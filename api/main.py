"""
FastAPI application for housing price prediction.
Loads production model from MLflow Model Registry.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import joblib
import numpy as np
import pandas as pd
import time
from pathlib import Path
import logging
import json
from datetime import datetime

from config import settings
from monitoring import PredictionMonitor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Housing Price Prediction API",
    version="2.0.0",
    description="API for predicting housing prices using XGBoost model from MLflow",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
scaler = None
model_info = {}
model_metrics = {}
monitor = PredictionMonitor()

# Directorio para guardar predicciones
PREDICTIONS_DIR = Path(__file__).parent.parent / "data" / "predictions"
PREDICTIONS_DIR.mkdir(parents=True, exist_ok=True)

# Directorio de modelos
MODELS_DIR = Path(__file__).parent.parent / "models"

# Todas las features disponibles (13 originales)
ALL_FEATURES = [
    'CRIM', 'ZN', 'INDUS', 'CHAS', 'NOX', 'RM', 'AGE',
    'DIS', 'RAD', 'TAX', 'PTRATIO', 'B', 'LSTAT'
]

# Features seleccionadas por el modelo (10 por defecto, se actualizan al cargar)
SELECTED_FEATURES = [
    'CRIM', 'NOX', 'RM', 'AGE', 'DIS', 'RAD', 'TAX', 'PTRATIO', 'B', 'LSTAT'
]


# ============================================================================
# Pydantic Models
# ============================================================================

class PredictionInput(BaseModel):
    """Input schema - Acepta todas las 13 variables pero solo usa las 10 seleccionadas."""
    
    CRIM: float = Field(..., description="Per capita crime rate by town", ge=0)
    ZN: Optional[float] = Field(None, description="Proportion of residential land zoned for lots over 25,000 sq.ft.", ge=0, le=100)
    INDUS: Optional[float] = Field(None, description="Proportion of non-retail business acres per town", ge=0, le=100)
    CHAS: Optional[float] = Field(None, description="Charles River dummy variable (1 if tract bounds river; 0 otherwise)", ge=0, le=1)
    NOX: float = Field(..., description="Nitric oxides concentration (parts per 10 million)", ge=0)
    RM: float = Field(..., description="Average number of rooms per dwelling", gt=0)
    AGE: float = Field(..., description="Proportion of owner-occupied units built prior to 1940", ge=0, le=100)
    DIS: float = Field(..., description="Weighted distances to five Boston employment centres", gt=0)
    RAD: float = Field(..., description="Index of accessibility to radial highways", ge=1)
    TAX: float = Field(..., description="Full-value property-tax rate per $10,000", gt=0)
    PTRATIO: float = Field(..., description="Pupil-teacher ratio by town", gt=0)
    B: float = Field(..., description="1000(Bk - 0.63)^2", ge=0, le=1000)
    LSTAT: float = Field(..., description="% lower status of the population", ge=0, le=100)

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
    model_name: str = Field(..., description="Name of the model in MLflow")
    model_version: str = Field(..., description="Version of the model used")
    model_stage: str = Field(..., description="Stage of the model (Production/Staging)")
    inference_time: float = Field(..., description="Time taken for inference in milliseconds")
    features_used: List[str] = Field(..., description="Features used by the model")


class BatchPredictionInput(BaseModel):
    """Input schema for batch predictions."""
    
    data: List[Dict[str, float]] = Field(..., description="List of records with feature values")
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "CRIM": 0.00632,
                        "NOX": 0.538,
                        "RM": 6.575,
                        "AGE": 65.2,
                        "DIS": 4.0900,
                        "RAD": 1.0,
                        "TAX": 296.0,
                        "PTRATIO": 15.3,
                        "B": 396.90,
                        "LSTAT": 4.98,
                    },
                    {
                        "CRIM": 0.02731,
                        "NOX": 0.469,
                        "RM": 6.421,
                        "AGE": 78.9,
                        "DIS": 4.9671,
                        "RAD": 2.0,
                        "TAX": 242.0,
                        "PTRATIO": 17.8,
                        "B": 396.90,
                        "LSTAT": 9.14,
                    }
                ]
            }
        }


class BatchPredictionOutput(BaseModel):
    """Output schema for batch predictions."""
    
    predictions: List[Dict[str, Any]] = Field(..., description="List of predictions with metadata")
    count: int = Field(..., description="Number of predictions made")
    model_version: str = Field(..., description="Model version used")
    total_inference_time: float = Field(..., description="Total inference time in milliseconds")
    avg_inference_time: float = Field(..., description="Average inference time per prediction in milliseconds")


class HealthResponse(BaseModel):
    """Health check response schema."""
    
    status: str
    model_loaded: bool
    scaler_loaded: bool
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    model_stage: Optional[str] = None
    uptime_seconds: float
    total_predictions: int


class ModelInfoResponse(BaseModel):
    """Model information response."""
    
    model_name: str
    model_version: str
    model_stage: str
    model_type: str
    features: List[str]
    n_features: int
    metrics: Optional[Dict] = None


# ============================================================================
# Utility Functions
# ============================================================================

# Función load_params eliminada - ya no se necesita cargar params.yaml


def load_production_model() -> tuple:
    """
    Carga el modelo de producción desde models/production_model.pkl.
    Este archivo es generado por model_register.py después de entrenar.
    
    Returns:
        (model, scaler, model_info, model_metrics)
    """
    try:
        production_path = MODELS_DIR / "production_model.pkl"
        
        if not production_path.exists():
            raise FileNotFoundError(
                f"Modelo de producción no encontrado en {production_path}. "
                "Ejecuta 'python src/model_register.py --stage Production' primero."
            )
        
        logger.info(f"📦 Cargando modelo de producción desde {production_path}...")
        
        # Cargar el paquete completo
        production_package = joblib.load(production_path)
        
        # Extraer componentes
        model = production_package['model']
        scaler = production_package['scaler']
        model_info = production_package['model_info']
        metrics = production_package['metrics']
        model_version = production_package.get('model_version', 'unknown')
        features = production_package.get('features', SELECTED_FEATURES)
        
        # Actualizar model_info con la versión
        model_info['model_version'] = str(model_version)
        model_info['model_stage'] = 'Production'
        model_info['features'] = features
        
        logger.info("✅ Modelo de producción cargado exitosamente")
        logger.info(f"   📦 Versión: v{model_version}")
        logger.info(f"   🎯 Features: {len(features)}")
        logger.info(f"   📊 Test RMSE: {metrics['test_rmse']:.4f}")
        logger.info(f"   📊 Test R²: {metrics['test_r2']:.4f}")
        
        return model, scaler, model_info, metrics
        
    except Exception as e:
        logger.error(f"❌ Error cargando modelo de producción: {e}")
        raise


def save_prediction(
    input_data: Dict,
    prediction: float,
    model_info: Dict,
    inference_time: float
) -> None:
    """
    Guarda la predicción en data/predictions/ para seguimiento.
    
    Args:
        input_data: Datos de entrada
        prediction: Predicción realizada
        model_info: Información del modelo
        inference_time: Tiempo de inferencia
    """
    try:
        timestamp = datetime.now()
        filename = timestamp.strftime("prediction_%Y%m%d_%H%M%S_%f.json")
        filepath = PREDICTIONS_DIR / filename
        
        record = {
            "timestamp": timestamp.isoformat(),
            "input": input_data,
            "prediction": float(prediction),
            "model_name": model_info.get("model_name"),
            "model_version": model_info.get("model_version"),
            "model_stage": model_info.get("model_stage"),
            "inference_time_ms": inference_time,
            "features_used": model_info.get("features", [])
        }
        
        with open(filepath, 'w') as f:
            json.dump(record, f, indent=2)
        
        logger.debug(f"💾 Predicción guardada: {filename}")
    except Exception as e:
        logger.error(f"❌ Error guardando predicción: {e}")


def prepare_features(input_data: Dict, features: List[str]) -> pd.DataFrame:
    """
    Prepara las features seleccionando solo las necesarias del input.
    
    Args:
        input_data: Diccionario con todas las variables
        features: Lista de features que el modelo necesita
        
    Returns:
        DataFrame con las features en el orden correcto
    """
    # Seleccionar solo las features que el modelo usa
    selected_data = {feat: input_data.get(feat, 0.0) for feat in features}
    
    # Crear DataFrame con el orden correcto
    df = pd.DataFrame([selected_data], columns=features)
    
    return df


# ============================================================================
# Model Loading (Production)
# ============================================================================


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Carga el modelo de producción al iniciar la aplicación."""
    global model, scaler, model_info, model_metrics
    
    try:
        logger.info("🚀 Iniciando Housing Price Prediction API...")
        
        # Cargar modelo de producción desde models/production_model.pkl
        model, scaler, model_info, model_metrics = load_production_model()
        
        # Actualizar SELECTED_FEATURES con las features del modelo
        global SELECTED_FEATURES
        SELECTED_FEATURES = model_info.get('features', SELECTED_FEATURES)
        
        logger.info("✅ API iniciada correctamente")
        logger.info(f"   📁 Directorio de predicciones: {PREDICTIONS_DIR}")
        logger.info(f"   🎯 Features del modelo: {len(SELECTED_FEATURES)}")
        
    except Exception as e:
        logger.error(f"❌ Error en startup: {e}")
        logger.error(f"   Asegúrate de ejecutar: python src/model_register.py --stage Production")
        model = None
        scaler = None
        model_info = {}
        model_metrics = {}


