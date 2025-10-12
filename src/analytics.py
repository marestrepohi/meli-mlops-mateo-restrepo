"""
Extended API endpoints for frontend integration.
Includes EDA, data lineage, MLflow integration, and drift detection.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from pathlib import Path
import mlflow
from sklearn.preprocessing import StandardScaler
from scipy import stats

from config import settings
from monitoring import monitor

router = APIRouter(prefix="/api/v1", tags=["analytics"])


# ============================================================================
# EDA Endpoints
# ============================================================================

@router.get("/eda/dataset-info")
async def get_dataset_info():
    """Get general information about the Boston Housing dataset."""
    try:
        data_path = settings.data_path
        if not data_path.exists():
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        df = pd.read_csv(data_path)
        
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "features": list(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.2f} KB",
            "file_size": f"{data_path.stat().st_size / 1024:.2f} KB",
            "last_modified": datetime.fromtimestamp(data_path.stat().st_mtime).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/eda/statistics")
async def get_statistics(feature: Optional[str] = None):
    """Get descriptive statistics for the dataset or a specific feature."""
    try:
        df = pd.read_csv(settings.data_path)
        
        if feature and feature in df.columns:
            # Statistics for single feature
            series = df[feature]
            return {
                "feature": feature,
                "count": int(series.count()),
                "mean": float(series.mean()),
                "std": float(series.std()),
                "min": float(series.min()),
                "25%": float(series.quantile(0.25)),
                "50%": float(series.median()),
                "75%": float(series.quantile(0.75)),
                "max": float(series.max()),
                "skewness": float(series.skew()),
                "kurtosis": float(series.kurtosis())
            }
        else:
            # Statistics for all features
            stats_df = df.describe()
            return stats_df.to_dict()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/eda/distribution")
async def get_distribution(feature: str, bins: int = 30):
    """Get distribution data for a feature (for histogram)."""
    try:
        df = pd.read_csv(settings.data_path)
        
        if feature not in df.columns:
            raise HTTPException(status_code=404, detail=f"Feature '{feature}' not found")
        
        data = df[feature].dropna()
        hist, edges = np.histogram(data, bins=bins)
        
        return {
            "feature": feature,
            "bins": edges.tolist(),
            "counts": hist.tolist(),
            "total": len(data),
            "mean": float(data.mean()),
            "median": float(data.median()),
            "std": float(data.std())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/eda/correlation")
async def get_correlation_matrix():
    """Get correlation matrix for all numeric features."""
    try:
        df = pd.read_csv(settings.data_path)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        corr_matrix = df[numeric_cols].corr()
        
        return {
            "features": numeric_cols.tolist(),
            "matrix": corr_matrix.values.tolist(),
            "correlations": corr_matrix.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/eda/feature-importance")
async def get_feature_importance():
    """Get feature importance from the current production model."""
    try:
        import joblib
        model_path = settings.model_path / "model.pkl"
        
        if not model_path.exists():
            raise HTTPException(status_code=404, detail="Model not found")
        
        model = joblib.load(model_path)
        
        if hasattr(model, 'feature_importances_'):
            preprocessor_path = settings.model_path / "preprocessor.pkl"
            preprocessor_data = joblib.load(preprocessor_path)
            feature_names = preprocessor_data['feature_names']
            
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            return {
                "features": [feature_names[i] for i in indices],
                "importances": importances[indices].tolist(),
                "model_type": type(model).__name__
            }
        else:
            return {
                "message": "Model does not have feature importances",
                "model_type": type(model).__name__
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Data Lineage & Versioning
# ============================================================================

@router.get("/lineage/versions")
async def get_data_versions():
    """Get all versions of the dataset with metadata."""
    try:
        # This would typically come from a data versioning tool like DVC
        # For now, we'll simulate with file metadata
        data_dir = settings.data_path.parent
        versions = []
        
        for file_path in data_dir.glob("*.csv"):
            stat = file_path.stat()
            df = pd.read_csv(file_path)
            
            versions.append({
                "filename": file_path.name,
                "version": file_path.stem,
                "size": stat.st_size,
                "rows": len(df),
                "columns": len(df.columns),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "hash": hash(df.to_string())  # Simple hash for demo
            })
        
        return sorted(versions, key=lambda x: x['modified'], reverse=True)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lineage/changes")
async def get_data_changes(
    version1: str = Query(..., description="First version filename"),
    version2: str = Query(..., description="Second version filename")
):
    """Compare two versions of the dataset."""
    try:
        data_dir = settings.data_path.parent
        
        df1 = pd.read_csv(data_dir / version1)
        df2 = pd.read_csv(data_dir / version2)
        
        changes = {
            "rows": {
                "version1": len(df1),
                "version2": len(df2),
                "diff": len(df2) - len(df1)
            },
            "columns": {
                "version1": list(df1.columns),
                "version2": list(df2.columns),
                "added": list(set(df2.columns) - set(df1.columns)),
                "removed": list(set(df1.columns) - set(df2.columns))
            },
            "statistics_changes": {}
        }
        
        # Compare statistics for common columns
        common_cols = set(df1.columns) & set(df2.columns)
        for col in common_cols:
            if df1[col].dtype in [np.float64, np.int64]:
                changes["statistics_changes"][col] = {
                    "mean_v1": float(df1[col].mean()),
                    "mean_v2": float(df2[col].mean()),
                    "mean_diff": float(df2[col].mean() - df1[col].mean()),
                    "std_v1": float(df1[col].std()),
                    "std_v2": float(df2[col].std())
                }
        
        return changes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MLflow Integration
# ============================================================================

@router.get("/mlflow/experiments")
async def get_experiments():
    """Get all MLflow experiments."""
    try:
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        experiments = mlflow.search_experiments()
        
        return [
            {
                "experiment_id": exp.experiment_id,
                "name": exp.name,
                "artifact_location": exp.artifact_location,
                "lifecycle_stage": exp.lifecycle_stage,
                "tags": exp.tags
            }
            for exp in experiments
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mlflow/runs")
async def get_mlflow_runs(
    experiment_name: str = Query(default="housing-price-prediction"),
    limit: int = Query(default=10, ge=1, le=100)
):
    """Get MLflow runs for an experiment."""
    try:
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        
        experiment = mlflow.get_experiment_by_name(experiment_name)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            max_results=limit,
            order_by=["start_time DESC"]
        )
        
        # Convert DataFrame to dict
        runs_data = []
        for _, run in runs.iterrows():
            run_dict = {
                "run_id": run.get("run_id"),
                "start_time": run.get("start_time"),
                "end_time": run.get("end_time"),
                "status": run.get("status"),
                "metrics": {},
                "params": {}
            }
            
            # Extract metrics
            for col in run.index:
                if col.startswith("metrics."):
                    metric_name = col.replace("metrics.", "")
                    run_dict["metrics"][metric_name] = run[col]
                elif col.startswith("params."):
                    param_name = col.replace("params.", "")
                    run_dict["params"][param_name] = run[col]
            
            runs_data.append(run_dict)
        
        return runs_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mlflow/run/{run_id}")
async def get_run_details(run_id: str):
    """Get detailed information about a specific run."""
    try:
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        client = mlflow.tracking.MlflowClient()
        
        run = client.get_run(run_id)
        
        return {
            "run_id": run.info.run_id,
            "experiment_id": run.info.experiment_id,
            "status": run.info.status,
            "start_time": run.info.start_time,
            "end_time": run.info.end_time,
            "metrics": run.data.metrics,
            "params": run.data.params,
            "tags": run.data.tags,
            "artifact_uri": run.info.artifact_uri
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Data Drift Detection
# ============================================================================

@router.post("/drift/detect")
async def detect_drift(current_data: Dict[str, List[float]]):
    """
    Detect data drift between training data and current data.
    Uses Kolmogorov-Smirnov test for each feature.
    """
    try:
        # Load training data statistics
        df_train = pd.read_csv(settings.data_path)
        
        drift_results = {
            "overall_drift": False,
            "features": {},
            "drift_score": 0.0,
            "timestamp": datetime.now().isoformat()
        }
        
        drift_count = 0
        total_features = 0
        
        for feature, values in current_data.items():
            if feature in df_train.columns:
                total_features += 1
                
                # Perform KS test
                statistic, p_value = stats.ks_2samp(
                    df_train[feature].dropna(),
                    values
                )
                
                has_drift = p_value < 0.05  # 5% significance level
                if has_drift:
                    drift_count += 1
                
                drift_results["features"][feature] = {
                    "has_drift": has_drift,
                    "p_value": float(p_value),
                    "statistic": float(statistic),
                    "severity": "high" if p_value < 0.01 else "medium" if p_value < 0.05 else "low"
                }
        
        # Calculate overall drift score
        drift_results["drift_score"] = drift_count / total_features if total_features > 0 else 0
        drift_results["overall_drift"] = drift_results["drift_score"] > 0.3  # 30% threshold
        
        return drift_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drift/alerts")
async def get_drift_alerts(days: int = Query(default=7, ge=1, le=30)):
    """Get drift detection alerts from the last N days."""
    try:
        # This would typically come from a database
        # For demo, we'll generate synthetic alerts
        alerts = []
        
        for i in range(5):
            alerts.append({
                "id": f"alert_{i}",
                "timestamp": (datetime.now() - timedelta(days=i)).isoformat(),
                "severity": ["low", "medium", "high"][i % 3],
                "feature": ["RM", "LSTAT", "PTRATIO", "NOX", "DIS"][i % 5],
                "drift_score": 0.05 + (i * 0.02),
                "status": "resolved" if i > 2 else "active",
                "recommendation": "Consider retraining" if i <= 2 else "Monitor"
            })
        
        return alerts[:days]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Synthetic Data Generation
# ============================================================================

@router.post("/synthetic/generate")
async def generate_synthetic_data(
    n_samples: int = Query(default=100, ge=10, le=1000),
    drift_factor: float = Query(default=0.0, ge=0.0, le=2.0),
    drift_features: Optional[List[str]] = None
):
    """
    Generate synthetic data based on training distribution.
    drift_factor: 0 = no drift, 1 = moderate drift, 2 = severe drift
    """
    try:
        df_train = pd.read_csv(settings.data_path)
        
        synthetic_data = {}
        
        for col in df_train.columns:
            if df_train[col].dtype in [np.float64, np.int64]:
                mean = df_train[col].mean()
                std = df_train[col].std()
                
                # Apply drift if specified
                if drift_features and col in drift_features:
                    mean = mean * (1 + drift_factor * 0.2)  # Shift mean
                    std = std * (1 + drift_factor * 0.3)    # Increase variance
                
                # Generate synthetic values
                values = np.random.normal(mean, std, n_samples)
                
                # Clip to reasonable ranges
                values = np.clip(values, df_train[col].min(), df_train[col].max())
                
                synthetic_data[col] = values.tolist()
        
        return {
            "data": synthetic_data,
            "n_samples": n_samples,
            "drift_factor": drift_factor,
            "drift_features": drift_features or [],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/synthetic/save")
async def save_synthetic_dataset(
    data: Dict[str, List[float]],
    name: str = Query(..., description="Dataset name")
):
    """Save synthetic dataset for testing."""
    try:
        df = pd.DataFrame(data)
        
        # Save to data directory
        synthetic_dir = settings.data_path.parent / "synthetic"
        synthetic_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.csv"
        filepath = synthetic_dir / filename
        
        df.to_csv(filepath, index=False)
        
        return {
            "message": "Synthetic dataset saved successfully",
            "filename": filename,
            "path": str(filepath),
            "rows": len(df),
            "columns": len(df.columns)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
