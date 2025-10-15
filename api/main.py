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

from api.monitoring import PredictionMonitor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}',
    datefmt='%Y-%m-%dT%H:%M:%S'
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

# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request, call_next):
    """Middleware para logging de requests."""
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = (time.time() - start_time) * 1000
        
        logger.info(
            f'{{"method":"{request.method}","path":"{request.url.path}",'
            f'"status":{response.status_code},"duration_ms":{duration:.2f}}}'
        )
        
        return response
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f'{{"method":"{request.method}","path":"{request.url.path}","duration_ms":{duration:.2f},"error":"{str(e)}"}}')
        raise

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

# Todas las features disponibles (13 originales) - EN EL ORDEN QUE ESPERA EL SCALER
ALL_FEATURES_ORDERED = [
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
    """
    Input schema - Acepta todas las 13 variables.
    Pydantic valida automáticamente tipos y rangos con Field(ge=min, le=max).
    """
    
    # Features requeridas (las que usa el modelo)
    CRIM: float = Field(..., ge=0.0, le=100.0, description="Per capita crime rate")
    NOX: float = Field(..., ge=0.3, le=1.0, description="Nitric oxides concentration")
    RM: float = Field(..., ge=3.0, le=9.0, description="Avg rooms per dwelling")
    AGE: float = Field(..., ge=0.0, le=100.0, description="% units built pre-1940")
    DIS: float = Field(..., description="Weighted distances to five Boston employment centres", ge=0.5, le=12.0)
    RAD: float = Field(..., description="Index of accessibility to radial highways", ge=1.0, le=24.0)
    TAX: float = Field(..., description="Full-value property-tax rate per $10,000", ge=100.0, le=800.0)
    PTRATIO: float = Field(..., description="Pupil-teacher ratio by town", ge=10.0, le=25.0)
    B: float = Field(..., description="Proportion of Black residents index", ge=0.0, le=400.0)
    LSTAT: float = Field(..., description="% lower status of the population", ge=0.0, le=40.0)
    
    # Features opcionales (las 3 restantes que el modelo no usa pero el scaler necesita)
    ZN: Optional[float] = Field(0.0, description="Proportion of residential land zoned for lots over 25,000 sq.ft.", ge=0.0, le=100.0)
    INDUS: Optional[float] = Field(0.0, description="Proportion of non-retail business acres per town", ge=0.0, le=30.0)
    CHAS: Optional[float] = Field(0.0, description="Charles River dummy variable (1 if tract bounds river; 0 otherwise)", ge=0.0, le=1.0)

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


class ProductionModelInfo(BaseModel):
    """Información completa del modelo en producción."""
    
    model_name: str
    model_version: str
    model_stage: str
    model_type: str
    
    # Features
    features: List[str]
    n_features: int
    all_features: List[str]
    
    # Performance metrics
    metrics: Dict[str, float]
    
    # Model metadata
    trained_at: Optional[str] = None
    registered_at: Optional[str] = None
    model_path: str
    
    # Production info
    deployment_date: Optional[str] = None
    uptime_hours: float
    total_predictions: int
    

class MonitoringStats(BaseModel):
    """Estadísticas de monitoreo del modelo."""
    
    # General
    total_predictions: int
    uptime_hours: float
    predictions_per_hour: float
    
    # Predictions statistics
    prediction_stats: Dict[str, float]
    
    # Performance statistics
    inference_stats: Dict[str, float]
    
    # Recent activity
    last_prediction_time: Optional[str] = None
    recent_predictions: List[float]


# ============================================================================
# Utility Functions
# ============================================================================

# Función load_params eliminada - ya no se necesita cargar params.yaml


def load_production_model() -> tuple:
    """Carga el modelo de producción generado por `model_register.py`."""

    latest_dir = MODELS_DIR / "production" / "latest"
    metadata_path = latest_dir / "metadata.json"
    model_path = latest_dir / "model.pkl"
    scaler_path = latest_dir / "scaler.pkl"

    try:
        if metadata_path.exists() and model_path.exists() and scaler_path.exists():
            logger.info(f"📦 Cargando modelo de producción desde {latest_dir}...")

            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)

            with open(metadata_path, "r") as f:
                metadata = json.load(f)

            metrics = metadata.get("metrics", {})
            model_info = metadata.get("model_info", {})
            model_info.setdefault("model_name", metadata.get("model_name"))
            model_info.setdefault("model_version", str(metadata.get("model_version", "unknown")))
            model_info.setdefault("model_stage", metadata.get("stage", "Production"))
            model_info.setdefault("features", metadata.get("features", model_info.get("feature_names", [])))

            logger.info("✅ Modelo de producción cargado exitosamente")
            logger.info(f"   📦 Versión: v{model_info.get('model_version', 'unknown')}")
            logger.info(f"   🎯 Features: {len(model_info.get('features', []))}")

            if metrics:
                logger.info(f"   📊 Test RMSE: {metrics.get('test_rmse', 'N/A')}")
                logger.info(f"   📊 Test R²: {metrics.get('test_r2', 'N/A')}")

            return model, scaler, model_info, metrics

        legacy_path = MODELS_DIR / "production_model.pkl"
        if legacy_path.exists():
            logger.warning(
                f"⚠️ Bundle legacy detectado en {legacy_path}. Considera ejecutar el nuevo pipeline para actualizar."
            )

            package = joblib.load(legacy_path)
            model = package['model']
            scaler = package['scaler']
            model_info = package['model_info']
            metrics = package.get('metrics', {})
            model_info['model_version'] = str(package.get('model_version', 'unknown'))
            model_info['model_name'] = package.get('model_name', 'unknown')
            model_info['model_stage'] = 'Production'
            model_info['features'] = package.get('features', SELECTED_FEATURES)

            return model, scaler, model_info, metrics

        raise FileNotFoundError(
            "No se encontró el paquete de producción. Ejecuta 'python src/model_register.py --stage Production'."
        )

    except Exception as exc:
        logger.error(f"❌ Error cargando modelo de producción: {exc}")
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


