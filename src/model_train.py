"""
Model Training Module with XGBoost, MLflow and SHAP
Trains 3 XGBoost experiments and selects the best model by RMSE:
1. Hyperparameter Tuning (RandomizedSearchCV)
2. Important Features (SHAP selection + default parameters)
3. Feature Selection + Optimization (SHAP + best hyperparameters)
"""

import logging
import sys
import yaml
import json
import joblib
from pathlib import Path
from typing import Dict, Any, Tuple, List

import numpy as np
import pandas as pd
import xgboost as xgb
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import RandomizedSearchCV
from sklearn.feature_selection import SelectFromModel
from scipy.stats import randint, uniform
import mlflow
import mlflow.xgboost
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import tempfile
import os

# --- Configuración del Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


def load_params(params_path: str = "params.yaml") -> Dict[str, Any]:
    """Carga parámetros desde archivo YAML."""
    try:
        with open(params_path, 'r') as file:
            params = yaml.safe_load(file)
        logger.info(f'✅ Parámetros cargados desde {params_path}')
        return params
    except Exception as e:
        logger.error(f'❌ Error cargando parámetros: {e}')
        raise


def load_data(data_dir: Path) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Carga datos de entrenamiento y prueba."""
    try:
        train_path = data_dir / 'train.csv'
        test_path = data_dir / 'test.csv'
        
        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)
        
        logger.info(f'✅ Datos cargados:')
        logger.info(f'   - Train: {train_df.shape}')
        logger.info(f'   - Test: {test_df.shape}')
        
        return train_df, test_df
    except Exception as e:
        logger.error(f'❌ Error cargando datos: {e}')
        raise


def prepare_features_target(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    target_column: str
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """Separa features y target."""
    try:
        X_train = train_df.drop(columns=[target_column])
        y_train = train_df[target_column]
        X_test = test_df.drop(columns=[target_column])
        y_test = test_df[target_column]
        
        logger.info(f'✅ Features y target preparados:')
        logger.info(f'   - Features: {list(X_train.columns)}')
        logger.info(f'   - Target: {target_column}')
        
        return X_train, y_train, X_test, y_test
    except Exception as e:
        logger.error(f'❌ Error preparando features: {e}')
        raise


def calculate_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    prefix: str = ''
) -> Dict[str, float]:
    """Calcula métricas de regresión."""
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    
    metrics = {
        f'{prefix}rmse': rmse,
        f'{prefix}mae': mae,
        f'{prefix}r2': r2,
        f'{prefix}mape': mape
    }
    
    return metrics


def calculate_shap_importance(
    model: XGBRegressor, 
    X_train: pd.DataFrame, 
    run_name: str,
    stage_description: str = ""
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Calcula SHAP values y genera visualizaciones.
    
    Args:
        model: Modelo XGBoost entrenado
        X_train: DataFrame con features de entrenamiento
        run_name: Nombre para identificar los artefactos
        stage_description: Descripción del stage (ej: "selector con 13 features")
    
    Returns:
        Tuple[np.ndarray, np.ndarray]: (shap_values, mean_abs_shap_values)
    """
    if stage_description:
        logger.info(f"📊 Calculando SHAP values ({stage_description})...")
    else:
        logger.info(f"📊 Calculando SHAP values para {run_name}...")
    
    # Usar directorio temporal para no dejar archivos sueltos
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            # Calcular SHAP values
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_train)
            
            # Calcular importancia promedio absoluta
            mean_abs_shap = np.abs(shap_values).mean(axis=0)
            
            # 1. Summary plot (beeswarm)
            plt.figure(figsize=(10, 8))
            shap.summary_plot(shap_values, X_train, show=False)
            plot_path = os.path.join(tmpdir, f"shap_summary_{run_name.replace(' ', '_')}.png")
            plt.savefig(plot_path, dpi=300, bbox_inches='tight')
            mlflow.log_artifact(plot_path)
            plt.close()
            logger.info(f"   ✅ SHAP summary plot guardado en MLflow")
            
            # 2. Bar plot de importancia promedio
            plt.figure(figsize=(10, 6))
            shap.summary_plot(shap_values, X_train, plot_type="bar", show=False)
            bar_path = os.path.join(tmpdir, f"shap_importance_bar_{run_name.replace(' ', '_')}.png")
            plt.savefig(bar_path, dpi=300, bbox_inches='tight')
            mlflow.log_artifact(bar_path)
            plt.close()
            logger.info(f"   ✅ SHAP bar plot guardado en MLflow")
            
            # 3. Guardar valores SHAP en JSON
            shap_dict = {
                feature: float(importance) 
                for feature, importance in zip(X_train.columns, mean_abs_shap)
            }
            shap_dict_sorted = dict(sorted(shap_dict.items(), key=lambda x: x[1], reverse=True))
            
            json_path = os.path.join(tmpdir, f"shap_values_{run_name.replace(' ', '_')}.json")
            with open(json_path, 'w') as f:
                json.dump(shap_dict_sorted, f, indent=2)
            mlflow.log_artifact(json_path)
            logger.info(f"   ✅ SHAP values JSON guardado en MLflow")
            
            return shap_values, mean_abs_shap
            
        except Exception as e:
            logger.error(f"❌ Error calculando SHAP values: {e}")
            raise


