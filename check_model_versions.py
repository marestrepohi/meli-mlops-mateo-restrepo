#!/usr/bin/env python3
"""
Script para verificar las versiones de modelos registrados en MLflow Model Registry.
"""

import mlflow
from mlflow.tracking import MlflowClient

def check_registered_models():
    """Verifica todos los modelos registrados y sus versiones."""
    
    # Configurar MLflow
    mlflow.set_tracking_uri("./mlruns")
    client = MlflowClient()
    
    print("="*70)
    print("📦 MODELOS REGISTRADOS EN MODEL REGISTRY")
    print("="*70)
    
    # Obtener todos los modelos registrados
    registered_models = client.search_registered_models()
    
    if not registered_models:
        print("\n⚠️  No hay modelos registrados en el Model Registry.")
        print("\n💡 Los modelos se registrarán automáticamente al ejecutar:")
        print("   python src/model_train.py")
        return
    
    for rm in registered_models:
        print(f"\n🏷️  Modelo: {rm.name}")
        print(f"   Descripción: {rm.description if rm.description else 'N/A'}")
        print(f"   Creado: {rm.creation_timestamp}")
        print(f"   Última actualización: {rm.last_updated_timestamp}")
        
        # Obtener todas las versiones de este modelo
        versions = client.search_model_versions(f"name='{rm.name}'")
        
        print(f"\n   📊 Versiones ({len(versions)}):")
        for version in sorted(versions, key=lambda x: int(x.version), reverse=True):
            print(f"      • Versión {version.version}")
            print(f"        - Estado: {version.current_stage}")
            print(f"        - Run ID: {version.run_id}")
            print(f"        - Creado: {version.creation_timestamp}")
            
            # Obtener métricas del run
            run = client.get_run(version.run_id)
            if run.data.metrics:
                print(f"        - Métricas:")
                for metric_name, metric_value in sorted(run.data.metrics.items()):
                    if 'test' in metric_name:
                        print(f"          * {metric_name}: {metric_value:.4f}")
            print()
    
    print("="*70)
    print("\n💡 Para ver los modelos en la UI:")
    print("   1. Inicia MLflow UI: mlflow ui --port 5000")
    print("   2. Ve a la pestaña 'Models' en http://localhost:5000")
    print("   3. Cada modelo mostrará todas sus versiones")
    print("="*70)


if __name__ == "__main__":
    check_registered_models()