def prepare_features(input_data: Dict, features: List[str]) -> Dict[str, float]:
    """
    Prepara las features seleccionando solo las necesarias del input.
    
    Args:
        input_data: Diccionario con todas las variables (13 originales)
        features: Lista de features que el modelo necesita (10 seleccionadas)
        
    Returns:
        Diccionario con las features seleccionadas en el orden correcto
    """
    # Seleccionar solo las features que el modelo usa
    # Si falta alguna feature requerida, usar 0.0 (aunque el validador debería prevenir esto)
    selected_data = {feat: input_data.get(feat, 0.0) for feat in features}
    
    return selected_data


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
        logger.info('{"event":"startup","service":"housing-api","version":"2.0.0"}')
        
    # Cargar modelo de producción desde models/production/latest/
        model, scaler, model_info, model_metrics = load_production_model()
        
        # Actualizar SELECTED_FEATURES con las features del modelo
        global SELECTED_FEATURES
        SELECTED_FEATURES = model_info.get('features', SELECTED_FEATURES)
        
        logger.info(
            f'{{"event":"api_started","predictions_dir":"{PREDICTIONS_DIR}",'
            f'"model_version":"{model_info.get("model_version","unknown")}",'
            f'"features_count":{len(SELECTED_FEATURES)},'
            f'"test_rmse":{model_metrics.get("test_rmse","N/A")},'
            f'"test_r2":{model_metrics.get("test_r2","N/A")}}}'
        )
        
    except Exception as e:
        logger.error(
            f'{{"event":"startup_failed","error":"{str(e)}",'
            f'"help":"Run: python src/model_register.py --stage Production"}}'
        )
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
        "features_available": ALL_FEATURES_ORDERED,
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
        total_predictions=monitor.prediction_count
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
    
    FLUJO:
    1. Entrada: 13 variables (CRIM, ZN, INDUS, CHAS, NOX, RM, AGE, DIS, RAD, TAX, PTRATIO, B, LSTAT)
    2. StandardScaler: Se aplica a TODAS las 13 variables
    3. Selección: Solo se usan las variables que el modelo necesita (típicamente 10)
    4. Predicción: El modelo usa solo las variables seleccionadas (escaladas)
    
    Nota: El StandardScaler SIEMPRE necesita las 13 variables en el orden correcto,
          independientemente de cuántas variables use el modelo final.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if scaler is None:
        raise HTTPException(status_code=503, detail="Scaler not loaded")
    
    try:
        start_time = time.time()
        
        # Convertir input a diccionario
        # Pydantic ya validó los rangos automáticamente
        input_dict = input_data.model_dump()
        
        # PASO 1: PREPARAR LAS 13 FEATURES PARA EL SCALER
        # El scaler SIEMPRE espera las 13 features en el orden correcto
        X_all = pd.DataFrame(
            [{feat: input_dict.get(feat, 0.0) for feat in ALL_FEATURES_ORDERED}], 
            columns=ALL_FEATURES_ORDERED
        )
        
        # PASO 3: APLICAR STANDARDSCALER A LAS 13 FEATURES
        X_scaled_all = scaler.transform(X_all)  # Resultado: (1, 13)
        
        # PASO 4: SELECCIONAR SOLO LAS FEATURES QUE USA EL MODELO
        # El modelo puede usar solo un subconjunto (ej: 10 de las 13)
        features = model_info.get("features", SELECTED_FEATURES)
        feature_indices = [ALL_FEATURES_ORDERED.index(f) for f in features]
        X_scaled = X_scaled_all[:, feature_indices]  # Resultado: (1, 10)
        
        # PASO 5: HACER PREDICCIÓN CON LAS FEATURES SELECCIONADAS
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
        monitor.log_prediction(
            features=input_dict,
            prediction=float(prediction),
            inference_time=inference_time
        )
        
        logger.info(
            f'{{"event":"prediction_success","prediction":{float(prediction):.2f},'
            f'"inference_ms":{inference_time:.2f},"features_count":{len(features)}}}'
        )
        
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
    
    FLUJO (igual que predict individual):
    1. Entrada: 13 variables por cada registro
    2. StandardScaler: Se aplica a TODAS las 13 variables
    3. Selección: Solo se usan las variables que el modelo necesita
    4. Predicción: El modelo usa solo las variables seleccionadas (escaladas)
    
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
        
        # El scaler necesita las 13 features originales
        feature_indices = [ALL_FEATURES_ORDERED.index(f) for f in features]
        
        for idx, record in enumerate(batch_input.data):
            try:
                # Crear DataFrame con las 13 features
                X_all = pd.DataFrame([{feat: record.get(feat, 0.0) for feat in ALL_FEATURES_ORDERED}],
                                    columns=ALL_FEATURES_ORDERED)
                
                # Aplicar transformación con las 13 features
                X_scaled_all = scaler.transform(X_all)
                
                # Seleccionar solo las features del modelo
                X_scaled = X_scaled_all[:, feature_indices]
                
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
                monitor.log_prediction(
                    features=record,
                    prediction=float(prediction),
                    inference_time=pred_time
                )
                
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
    """Obtiene métricas básicas de monitoring."""
    return monitor.get_metrics()


