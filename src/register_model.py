"""
Register best model to MLflow Model Registry.
"""

import json
import mlflow
import mlflow.xgboost
import joblib
from pathlib import Path
from datetime import datetime

# Setup paths
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
EVAL_DIR = MODELS_DIR / "evaluation"

# MLflow configuration
MLFLOW_TRACKING_URI = "http://localhost:5000"
MODEL_NAME = "housing-price-model"


def register_best_model():
    """Register the best model to MLflow Model Registry."""
    print("=" * 80)
    print("Model Registration - MLflow Model Registry")
    print("=" * 80)
    
    # Load comparison results
    comparison_file = EVAL_DIR / "model_comparison.json"
    if not comparison_file.exists():
        print("❌ Comparison file not found. Run evaluation first.")
        return
    
    with open(comparison_file, "r") as f:
        comparison = json.load(f)
    
    best_model_info = comparison["best_model"]
    best_model_name = best_model_info["model"]
    
    print(f"🏆 Best Model: {best_model_name}")
    print(f"   RMSE: {best_model_info['rmse']:.4f}")
    print(f"   R²: {best_model_info['r2']:.4f}")
    
    # Find model file
    model_filename = best_model_name.lower().replace(" ", "_") + ".pkl"
    model_path = MODELS_DIR / model_filename
    
    if not model_path.exists():
        print(f"❌ Model file not found: {model_path}")
        return
    
    # Load model
    model = joblib.load(model_path)
    
    # Set MLflow tracking URI
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    
    # Register model
    print(f"\n📦 Registering model to MLflow...")
    
    with mlflow.start_run(run_name=f"register_{best_model_name}"):
        # Log metrics
        mlflow.log_metrics({
            "rmse": best_model_info["rmse"],
            "mae": best_model_info["mae"],
            "r2": best_model_info["r2"],
            "mape": best_model_info["mape"]
        })
        
        # Log model
        mlflow.xgboost.log_model(
            model,
            artifact_path="model",
            registered_model_name=MODEL_NAME
        )
        
        # Get run info
        run_id = mlflow.active_run().info.run_id
        
        print(f"✅ Model registered successfully!")
        print(f"   Run ID: {run_id}")
        print(f"   Model Name: {MODEL_NAME}")
    
    # Save registration info
    registration_info = {
        "model_name": MODEL_NAME,
        "best_model": best_model_name,
        "run_id": run_id,
        "metrics": best_model_info,
        "registered_at": datetime.now().isoformat(),
        "mlflow_uri": MLFLOW_TRACKING_URI
    }
    
    with open(MODELS_DIR / "registered_model_info.json", "w") as f:
        json.dump(registration_info, f, indent=2)
    
    # Save registration metrics for DVC
    registration_metrics = {
        "registered_model": MODEL_NAME,
        "registration_timestamp": datetime.now().isoformat(),
        "model_rmse": best_model_info["rmse"],
        "model_r2": best_model_info["r2"]
    }
    
    with open(MODELS_DIR / "registration_metrics.json", "w") as f:
        json.dump(registration_metrics, f, indent=2)
    
    print(f"\n✅ Registration info saved to {MODELS_DIR / 'registered_model_info.json'}")
    print("=" * 80)


if __name__ == "__main__":
    register_best_model()
