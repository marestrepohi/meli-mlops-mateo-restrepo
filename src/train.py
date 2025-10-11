"""
Training module for the housing price prediction model.
"""
import mlflow
import mlflow.sklearn
import numpy as np
import yaml
from pathlib import Path
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Any, Dict, Tuple

from .config import settings
from .preprocessing import DataPreprocessor


class ModelTrainer:
    """Handles model training and evaluation with MLflow tracking."""
    
    def __init__(self, experiment_name: str = None, params_path: Path = None):
        """Initialize the trainer."""
        self.experiment_name = experiment_name or settings.mlflow_experiment_name
        
        # Load params.yaml if provided
        self.params = {}
        if params_path and params_path.exists():
            with open(params_path, 'r') as f:
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
            'RandomForest': RandomForestRegressor,
            'GradientBoosting': GradientBoostingRegressor,
            'LinearRegression': LinearRegression,
            'Ridge': Ridge,
            'Lasso': Lasso
        }
        
        if model_name not in models:
            raise ValueError(f"Unknown model: {model_name}. Choose from {list(models.keys())}")
        
        return models[model_name](**params)
    
    def log_evaluation_artifacts(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray, 
        model_name: str,
        model: Any = None,
        feature_names: list = None
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
            plt.scatter(y_true, y_pred, alpha=0.6, edgecolors='k', linewidth=0.5)
            plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 
                     'r--', lw=2, label='Perfect Prediction')
            plt.xlabel('Actual Values', fontsize=12)
            plt.ylabel('Predicted Values', fontsize=12)
            plt.title(f'{model_name} - Predictions vs Actual Values', fontsize=14, fontweight='bold')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            pred_vs_actual_path = os.path.join(temp_dir, 'prediction_vs_actual.png')
            plt.savefig(pred_vs_actual_path, dpi=150, bbox_inches='tight')
            plt.close()
            mlflow.log_artifact(pred_vs_actual_path)
            
            # 2. Residuals plot
            residuals = y_true - y_pred
            plt.figure(figsize=(10, 6))
            plt.scatter(y_pred, residuals, alpha=0.6, edgecolors='k', linewidth=0.5)
            plt.axhline(y=0, color='r', linestyle='--', lw=2)
            plt.xlabel('Predicted Values', fontsize=12)
            plt.ylabel('Residuals', fontsize=12)
            plt.title(f'{model_name} - Residual Plot', fontsize=14, fontweight='bold')
            plt.grid(True, alpha=0.3)
            plt.tight_layout()
            residuals_path = os.path.join(temp_dir, 'residuals_plot.png')
            plt.savefig(residuals_path, dpi=150, bbox_inches='tight')
            plt.close()
            mlflow.log_artifact(residuals_path)
            
            # 3. Residuals distribution
            plt.figure(figsize=(10, 6))
            plt.hist(residuals, bins=30, edgecolor='black', alpha=0.7)
            plt.xlabel('Residuals', fontsize=12)
            plt.ylabel('Frequency', fontsize=12)
            plt.title(f'{model_name} - Residuals Distribution', fontsize=14, fontweight='bold')
            plt.axvline(x=0, color='r', linestyle='--', lw=2)
            plt.grid(True, alpha=0.3, axis='y')
            plt.tight_layout()
            residuals_dist_path = os.path.join(temp_dir, 'residuals_distribution.png')
            plt.savefig(residuals_dist_path, dpi=150, bbox_inches='tight')
            plt.close()
            mlflow.log_artifact(residuals_dist_path)
            
            # 4. Feature Importance (if applicable)
            if model is not None and hasattr(model, 'feature_importances_') and feature_names is not None:
                importances = model.feature_importances_
                indices = np.argsort(importances)[::-1][:15]  # Top 15 features
                
                plt.figure(figsize=(10, 6))
                plt.barh(range(len(indices)), importances[indices], align='center')
                plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
                plt.xlabel('Importance', fontsize=12)
                plt.ylabel('Features', fontsize=12)
                plt.title(f'{model_name} - Feature Importance (Top 15)', fontsize=14, fontweight='bold')
                plt.grid(True, alpha=0.3, axis='x')
                plt.tight_layout()
                importance_path = os.path.join(temp_dir, 'feature_importance.png')
                plt.savefig(importance_path, dpi=150, bbox_inches='tight')
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
        model_name: str = "model"
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
            if hasattr(model, 'get_params'):
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
                'train_rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
                'train_mae': mean_absolute_error(y_train, y_train_pred),
                'train_r2': r2_score(y_train, y_train_pred),
                'test_rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
                'test_mae': mean_absolute_error(y_test, y_test_pred),
                'test_r2': r2_score(y_test, y_test_pred),
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
                registered_model_name=f"{self.experiment_name}_{model_name}"
            )
            print(f"💾 Model logged to MLflow")
            
            return model, metrics
    
    def train_multiple_models(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, Tuple[Any, Dict[str, float]]]:
        """
        Train multiple models and compare performance.
        
        Returns:
            Dictionary with model results
        """
        print("\n" + "="*60)
        print("🔬 Training Multiple Models")
        print("="*60)
        
        # Define models to train
        models_config = {
            'LinearRegression': {
                'model': 'LinearRegression',
                'params': {}
            },
            'Ridge': {
                'model': 'Ridge',
                'params': {'alpha': 1.0, 'random_state': settings.random_state}
            },
            'RandomForest': {
                'model': 'RandomForest',
                'params': {
                    'n_estimators': 100,
                    'max_depth': 10,
                    'random_state': settings.random_state,
                    'n_jobs': -1
                }
            },
            'GradientBoosting': {
                'model': 'GradientBoosting',
                'params': {
                    'n_estimators': 100,
                    'learning_rate': 0.1,
                    'max_depth': 3,
                    'random_state': settings.random_state
                }
            }
        }
        
        results = {}
        
        for name, config in models_config.items():
            model = self.get_model(config['model'], **config['params'])
            trained_model, metrics = self.train_model(
                model, X_train, y_train, X_test, y_test, name
            )
            results[name] = (trained_model, metrics)
        
        # Find best model
        best_model_name = min(
            results.keys(),
            key=lambda k: results[k][1]['test_rmse']
        )
        
        print("\n" + "="*60)
        print(f"🏆 Best Model: {best_model_name}")
        print(f"   Test RMSE: {results[best_model_name][1]['test_rmse']:.4f}")
        print(f"   Test R²:   {results[best_model_name][1]['test_r2']:.4f}")
        print("="*60)
        
        return results
    
    def save_model(
        self,
        model: Any,
        preprocessor: DataPreprocessor,
        save_dir: Path,
        metrics: Dict[str, float] = None
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
            with open(metrics_path, 'w') as f:
                json.dump(metrics, f, indent=2)
            print(f"📊 Metrics saved to {metrics_path}")
        
        # Save model info
        info_path = save_dir / "model_info.txt"
        with open(info_path, 'w') as f:
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
    """Main training pipeline."""
    print("="*60)
    print("🤖 Housing Price Prediction - Model Training Pipeline")
    print("="*60 + "\n")
    
    # Load params.yaml if exists
    params_file = Path(__file__).parent.parent / "params.yaml"
    
    # Initialize preprocessor
    preprocessor = DataPreprocessor()
    
    # Load and prepare data
    df = preprocessor.load_data(settings.data_path)
    preprocessor.identify_features(df)
    df = preprocessor.clean_data(df)
    
    # Split features and target
    X, y = preprocessor.split_features_target(df)
    
    # Split train/test
    X_train, X_test, y_train, y_test = preprocessor.split_train_test(
        X, y,
        test_size=settings.test_size,
        random_state=settings.random_state
    )
    
    # Scale features
    X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)
    
    # Initialize trainer with params.yaml
    trainer = ModelTrainer(params_path=params_file if params_file.exists() else None)
    
    # Train multiple models
    results = trainer.train_multiple_models(
        X_train_scaled, y_train,
        X_test_scaled, y_test
    )
    
    # Save best model
    best_model_name = min(
        results.keys(),
        key=lambda k: results[k][1]['test_rmse']
    )
    best_model, best_metrics = results[best_model_name]
    
    print(f"\n💾 Saving best model ({best_model_name}) to production...")
    trainer.save_model(
        best_model,
        preprocessor,
        settings.model_path,
        best_metrics
    )
    
    print("\n" + "="*60)
    print("✅ Training pipeline completed successfully!")
    print("="*60)
    print(f"\n💡 Tip: Modify hyperparameters in {params_file if params_file.exists() else 'params.yaml'}")


if __name__ == "__main__":
    main()
