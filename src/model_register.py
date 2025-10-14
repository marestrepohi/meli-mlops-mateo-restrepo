"""
Model Registration Module
Promotes the best trained model to MLflow Model Registry with stage management.

Este script:
1. Lee el mejor modelo entrenado por model_train.py
2. Lo registra en MLflow Model Registry con un nombre de producción
3. Permite transicionar entre stages (Staging, Production, Archived)
4. Genera métricas de registro para DVC tracking
"""

import json
import yaml
import mlflow
import mlflow.xgboost
import joblib
import logging
import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional
from mlflow.tracking import MlflowClient

# Configuración del logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# Setup paths
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"


def load_params(params_path: str = "params.yaml") -> Dict:
    """Carga parámetros desde archivo YAML."""
    try:
        params_file = PROJECT_ROOT / params_path
        with open(params_file, 'r') as file:
            params = yaml.safe_load(file)
        logger.info(f'✅ Parámetros cargados desde {params_path}')
        return params
    except Exception as e:
        logger.error(f'❌ Error cargando parámetros: {e}')
        raise


def get_best_run_from_experiment(experiment_name: str, tracking_uri: str) -> Optional[Dict]:
    """
    Obtiene el mejor run del experimento basado en test_rmse.
    
    Args:
        experiment_name: Nombre del experimento en MLflow
        tracking_uri: URI de MLflow tracking
        
    Returns:
        Diccionario con información del mejor run o None
    """
    mlflow.set_tracking_uri(tracking_uri)
    client = MlflowClient()
    
    # Obtener experimento
    experiment = mlflow.get_experiment_by_name(experiment_name)
    if not experiment:
        logger.error(f"❌ Experimento '{experiment_name}' no encontrado")
        return None
    
    # Buscar todos los runs del experimento
    runs = mlflow.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.test_rmse ASC"],
        max_results=1
    )
    
    if runs.empty:
        logger.error("❌ No se encontraron runs en el experimento")
        return None
    
    best_run = runs.iloc[0]
    
    return {
        "run_id": best_run["run_id"],
        "run_name": best_run["tags.mlflow.runName"],
        "test_rmse": best_run["metrics.test_rmse"],
        "test_r2": best_run["metrics.test_r2"],
        "test_mae": best_run["metrics.test_mae"],
        "test_mape": best_run["metrics.test_mape"],
    }


def export_production_model(
    model,
    scaler,
    model_info: Dict,
    metrics: Dict,
    model_version: int
) -> None:
    """
    Exporta el modelo de producción a models/production_model.pkl para uso de la API.
    
    Args:
        model: Modelo XGBoost entrenado
        scaler: StandardScaler usado en entrenamiento
        model_info: Información del modelo (features, tipo, etc.)
        metrics: Métricas del modelo
        model_version: Versión del modelo en MLflow
    """
    try:
        production_package = {
            'model': model,
            'scaler': scaler,
            'model_info': model_info,
            'metrics': metrics,
            'model_version': model_version,
            'exported_at': datetime.now().isoformat(),
            'features': model_info['feature_names']
        }
        
        production_path = MODELS_DIR / "production_model.pkl"
        joblib.dump(production_package, production_path)
        
        logger.info(f"✅ Modelo exportado para producción:")
        logger.info(f"   📁 Ruta: {production_path}")
        logger.info(f"   📦 Versión: v{model_version}")
        logger.info(f"   🎯 Features: {len(model_info['feature_names'])}")
        logger.info(f"   📊 Test RMSE: {metrics['test_rmse']:.4f}")
        
    except Exception as e:
        logger.error(f"❌ Error exportando modelo: {e}")
        raise


def promote_model_to_stage(
    model_name: str,
    version: int,
    stage: str,
    tracking_uri: str = "./mlruns"
) -> bool:
    """
    Promociona una versión del modelo a un stage específico.
    
    Args:
        model_name: Nombre del modelo registrado
        version: Versión del modelo
        stage: Stage destino ("Staging", "Production", "Archived")
        tracking_uri: URI de MLflow tracking
        
    Returns:
        True si fue exitoso, False en caso contrario
    """
    try:
        mlflow.set_tracking_uri(tracking_uri)
        client = MlflowClient()
        
        # Transicionar a nuevo stage
        client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage=stage,
            archive_existing_versions=True  # Archivar versiones previas en Production
        )
        
        logger.info(f"✅ Modelo '{model_name}' v{version} promovido a '{stage}'")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error promoviendo modelo: {e}")
        return False


