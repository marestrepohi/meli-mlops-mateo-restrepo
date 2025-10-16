"""
Model Registration Module
Registra el mejor modelo en MLflow Model Registry y lo promociona a un stage específico.

Este script:
1. Lee model_info.json (generado por model_train.py)
2. Registra el modelo en MLflow Model Registry
3. Transiciona el modelo al stage especificado (Production, Staging, Archived)
4. Archiva versiones antiguas si es necesario

Uso:
    python src/model_register.py --stage Production
    python src/model_register.py --stage Staging
    python src/model_register.py --stage Archived
"""

import logging
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

import mlflow
from mlflow.tracking import MlflowClient
from mlflow.exceptions import MlflowException

# --- Configuración del Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def load_model_info(model_info_path: Path) -> Dict[str, Any]:
    """
    Carga la información del modelo desde model_info.json.
    
    Args:
        model_info_path: Ruta al archivo model_info.json
        
    Returns:
        Dict con run_id y model_path del mejor modelo
        
    Raises:
        FileNotFoundError: Si el archivo no existe
        json.JSONDecodeError: Si el JSON es inválido
    """
    try:
        logger.info(f"📂 Cargando información del modelo desde: {model_info_path}")
        with open(model_info_path, 'r') as f:
            model_info = json.load(f)
        
        if 'run_id' not in model_info:
            raise ValueError("model_info.json debe contener 'run_id'")
        
        logger.info(f"✅ Información del modelo cargada:")
        logger.info(f"   - Run ID: {model_info['run_id']}")
        logger.info(f"   - Model Path: {model_info.get('model_path', 'N/A')}")
        
        return model_info
    
    except FileNotFoundError:
        logger.error(f"❌ Archivo no encontrado: {model_info_path}")
        logger.error("💡 Asegúrate de ejecutar primero: python src/model_train.py")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"❌ Error al parsear JSON: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")
        raise


def get_run_info(client: MlflowClient, run_id: str) -> Dict[str, Any]:
    """
    Obtiene información detallada del run de MLflow.
    
    Args:
        client: Cliente de MLflow
        run_id: ID del run
        
    Returns:
        Dict con información del run (métricas, parámetros, tags)
    """
    try:
        logger.info(f"🔍 Obteniendo información del run: {run_id}")
        run = client.get_run(run_id)
        
        metrics = run.data.metrics
        params = run.data.params
        tags = run.data.tags
        
        logger.info(f"✅ Run encontrado:")
        logger.info(f"   - Experimento: {tags.get('mlflow.runName', 'N/A')}")
        logger.info(f"   - Test RMSE: {metrics.get('test_rmse', 'N/A')}")
        logger.info(f"   - Test R²: {metrics.get('test_r2', 'N/A')}")
        
        return {
            'metrics': metrics,
            'params': params,
            'tags': tags,
            'run': run
        }
    
    except MlflowException as e:
        logger.error(f"❌ Error obteniendo información del run: {e}")
        raise


def register_model(
    client: MlflowClient,
    model_uri: str,
    model_name: str,
    run_info: Dict[str, Any]
) -> str:
    """
    Registra el modelo en MLflow Model Registry.
    
    Args:
        client: Cliente de MLflow
        model_uri: URI del modelo (e.g., runs:/<run_id>/model)
        model_name: Nombre del modelo en el registry
        run_info: Información del run (métricas, parámetros)
        
    Returns:
        version: Versión del modelo registrado
    """
    try:
        logger.info(f"📦 Registrando modelo en MLflow Model Registry...")
        logger.info(f"   - Model Name: {model_name}")
        logger.info(f"   - Model URI: {model_uri}")
        
        # Registrar el modelo
        model_version = mlflow.register_model(
            model_uri=model_uri,
            name=model_name
        )
        
        version = model_version.version
        logger.info(f"✅ Modelo registrado con éxito:")
        logger.info(f"   - Model Name: {model_name}")
        logger.info(f"   - Version: {version}")
        
        # Agregar descripción al modelo con métricas
        try:
            metrics = run_info['metrics']
            test_rmse = metrics.get('test_rmse', 'N/A')
            test_r2 = metrics.get('test_r2', 'N/A')
            test_mae = metrics.get('test_mae', 'N/A')
            experiment_name = run_info['tags'].get('mlflow.runName', 'N/A')
            
            # Formatear valores solo si no son 'N/A'
            test_rmse_str = f"{test_rmse:.4f}" if test_rmse != 'N/A' else 'N/A'
            test_r2_str = f"{test_r2:.4f}" if test_r2 != 'N/A' else 'N/A'
            test_mae_str = f"{test_mae:.4f}" if test_mae != 'N/A' else 'N/A'
            
            description = (
                f"XGBoost Housing Price Prediction Model\n"
                f"Test RMSE: {test_rmse_str}\n"
                f"Test R²: {test_r2_str}\n"
                f"Test MAE: {test_mae_str}\n"
                f"Experiment: {experiment_name}"
            )
            
            client.update_model_version(
                name=model_name,
                version=version,
                description=description
            )
            logger.info(f"✅ Descripción del modelo actualizada")
        except Exception as e:
            logger.warning(f"⚠️  No se pudo actualizar la descripción: {e}")
        
        return version
    
    except MlflowException as e:
        logger.error(f"❌ Error registrando modelo: {e}")
        raise


