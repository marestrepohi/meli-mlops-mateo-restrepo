"""
Training module for the housing price prediction model.
XGBoost-focused training pipeline with multiple strategies:
1. Baseline model with all features
2. Hyperparameter tuning with GridSearchCV
3. Feature selection by importance
4. Final tuned model with top features
"""

import mlflow
import mlflow.sklearn
import mlflow.xgboost
import numpy as np
import yaml
import json
from pathlib import Path
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Any, Dict, Tuple, List
import xgboost as xgb

from config import settings
from src.data_preparation import DataPreprocessor


class ModelTrainer:
    """Handles model training and evaluation with MLflow tracking."""

    def __init__(self, experiment_name: str = None, params_path: Path = None):
        """Initialize the trainer."""
        self.experiment_name = experiment_name or settings.mlflow_experiment_name

        # Load params.yaml if provided
        self.params = {}
        if params_path and params_path.exists():
            with open(params_path, "r") as f:
                self.params = yaml.safe_load(f)
            print(f"📋 Loaded parameters from {params_path}")

        # Set MLflow tracking URI
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)

        # Create or get experiment
        experiment = mlflow.get_experiment_by_name(self.experiment_name)
        if experiment is None:
            self.experiment_id = mlflow.create_experiment(self.experiment_name)
            print(f"✅ Created experiment: {self.experiment_name}")
        else:
            self.experiment_id = experiment.experiment_id
            print(f"📂 Using existing experiment: {self.experiment_name}")

        mlflow.set_experiment(self.experiment_name)

    def get_model(self, model_name: str, **params) -> Any:
        """
        Get model instance by name.

        Args:
            model_name: Name of the model
            **params: Model hyperparameters

        Returns:
            Model instance
        """
        models = {
            "RandomForest": RandomForestRegressor,
            "GradientBoosting": GradientBoostingRegressor,
            "LinearRegression": LinearRegression,
            "Ridge": Ridge,
            "Lasso": Lasso,
        }

        if model_name not in models:
            raise ValueError(
                f"Unknown model: {model_name}. Choose from {list(models.keys())}"
            )

        return models[model_name](**params)

    def log_evaluation_artifacts(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        model_name: str,
        model: Any = None,
        feature_names: list = None,
    ):
        """
        Generate and log evaluation plots as MLflow artifacts.

        Args:
            y_true: True values
            y_pred: Predicted values
            model_name: Name of the model
            model: Trained model (optional, for feature importance)
            feature_names: List of feature names (optional)
        """
        try:
            # Create temporary directory for plots
            import tempfile
            import os

            temp_dir = tempfile.mkdtemp()

            # 1. Prediction vs Actual plot
            plt.figure(figsize=(10, 6))
            plt.scatter(y_true, y_pred, alpha=0.6, edgecolors="k", linewidth=0.5)
            plt.plot(
                [y_true.min(), y_true.max()],
                [y_true.min(), y_true.max()],
                "r--",
                lw=2,
                label="Perfect Prediction",
            )
            plt.xlabel("Actual Values", fontsize=12)
            plt.ylabel("Predicted Values", fontsize=12)
            plt.title(
                f"{model_name} - Predictions vs Actual Values",
                fontsize=14,
                fontweight="bold",
            )
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            pred_vs_actual_path = os.path.join(temp_dir, "prediction_vs_actual.png")
            plt.savefig(pred_vs_actual_path, dpi=150, bbox_inches="tight")
            plt.close()
            mlflow.log_artifact(pred_vs_actual_path)

            # 2. Residuals plot
            residuals = y_true - y_pred
            plt.figure(figsize=(10, 6))
            plt.scatter(y_pred, residuals, alpha=0.6, edgecolors="k", linewidth=0.5)
            plt.axhline(y=0, color="r", linestyle="--", lw=2)
            plt.xlabel("Predicted Values", fontsize=12)
            plt.ylabel("Residuals", fontsize=12)
            plt.title(f"{model_name} - Residual Plot", fontsize=14, fontweight="bold")
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            residuals_path = os.path.join(temp_dir, "residuals_plot.png")
            plt.savefig(residuals_path, dpi=150, bbox_inches="tight")
            plt.close()
            mlflow.log_artifact(residuals_path)

            # 3. Residuals distribution
            plt.figure(figsize=(10, 6))
            plt.hist(residuals, bins=30, edgecolor="black", alpha=0.7)
            plt.xlabel("Residuals", fontsize=12)
            plt.ylabel("Frequency", fontsize=12)
            plt.title(
                f"{model_name} - Residuals Distribution", fontsize=14, fontweight="bold"
            )
            plt.axvline(x=0, color="r", linestyle="--", lw=2)
            plt.grid(True, alpha=0.3, axis="y")
            plt.tight_layout()
            residuals_dist_path = os.path.join(temp_dir, "residuals_distribution.png")
            plt.savefig(residuals_dist_path, dpi=150, bbox_inches="tight")
            plt.close()
            mlflow.log_artifact(residuals_dist_path)

            # 4. Feature Importance (if applicable)
            if (
                model is not None
                and hasattr(model, "feature_importances_")
                and feature_names is not None
            ):
                importances = model.feature_importances_
                indices = np.argsort(importances)[::-1][:15]  # Top 15 features

                plt.figure(figsize=(10, 6))
                plt.barh(range(len(indices)), importances[indices], align="center")
                plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
                plt.xlabel("Importance", fontsize=12)
                plt.ylabel("Features", fontsize=12)
                plt.title(
                    f"{model_name} - Feature Importance (Top 15)",
                    fontsize=14,
                    fontweight="bold",
                )
                plt.grid(True, alpha=0.3, axis="x")
                plt.tight_layout()
                importance_path = os.path.join(temp_dir, "feature_importance.png")
                plt.savefig(importance_path, dpi=150, bbox_inches="tight")
                plt.close()
                mlflow.log_artifact(importance_path)

            print(f"  📊 Logged evaluation plots for {model_name}")

            # Cleanup
            import shutil

            shutil.rmtree(temp_dir)

        except Exception as e:
            print(f"  ⚠️  Warning: Could not log evaluation artifacts: {e}")

    def train_model(
        self,
        model: Any,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        model_name: str = "model",
    ) -> Tuple[Any, Dict[str, float]]:
        """
        Train model and track with MLflow.

        Args:
            model: Model instance
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            model_name: Name for the model

        Returns:
            Tuple of (trained_model, metrics)
        """
        print(f"\n🚀 Training {model_name}...")

        with mlflow.start_run(run_name=model_name):
            # Log model parameters
            if hasattr(model, "get_params"):
                params = model.get_params()
                mlflow.log_params(params)
                print(f"📝 Logged parameters: {params}")

            # Train model
            model.fit(X_train, y_train)
            print("✅ Training complete")

            # Make predictions
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)

            # Calculate metrics
            metrics = {
                "train_rmse": np.sqrt(mean_squared_error(y_train, y_train_pred)),
                "train_mae": mean_absolute_error(y_train, y_train_pred),
                "train_r2": r2_score(y_train, y_train_pred),
                "test_rmse": np.sqrt(mean_squared_error(y_test, y_test_pred)),
                "test_mae": mean_absolute_error(y_test, y_test_pred),
                "test_r2": r2_score(y_test, y_test_pred),
            }

            # Log metrics
            mlflow.log_metrics(metrics)

            # Print metrics
            print("\n📊 Model Performance:")
            print(f"   Training RMSE: {metrics['train_rmse']:.4f}")
            print(f"   Training MAE:  {metrics['train_mae']:.4f}")
            print(f"   Training R²:   {metrics['train_r2']:.4f}")
            print(f"   Test RMSE:     {metrics['test_rmse']:.4f}")
            print(f"   Test MAE:      {metrics['test_mae']:.4f}")
            print(f"   Test R²:       {metrics['test_r2']:.4f}")

            # Log evaluation artifacts (plots)
            self.log_evaluation_artifacts(y_test, y_test_pred, model_name, model)

            # Log model
            mlflow.sklearn.log_model(
                model,
                "model",
                registered_model_name=f"{self.experiment_name}_{model_name}",
            )
            print(f"💾 Model logged to MLflow")

            return model, metrics

    def train_multiple_models(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
    ) -> Dict[str, Tuple[Any, Dict[str, float]]]:
        """
        Train multiple models and compare performance.

        Returns:
            Dictionary with model results
        """
        print("\n" + "=" * 60)
        print("🔬 Training Multiple Models")
        print("=" * 60)

        # Define models to train
        models_config = {
            "LinearRegression": {"model": "LinearRegression", "params": {}},
            "Ridge": {
                "model": "Ridge",
                "params": {"alpha": 1.0, "random_state": settings.random_state},
            },
            "RandomForest": {
                "model": "RandomForest",
                "params": {
                    "n_estimators": 100,
                    "max_depth": 10,
                    "random_state": settings.random_state,
                    "n_jobs": -1,
                },
            },
            "GradientBoosting": {
                "model": "GradientBoosting",
                "params": {
                    "n_estimators": 100,
                    "learning_rate": 0.1,
                    "max_depth": 3,
                    "random_state": settings.random_state,
                },
            },
        }

        results = {}

        for name, config in models_config.items():
            model = self.get_model(config["model"], **config["params"])
            trained_model, metrics = self.train_model(
                model, X_train, y_train, X_test, y_test, name
            )
            results[name] = (trained_model, metrics)

        # Find best model
        best_model_name = min(results.keys(), key=lambda k: results[k][1]["test_rmse"])

        print("\n" + "=" * 60)
        print(f"🏆 Best Model: {best_model_name}")
        print(f"   Test RMSE: {results[best_model_name][1]['test_rmse']:.4f}")
        print(f"   Test R²:   {results[best_model_name][1]['test_r2']:.4f}")
        print("=" * 60)

        return results

    def train_xgboost_baseline(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str] = None,
    ) -> Tuple[Any, Dict[str, float]]:
        """
        Train baseline XGBoost model with all features.
        
        Args:
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            feature_names: List of feature names
            
        Returns:
            Tuple of (trained_model, metrics)
        """
        print("\n" + "=" * 60)
        print("🎯 Strategy 1: XGBoost Baseline Model (All Features)")
        print("=" * 60)
        
        with mlflow.start_run(run_name="XGBoost_Baseline"):
            # Default parameters
            params = {
                "objective": "reg:squarederror",
                "n_estimators": 100,
                "max_depth": 6,
                "learning_rate": 0.1,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "random_state": settings.random_state,
            }
            
            # Log parameters
            mlflow.log_params(params)
            mlflow.log_param("strategy", "baseline_all_features")
            mlflow.log_param("n_features", X_train.shape[1])
            
            # Train model
            model = xgb.XGBRegressor(**params)
            
            # Enable early stopping
            eval_set = [(X_train, y_train), (X_test, y_test)]
            model.fit(
                X_train, 
                y_train,
                eval_set=eval_set,
                verbose=False
            )
            
            # Make predictions
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)
            
            # Calculate metrics
            metrics = {
                "train_rmse": np.sqrt(mean_squared_error(y_train, y_train_pred)),
                "train_mae": mean_absolute_error(y_train, y_train_pred),
                "train_r2": r2_score(y_train, y_train_pred),
                "test_rmse": np.sqrt(mean_squared_error(y_test, y_test_pred)),
                "test_mae": mean_absolute_error(y_test, y_test_pred),
                "test_r2": r2_score(y_test, y_test_pred),
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Print metrics
            print("\n📊 Baseline Model Performance:")
            print(f"   Training RMSE: {metrics['train_rmse']:.4f}")
            print(f"   Training R²:   {metrics['train_r2']:.4f}")
            print(f"   Test RMSE:     {metrics['test_rmse']:.4f}")
            print(f"   Test R²:       {metrics['test_r2']:.4f}")
            
            # Log evaluation artifacts
            self.log_evaluation_artifacts(
                y_test, y_test_pred, "XGBoost_Baseline", model, feature_names
            )
            
            # Create input example and signature
            input_example = X_train[:5]
            
            # Create signature
            from mlflow.models.signature import infer_signature
            signature = infer_signature(X_train, y_train_pred)
            
            # Log model with MLflow (using 'artifact_path' parameter correctly)
            mlflow.xgboost.log_model(
                xgb_model=model,
                artifact_path="model",
                registered_model_name=f"{self.experiment_name}_XGBoost_Baseline",
                input_example=input_example,
                signature=signature
            )
            
            print("✅ Baseline model trained and logged")
            
            return model, metrics
    
    def train_xgboost_with_tuning(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str] = None,
    ) -> Tuple[Any, Dict[str, float]]:
        """
        Train XGBoost with hyperparameter tuning using GridSearchCV.
        
        Args:
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            feature_names: List of feature names
            
        Returns:
            Tuple of (best_model, metrics)
        """
        print("\n" + "=" * 60)
        print("🔧 Strategy 2: XGBoost with Hyperparameter Tuning")
        print("=" * 60)
        
        with mlflow.start_run(run_name="XGBoost_Tuned"):
            # Define parameter grid
            param_grid = {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7, 9],
                "learning_rate": [0.01, 0.05, 0.1, 0.2],
                "subsample": [0.7, 0.8, 0.9],
                "colsample_bytree": [0.7, 0.8, 0.9],
                "min_child_weight": [1, 3, 5],
                "gamma": [0, 0.1, 0.2],
            }
            
            # Log search strategy
            mlflow.log_param("strategy", "hyperparameter_tuning")
            mlflow.log_param("search_method", "GridSearchCV")
            mlflow.log_param("n_features", X_train.shape[1])
            mlflow.log_param("param_grid_size", len(param_grid))
            
            # Base model
            base_model = xgb.XGBRegressor(
                objective="reg:squarederror",
                random_state=settings.random_state,
            )
            
            # Grid search
            print("🔍 Starting hyperparameter search...")
            print(f"   Parameter combinations to test: {np.prod([len(v) for v in param_grid.values()])}")
            
            grid_search = GridSearchCV(
                estimator=base_model,
                param_grid=param_grid,
                cv=5,
                scoring="neg_mean_squared_error",
                n_jobs=-1,
                verbose=1,
            )
            
            grid_search.fit(X_train, y_train)
            
            # Get best model
            best_model = grid_search.best_estimator_
            best_params = grid_search.best_params_
            
            print(f"\n✅ Best parameters found:")
            for param, value in best_params.items():
                print(f"   {param}: {value}")
                mlflow.log_param(f"best_{param}", value)
            
            # Log CV results
            mlflow.log_metric("best_cv_score", -grid_search.best_score_)
            
            # Make predictions
            y_train_pred = best_model.predict(X_train)
            y_test_pred = best_model.predict(X_test)
            
            # Calculate metrics
            metrics = {
                "train_rmse": np.sqrt(mean_squared_error(y_train, y_train_pred)),
                "train_mae": mean_absolute_error(y_train, y_train_pred),
                "train_r2": r2_score(y_train, y_train_pred),
                "test_rmse": np.sqrt(mean_squared_error(y_test, y_test_pred)),
                "test_mae": mean_absolute_error(y_test, y_test_pred),
                "test_r2": r2_score(y_test, y_test_pred),
                "cv_rmse": np.sqrt(-grid_search.best_score_),
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Print metrics
            print("\n📊 Tuned Model Performance:")
            print(f"   CV RMSE:       {metrics['cv_rmse']:.4f}")
            print(f"   Training RMSE: {metrics['train_rmse']:.4f}")
            print(f"   Training R²:   {metrics['train_r2']:.4f}")
            print(f"   Test RMSE:     {metrics['test_rmse']:.4f}")
            print(f"   Test R²:       {metrics['test_r2']:.4f}")
            
            # Log evaluation artifacts
            self.log_evaluation_artifacts(
                y_test, y_test_pred, "XGBoost_Tuned", best_model, feature_names
            )
            
            # Create input example and signature
            input_example = X_train[:5]
            from mlflow.models.signature import infer_signature
            signature = infer_signature(X_train, y_train_pred)
            
            # Log model
            mlflow.xgboost.log_model(
                xgb_model=best_model,
                artifact_path="model",
                registered_model_name=f"{self.experiment_name}_XGBoost_Tuned",
                input_example=input_example,
                signature=signature
            )
            
            print("✅ Tuned model trained and logged")
            
            return best_model, metrics
    
    def select_features_by_importance(
        self,
        model: Any,
        feature_names: List[str],
        top_n: int = 10,
    ) -> Tuple[List[int], List[str]]:
        """
        Select top N features based on model importance.
        
        Args:
            model: Trained model with feature_importances_
            feature_names: List of all feature names
            top_n: Number of top features to select
            
        Returns:
            Tuple of (selected_indices, selected_feature_names)
        """
        print("\n" + "=" * 60)
        print(f"🎯 Strategy 3: Feature Selection (Top {top_n} Features)")
        print("=" * 60)
        
        # Get feature importances
        importances = model.feature_importances_
        
        # Sort features by importance
        indices = np.argsort(importances)[::-1]
        
        # Select top N features
        top_indices = indices[:top_n]
        top_features = [feature_names[i] for i in top_indices]
        top_importances = importances[top_indices]
        
        print(f"\n📊 Top {top_n} Most Important Features:")
        for i, (feat, imp) in enumerate(zip(top_features, top_importances), 1):
            print(f"   {i:2d}. {feat:15s} - Importance: {imp:.4f}")
        
        # Create visualization
        plt.figure(figsize=(10, 6))
        plt.barh(range(len(top_indices)), top_importances, align='center')
        plt.yticks(range(len(top_indices)), top_features)
        plt.xlabel('Feature Importance', fontsize=12)
        plt.ylabel('Features', fontsize=12)
        plt.title(f'Top {top_n} Feature Importances', fontsize=14, fontweight='bold')
        plt.grid(True, alpha=0.3, axis='x')
        plt.tight_layout()
        
        # Save plot
        import tempfile
        temp_dir = tempfile.mkdtemp()
        plot_path = Path(temp_dir) / "top_features_importance.png"
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        # Log with MLflow in a dedicated run for feature selection
        with mlflow.start_run(run_name="Feature_Selection_Analysis"):
            mlflow.log_artifact(str(plot_path))
            mlflow.log_param("strategy", "feature_selection")
            mlflow.log_param("n_selected_features", top_n)
            mlflow.log_param("n_total_features", len(feature_names))
            
            # Log each selected feature and its importance
            for i, (feat, imp) in enumerate(zip(top_features, top_importances), 1):
                mlflow.log_param(f"top_feature_{i}", feat)
                mlflow.log_metric(f"importance_{i}", float(imp))
            
            print("✅ Feature selection logged to MLflow")
        
        print(f"✅ Selected {top_n} features for next model")
        
        return top_indices, top_features
    
    def train_xgboost_with_selected_features(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        selected_indices: List[int],
        selected_features: List[str],
    ) -> Tuple[Any, Dict[str, float]]:
        """
        Train XGBoost with selected features and tune hyperparameters.
        
        Args:
            X_train: Training features
            y_train: Training target
            X_test: Test features
            y_test: Test target
            selected_indices: Indices of selected features
            selected_features: Names of selected features
            
        Returns:
            Tuple of (best_model, metrics)
        """
        print("\n" + "=" * 60)
        print(f"🚀 Strategy 4: XGBoost with Top {len(selected_indices)} Features + Tuning")
        print("=" * 60)
        
        with mlflow.start_run(run_name="XGBoost_TopFeatures_Tuned"):
            # Select features
            X_train_selected = X_train[:, selected_indices]
            X_test_selected = X_test[:, selected_indices]
            
            print(f"📊 Training with {len(selected_indices)} selected features")
            
            # Define parameter grid (focused search)
            param_grid = {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1],
                "subsample": [0.8, 0.9],
                "colsample_bytree": [0.8, 0.9],
                "min_child_weight": [1, 3],
                "gamma": [0, 0.1],
            }
            
            # Log strategy
            mlflow.log_param("strategy", "top_features_tuning")
            mlflow.log_param("n_features", len(selected_indices))
            mlflow.log_params({f"feature_{i+1}": feat for i, feat in enumerate(selected_features)})
            
            # Base model
            base_model = xgb.XGBRegressor(
                objective="reg:squarederror",
                random_state=settings.random_state,
            )
            
            # Grid search
            print("🔍 Starting hyperparameter search...")
            grid_search = GridSearchCV(
                estimator=base_model,
                param_grid=param_grid,
                cv=5,
                scoring="neg_mean_squared_error",
                n_jobs=-1,
                verbose=1,
            )
            
            grid_search.fit(X_train_selected, y_train)
            
            # Get best model
            best_model = grid_search.best_estimator_
            best_params = grid_search.best_params_
            
            print(f"\n✅ Best parameters found:")
            for param, value in best_params.items():
                print(f"   {param}: {value}")
                mlflow.log_param(f"best_{param}", value)
            
            # Log CV results
            mlflow.log_metric("best_cv_score", -grid_search.best_score_)
            
            # Make predictions
            y_train_pred = best_model.predict(X_train_selected)
            y_test_pred = best_model.predict(X_test_selected)
            
            # Calculate metrics
            metrics = {
                "train_rmse": np.sqrt(mean_squared_error(y_train, y_train_pred)),
                "train_mae": mean_absolute_error(y_train, y_train_pred),
                "train_r2": r2_score(y_train, y_train_pred),
                "test_rmse": np.sqrt(mean_squared_error(y_test, y_test_pred)),
                "test_mae": mean_absolute_error(y_test, y_test_pred),
                "test_r2": r2_score(y_test, y_test_pred),
                "cv_rmse": np.sqrt(-grid_search.best_score_),
            }
            
            # Log metrics
            mlflow.log_metrics(metrics)
            
            # Print metrics
            print("\n📊 Final Model Performance (with selected features):")
            print(f"   CV RMSE:       {metrics['cv_rmse']:.4f}")
            print(f"   Training RMSE: {metrics['train_rmse']:.4f}")
            print(f"   Training R²:   {metrics['train_r2']:.4f}")
            print(f"   Test RMSE:     {metrics['test_rmse']:.4f}")
            print(f"   Test R²:       {metrics['test_r2']:.4f}")
            
            # Log evaluation artifacts
            self.log_evaluation_artifacts(
                y_test, y_test_pred, "XGBoost_TopFeatures", best_model, selected_features
            )
            
            # Log model with feature indices for later use
            mlflow.log_dict(
                {"selected_indices": selected_indices, "selected_features": selected_features},
                "selected_features.json"
            )
            
            # Create input example and signature (using selected features)
            input_example = X_train_selected[:5]
            from mlflow.models.signature import infer_signature
            signature = infer_signature(X_train_selected, y_train_pred)
            
            # Log model
            mlflow.xgboost.log_model(
                xgb_model=best_model,
                artifact_path="model",
                registered_model_name=f"{self.experiment_name}_XGBoost_TopFeatures",
                input_example=input_example,
                signature=signature
            )
            
            print("✅ Final model trained and logged")
            
            return best_model, metrics

    def save_model(
        self,
        model: Any,
        preprocessor: DataPreprocessor,
        save_dir: Path,
        metrics: Dict[str, float] = None,
    ):
        """
        Save model and related artifacts to disk.

        Args:
            model: Trained model
            preprocessor: Data preprocessor
            save_dir: Directory to save artifacts
            metrics: Model metrics to save
        """
        save_dir.mkdir(parents=True, exist_ok=True)

        # Save model
        model_path = save_dir / "model.joblib"
        joblib.dump(model, model_path)
        print(f"💾 Model saved to {model_path}")

        # Save preprocessor
        preprocessor_path = save_dir / "preprocessor.joblib"
        preprocessor.save_preprocessor(preprocessor_path)

        # Save metrics
        if metrics:
            metrics_path = save_dir / "metrics.json"
            with open(metrics_path, "w") as f:
                json.dump(metrics, f, indent=2)
            print(f"📊 Metrics saved to {metrics_path}")

        # Save model info
        info_path = save_dir / "model_info.txt"
        with open(info_path, "w") as f:
            f.write(f"Model Type: {type(model).__name__}\n")
            f.write(f"Features: {preprocessor.feature_names}\n")
            f.write(f"Target: {preprocessor.target_name}\n")
            if metrics:
                f.write(f"\nMetrics:\n")
                for key, value in metrics.items():
                    f.write(f"  {key}: {value:.4f}\n")

        print(f"📄 Model info saved to {info_path}")
        print(f"\n✅ All artifacts saved to {save_dir}")