def log_feature_importance(model: XGBRegressor, feature_names: List[str], run_name: str):
    """Analiza y registra importancia de features con visualizaciones."""
    importance_types = ["weight", "gain", "cover"]
    
    # Usar directorio temporal para no dejar archivos sueltos
    with tempfile.TemporaryDirectory() as tmpdir:
        for imp_type in importance_types:
            try:
                # Obtener importancias
                booster = model.get_booster()
                importance_dict = booster.get_score(importance_type=imp_type)
                
                if not importance_dict:
                    continue
                
                # Ordenar por importancia
                sorted_features = sorted(
                    importance_dict.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
                
                # Crear visualización
                features, scores = zip(*sorted_features[:13])  # Top 13 (todas las features)
                
                plt.figure(figsize=(10, 6))
                sns.barplot(x=list(scores), y=list(features))
                plt.title(f'Feature Importance ({imp_type.title()}) - {run_name}')
                plt.xlabel('Importance Score')
                plt.ylabel('Features')
                plt.tight_layout()
                
                # Guardar plot en directorio temporal
                plot_filename = os.path.join(tmpdir, f"feature_importance_{imp_type}_{run_name.replace(' ', '_')}.png")
                plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
                mlflow.log_artifact(plot_filename)
                plt.close()
                
                # Guardar JSON en directorio temporal
                json_filename = os.path.join(tmpdir, f"feature_importance_{imp_type}_{run_name.replace(' ', '_')}.json")
                with open(json_filename, 'w') as f:
                    json.dump(importance_dict, f, indent=2)
                mlflow.log_artifact(json_filename)
                
                logger.info(f"   ✅ Feature importance ({imp_type}) registrada en MLflow")
                
            except Exception as e:
                logger.warning(f"   ⚠️ No se pudo registrar feature importance ({imp_type}): {e}")


# ============================================================================
# EXPERIMENTO 1: Hyperparameter Tuning with RandomizedSearchCV
# ============================================================================
def train_tuned_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[XGBRegressor, Dict[str, float], Dict[str, Any]]:
    """
    Experimento 1: Búsqueda de hiperparámetros con RandomizedSearchCV.
    """
    logger.info("\n" + "="*70)
    logger.info("🔍 EXPERIMENTO 1: HYPERPARAMETER TUNING (RandomizedSearchCV)")
    logger.info("="*70)
    
    # Definir distribuciones de hiperparámetros
    param_distributions = {
        "n_estimators": randint(50, 500),
        "max_depth": randint(2, 15),
        "min_child_weight": randint(1, 10),
        "learning_rate": uniform(0.01, 0.3),
        "subsample": uniform(0.6, 0.2),
        "colsample_bytree": uniform(0.6, 0.2),
    }
    
    with mlflow.start_run(run_name="01_tuned_randomized_search"):
        # Configurar MLflow autolog para capturar búsqueda
        mlflow.xgboost.autolog(
            log_input_examples=True,
            log_model_signatures=True,
            log_models=False,  # Lo registraremos manualmente
            silent=True
        )
        
        # Modelo base
        xgb_model = XGBRegressor(random_state=42)
        
        # RandomizedSearchCV
        random_search = RandomizedSearchCV(
            xgb_model,
            param_distributions,
            n_iter=50,
            cv=10,
            scoring='neg_mean_squared_error',
            random_state=42,
            n_jobs=-1,
            verbose=1
        )
        
        random_search.fit(X_train, y_train)
        
        # Mejor modelo
        best_model = random_search.best_estimator_
        best_params = random_search.best_params_
        
        # Predicciones
        y_train_pred = best_model.predict(X_train)
        y_test_pred = best_model.predict(X_test)
        
        # Métricas
        train_metrics = calculate_metrics(y_train, y_train_pred, 'train_')
        test_metrics = calculate_metrics(y_test, y_test_pred, 'test_')
        all_metrics = {**train_metrics, **test_metrics}
        
        # Log métricas y parámetros
        mlflow.log_metrics(all_metrics)
        mlflow.log_params(best_params)
        mlflow.log_param("model_type", "tuned_randomized_search")
        mlflow.log_metric("cv_best_score", -random_search.best_score_)
        
        # Log modelo con mejores parámetros
        from mlflow.models import infer_signature
        signature = infer_signature(X_train, best_model.predict(X_train))
        
        mlflow.xgboost.log_model(
            best_model,
            artifact_path="model",
            model_format="json",
            signature=signature,
            input_example=X_train.head(1),
            registered_model_name="housing_price_01_tuned"
        )
        
        logger.info(f"✅ Mejores hiperparámetros encontrados:")
        for param, value in best_params.items():
            logger.info(f"   - {param}: {value}")
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        mlflow.xgboost.autolog(disable=True)
        
        return best_model, all_metrics, best_params


# ============================================================================
# EXPERIMENTO 2: Important Features Only (Default Params)
# ============================================================================
def train_with_important_features(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[XGBRegressor, Dict[str, float], List[str]]:
    """
    Experimento 2: Modelo con solo las features más importantes usando SHAP (parámetros por defecto).
    """
    logger.info("\n" + "="*70)
    logger.info("🎯 EXPERIMENTO 2: IMPORTANT FEATURES (SHAP + Default Params)")
    logger.info("="*70)
    
    with mlflow.start_run(run_name="02_important_features_shap"):
        # Paso 1: Entrenar modelo para calcular SHAP values
        logger.info("🔄 Paso 1: Entrenando modelo para calcular SHAP values...")
        selector_model = XGBRegressor()
        selector_model.fit(X_train, y_train)
        
        # Paso 2: Calcular SHAP values y obtener importancia
        logger.info("🔄 Paso 2: Calculando SHAP values para selección de features...")
        shap_values, mean_abs_shap = calculate_shap_importance(
            selector_model, 
            X_train, 
            "exp2_selector"
        )
        
        # Paso 3: Seleccionar features con SHAP > threshold (percentil 20)
        threshold = np.percentile(mean_abs_shap, 20)
        selected_mask = mean_abs_shap >= threshold
        selected_features = X_train.columns[selected_mask].tolist()
        n_selected = len(selected_features)
        
        # Crear diccionario solo con features seleccionadas
        selected_shap_dict = {
            feat: float(mean_abs_shap[X_train.columns.get_loc(feat)])
            for feat in selected_features
        }
        selected_shap_dict_sorted = dict(sorted(selected_shap_dict.items(), key=lambda x: x[1], reverse=True))
        
        logger.info(f"\n✅ Features seleccionadas por SHAP ({n_selected}/{X_train.shape[1]}):")
        logger.info(f"   Threshold (percentil 20): {threshold:.4f}")
        logger.info(f"\n📊 Features que cumplen el threshold:")
        for i, (feat, shap_val) in enumerate(selected_shap_dict_sorted.items(), 1):
            logger.info(f"   {i}. {feat}: SHAP={shap_val:.4f}")
        
        # Transformar datos
        X_train_selected = X_train[selected_features]
        X_test_selected = X_test[selected_features]
        
        # Log información de selección
        mlflow.log_metrics({
            "original_features": X_train.shape[1],
            "selected_features": n_selected,
            "feature_reduction_ratio": n_selected / X_train.shape[1]
        })
        mlflow.log_param("selected_features", ", ".join(selected_features))
        
        # Paso 3: Entrenar modelo CON PARÁMETROS POR DEFECTO usando solo features importantes
        logger.info("\n🔄 Paso 2: Entrenando modelo final con features seleccionadas...")
        logger.info(f"   Usando {n_selected} features (reducción del {(1 - n_selected/X_train.shape[1])*100:.1f}%)")
        
        final_model = XGBRegressor(random_state=42)  # SOLO parámetros por defecto
        final_model.fit(
            X_train_selected, y_train,
            eval_set=[(X_test_selected, y_test)],
            verbose=False
        )
        
        # Predicciones
        y_train_pred = final_model.predict(X_train_selected)
        y_test_pred = final_model.predict(X_test_selected)
        
        # Métricas
        train_metrics = calculate_metrics(y_train, y_train_pred, 'train_')
        test_metrics = calculate_metrics(y_test, y_test_pred, 'test_')
        all_metrics = {**train_metrics, **test_metrics}
        
        # Log métricas
        mlflow.log_metrics(all_metrics)
        mlflow.log_param("model_type", "important_features_default_params")
        mlflow.log_param("shap_selection_method", "percentile_20")
        
        # Análisis de importancia XGBoost de features (solo registrar, sin SHAP redundante)
        logger.info("\n📈 Registrando importancia XGBoost de features seleccionadas...")
        log_feature_importance(final_model, selected_features, "exp2")
        
        # Log modelo
        from mlflow.models import infer_signature
        signature = infer_signature(X_train_selected, final_model.predict(X_train_selected))
        
        mlflow.xgboost.log_model(
            final_model,
            artifact_path="model",
            model_format="json",
            signature=signature,
            input_example=X_train_selected.head(1),
            registered_model_name="housing_price_02_important_features"
        )
        
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        return final_model, all_metrics, selected_features


# ============================================================================
# EXPERIMENTO 3: Hyperparameter Tuning on Selected Features
# ============================================================================
def train_with_feature_selection(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    selected_features: List[str]
) -> Tuple[XGBRegressor, Dict[str, float], Dict[str, Any]]:
    """
    Experimento 3: Búsqueda de hiperparámetros en features seleccionadas del Experimento 2.
    """
    logger.info("\n" + "="*70)
    logger.info("🎯 EXPERIMENTO 3: HYPERPARAMETER TUNING ON SELECTED FEATURES")
    logger.info("="*70)
    
    with mlflow.start_run(run_name="03_tuning_on_selected_features"):
        logger.info(f"🔄 Usando {len(selected_features)} features del Experimento 2")
        logger.info(f"   Features: {', '.join(selected_features)}")
        
        # Paso 1: Filtrar datos con features seleccionadas
        X_train_selected = X_train[selected_features]
        X_test_selected = X_test[selected_features]
        
        # Log información de selección
        mlflow.log_metrics({
            "original_features": X_train.shape[1],
            "selected_features": len(selected_features),
            "feature_reduction_ratio": len(selected_features) / X_train.shape[1]
        })
        mlflow.log_param("selected_features", ", ".join(selected_features))
        mlflow.log_param("selection_method", "shap_percentile_20_from_exp2")
        
        # Paso 2: Definir distribuciones de hiperparámetros
        logger.info("🔄 Iniciando búsqueda de hiperparámetros para features seleccionadas...")
        param_distributions = {
            'n_estimators': randint(50, 300),
            'max_depth': randint(2, 10),
            'learning_rate': uniform(0.01, 0.29),
            'subsample': uniform(0.6, 0.4),
            'colsample_bytree': uniform(0.6, 0.4),
            'min_child_weight': randint(1, 10),
            'gamma': uniform(0, 0.5),
            'reg_alpha': uniform(0, 1),
            'reg_lambda': uniform(0, 1)
        }
        
        # Configurar MLflow autolog
        mlflow.xgboost.autolog(
            log_input_examples=True,
            log_model_signatures=True,
            log_models=False,
            silent=True
        )
        
        # Modelo base
        xgb_model = XGBRegressor(random_state=42)
        
        # RandomizedSearchCV
        random_search = RandomizedSearchCV(
            xgb_model,
            param_distributions,
            n_iter=50,
            cv=10,
            scoring='neg_mean_squared_error',
            random_state=42,
            n_jobs=-1,
            verbose=1
        )
        
        # Entrenar
        random_search.fit(X_train_selected, y_train)
        
        # Obtener mejor modelo
        best_model = random_search.best_estimator_
        best_params = random_search.best_params_
        
        logger.info("✅ Mejores hiperparámetros encontrados para features seleccionadas:")
        for param, value in best_params.items():
            logger.info(f"   - {param}: {value}")
        
        # Predicciones
        y_train_pred = best_model.predict(X_train_selected)
        y_test_pred = best_model.predict(X_test_selected)
        
        # Métricas
        train_metrics = calculate_metrics(y_train, y_train_pred, 'train_')
        test_metrics = calculate_metrics(y_test, y_test_pred, 'test_')
        all_metrics = {**train_metrics, **test_metrics}
        
        # Log métricas y parámetros
        mlflow.log_metrics(all_metrics)
        mlflow.log_params(best_params)
        mlflow.log_param("model_type", "tuned_on_selected_features")
        
        # Paso 3: Calcular SHAP values del modelo final
        logger.info("📈 Calculando SHAP values del modelo optimizado...")
        calculate_shap_importance(best_model, X_train_selected, "exp3_final")
        
        # Análisis de importancia XGBoost de features
        logger.info("📈 Analizando importancia XGBoost de features...")
        log_feature_importance(best_model, selected_features, "exp3")
        
        # Log modelo
        from mlflow.models import infer_signature
        signature = infer_signature(X_train_selected, best_model.predict(X_train_selected))
        
        mlflow.xgboost.log_model(
            best_model,
            artifact_path="model",
            model_format="json",
            signature=signature,
            input_example=X_train_selected.head(1),
            registered_model_name="housing_price_03_tuned_selected"
        )
        
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        mlflow.xgboost.autolog(disable=True)
        
        return best_model, all_metrics, best_params


def save_best_model_artifacts(
    best_model: XGBRegressor,
    best_metrics: Dict[str, float],
    feature_names: List[str],
    output_dir: Path
):
    """Guarda el mejor modelo y sus artifacts para la API."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Guardar modelo
    model_path = output_dir / 'xgboost_model.pkl'
    joblib.dump(best_model, model_path)
    logger.info(f"💾 Mejor modelo guardado: {model_path}")
    
    # Guardar métricas
    metrics_path = output_dir / 'metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(best_metrics, f, indent=2)
    logger.info(f"💾 Métricas guardadas: {metrics_path}")
    
    # Guardar info del modelo
    model_info = {
        'feature_names': feature_names,
        'n_features': len(feature_names),
        'model_type': 'XGBRegressor',
        'best_test_rmse': best_metrics.get('test_rmse', 0),
        'best_test_r2': best_metrics.get('test_r2', 0)
    }
    
    info_path = output_dir / 'model_info.json'
    with open(info_path, 'w') as f:
        json.dump(model_info, f, indent=2)
    logger.info(f"💾 Info del modelo guardada: {info_path}")


def main():
    """
    Función principal: Ejecuta los 3 experimentos y selecciona el mejor.
    """
    logger.info("\n" + "="*70)
    logger.info("🚀 INICIANDO PIPELINE DE ENTRENAMIENTO - 3 EXPERIMENTOS XGBOOST")
    logger.info("="*70)
    
    # PASO 1: Cargar parámetros
    params_path = Path("params.yaml")
    if not params_path.exists():
        logger.error(f"❌ Archivo params.yaml no encontrado")
        return
    
    params = load_params(str(params_path))
    
    # PASO 2: Configurar MLflow
    mlflow_uri = params.get('mlflow', {}).get('tracking_uri', './mlruns')
    mlflow.set_tracking_uri(mlflow_uri)
    experiment_name = params.get('mlflow', {}).get('experiment_name', 'Boston_Housing_Price_Prediction')
    mlflow.set_experiment(experiment_name)
    
    logger.info(f"📊 MLflow configurado:")
    logger.info(f"   - Tracking URI: {mlflow_uri}")
    logger.info(f"   - Experimento: {experiment_name}")
    
    # PASO 3: Configurar rutas
    data_dir = Path(params.get('preprocessing', {}).get('processed_data_dir', 'data/processed'))
    output_dir = Path(params.get('model_training', {}).get('model_output_dir', 'models'))
    target_column = params.get('data_ingestion', {}).get('target_column', 'MEDV')
    
    # PASO 4: Cargar datos
    train_df, test_df = load_data(data_dir)
    X_train, y_train, X_test, y_test = prepare_features_target(
        train_df, test_df, target_column
    )
    
    # ========================================================================
    # EJECUTAR LOS 3 EXPERIMENTOS
    # ========================================================================
    results = {}
    
    # Experimento 1: Hyperparameter Tuning
    model1, metrics1, best_params = train_tuned_model(X_train, y_train, X_test, y_test)
    results['01_tuned'] = {
        'model': model1,
        'metrics': metrics1,
        'test_rmse': metrics1['test_rmse'],
        'feature_names': list(X_train.columns)
    }
    
    # Experimento 2: Important Features (SHAP percentil 20 + Default Params)
    model2, metrics2, selected_features_exp2 = train_with_important_features(
        X_train, y_train, X_test, y_test
    )
    results['02_important_features'] = {
        'model': model2,
        'metrics': metrics2,
        'test_rmse': metrics2['test_rmse'],
        'feature_names': selected_features_exp2
    }
    
    # Experimento 3: Hyperparameter Tuning on Selected Features from Exp 2
    model3, metrics3, best_params_exp3 = train_with_feature_selection(
        X_train, y_train, X_test, y_test, selected_features_exp2
    )
    results['03_tuned_selected'] = {
        'model': model3,
        'metrics': metrics3,
        'test_rmse': metrics3['test_rmse'],
        'feature_names': selected_features_exp2
    }
    
    # ========================================================================
    # COMPARACIÓN Y SELECCIÓN DEL MEJOR MODELO
    # ========================================================================
    logger.info("\n" + "="*70)
    logger.info("📊 COMPARACIÓN DE MODELOS")
    logger.info("="*70)
    
    comparison_data = []
    for exp_name, result in results.items():
        comparison_data.append({
            'Experimento': exp_name,
            'Test RMSE': result['test_rmse'],
            'Test R²': result['metrics']['test_r2'],
            'Test MAE': result['metrics']['test_mae'],
            'Train RMSE': result['metrics']['train_rmse']
        })
    
    comparison_df = pd.DataFrame(comparison_data)
    logger.info("\n" + comparison_df.to_string(index=False))
    
    # Identificar el mejor modelo (menor RMSE en test)
    best_exp_name = min(results.keys(), key=lambda k: results[k]['test_rmse'])
    best_result = results[best_exp_name]
    
    logger.info("\n" + "="*70)
    logger.info(f"🏆 MEJOR MODELO: {best_exp_name}")
    logger.info("="*70)
    logger.info(f"📊 Test RMSE: {best_result['test_rmse']:.4f}")
    logger.info(f"📊 Test R²: {best_result['metrics']['test_r2']:.4f}")
    logger.info(f"📊 Test MAE: {best_result['metrics']['test_mae']:.4f}")
    
    # Guardar el mejor modelo para la API
    save_best_model_artifacts(
        best_model=best_result['model'],
        best_metrics=best_result['metrics'],
        feature_names=best_result['feature_names'],
        output_dir=output_dir
    )
    
    # ========================================================================
    # RESUMEN FINAL
    # ========================================================================
    logger.info("\n" + "="*70)
    logger.info("✅ ¡ENTRENAMIENTO COMPLETADO EXITOSAMENTE!")
    logger.info("="*70)
    logger.info(f"🏆 Mejor modelo: {best_exp_name}")
    logger.info(f"📊 RMSE en test: {best_result['test_rmse']:.4f}")
    logger.info(f"💾 Modelo guardado en: {output_dir}")
    logger.info(f"📈 Experimentos en MLflow: {mlflow_uri}")
    logger.info("\n💡 Próximos pasos:")
    logger.info("   1. Ver experimentos: mlflow ui --port 5000")
    logger.info("   2. El mejor modelo está listo para la API")
    logger.info("="*70)


if __name__ == "__main__":
    main()