def register_production_model(
    stage: str = "Staging",
    auto_promote: bool = False
) -> None:
    """
    Registra el mejor modelo en MLflow Model Registry para producción.
    
    Args:
        stage: Stage inicial del modelo ("Staging", "Production", "None")
        auto_promote: Si True, promociona automáticamente a Production
    """
    logger.info("=" * 80)
    logger.info("🚀 MODEL REGISTRATION - MLflow Model Registry")
    logger.info("=" * 80)
    
    # Cargar parámetros
    params = load_params()
    mlflow_config = params.get('mlflow', {})
    model_config = params.get('model_training', {})
    
    tracking_uri = mlflow_config.get('tracking_uri', './mlruns')
    experiment_name = mlflow_config.get('experiment_name', 'housing-price-prediction')
    production_model_name = mlflow_config.get('production_model_name', 'housing-price-production')
    
    logger.info(f"📋 Configuración:")
    logger.info(f"   - Tracking URI: {tracking_uri}")
    logger.info(f"   - Experimento: {experiment_name}")
    logger.info(f"   - Modelo producción: {production_model_name}")
    logger.info(f"   - Stage inicial: {stage}")
    
    # Verificar archivos locales del mejor modelo
    model_path = MODELS_DIR / "xgboost_model.pkl"
    metrics_path = MODELS_DIR / "metrics.json"
    model_info_path = MODELS_DIR / "model_info.json"
    
    if not model_path.exists():
        logger.error(f"❌ Archivo de modelo no encontrado: {model_path}")
        logger.info("💡 Ejecuta primero: python src/model_train.py")
        return
    
    # Cargar métricas y metadata del modelo
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
    
    with open(model_info_path, 'r') as f:
        model_info = json.load(f)
    
    logger.info("\n" + "=" * 80)
    logger.info("🏆 MEJOR MODELO ENTRENADO")
    logger.info("=" * 80)
    logger.info(f"📊 Métricas:")
    logger.info(f"   - Test RMSE: {metrics['test_rmse']:.4f}")
    logger.info(f"   - Test R²: {metrics['test_r2']:.4f}")
    logger.info(f"   - Test MAE: {metrics['test_mae']:.4f}")
    logger.info(f"   - Test MAPE: {metrics['test_mape']:.4f}")
    logger.info(f"🔧 Configuración:")
    logger.info(f"   - Tipo: {model_info['model_type']}")
    logger.info(f"   - Features: {model_info['n_features']}")
    logger.info(f"   - Features usadas: {', '.join(model_info['feature_names'][:5])}...")
    
    # Obtener información del mejor run en MLflow
    best_run_info = get_best_run_from_experiment(experiment_name, tracking_uri)
    
    if best_run_info:
        logger.info(f"\n📈 Mejor Run en MLflow:")
        logger.info(f"   - Run Name: {best_run_info['run_name']}")
        logger.info(f"   - Run ID: {best_run_info['run_id'][:8]}...")
        logger.info(f"   - Test RMSE: {best_run_info['test_rmse']:.4f}")
    
    # Cargar modelo y scaler
    logger.info(f"\n📦 Cargando modelo desde {model_path}...")
    model = joblib.load(model_path)
    
    scaler_path = MODELS_DIR / "standard_scaler.pkl"
    scaler_data = joblib.load(scaler_path)
    
    # El scaler se guarda como dict con clave 'escalador'
    if isinstance(scaler_data, dict):
        scaler = scaler_data.get('escalador')
        logger.info(f"✅ Scaler cargado desde diccionario")
    else:
        scaler = scaler_data
        logger.info(f"✅ Scaler cargado directamente")
    
    # Set MLflow tracking URI
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment(experiment_name)
    
    # Registrar modelo en MLflow Model Registry
    logger.info(f"\n🔄 Registrando modelo en MLflow Model Registry...")
    logger.info(f"   Nombre: {production_model_name}")
    
    with mlflow.start_run(run_name=f"register_production_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
        # Log parámetros de registro
        mlflow.log_param("stage", stage)
        mlflow.log_param("source_model_type", model_info['model_type'])
        mlflow.log_param("n_features", model_info['n_features'])
        mlflow.log_param("registration_date", datetime.now().isoformat())
        
        # Log métricas del mejor modelo
        mlflow.log_metrics({
            "prod_test_rmse": metrics['test_rmse'],
            "prod_test_r2": metrics['test_r2'],
            "prod_test_mae": metrics['test_mae'],
            "prod_test_mape": metrics['test_mape'],
            "prod_train_rmse": metrics['train_rmse'],
            "prod_train_r2": metrics['train_r2']
        })
        
        # Log feature names
        for i, feature in enumerate(model_info['feature_names'], 1):
            mlflow.log_param(f"feature_{i}", feature)
        
        # Preparar input example (datos de prueba)
        import pandas as pd
        import numpy as np
        
        # Leer datos procesados para obtener ejemplo real
        train_data = pd.read_csv(PROJECT_ROOT / "data" / "processed" / "train.csv")
        
        # Obtener solo las features seleccionadas en el modelo
        selected_features = model_info['feature_names']
        feature_example = train_data[selected_features].head(1)
        
        logger.info(f"📋 Input example con {len(selected_features)} features: {', '.join(selected_features)}")
        
        # Log artifacts adicionales
        artifacts_dir = MODELS_DIR
        mlflow.log_artifact(str(metrics_path), "model_metrics")
        mlflow.log_artifact(str(model_info_path), "model_info")
        
        # Crear signature (el modelo ya espera datos SIN escalar, porque se entrenó con X_train que YA estaba escalado)
        from mlflow.models.signature import infer_signature
        signature = infer_signature(feature_example, model.predict(feature_example))
        
        # Registrar modelo con nombre de producción
        model_uri = mlflow.xgboost.log_model(
            model,
            artifact_path="model",
            registered_model_name=production_model_name,
            signature=signature,
            input_example=feature_example
        ).model_uri
        
        run_id = mlflow.active_run().info.run_id
        
        logger.info(f"✅ Modelo registrado exitosamente!")
        logger.info(f"   Run ID: {run_id}")
        logger.info(f"   Model URI: {model_uri}")
    
    # Obtener versión del modelo registrado
    client = MlflowClient()
    model_versions = client.search_model_versions(f"name='{production_model_name}'")
    latest_version = max([int(mv.version) for mv in model_versions])
    
    logger.info(f"\n📌 Versión registrada: v{latest_version}")
    
    # Promocionar a stage si es necesario
    if stage != "None":
        logger.info(f"\n🎯 Promoviendo modelo a stage '{stage}'...")
        success = promote_model_to_stage(
            model_name=production_model_name,
            version=latest_version,
            stage=stage,
            tracking_uri=tracking_uri
        )
        
        if success and auto_promote and stage == "Staging":
            logger.info(f"\n🚀 Auto-promoción a 'Production'...")
            promote_model_to_stage(
                model_name=production_model_name,
                version=latest_version,
                stage="Production",
                tracking_uri=tracking_uri
            )
    
    # Guardar información de registro
    registration_info = {
        "model_name": production_model_name,
        "version": latest_version,
        "stage": stage,
        "run_id": run_id,
        "model_uri": model_uri,
        "metrics": metrics,
        "model_info": model_info,
        "registered_at": datetime.now().isoformat(),
        "mlflow_tracking_uri": tracking_uri
    }
    
    registration_file = MODELS_DIR / "registered_model_info.json"
    with open(registration_file, "w") as f:
        json.dump(registration_info, f, indent=2)
    
    logger.info(f"\n💾 Información de registro guardada en:")
    logger.info(f"   {registration_file}")
    
    # Guardar métricas de registro para DVC
    registration_metrics = {
        "registered_model_name": production_model_name,
        "model_version": latest_version,
        "stage": stage,
        "registration_timestamp": datetime.now().isoformat(),
        "prod_test_rmse": metrics['test_rmse'],
        "prod_test_r2": metrics['test_r2'],
        "prod_test_mae": metrics['test_mae']
    }
    
    registration_metrics_file = MODELS_DIR / "registration_metrics.json"
    with open(registration_metrics_file, "w") as f:
        json.dump(registration_metrics, f, indent=2)
    
    logger.info(f"   {registration_metrics_file}")
    
    # Exportar modelo para producción (API)
    logger.info(f"\n📤 Exportando modelo para producción...")
    export_production_model(
        model=model,
        scaler=scaler,
        model_info=model_info,
        metrics=metrics,
        model_version=latest_version
    )
    
    # Resumen final
    logger.info("\n" + "=" * 80)
    logger.info("✅ REGISTRO COMPLETADO EXITOSAMENTE")
    logger.info("=" * 80)
    logger.info(f"📦 Modelo: {production_model_name} v{latest_version}")
    logger.info(f"🎯 Stage: {stage}")
    logger.info(f"📊 Test RMSE: {metrics['test_rmse']:.4f}")
    logger.info(f"📊 Test R²: {metrics['test_r2']:.4f}")
    logger.info("\n💡 Próximos pasos:")
    logger.info("   1. Ver modelo en MLflow UI: mlflow ui --port 5000")
    logger.info("   2. Ir a 'Models' → buscar '{}'".format(production_model_name))
    logger.info(f"   3. API cargará modelo desde: models/production_model.pkl")
    logger.info("   4. Iniciar API: cd api && ./start.sh")
    logger.info("=" * 80)


def main():
    """Main function con argumentos CLI."""
    parser = argparse.ArgumentParser(
        description="Registrar modelo en MLflow Model Registry"
    )
    parser.add_argument(
        "--stage",
        type=str,
        default="Staging",
        choices=["None", "Staging", "Production", "Archived"],
        help="Stage inicial del modelo (default: Staging)"
    )
    parser.add_argument(
        "--auto-promote",
        action="store_true",
        help="Promover automáticamente de Staging a Production"
    )
    
    args = parser.parse_args()
    
    register_production_model(
        stage=args.stage,
        auto_promote=args.auto_promote
    )


if __name__ == "__main__":
    main()