@app.get("/model/production-info", response_model=ProductionModelInfo, tags=["Info", "Production"])
async def get_production_model_info():
    """
    Obtiene información completa del modelo en producción.
    
    Incluye:
    - Información del modelo (nombre, versión, stage)
    - Features utilizadas
    - Métricas de performance
    - Información de deployment
    - Estadísticas de uso
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    uptime = time.time() - monitor.start_time
    
    # Buscar metadata adicional
    latest_dir = MODELS_DIR / "production" / "latest"
    metadata_path = latest_dir / "metadata.json"
    
    trained_at = None
    registered_at = None
    
    if metadata_path.exists():
        import json
        with open(metadata_path) as f:
            metadata = json.load(f)
            trained_at = metadata.get("trained_at")
            registered_at = metadata.get("registered_at")
    
    return ProductionModelInfo(
        model_name=model_info.get("model_name", "unknown"),
        model_version=model_info.get("model_version", "unknown"),
        model_stage=model_info.get("model_stage", "Production"),
        model_type=model_info.get("model_type", "unknown"),
        features=model_info.get("features", []),
        n_features=len(model_info.get("features", [])),
        all_features=ALL_FEATURES_ORDERED,
        metrics=model_metrics or {},
        trained_at=trained_at,
        registered_at=registered_at,
        model_path=str(latest_dir),
        uptime_hours=uptime / 3600,
        total_predictions=monitor.prediction_count,
    )


@app.get("/monitoring/stats", response_model=MonitoringStats, tags=["Monitoring"])
async def get_monitoring_stats():
    """
    Obtiene estadísticas detalladas de monitoreo.
    
    Incluye:
    - Estadísticas de predicciones (media, desviación, percentiles)
    - Estadísticas de performance (tiempo de inferencia)
    - Actividad reciente
    - Predicciones por hora
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    stats = monitor.get_detailed_stats()
    
    return MonitoringStats(
        total_predictions=stats.get("total_predictions", 0),
        uptime_hours=stats.get("uptime_hours", 0),
        predictions_per_hour=stats.get("predictions_per_hour", 0),
        prediction_stats=stats.get("prediction_stats", {}),
        inference_stats=stats.get("inference_stats", {}),
        last_prediction_time=stats.get("last_prediction_time"),
        recent_predictions=stats.get("recent_predictions", []),
    )