def main():
    """
    Main training pipeline with XGBoost strategies.
    
    Pipeline:
    1. Baseline XGBoost with all features
    2. XGBoost with hyperparameter tuning
    3. Feature selection by importance
    4. XGBoost with top features + tuning
    """
    print("=" * 70)
    print("🤖 Housing Price Prediction - XGBoost Training Pipeline")
    print("=" * 70 + "\n")

    # Initialize preprocessor
    preprocessor = DataPreprocessor()

    # Load and prepare data
    print("📊 Loading and preparing data...")
    df = preprocessor.load_data(settings.data_path)
    preprocessor.identify_features(df)
    df = preprocessor.clean_data(df)

    # Split features and target
    X, y = preprocessor.split_features_target(df)

    # Split train/test
    X_train, X_test, y_train, y_test = preprocessor.split_train_test(
        X, y, test_size=settings.test_size, random_state=settings.random_state
    )

    # Scale features
    X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)
    
    # Get feature names
    feature_names = preprocessor.feature_names
    
    print(f"✅ Data prepared:")
    print(f"   Total samples: {len(df)}")
    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")
    print(f"   Features: {len(feature_names)}")

    # Initialize trainer
    params_file = Path(__file__).parent.parent / "params.yaml"
    trainer = ModelTrainer(
        experiment_name=settings.mlflow_experiment_name,
        params_path=params_file if params_file.exists() else None
    )

    # Dictionary to store all results
    all_results = {}

    # ========================================
    # Strategy 1: Baseline XGBoost
    # ========================================
    baseline_model, baseline_metrics = trainer.train_xgboost_baseline(
        X_train_scaled, y_train, X_test_scaled, y_test, feature_names
    )
    all_results["XGBoost_Baseline"] = (baseline_model, baseline_metrics)

    # ========================================
    # Strategy 2: XGBoost with Hyperparameter Tuning
    # ========================================
    tuned_model, tuned_metrics = trainer.train_xgboost_with_tuning(
        X_train_scaled, y_train, X_test_scaled, y_test, feature_names
    )
    all_results["XGBoost_Tuned"] = (tuned_model, tuned_metrics)

    # ========================================
    # Strategy 3: Feature Selection
    # ========================================
    # Use the tuned model to select features
    selected_indices, selected_features = trainer.select_features_by_importance(
        tuned_model, feature_names, top_n=10
    )

    # ========================================
    # Strategy 4: XGBoost with Top Features + Tuning
    # ========================================
    final_model, final_metrics = trainer.train_xgboost_with_selected_features(
        X_train_scaled, y_train, X_test_scaled, y_test,
        selected_indices, selected_features
    )
    all_results["XGBoost_TopFeatures"] = (final_model, final_metrics)

    # ========================================
    # Compare All Models
    # ========================================
    print("\n" + "=" * 70)
    print("📊 Model Comparison Summary")
    print("=" * 70)
    
    comparison_data = []
    for model_name, (model, metrics) in all_results.items():
        comparison_data.append({
            "Model": model_name,
            "Test RMSE": metrics["test_rmse"],
            "Test MAE": metrics["test_mae"],
            "Test R²": metrics["test_r2"],
            "Train R²": metrics["train_r2"],
        })
    
    # Print comparison table
    print(f"\n{'Model':<30} {'Test RMSE':<12} {'Test MAE':<12} {'Test R²':<12} {'Train R²':<12}")
    print("-" * 78)
    for data in comparison_data:
        print(
            f"{data['Model']:<30} "
            f"{data['Test RMSE']:<12.4f} "
            f"{data['Test MAE']:<12.4f} "
            f"{data['Test R²']:<12.4f} "
            f"{data['Train R²']:<12.4f}"
        )
    
    # Find best model by test RMSE
    best_model_name = min(all_results.keys(), key=lambda k: all_results[k][1]["test_rmse"])
    best_model, best_metrics = all_results[best_model_name]
    
    print("\n" + "=" * 70)
    print(f"🏆 Best Model: {best_model_name}")
    print(f"   Test RMSE: {best_metrics['test_rmse']:.4f}")
    print(f"   Test MAE:  {best_metrics['test_mae']:.4f}")
    print(f"   Test R²:   {best_metrics['test_r2']:.4f}")
    print("=" * 70)

    # ========================================
    # Save Best Model to Production
    # ========================================
    print(f"\n💾 Saving best model ({best_model_name}) to production...")
    
    # If the best model uses selected features, we need to save that info
    if best_model_name == "XGBoost_TopFeatures":
        # Save feature selection info
        feature_selection_info = {
            "selected_indices": selected_indices.tolist() if isinstance(selected_indices, np.ndarray) else selected_indices,
            "selected_features": selected_features,
            "n_features": len(selected_features),
        }
        
        feature_info_path = settings.model_path / "feature_selection.json"
        settings.model_path.mkdir(parents=True, exist_ok=True)
        with open(feature_info_path, "w") as f:
            json.dump(feature_selection_info, f, indent=2)
        print(f"📄 Feature selection info saved to {feature_info_path}")
    
    trainer.save_model(best_model, preprocessor, settings.model_path, best_metrics)

    # ========================================
    # Final Summary
    # ========================================
    print("\n" + "=" * 70)
    print("✅ XGBoost Training Pipeline Completed Successfully!")
    print("=" * 70)
    print("\n📋 Summary:")
    print(f"   - Trained {len(all_results)} XGBoost models")
    print(f"   - Best model: {best_model_name}")
    print(f"   - Best Test RMSE: {best_metrics['test_rmse']:.4f}")
    print(f"   - Best Test R²: {best_metrics['test_r2']:.4f}")
    print(f"   - Models logged to MLflow: {settings.mlflow_tracking_uri}")
    print(f"   - Production model saved to: {settings.model_path}")
    
    print("\n💡 Next Steps:")
    print("   1. View experiments in MLflow UI: mlflow ui --port 5000")
    print("   2. Compare models in the MLflow dashboard")
    print("   3. Deploy the best model to production")
    print("   4. Start the API: ./start.sh")
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