@app.on_event("shutdown")
async def shutdown_event():
    """Limpieza al apagar la aplicación."""
    logger.info("👋 Cerrando Housing Price Prediction API...")


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """Información básica de la API."""
    return {
        "message": "Housing Price Prediction API - Production Ready",
        "version": "2.0.0",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "model_version": model_info.get("model_version", "unknown") if model else None,
        "features_available": ALL_FEATURES,
        "features_used_by_model": SELECTED_FEATURES,
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "batch_predict": "/predict/batch",
            "demo": "/demo",
            "model_info": "/model/info",
            "metrics": "/metrics",
            "reload": "/admin/reload",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    uptime = time.time() - monitor.start_time
    
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        scaler_loaded=scaler is not None,
        model_name=model_info.get("model_name"),
        model_version=model_info.get("model_version"),
        model_stage=model_info.get("model_stage"),
        uptime_seconds=uptime,
        total_predictions=monitor.total_predictions
    )


@app.get("/model/info", response_model=ModelInfoResponse, tags=["Info"])
async def get_model_info():
    """Obtiene información detallada del modelo cargado."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return ModelInfoResponse(**model_info)


@app.post("/predict", response_model=PredictionOutput, tags=["Prediction"])
async def predict(input_data: PredictionInput):
    """
    Realiza una predicción individual.
    Acepta 13 variables pero usa solo las 10 seleccionadas por el modelo.
    Guarda la predicción en data/predictions/ para seguimiento.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if scaler is None:
        raise HTTPException(status_code=503, detail="Scaler not loaded")
    
    try:
        start_time = time.time()
        
        # Convertir input a diccionario
        input_dict = input_data.model_dump()
        
        # Preparar features (seleccionar solo las que usa el modelo)
        features = model_info.get("features", SELECTED_FEATURES)
        X = prepare_features(input_dict, features)
        
        # Aplicar transformación (scaling)
        X_scaled = scaler.transform(X)
        
        # Hacer predicción
        prediction = model.predict(X_scaled)[0]
        
        # Calcular tiempo de inferencia
        inference_time = (time.time() - start_time) * 1000  # ms
        
        # Guardar predicción
        save_prediction(
            input_data=input_dict,
            prediction=prediction,
            model_info=model_info,
            inference_time=inference_time
        )
        
        # Registrar en monitor
        monitor.log_prediction(float(prediction), inference_time)
        
        logger.info(f"✅ Predicción: ${prediction:.2f}k, Tiempo: {inference_time:.2f}ms")
        
        return PredictionOutput(
            prediction=float(prediction),
            model_name=model_info.get("model_name", "unknown"),
            model_version=f"v{model_info.get('model_version', 'unknown')}",
            model_stage=model_info.get("model_stage", "unknown"),
            inference_time=inference_time,
            features_used=features
        )
        
    except Exception as e:
        logger.error(f"❌ Error en predicción: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/batch", response_model=BatchPredictionOutput, tags=["Prediction"])
