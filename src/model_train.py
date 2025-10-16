"""
Módulo de Entrenamiento de Modelos con XGBoost, MLflow y SHAP

Entrena 3 experimentos de XGBoost y selecciona el mejor modelo según RMSE:
1. Ajuste de Hiperparámetros (RandomizedSearchCV con todas las características)
2. Características Importantes (selección SHAP + parámetros por defecto)
3. Optimización con Selección de Características (SHAP + mejores hiperparámetros)

🔥 MLFLOW AUTOLOGGING HABILITADO:
   - Todo se guarda automáticamente en mlruns/
   - Modelos, métricas, parámetros y artefactos en un solo lugar
   - El mejor modelo se exporta automáticamente para la API
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
from mlflow.models import infer_signature
import matplotlib.pyplot as plt
import seaborn as sns
import shap
import tempfile
import os

# ============================================================================
# CONFIGURACIÓN DE LOGGING
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

def load_params(params_path: str = "params.yaml") -> Dict[str, Any]:
    """
    Carga parámetros desde archivo YAML.
    
    Args:
        params_path: Ruta al archivo params.yaml
        
    Returns:
        Diccionario con los parámetros cargados
        
    Raises:
        Exception: Si hay error al leer el archivo YAML
    """
    try:
        with open(params_path, 'r') as file:
            params = yaml.safe_load(file)
        logger.info(f'✅ Parámetros cargados desde {params_path}')
        return params
    except Exception as e:
        logger.error(f'❌ Error cargando parámetros: {e}')
        raise


def load_data(data_dir: Path) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Carga datos de entrenamiento y prueba.
    
    Args:
        data_dir: Directorio donde están los archivos train.csv y test.csv
        
    Returns:
        Tupla (train_df, test_df) con los datos cargados
        
    Raises:
        Exception: Si hay error al cargar los archivos
    """
    try:
        train_path = data_dir / 'train.csv'
        test_path = data_dir / 'test.csv'
        
        train_df = pd.read_csv(train_path)
        test_df = pd.read_csv(test_path)
        
        logger.info(f'✅ Datos cargados exitosamente:')
        logger.info(f'   - Entrenamiento: {train_df.shape}')
        logger.info(f'   - Prueba: {test_df.shape}')
        
        return train_df, test_df
    except Exception as e:
        logger.error(f'❌ Error cargando datos: {e}')
        raise