@app.get("/monitoring/drift", tags=["Monitoring"])
async def detect_drift(threshold: float = 2.0):
    """
    Detecta drift en las predicciones comparado con baseline.
    
    Args:
        threshold: Número de desviaciones estándar para detectar drift (default: 2.0)
        
    Returns:
        - drift_detected: Si se detectó drift
        - drift_score: Puntuación de drift
        - current_mean: Media actual de predicciones
        - baseline_mean: Media baseline
        
    Nota: Se debe configurar baseline primero con POST /monitoring/baseline
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    drift_info = monitor.detect_drift(threshold=threshold)
    
    return {
        **drift_info,
        "threshold": threshold,
        "recommendation": "Configure baseline with POST /monitoring/baseline" if not drift_info["baseline_configured"] else None
    }


@app.post("/monitoring/baseline", tags=["Monitoring"])
async def set_monitoring_baseline():
    """
    Establece el baseline actual para detección de drift.
    
    Usa las predicciones actuales en el monitor como baseline.
    Útil después de validar que el modelo está funcionando correctamente.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not monitor.predictions:
        raise HTTPException(status_code=400, detail="No predictions available to set baseline")
    
    # Set baseline from current predictions
    predictions_list = list(monitor.predictions)
    
    # Extract features if available
    features_dict = {}
    if monitor.features_log:
        for feature_name in ALL_FEATURES_ORDERED:
            values = [f.get(feature_name) for f in monitor.features_log if feature_name in f]
            if values:
                features_dict[feature_name] = values
    
    monitor.set_baseline(predictions_list, features_dict if features_dict else None)
    
    return {
        "message": "Baseline configured successfully",
        "baseline_predictions": len(predictions_list),
        "baseline_mean": monitor.baseline_mean,
        "baseline_std": monitor.baseline_std,
        "features_tracked": len(features_dict)
    }


