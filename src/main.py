"""
FastAPI application for housing price prediction.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import joblib
import numpy as np
import time
from pathlib import Path
import logging

from config import settings
from preprocessing import DataPreprocessor
from monitoring import monitor
from analytics import router as analytics_router

# Setup logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description="API for predicting housing prices using machine learning",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analytics router
app.include_router(analytics_router)

# Global variables for model and preprocessor
model = None
preprocessor = None


# Pydantic models
class PredictionInput(BaseModel):
    """Input schema for prediction endpoint."""

    CRIM: float = Field(..., description="Per capita crime rate by town")
    ZN: float = Field(
        ...,
        description="Proportion of residential land zoned for lots over 25,000 sq.ft",
    )
    INDUS: float = Field(
        ..., description="Proportion of non-retail business acres per town"
    )
    CHAS: float = Field(
        ...,
        description="Charles River dummy variable (1 if tract bounds river; 0 otherwise)",
    )
    NOX: float = Field(
        ..., description="Nitric oxides concentration (parts per 10 million)"
    )
    RM: float = Field(..., description="Average number of rooms per dwelling")
    AGE: float = Field(
        ..., description="Proportion of owner-occupied units built prior to 1940"
    )
    DIS: float = Field(
        ..., description="Weighted distances to five Boston employment centres"
    )
    RAD: float = Field(..., description="Index of accessibility to radial highways")
    TAX: float = Field(..., description="Full-value property-tax rate per $10,000")
    PTRATIO: float = Field(..., description="Pupil-teacher ratio by town")
    B: float = Field(
        ...,
        description="1000(Bk - 0.63)^2 where Bk is the proportion of Black residents by town",
    )
    LSTAT: float = Field(
        ..., description="Percentage of lower status of the population"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "CRIM": 0.00632,
                "ZN": 18.0,
                "INDUS": 2.31,
                "CHAS": 0.0,
                "NOX": 0.538,
                "RM": 6.575,
                "AGE": 65.2,
                "DIS": 4.0900,
                "RAD": 1.0,
                "TAX": 296.0,
                "PTRATIO": 15.3,
                "B": 396.90,
                "LSTAT": 4.98,
            }
        }


class PredictionOutput(BaseModel):
    """Output schema for prediction endpoint."""

    prediction: float = Field(..., description="Predicted housing price in $1000s")
    model_version: str = Field(..., description="Version of the model used")
    inference_time: float = Field(
        ..., description="Time taken for inference in seconds"
    )


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    model_loaded: bool
    uptime_hours: float
    total_predictions: int
    warnings: List[str] = []


class MetricsResponse(BaseModel):
    """Metrics response schema."""

    total_predictions: int
    avg_inference_time: float
    p95_inference_time: float
    avg_prediction: float
    std_prediction: float
    uptime_hours: float


def load_model_artifacts():
    """Load model and preprocessor from disk."""
    global model, preprocessor

    try:
        model_path = settings.model_path / "model.joblib"
        preprocessor_path = settings.model_path / "preprocessor.joblib"

        if not model_path.exists() or not preprocessor_path.exists():
            logger.error(f"Model artifacts not found at {settings.model_path}")
            return False

        model = joblib.load(model_path)
        preprocessor = DataPreprocessor()
        preprocessor.load_preprocessor(preprocessor_path)

        logger.info("✅ Model and preprocessor loaded successfully")
        return True

    except Exception as e:
        logger.error(f"❌ Error loading model artifacts: {e}")
        return False


@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    logger.info("🚀 Starting Housing Price Prediction API...")
    success = load_model_artifacts()
    if success:
        logger.info("✅ API ready to serve predictions")
    else:
        logger.warning("⚠️  API started but model not loaded. Run training first.")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Housing Price Prediction API",
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service health status and basic metrics.
    """
    health_status = monitor.get_health_status()

    return HealthResponse(
        status=health_status["status"],
        model_loaded=model is not None,
        uptime_hours=health_status["uptime_hours"],
        total_predictions=health_status["total_predictions"],
        warnings=health_status["warnings"],
    )


@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Get monitoring metrics.

    Returns detailed metrics about model performance and usage.
    """
    metrics = monitor.get_metrics()

    return MetricsResponse(
        total_predictions=metrics["total_predictions"],
        avg_inference_time=metrics["avg_inference_time"],
        p95_inference_time=metrics.get("p95_inference_time", 0),
        avg_prediction=metrics.get("avg_prediction", 0),
        std_prediction=metrics.get("std_prediction", 0),
        uptime_hours=metrics["uptime_hours"],
    )


@app.post("/predict", response_model=PredictionOutput)
async def predict(input_data: PredictionInput):
    """
    Make a housing price prediction.

    Args:
        input_data: Housing features

    Returns:
        Predicted price and metadata
    """
    if model is None or preprocessor is None:
        raise HTTPException(
            status_code=503, detail="Model not loaded. Please train the model first."
        )

    try:
        # Start timing
        start_time = time.time()

        # Convert input to dict
        features = input_data.model_dump()

        # Preprocess
        X = preprocessor.preprocess_for_inference(features)

        # Predict
        prediction = float(model.predict(X)[0])

        # Calculate inference time
        inference_time = time.time() - start_time

        # Log prediction for monitoring
        if settings.enable_monitoring:
            monitor.log_prediction(features, prediction, inference_time)

        logger.info(f"Prediction: {prediction:.2f}, Time: {inference_time:.4f}s")

        return PredictionOutput(
            prediction=prediction,
            model_version=settings.api_version,
            inference_time=inference_time,
        )

    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
async def predict_batch(inputs: List[PredictionInput]):
    """
    Make batch predictions.

    Args:
        inputs: List of housing features

    Returns:
        List of predictions
    """
    if model is None or preprocessor is None:
        raise HTTPException(
            status_code=503, detail="Model not loaded. Please train the model first."
        )

    try:
        start_time = time.time()

        predictions = []
        for input_data in inputs:
            features = input_data.model_dump()
            X = preprocessor.preprocess_for_inference(features)
            prediction = float(model.predict(X)[0])
            predictions.append(prediction)

        inference_time = time.time() - start_time

        logger.info(
            f"Batch prediction: {len(predictions)} predictions in {inference_time:.4f}s"
        )

        return {
            "predictions": predictions,
            "count": len(predictions),
            "inference_time": inference_time,
        }

    except Exception as e:
        logger.error(f"Error during batch prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model/info")
async def model_info():
    """
    Get information about the loaded model.

    Returns:
        Model metadata and feature information
    """
    if model is None or preprocessor is None:
        raise HTTPException(
            status_code=503, detail="Model not loaded. Please train the model first."
        )

    # Load metrics if available
    metrics_path = settings.model_path / "metrics.json"
    metrics = None
    if metrics_path.exists():
        import json

        with open(metrics_path) as f:
            metrics = json.load(f)

    return {
        "model_type": type(model).__name__,
        "features": preprocessor.feature_names,
        "target": preprocessor.target_name,
        "metrics": metrics,
        "version": settings.api_version,
    }


@app.post("/admin/reload")
async def reload_model():
    """
    Reload model from disk (admin endpoint).

    Useful for loading a newly trained model without restarting the service.
    """
    logger.info("🔄 Reloading model...")
    success = load_model_artifacts()

    if success:
        return {"message": "Model reloaded successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload model")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=True)