def prepare_features_target(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    target_column: str
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """
    Separa las características del objetivo (target).
    
    Args:
        train_df: DataFrame de entrenamiento
        test_df: DataFrame de prueba
        target_column: Nombre de la columna objetivo
        
    Returns:
        Tupla (X_train, y_train, X_test, y_test)
        
    Raises:
        Exception: Si hay error al separar características y objetivo
    """
    try:
        X_train = train_df.drop(columns=[target_column])
        y_train = train_df[target_column]
        X_test = test_df.drop(columns=[target_column])
        y_test = test_df[target_column]
        
        logger.info(f'✅ Características y objetivo preparados:')
        logger.info(f'   - Características: {list(X_train.columns)}')
        logger.info(f'   - Objetivo: {target_column}')
        
        return X_train, y_train, X_test, y_test
    except Exception as e:
        logger.error(f'❌ Error preparando características: {e}')
        raise


def calculate_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    prefix: str = ''
) -> Dict[str, float]:
    """
    Calcula métricas de regresión.
    
    Calcula RMSE, MAE, R², y MAPE para evaluar el desempeño del modelo.
    
    Args:
        y_true: Valores reales
        y_pred: Valores predichos
        prefix: Prefijo para los nombres de las métricas (ej: 'train_', 'test_')
        
    Returns:
        Diccionario con las métricas calculadas
    """
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
    """
    Analiza y registra la importancia de características con visualizaciones.
    
    Calcula importancia por tipo: weight (número de veces usado), gain (mejora de pérdida),
    cover (número de observaciones afectadas).
    
    Args:
        model: Modelo XGBoost entrenado
        feature_names: Lista de nombres de características
        run_name: Nombre del experimento para identificar artefactos
    """
    importance_types = ["weight", "gain", "cover"]
    
    # Usar directorio temporal para no dejar archivos sueltos
    with tempfile.TemporaryDirectory() as tmpdir:
        for imp_type in importance_types:
            try:
                # Obtener importancias del booster
                booster = model.get_booster()
                importance_dict = booster.get_score(importance_type=imp_type)
                
                if not importance_dict:
                    continue
                
                # Ordenar por importancia (descendente)
                sorted_features = sorted(
                    importance_dict.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
                
                # Crear visualización (Top 13 = todas las características)
                features, scores = zip(*sorted_features[:13])
                
                plt.figure(figsize=(10, 6))
                sns.barplot(x=list(scores), y=list(features))
                plt.title(f'Importancia de Características ({imp_type.title()}) - {run_name}')
                plt.xlabel('Puntuación de Importancia')
                plt.ylabel('Características')
                plt.tight_layout()
                
                # Guardar gráfico en directorio temporal
                plot_filename = os.path.join(tmpdir, f"feature_importance_{imp_type}_{run_name.replace(' ', '_')}.png")
                plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
                mlflow.log_artifact(plot_filename)
                plt.close()
                
                # Guardar JSON en directorio temporal
                json_filename = os.path.join(tmpdir, f"feature_importance_{imp_type}_{run_name.replace(' ', '_')}.json")
                with open(json_filename, 'w') as f:
                    json.dump(importance_dict, f, indent=2)
                mlflow.log_artifact(json_filename)
                
                logger.info(f"   ✅ Importancia de características ({imp_type}) registrada en MLflow")
                
            except Exception as e:
                logger.warning(f"   ⚠️ No se pudo registrar importancia de características ({imp_type}): {e}")


# ============================================================================
# EXPERIMENTO 1: Ajuste de Hiperparámetros con RandomizedSearchCV
# ============================================================================
def train_tuned_model(
    X_train: pd.DataFrame, 
    y_train: pd.Series, 
    X_test: pd.DataFrame, 
    y_test: pd.Series,
    save_model_info: bool = True
) -> Tuple[XGBRegressor, Dict[str, float], Dict[str, Any]]:
    """
    Experimento 1: Ajuste de Hiperparámetros con RandomizedSearchCV.
    
    🔥 USA MLflow autologging - guarda automáticamente modelo y parámetros.
    
    Args:
        X_train: Características de entrenamiento
        y_train: Objetivo de entrenamiento
        X_test: Características de prueba
        y_test: Objetivo de prueba
        save_model_info: Si es True, guarda model_info.json con run_id y model_path
        
    Returns:
        Tupla (modelo_entrenado, métricas, mejores_parámetros)
    """
    logger.info("\n" + "="*70)
    logger.info("🔍 EXPERIMENTO 1: Ajuste de Hiperparámetros")
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
        # 🔥 AUTOLOGGING: MLflow registra TODO automáticamente
        mlflow.xgboost.autolog(
            log_input_examples=True,
            log_model_signatures=True,
            log_models=True,  # ✅ Ahora SÍ guardamos automáticamente
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
        
        # Log métricas adicionales (autolog ya registró las básicas)
        mlflow.log_metrics(all_metrics)
        mlflow.log_param("model_type", "tuned_randomized_search")
        mlflow.log_param("experiment_number", "01")
        mlflow.log_metric("cv_best_score", -random_search.best_score_)
        
        # Calcular y registrar SHAP values
        logger.info("📊 Calculando SHAP values para el modelo optimizado...")
        calculate_shap_importance(best_model, X_train, "exp1_tuned")
        
        # Registrar importancia de features
        logger.info("📈 Registrando importancia de features...")
        log_feature_importance(best_model, list(X_train.columns), "exp1")
        
        logger.info(f"✅ Mejores hiperparámetros encontrados:")
        for param, value in best_params.items():
            logger.info(f"   - {param}: {value}")
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        # Guardar info para compatibilidad con model_register.py
        run_id = mlflow.active_run().info.run_id
        mlflow.log_dict({
            "feature_names": list(X_train.columns),
            "n_features": len(X_train.columns),
            "model_type": "tuned_randomized_search",
            "experiment_number": "01"
        }, "model_info.json")
        
        mlflow.xgboost.autolog(disable=True)
        
        return best_model, all_metrics, best_params


# ============================================================================
# ============================================================================
# EXPERIMENTO 2: Características Importantes Solamente (Parámetros por Defecto)
# ============================================================================
def train_with_important_features(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[XGBRegressor, Dict[str, float], List[str]]:
    """
    Experimento 2: Modelo con solo las características más importantes usando SHAP (parámetros por defecto).
    
    🔥 Usa MLflow autologging - TODO se guarda automáticamente en mlruns/
    
    Args:
        X_train: Características de entrenamiento
        y_train: Objetivo de entrenamiento
        X_test: Características de prueba
        y_test: Objetivo de prueba
        
    Returns:
        Tupla (modelo_entrenado, métricas, características_seleccionadas)
    """
    logger.info("\n" + "="*70)
    logger.info("🎯 EXPERIMENTO 2: CARACTERÍSTICAS IMPORTANTES (SHAP + Parámetros por Defecto)")
    logger.info("="*70)
    
    with mlflow.start_run(run_name="02_important_features_shap"):
        # 🔥 AUTOLOGGING activado
        mlflow.xgboost.autolog(
            log_input_examples=True,
            log_model_signatures=True,
            log_models=True,
            silent=True
        )
        
        # Paso 1: Entrenar modelo para calcular SHAP values
        logger.info("🔄 Paso 1: Entrenando modelo para calcular SHAP values...")
        selector_model = XGBRegressor(random_state=42)
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
            "feature_reduction_ratio": n_selected / X_train.shape[1],
            "shap_threshold": threshold
        })
        mlflow.log_param("selected_features", ", ".join(selected_features))
        mlflow.log_param("model_type", "important_features_default_params")
        mlflow.log_param("shap_selection_method", "percentile_20")
        mlflow.log_param("experiment_number", "02")
        
        # Paso 3: Entrenar modelo CON PARÁMETROS POR DEFECTO usando solo features importantes
        logger.info("\n🔄 Paso 3: Entrenando modelo final con features seleccionadas...")
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
        
        # Log métricas adicionales
        mlflow.log_metrics(all_metrics)
        
        # Análisis de importancia XGBoost de features (solo registrar, sin SHAP redundante)
        logger.info("\n📈 Registrando importancia XGBoost de features seleccionadas...")
        log_feature_importance(final_model, selected_features, "exp2")
        
        # Guardar info para compatibilidad con model_register.py
        run_id = mlflow.active_run().info.run_id
        mlflow.log_dict({
            "feature_names": selected_features,
            "n_features": len(selected_features),
            "model_type": "important_features_default_params",
            "experiment_number": "02",
            "shap_threshold": float(threshold),
            "feature_reduction_ratio": n_selected / X_train.shape[1]
        }, "model_info.json")
        
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        mlflow.xgboost.autolog(disable=True)
        
        return final_model, all_metrics, selected_features


# ============================================================================
# EXPERIMENTO 3: Ajuste de Hiperparámetros en Características Seleccionadas
# ============================================================================
def train_with_feature_selection(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    selected_features: List[str]
) -> Tuple[XGBRegressor, Dict[str, float], Dict[str, Any]]:
    """
    Experimento 3: Búsqueda de hiperparámetros en características seleccionadas del Experimento 2.
    
    Aplica RandomizedSearchCV usando solo las características más importantes del Experimento 2.
    
    Args:
        X_train: Características de entrenamiento
        y_train: Objetivo de entrenamiento
        X_test: Características de prueba
        y_test: Objetivo de prueba
        selected_features: Lista de características seleccionadas en Experimento 2
        
    Returns:
        Tupla (modelo_entrenado, métricas, mejores_parámetros)
        
    Notas:
        🔥 Usa MLflow autologging - TODO se guarda automáticamente en mlruns/
    """
    logger.info("\n" + "="*70)
    logger.info("⚙️ EXPERIMENTO 3: AJUSTE DE HIPERPARÁMETROS EN CARACTERÍSTICAS SELECCIONADAS")
    logger.info("="*70)
    
    with mlflow.start_run(run_name="03_tuning_on_selected_features"):
        # 🔥 AUTOLOGGING activado
        mlflow.xgboost.autolog(
            log_input_examples=True,
            log_model_signatures=True,
            log_models=True,
            silent=True
        )
        
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
        mlflow.log_param("model_type", "tuned_on_selected_features")
        mlflow.log_param("experiment_number", "03")
        
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
        
        # Log métricas adicionales
        mlflow.log_metrics(all_metrics)
        mlflow.log_params(best_params)
        mlflow.log_metric("cv_best_score", -random_search.best_score_)
        
        # Paso 3: Calcular SHAP values del modelo final
        logger.info("📈 Calculando SHAP values del modelo optimizado...")
        calculate_shap_importance(best_model, X_train_selected, "exp3_final")
        
        # Análisis de importancia XGBoost de features
        logger.info("📈 Analizando importancia XGBoost de features...")
        log_feature_importance(best_model, selected_features, "exp3")
        
        # Guardar info para compatibilidad con model_register.py
        run_id = mlflow.active_run().info.run_id
        mlflow.log_dict({
            "feature_names": selected_features,
            "n_features": len(selected_features),
            "model_type": "tuned_on_selected_features",
            "experiment_number": "03",
            "best_params": best_params,
            "feature_reduction_ratio": len(selected_features) / X_train.shape[1]
        }, "model_info.json")
        
        logger.info(f"📊 Train RMSE: {train_metrics['train_rmse']:.4f} | R²: {train_metrics['train_r2']:.4f}")
        logger.info(f"📊 Test RMSE: {test_metrics['test_rmse']:.4f} | R²: {test_metrics['test_r2']:.4f}")
        
        mlflow.xgboost.autolog(disable=True)
        
        return best_model, all_metrics, best_params





def export_best_model_for_api(
    best_result: Dict[str, Any],
    output_dir: Path = Path("models/production/latest")
):
    """
    Exporta el mejor modelo al formato que espera la API.
    
    Guarda:
    - model.pkl: Modelo XGBoost listo para predicciones
    - metadata.json: Información del modelo (features, métricas, versión)
    
    NOTA: El scaler.pkl ya está en models/production/latest/ desde data_preparation.py
    
    Args:
        best_result: Diccionario con el mejor modelo y sus métricas
        output_dir: Directorio donde guardar (default: models/production/latest)
    """
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        
        run_id = best_result.get('run_id')
        if not run_id:
            logger.error("❌ No se puede exportar: falta run_id del mejor modelo")
            return
        
        # Cargar el modelo desde MLflow
        model_uri = f"runs:/{run_id}/model"
        logger.info(f"📦 Cargando mejor modelo desde MLflow: {model_uri}")
        model = mlflow.xgboost.load_model(model_uri)
        
        # Guardar modelo
        model_path = output_dir / "model.pkl"
        joblib.dump(model, model_path)
        logger.info(f"💾 Modelo exportado: {model_path}")
        
        # Verificar que el scaler exista (ya fue guardado por data_preparation.py)
        scaler_path = output_dir / "scaler.pkl"
        if scaler_path.exists():
            logger.info(f"✅ Scaler ya existe: {scaler_path} (desde data_preparation)")
        else:
            logger.warning(f"⚠️ Scaler no encontrado en {scaler_path} - debería existir desde data_preparation")
        
        # Crear metadata para la API
        metadata = {
            "model_name": "housing-price-production",
            "model_version": 1,
            "stage": "Production",
            "mlflow_run_id": run_id,
            "features": best_result['feature_names'],
            "n_features": len(best_result['feature_names']),
            "model_type": best_result.get('experiment_name', 'xgboost'),
            "metrics": {
                "test_rmse": best_result['metrics'].get('test_rmse', 0),
                "test_r2": best_result['metrics'].get('test_r2', 0),
                "test_mae": best_result['metrics'].get('test_mae', 0),
                "train_rmse": best_result['metrics'].get('train_rmse', 0),
                "train_r2": best_result['metrics'].get('train_r2', 0)
            },
            "model_info": {
                "feature_names": best_result['feature_names'],
                "model_name": "housing-price-production",
                "model_version": "1",
                "model_stage": "Production"
            },
            "created_at": pd.Timestamp.now().isoformat()
        }
        
        # Guardar metadata
        metadata_path = output_dir / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"💾 Metadata exportada: {metadata_path}")
        
        # Guardar model_info.json simple (para model_register.py)
        # Similar al patrón del repo de referencia
        model_info_simple = {
            "run_id": run_id,
            "model_path": f"runs:/{run_id}/model"
        }
        model_info_path = output_dir.parent.parent / "model_info.json"
        with open(model_info_path, 'w') as f:
            json.dump(model_info_simple, f, indent=2)
        logger.info(f"💾 model_info.json guardado: {model_info_path}")
        
        logger.info("\n" + "="*70)
        logger.info("✅ MODELO EXPORTADO PARA API")
        logger.info("="*70)
        logger.info(f"📂 Directorio: {output_dir}")
        logger.info(f"📦 Archivos creados:")
        logger.info(f"   - model.pkl ({model_path.stat().st_size / 1024:.2f} KB)")
        logger.info(f"   - scaler.pkl ({scaler_path.stat().st_size / 1024:.2f} KB)")
        logger.info(f"   - metadata.json")
        logger.info(f"🔗 MLflow Run ID: {run_id}")
        logger.info("="*70)
        
    except Exception as e:
        logger.error(f"❌ Error exportando modelo para API: {e}")
        raise