@app.get("/monitoring/features", tags=["Monitoring"])
async def get_feature_statistics():
    """
    Obtiene estadísticas de las features usadas en predicciones recientes.
    
    Incluye drift detection por feature si hay baseline configurado.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    feature_stats = monitor.get_feature_stats()
    
    return {
        "features_tracked": len(feature_stats),
        "statistics": feature_stats,
        "baseline_configured": monitor.baseline_features is not None
    }


def _generate_feature_rows(feature_stats: Dict) -> str:
    """Helper function to generate feature statistics table rows."""
    if not feature_stats:
        return ""
    
    rows = []
    for name, stats in feature_stats.items():
        drift_badge = "-"
        if stats.get("drift_detected"):
            drift_score = stats.get("drift_score", 0)
            drift_badge = f'<span class="badge badge-danger">DRIFT {drift_score:.2f}</span>'
        elif "drift_score" in stats:
            drift_badge = '<span class="badge badge-success">OK</span>'
        
        row = f'''
        <tr>
            <td><strong>{name}</strong></td>
            <td>{stats.get("mean", 0):.3f}</td>
            <td>{stats.get("std", 0):.3f}</td>
            <td>{stats.get("min", 0):.3f}</td>
            <td>{stats.get("max", 0):.3f}</td>
            <td>{drift_badge}</td>
        </tr>
        '''
        rows.append(row)
    
    return "".join(rows)


@app.get("/monitoring/dashboard", response_class=HTMLResponse, tags=["Monitoring"])
async def monitoring_dashboard():
    """
    Dashboard HTML de monitoreo con visualización de métricas.
    """
    if model is None:
        return HTMLResponse(content="<h1>Model not loaded</h1>", status_code=503)
    
    metrics = monitor.get_metrics()
    drift_info = monitor.detect_drift()
    feature_stats = monitor.get_feature_stats()
    
    # Build HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Model Monitoring Dashboard</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            h1 {{
                color: #333;
                border-bottom: 3px solid #4CAF50;
                padding-bottom: 10px;
            }}
            .metric-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }}
            .metric-card {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .metric-card h3 {{
                margin: 0 0 10px 0;
                color: #666;
                font-size: 14px;
                text-transform: uppercase;
            }}
            .metric-value {{
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
            }}
            .metric-label {{
                font-size: 12px;
                color: #999;
                margin-top: 5px;
            }}
            .alert {{
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }}
            .alert-success {{
                background: #d4edda;
                border-left: 4px solid #28a745;
                color: #155724;
            }}
            .alert-warning {{
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                color: #856404;
            }}
            .alert-danger {{
                background: #f8d7da;
                border-left: 4px solid #dc3545;
                color: #721c24;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            th {{
                background: #4CAF50;
                color: white;
                font-weight: 600;
            }}
            tr:hover {{
                background: #f5f5f5;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }}
            .badge-success {{
                background: #28a745;
                color: white;
            }}
            .badge-danger {{
                background: #dc3545;
                color: white;
            }}
            .refresh-button {{
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }}
            .refresh-button:hover {{
                background: #45a049;
            }}
        </style>
        <script>
            function refreshPage() {{
                location.reload();
            }}
            // Auto-refresh every 30 seconds
            setTimeout(refreshPage, 30000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Model Monitoring Dashboard</h1>
            
            <p style="color: #666;">
                <strong>Model:</strong> {model_info.get('model_name', 'N/A')} v{model_info.get('model_version', 'N/A')} 
                | <strong>Stage:</strong> {model_info.get('model_stage', 'N/A')}
                | <button class="refresh-button" onclick="refreshPage()">🔄 Refresh</button>
            </p>
            
            <!-- Drift Alert -->
            {f'''
            <div class="alert alert-danger">
                <strong>⚠️ Drift Detected!</strong><br>
                Drift score: {drift_info.get('drift_score', 0):.2f} (threshold: 2.0)<br>
                Current mean: {drift_info.get('current_mean', 0):.2f} | Baseline mean: {drift_info.get('baseline_mean', 0):.2f}
            </div>
            ''' if drift_info.get('drift_detected') else ''}
            
            {f'''
            <div class="alert alert-warning">
                <strong>ℹ️ Baseline Not Configured</strong><br>
                Configure baseline for drift detection: <code>POST /monitoring/baseline</code>
            </div>
            ''' if not drift_info.get('baseline_configured') else ''}
            
            <!-- Metrics Grid -->
            <div class="metric-grid">
                <div class="metric-card">
                    <h3>Total Predictions</h3>
                    <div class="metric-value">{metrics.get('total_predictions', 0):,}</div>
                    <div class="metric-label">Since startup</div>
                </div>
                
                <div class="metric-card">
                    <h3>Uptime</h3>
                    <div class="metric-value">{metrics.get('uptime_hours', 0):.1f}h</div>
                    <div class="metric-label">{metrics.get('predictions_per_hour', 0):.1f} pred/hour</div>
                </div>
                
                <div class="metric-card">
                    <h3>Avg Prediction</h3>
                    <div class="metric-value">${metrics.get('avg_prediction', 0):.1f}k</div>
                    <div class="metric-label">Median: ${metrics.get('median_prediction', 0):.1f}k</div>
                </div>
                
                <div class="metric-card">
                    <h3>Prediction Range</h3>
                    <div class="metric-value">${metrics.get('min_prediction', 0):.1f}k - ${metrics.get('max_prediction', 0):.1f}k</div>
                    <div class="metric-label">Min - Max</div>
                </div>
                
                <div class="metric-card">
                    <h3>Avg Inference Time</h3>
                    <div class="metric-value">{metrics.get('avg_inference_time_ms', 0):.1f}ms</div>
                    <div class="metric-label">P95: {metrics.get('p95_inference_time_ms', 0):.1f}ms</div>
                </div>
                
                <div class="metric-card">
                    <h3>Std Deviation</h3>
                    <div class="metric-value">${metrics.get('std_prediction', 0):.1f}k</div>
                    <div class="metric-label">Prediction spread</div>
                </div>
            </div>
            
            <!-- Feature Statistics -->
            {f'''
            <h2 style="margin-top: 40px;">📊 Feature Statistics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Mean</th>
                        <th>Std</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Drift</th>
                    </tr>
                </thead>
                <tbody>
                    {_generate_feature_rows(feature_stats)}
                </tbody>
            </table>
            ''' if feature_stats else '<p style="color: #999;">No feature statistics available yet.</p>'}
            
            <p style="margin-top: 40px; color: #999; font-size: 12px;">
                Auto-refreshes every 30 seconds | Last update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </p>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@app.post("/admin/reload", tags=["Admin"])
async def reload_model():
    """
    Recarga el modelo desde models/production/latest/ sin reiniciar la API.
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