def transition_model_stage(
    client: MlflowClient,
    model_name: str,
    version: str,
    stage: str,
    archive_existing: bool = True
) -> None:
    """
    Transiciona el modelo a un stage específico en MLflow Model Registry.
    
    Args:
        client: Cliente de MLflow
        model_name: Nombre del modelo
        version: Versión del modelo
        stage: Stage destino (Production, Staging, Archived)
        archive_existing: Si True, archiva versiones existentes en el stage
    """
    try:
        valid_stages = ['Production', 'Staging', 'Archived', 'None']
        if stage not in valid_stages:
            raise ValueError(f"Stage inválido: {stage}. Debe ser uno de {valid_stages}")
        
        logger.info(f"🔄 Transicionando modelo al stage: {stage}")
        
        # Si se solicita archivar versiones existentes en el stage
        if archive_existing and stage in ['Production', 'Staging']:
            try:
                logger.info(f"📦 Archivando versiones existentes en {stage}...")
                
                # Obtener todas las versiones del modelo
                model_versions = client.get_latest_versions(model_name, stages=[stage])
                
                for mv in model_versions:
                    try:
                        logger.info(f"   - Archivando versión {mv.version} (stage: {mv.current_stage})")
                        client.transition_model_version_stage(
                            name=model_name,
                            version=mv.version,
                            stage="Archived"
                        )
                    except Exception as e:
                        logger.warning(f"   ⚠️  No se pudo archivar versión {mv.version}: {e}")
            except Exception as e:
                logger.warning(f"⚠️  Error al archivar versiones existentes: {e}")
        
        # Transicionar la nueva versión al stage solicitado
        try:
            client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )
            
            logger.info(f"✅ Modelo transicionado exitosamente:")
            logger.info(f"   - Model: {model_name}")
            logger.info(f"   - Version: {version}")
            logger.info(f"   - Stage: {stage}")
        except Exception as e:
            logger.error(f"❌ Error transicionando a {stage}: {e}")
            # Intentar con alias (nuevo API de MLflow 2.9+)
            try:
                logger.info(f"🔄 Intentando transición con alias (MLflow 2.9+)...")
                client.set_registered_model_alias(model_name, stage.lower(), version)
                logger.info(f"✅ Alias '{stage.lower()}' asignado a versión {version}")
            except Exception as e2:
                logger.error(f"❌ Falló transición con alias: {e2}")
                raise
    
    except Exception as e:
        logger.error(f"❌ Error transicionando modelo: {e}")
        raise


def add_model_tags(
    client: MlflowClient,
    model_name: str,
    version: str,
    tags: Dict[str, str]
) -> None:
    """
    Agrega tags al modelo registrado.
    
    Args:
        client: Cliente de MLflow
        model_name: Nombre del modelo
        version: Versión del modelo
        tags: Diccionario de tags a agregar
    """
    try:
        logger.info(f"🏷️  Agregando tags al modelo...")
        for key, value in tags.items():
            client.set_model_version_tag(
                name=model_name,
                version=version,
                key=key,
                value=value
            )
            logger.info(f"   - {key}: {value}")
        
        logger.info(f"✅ Tags agregados exitosamente")
    
    except MlflowException as e:
        logger.error(f"❌ Error agregando tags: {e}")
        raise


def get_production_model_info(
    client: MlflowClient,
    model_name: str
) -> Optional[Dict[str, Any]]:
    """
    Obtiene información del modelo actualmente en producción.
    
    Args:
        client: Cliente de MLflow
        model_name: Nombre del modelo
        
    Returns:
        Dict con información del modelo en producción o None si no existe
    """
    try:
        production_versions = client.get_latest_versions(model_name, stages=["Production"])
        
        if not production_versions:
            logger.info("ℹ️  No hay modelo en producción actualmente")
            return None
        
        prod_model = production_versions[0]
        logger.info(f"📊 Modelo actual en producción:")
        logger.info(f"   - Version: {prod_model.version}")
        logger.info(f"   - Run ID: {prod_model.run_id}")
        
        return {
            'version': prod_model.version,
            'run_id': prod_model.run_id,
            'model': prod_model
        }
    
    except MlflowException as e:
        logger.warning(f"⚠️  Error obteniendo modelo en producción: {e}")
        return None