def main():
    """
    Función principal: Ejecuta los 3 experimentos y selecciona el mejor.
    🔥 TODO se guarda automáticamente en mlruns/ usando MLflow autologging
    """
    logger.info("\n" + "="*70)
    logger.info("🚀 INICIANDO PIPELINE DE ENTRENAMIENTO - 3 EXPERIMENTOS XGBOOST")
    logger.info("🔥 MLflow Autologging Enabled - Todo en mlruns/")
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
    experiment_name = params.get('mlflow', {}).get('experiment_name', 'housing-price-prediction')
    experiment = mlflow.set_experiment(experiment_name)
    
    logger.info(f"📊 MLflow configurado:")
    logger.info(f"   - Tracking URI: {mlflow_uri}")
    logger.info(f"   - Experimento: {experiment_name}")
    logger.info(f"   - Experiment ID: {experiment.experiment_id}")
    
    # PASO 3: Configurar rutas
    data_dir = Path(params.get('preprocessing', {}).get('processed_data_dir', 'data/processed'))
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
    run_id_1 = mlflow.last_active_run().info.run_id if mlflow.last_active_run() else None
    results['01_tuned'] = {
        'model': model1,
        'metrics': metrics1,
        'test_rmse': metrics1['test_rmse'],
        'feature_names': list(X_train.columns),
        'run_id': run_id_1,
        'experiment_name': '01_tuned'
    }
    
    # Experimento 2: Important Features (SHAP percentil 20 + Default Params)
    model2, metrics2, selected_features_exp2 = train_with_important_features(
        X_train, y_train, X_test, y_test
    )
    run_id_2 = mlflow.last_active_run().info.run_id if mlflow.last_active_run() else None
    results['02_important_features'] = {
        'model': model2,
        'metrics': metrics2,
        'test_rmse': metrics2['test_rmse'],
        'feature_names': selected_features_exp2,
        'run_id': run_id_2,
        'experiment_name': '02_important_features'
    }
    
    # Experimento 3: Hyperparameter Tuning on Selected Features from Exp 2
    model3, metrics3, best_params_exp3 = train_with_feature_selection(
        X_train, y_train, X_test, y_test, selected_features_exp2
    )
    run_id_3 = mlflow.last_active_run().info.run_id if mlflow.last_active_run() else None
    results['03_tuned_selected'] = {
        'model': model3,
        'metrics': metrics3,
        'test_rmse': metrics3['test_rmse'],
        'feature_names': selected_features_exp2,
        'run_id': run_id_3,
        'experiment_name': '03_tuned_selected'
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
            'Train RMSE': result['metrics']['train_rmse'],
            'Run ID': result['run_id'][:8] if result['run_id'] else 'N/A'
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
    logger.info(f"🔗 MLflow Run ID: {best_result['run_id']}")
    
    # ========================================================================
    # EXPORTAR MEJOR MODELO PARA LA API
    # ========================================================================
    logger.info("\n" + "="*70)
    logger.info("📦 EXPORTANDO MEJOR MODELO PARA API")
    logger.info("="*70)
    
    # Cargar StandardScaler desde data_preparation
    scaler_path = Path(params.get('preprocessing', {}).get('standard_scaler_path', 'models/standard_scaler.pkl'))
    
    if not scaler_path.exists():
        logger.warning(f"⚠️ StandardScaler no encontrado en {scaler_path}")
        logger.warning("⚠️ Ejecuta primero: python src/data_preparation.py")
        scaler = None
    else:
        scaler_data = joblib.load(scaler_path)
        # El scaler se guarda como diccionario con clave 'escalador'
        if isinstance(scaler_data, dict):
            scaler = scaler_data.get('escalador')
            logger.info(f"✅ StandardScaler extraído del diccionario")
        else:
            scaler = scaler_data
        logger.info(f"✅ StandardScaler cargado desde {scaler_path}")
    
    # Exportar modelo al formato que espera la API
    # El scaler ya está en models/production/latest/ desde data_preparation.py
    export_best_model_for_api(
        best_result=best_result,
        output_dir=Path("models/production/latest")
    )
    
    # ========================================================================
    # RESUMEN FINAL
    # ========================================================================
    logger.info("\n" + "="*70)
    logger.info("✅ ¡ENTRENAMIENTO COMPLETADO EXITOSAMENTE!")
    logger.info("="*70)
    logger.info(f"🏆 Mejor modelo: {best_exp_name}")
    logger.info(f"📊 RMSE en test: {best_result['test_rmse']:.4f}")
    logger.info(f"🔗 Run ID: {best_result['run_id']}")
    logger.info(f"📂 MLflow: {mlflow_uri}/{experiment.experiment_id}/{best_result['run_id']}/artifacts/model")
    logger.info(f"� API: models/production/latest/")
    logger.info(f"�📈 Tracking URI: {mlflow_uri}")
    logger.info("\n💡 Próximos pasos:")
    logger.info(f"   1. Ver experimentos: mlflow ui --backend-store-uri {mlflow_uri}")
    logger.info("   2. Iniciar API: uvicorn api.main:app --reload")
    logger.info("   3. Probar: curl -X POST http://localhost:8000/predict")
    logger.info("="*70)


if __name__ == "__main__":
    main()