# ============================================================================
# EDA Endpoints
# ============================================================================

@app.get("/eda/data", tags=["EDA"])
async def get_eda_data():
    """
    Obtiene los datos del EDA en formato JSON.
    Busca primero el archivo con timestamp, luego el genérico.
    """
    import glob
    
    reports_dir = Path(__file__).parent.parent / "data" / "reports"
    
    # Buscar archivos eda_data con timestamp (más reciente primero)
    json_files = sorted(glob.glob(str(reports_dir / "eda_data_*.json")), reverse=True)
    
    # Si no hay con timestamp, buscar el genérico
    if not json_files:
        json_files = [str(reports_dir / "eda_data.json")]
    
    for json_file in json_files:
        if Path(json_file).exists():
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return data
            except Exception as e:
                logger.error(f"Error loading {json_file}: {e}")
                continue
    
    raise HTTPException(
        status_code=404,
        detail="EDA data not found. Run data_ingestion.py first."
    )


@app.get("/eda/report", response_class=HTMLResponse, tags=["EDA"])
async def get_eda_report():
    """
    Obtiene el reporte HTML del EDA.
    Busca primero el archivo con timestamp, luego el genérico.
    """
    import glob
    
    reports_dir = Path(__file__).parent.parent / "data" / "reports"
    
    # Buscar archivos raw_eda_report con timestamp (más reciente primero)
    html_files = sorted(glob.glob(str(reports_dir / "raw_eda_report_*.html")), reverse=True)
    
    # Si no hay con timestamp, buscar el genérico
    if not html_files:
        html_files = [str(reports_dir / "raw_eda_report.html")]
    
    for html_file in html_files:
        if Path(html_file).exists():
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                return HTMLResponse(content=content)
            except Exception as e:
                logger.error(f"Error loading {html_file}: {e}")
                continue
    
    raise HTTPException(
        status_code=404,
        detail="EDA report not found. Run data_ingestion.py first."
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