def main():
    """
    Función principal para registrar el modelo en MLflow Model Registry.
    """
    # Parse argumentos
    parser = argparse.ArgumentParser(
        description='Registra el mejor modelo en MLflow Model Registry'
    )
    parser.add_argument(
        '--stage',
        type=str,
        default='Production',
        choices=['Production', 'Staging', 'Archived'],
        help='Stage al que transicionar el modelo (default: Production)'
    )
    parser.add_argument(
        '--model-name',
        type=str,
        default='housing-price-production',
        help='Nombre del modelo en Model Registry (default: housing-price-production)'
    )
    parser.add_argument(
        '--model-info-path',
        type=str,
        default='models/model_info.json',
        help='Ruta al archivo model_info.json (default: models/model_info.json)'
    )
    parser.add_argument(
        '--no-archive',
        action='store_true',
        help='No archivar versiones existentes en el stage'
    )
    
    args = parser.parse_args()
    
    logger.info("\n" + "="*70)
    logger.info("📦 REGISTRO DE MODELO EN MLFLOW MODEL REGISTRY")
    logger.info("="*70)
    
    # PASO 1: Cargar información del modelo
    model_info_path = Path(args.model_info_path)
    
    try:
        model_info = load_model_info(model_info_path)
        run_id = model_info['run_id']
        model_path = model_info.get('model_path', f"runs:/{run_id}/model")
    
    except Exception as e:
        logger.error(f"❌ No se pudo cargar model_info.json: {e}")
        sys.exit(1)
    
    # PASO 2: Configurar MLflow
    # Intentar cargar tracking_uri desde params.yaml, si falla usar default
    try:
        import yaml
        params_path = Path("params.yaml")
        if params_path.exists():
            with open(params_path, 'r') as f:
                params = yaml.safe_load(f)
            tracking_uri = params.get('mlflow', {}).get('tracking_uri', './mlruns')
        else:
            tracking_uri = './mlruns'
    except Exception:
        tracking_uri = './mlruns'
    
    mlflow.set_tracking_uri(tracking_uri)
    client = MlflowClient()
    
    logger.info(f"📊 MLflow configurado:")
    logger.info(f"   - Tracking URI: {tracking_uri}")
    logger.info(f"   - Model Name: {args.model_name}")
    logger.info(f"   - Target Stage: {args.stage}")
    
    # PASO 3: Obtener información del run
    try:
        run_info = get_run_info(client, run_id)
    except Exception as e:
        logger.error(f"❌ No se pudo obtener información del run: {e}")
        sys.exit(1)
    
    # PASO 4: Mostrar información del modelo actual en producción (si existe)
    if args.stage == 'Production':
        get_production_model_info(client, args.model_name)
    
    # PASO 5: Registrar el modelo
    try:
        version = register_model(
            client=client,
            model_uri=model_path,
            model_name=args.model_name,
            run_info=run_info
        )
    except Exception as e:
        logger.error(f"❌ No se pudo registrar el modelo: {e}")
        sys.exit(1)
    
    # PASO 6: Agregar tags al modelo
    tags = {
        'framework': 'xgboost',
        'task': 'regression',
        'dataset': 'boston-housing',
        'registered_by': 'model_register.py',
        'experiment': run_info['tags'].get('mlflow.runName', 'N/A')
    }
    
    try:
        add_model_tags(client, args.model_name, version, tags)
    except Exception as e:
        logger.warning(f"⚠️  No se pudieron agregar tags: {e}")
    
    # PASO 7: Transicionar al stage solicitado
    try:
        transition_model_stage(
            client=client,
            model_name=args.model_name,
            version=version,
            stage=args.stage,
            archive_existing=not args.no_archive
        )
    except Exception as e:
        logger.error(f"❌ No se pudo transicionar el modelo: {e}")
        sys.exit(1)
    
    # RESUMEN FINAL
    logger.info("\n" + "="*70)
    logger.info("✅ ¡REGISTRO DE MODELO COMPLETADO EXITOSAMENTE!")
    logger.info("="*70)
    logger.info(f"📦 Modelo: {args.model_name}")
    logger.info(f"🔢 Versión: {version}")
    logger.info(f"🏷️  Stage: {args.stage}")
    logger.info(f"🔗 Run ID: {run_id}")
    logger.info("\n💡 Próximos pasos:")
    logger.info(f"   1. Ver modelo en UI: mlflow ui --backend-store-uri {tracking_uri}")
    logger.info(f"   2. Navegar a: Models > {args.model_name}")
    logger.info(f"   3. Cargar modelo: mlflow.pyfunc.load_model('models:/{args.model_name}/{args.stage}')")
    logger.info("="*70)


if __name__ == "__main__":
    main()