async def predict_batch(batch_input: BatchPredictionInput):
    """
    Realiza predicciones en batch.
    Acepta un diccionario con múltiples registros.
    Cada predicción se guarda individualmente en data/predictions/.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if scaler is None:
        raise HTTPException(status_code=503, detail="Scaler not loaded")
    
    try:
        start_time = time.time()
        predictions = []
        features = model_info.get("features", SELECTED_FEATURES)
        
        for idx, record in enumerate(batch_input.data):
            try:
                # Preparar features
                X = prepare_features(record, features)
                
                # Aplicar transformación
                X_scaled = scaler.transform(X)
                
                # Hacer predicción
                pred_start = time.time()
                prediction = model.predict(X_scaled)[0]
                pred_time = (time.time() - pred_start) * 1000
                
                # Guardar predicción
                save_prediction(
                    input_data=record,
                    prediction=prediction,
                    model_info=model_info,
                    inference_time=pred_time
                )
                
                # Registrar en monitor
                monitor.log_prediction(float(prediction), pred_time)
                
                predictions.append({
                    "index": idx,
                    "prediction": float(prediction),
                    "inference_time_ms": pred_time
                })
                
            except Exception as e:
                logger.error(f"❌ Error en registro {idx}: {e}")
                predictions.append({
                    "index": idx,
                    "error": str(e),
                    "prediction": None
                })
        
        # Calcular tiempo total
        total_time = (time.time() - start_time) * 1000
        avg_time = total_time / len(batch_input.data) if batch_input.data else 0
        
        logger.info(f"✅ Batch: {len(predictions)} predicciones en {total_time:.2f}ms")
        
        return BatchPredictionOutput(
            predictions=predictions,
            count=len(predictions),
            model_version=f"v{model_info.get('model_version', 'unknown')}",
            total_inference_time=total_time,
            avg_inference_time=avg_time
        )
        
    except Exception as e:
        logger.error(f"❌ Error en batch prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


@app.get("/metrics", tags=["Monitoring"])
async def get_metrics():
    """Obtiene métricas de monitoring."""
    return monitor.get_metrics()


@app.post("/admin/reload", tags=["Admin"])
async def reload_model():
    """
    Recarga el modelo desde models/production_model.pkl sin reiniciar la API.
    Útil después de entrenar y registrar un nuevo modelo.
    """
    global model, scaler, model_info, model_metrics, SELECTED_FEATURES
    
    try:
        logger.info(f"🔄 Recargando modelo de producción...")
        
        model, scaler, model_info, model_metrics = load_production_model()
        SELECTED_FEATURES = model_info.get('features', SELECTED_FEATURES)
        
        return {
            "message": "Model reloaded successfully",
            "model_version": model_info.get("model_version"),
            "test_rmse": model_metrics.get("test_rmse"),
            "test_r2": model_metrics.get("test_r2"),
            "features_count": len(SELECTED_FEATURES)
        }
        
    except Exception as e:
        logger.error(f"❌ Error recargando modelo: {e}")
        raise HTTPException(status_code=500, detail=f"Reload error: {str(e)}")


@app.get("/demo", response_class=HTMLResponse, tags=["Demo"])
async def demo_page():
    """
    Página de demostración interactiva para probar predicciones.
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Housing Price Prediction - Demo</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                padding: 30px;
            }
            
            .form-section {
                padding: 20px;
            }
            
            .form-section h2 {
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
            }
            
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            
            label {
                font-weight: 600;
                margin-bottom: 5px;
                color: #333;
                font-size: 0.9em;
            }
            
            input[type="number"] {
                padding: 10px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 1em;
                transition: border-color 0.3s;
            }
            
            input[type="number"]:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .button-group {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            button {
                flex: 1;
                padding: 15px;
                font-size: 1.1em;
                font-weight: 600;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-predict {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .btn-predict:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
            }
            
            .btn-reset {
                background: #f0f0f0;
                color: #333;
            }
            
            .btn-reset:hover {
                background: #e0e0e0;
            }
            
            .results-section {
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
            }
            
            .results-section h2 {
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            
            .result-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .prediction-value {
                font-size: 3em;
                font-weight: bold;
                color: #667eea;
                text-align: center;
                margin: 20px 0;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 15px;
            }
            
            .info-item {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
            }
            
            .info-label {
                font-size: 0.85em;
                color: #666;
                margin-bottom: 5px;
            }
            
            .info-value {
                font-weight: 600;
                color: #333;
            }
            
            .loading {
                display: none;
                text-align: center;
                padding: 40px;
            }
            
            .loading.active {
                display: block;
            }
            
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .error {
                background: #fee;
                color: #c33;
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
                display: none;
            }
            
            .error.active {
                display: block;
            }
            
            @media (max-width: 768px) {
                .content {
                    grid-template-columns: 1fr;
                }
                
                .form-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Housing Price Prediction</h1>
                <p>Sistema de predicción de precios con MLflow + XGBoost</p>
            </div>
            
            <div class="content">
                <div class="form-section">
                    <h2>📝 Datos de Entrada</h2>
                    <form id="predictionForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="CRIM">CRIM <span style="color:red">*</span></label>
                                <input type="number" id="CRIM" name="CRIM" step="0.00001" value="0.00632" required>
                            </div>
                            <div class="form-group">
                                <label for="ZN">ZN</label>
                                <input type="number" id="ZN" name="ZN" step="0.1" value="18.0">
                            </div>
                            <div class="form-group">
                                <label for="INDUS">INDUS</label>
                                <input type="number" id="INDUS" name="INDUS" step="0.01" value="2.31">
                            </div>
                            <div class="form-group">
                                <label for="CHAS">CHAS</label>
                                <input type="number" id="CHAS" name="CHAS" step="1" min="0" max="1" value="0">
                            </div>
                            <div class="form-group">
                                <label for="NOX">NOX <span style="color:red">*</span></label>
                                <input type="number" id="NOX" name="NOX" step="0.001" value="0.538" required>
                            </div>
                            <div class="form-group">
                                <label for="RM">RM <span style="color:red">*</span></label>
                                <input type="number" id="RM" name="RM" step="0.001" value="6.575" required>
                            </div>
                            <div class="form-group">
                                <label for="AGE">AGE <span style="color:red">*</span></label>
                                <input type="number" id="AGE" name="AGE" step="0.1" value="65.2" required>
                            </div>
                            <div class="form-group">
                                <label for="DIS">DIS <span style="color:red">*</span></label>
                                <input type="number" id="DIS" name="DIS" step="0.0001" value="4.0900" required>
                            </div>
                            <div class="form-group">
                                <label for="RAD">RAD <span style="color:red">*</span></label>
                                <input type="number" id="RAD" name="RAD" step="1" value="1" required>
                            </div>
                            <div class="form-group">
                                <label for="TAX">TAX <span style="color:red">*</span></label>
                                <input type="number" id="TAX" name="TAX" step="1" value="296" required>
                            </div>
                            <div class="form-group">
                                <label for="PTRATIO">PTRATIO <span style="color:red">*</span></label>
                                <input type="number" id="PTRATIO" name="PTRATIO" step="0.1" value="15.3" required>
                            </div>
                            <div class="form-group">
                                <label for="B">B <span style="color:red">*</span></label>
                                <input type="number" id="B" name="B" step="0.01" value="396.90" required>
                            </div>
                            <div class="form-group">
                                <label for="LSTAT">LSTAT <span style="color:red">*</span></label>
                                <input type="number" id="LSTAT" name="LSTAT" step="0.01" value="4.98" required>
                            </div>
                        </div>
                        
                        <div class="button-group">
                            <button type="submit" class="btn-predict">🔮 Predecir Precio</button>
                            <button type="button" class="btn-reset" onclick="resetForm()">🔄 Limpiar</button>
                        </div>
                    </form>
                    
                    <div class="error" id="errorDiv"></div>
                </div>
                
                <div class="results-section">
                    <h2>📊 Resultados</h2>
                    
                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Procesando predicción...</p>
                    </div>
                    
                    <div id="resultsContent" style="display:none;">
                        <div class="result-card">
                            <h3 style="text-align:center; color:#666; margin-bottom:10px;">Precio Predicho</h3>
                            <div class="prediction-value" id="predictionValue">$0.00k</div>
                            <p style="text-align:center; color:#666; font-size:0.9em;">*Valor en miles de dólares</p>
                        </div>
                        
                        <div class="result-card">
                            <h3 style="color:#666; margin-bottom:15px;">Información del Modelo</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Modelo</div>
                                    <div class="info-value" id="modelName">-</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Versión</div>
                                    <div class="info-value" id="modelVersion">-</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Stage</div>
                                    <div class="info-value" id="modelStage">-</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Tiempo</div>
                                    <div class="info-value" id="inferenceTime">-</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="result-card">
                            <h3 style="color:#666; margin-bottom:10px;">Features Utilizadas</h3>
                            <div id="featuresUsed" style="color:#333; font-size:0.9em;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            const form = document.getElementById('predictionForm');
            const loading = document.getElementById('loading');
            const resultsContent = document.getElementById('resultsContent');
            const errorDiv = document.getElementById('errorDiv');
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Ocultar error previo
                errorDiv.classList.remove('active');
                errorDiv.textContent = '';
                
                // Mostrar loading
                loading.classList.add('active');
                resultsContent.style.display = 'none';
                
                // Recopilar datos del formulario
                const formData = new FormData(form);
                const data = {};
                
                for (let [key, value] of formData.entries()) {
                    data[key] = value ? parseFloat(value) : null;
                }
                
                try {
                    // Hacer request a la API
                    const response = await fetch('/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.detail || 'Error en la predicción');
                    }
                    
                    const result = await response.json();
                    
                    // Mostrar resultados
                    document.getElementById('predictionValue').textContent = 
                        `$${result.prediction.toFixed(2)}k`;
                    document.getElementById('modelName').textContent = result.model_name;
                    document.getElementById('modelVersion').textContent = result.model_version;
                    document.getElementById('modelStage').textContent = result.model_stage;
                    document.getElementById('inferenceTime').textContent = 
                        `${result.inference_time.toFixed(2)}ms`;
                    document.getElementById('featuresUsed').textContent = 
                        result.features_used.join(', ');
                    
                    loading.classList.remove('active');
                    resultsContent.style.display = 'block';
                    
                } catch (error) {
                    loading.classList.remove('active');
                    errorDiv.textContent = `❌ Error: ${error.message}`;
                    errorDiv.classList.add('active');
                }
            });
            
            function resetForm() {
                form.reset();
                resultsContent.style.display = 'none';
                errorDiv.classList.remove('active');
            }
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
