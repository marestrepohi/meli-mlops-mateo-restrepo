# 🔥 Refactorización MLflow Autologging

## Resumen de Cambios

Se ha refactorizado el código para usar **MLflow Autologging** siguiendo las mejores prácticas. Ahora TODO se guarda automáticamente en `mlruns/` sin duplicación de archivos.

## 🎯 Antes vs Después

### ❌ ANTES (Problema)

```
Proyecto/
├── mlruns/              # Tracking de experimentos MLflow
├── mlartifacts/
│   └── training/
│       ├── best_model.pkl        # ❌ Duplicado
│       ├── best_model_info.json
│       └── best_metrics.json
├── models/
│   ├── xgboost_model.pkl         # ❌ Duplicado
│   ├── model_info.json
│   └── production/
│       ├── latest/
│       │   └── model.pkl         # ❌ Duplicado
│       └── v001/
│           └── model.pkl         # ❌ Duplicado
```

**Problemas:**
- ❌ Modelo guardado en 4+ lugares diferentes
- ❌ Sincronización manual entre archivos
- ❌ Confusión sobre cuál es la "fuente de verdad"
- ❌ Desperdicio de espacio en disco
- ❌ Autologging deshabilitado (`log_models=False`)

### ✅ DESPUÉS (Solución)

```
Proyecto/
├── mlruns/              # ✅ ÚNICA fuente de verdad
│   └── <experiment_id>/
│       └── <run_id>/
│           ├── artifacts/
│           │   ├── model/              # ✅ Modelo XGBoost
│           │   ├── model_info.json     # ✅ Metadata
│           │   ├── shap_summary_*.png  # ✅ Gráficos SHAP
│           │   └── feature_importance_*.png
│           ├── metrics/                # ✅ Métricas
│           ├── params/                 # ✅ Parámetros
│           └── tags/                   # ✅ Tags
├── mlartifacts/
│   └── training/
│       ├── best_model_info.json  # Solo run_id y metadata mínima
│       ├── best_metrics.json     # Para DVC tracking
│       └── experiments_summary.json
└── models/
    ├── standard_scaler.pkl       # Solo preprocessing
    └── production/               # Exportaciones para deploy
        ├── latest/
        │   ├── model.pkl         # Cargado desde MLflow
        │   └── metadata.json
        └── v001/
            ├── model.pkl         # Cargado desde MLflow
            └── metadata.json
```

**Ventajas:**
- ✅ Modelo guardado UNA SOLA VEZ en mlruns/
- ✅ Autologging completo activado (`log_models=True`)
- ✅ Todos los artifacts (SHAP, plots, etc.) en un lugar
- ✅ Carga directa desde MLflow: `mlflow.xgboost.load_model(f"runs:/{run_id}/model")`
- ✅ Historial completo de experimentos
- ✅ Comparación fácil entre modelos

## 📝 Cambios en el Código

### 1. `src/model_train.py`

**Antes:**
```python
mlflow.xgboost.autolog(
    log_models=False,  # ❌ Deshabilitado
    silent=True
)

# Guardado manual con joblib
joblib.dump(model, 'models/xgboost_model.pkl')

# Logging manual del modelo
mlflow.xgboost.log_model(model, "model")
```

**Después:**
```python
mlflow.xgboost.autolog(
    log_input_examples=True,
    log_model_signatures=True,
    log_models=True,  # ✅ Autologging completo
    silent=True
)

# ¡YA NO SE NECESITA guardar manualmente!
# MLflow lo hace automáticamente

# Guardar solo run_id para referencia
mlflow.log_dict({
    "feature_names": list(X_train.columns),
    "n_features": len(X_train.columns),
    "model_type": "tuned_randomized_search",
}, "model_info.json")
```

### 2. `src/model_register.py`

**Antes:**
```python
# Cargar desde archivo pkl
best_model_path = training_artifacts_dir / "best_model.pkl"
if best_model_path.exists():
    model = joblib.load(best_model_path)
else:
    # Fallback complicado
    model = mlflow.xgboost.load_model(model_uri)
```

**Después:**
```python
# ✅ SIEMPRE carga desde MLflow
run_id = best_model_info.get("mlflow_run_id")
model_uri = f"runs:/{run_id}/model"
model = mlflow.xgboost.load_model(model_uri)

# Exportar SOLO para producción si es necesario
export_production_model(model, scaler, ...)
```

### 3. `dvc.yaml`

**Antes:**
```yaml
model_train:
  outs:
    - mlartifacts/training/best_model.pkl  # ❌ Archivo pkl
    - mlartifacts/training/best_model_info.json
    - mlartifacts/training/best_metrics.json
```

**Después:**
```yaml
model_train:
  outs:
    # Solo outputs mínimos - los modelos están en mlruns/
    - mlartifacts/training/best_model_info.json
    - mlartifacts/training/best_metrics.json
    - mlartifacts/training/experiments_summary.json
```

## 🚀 Cómo Usar

### 1. Entrenar Modelos

```bash
# Ejecutar pipeline de entrenamiento
python src/model_train.py

# O con DVC
dvc repro model_train
```

**Resultado:**
- Todos los modelos en `mlruns/<experiment_id>/<run_id>/artifacts/model/`
- Resumen en `mlartifacts/training/best_model_info.json` con el `run_id` del mejor modelo

### 2. Explorar Experimentos

```bash
# Iniciar MLflow UI
mlflow ui --backend-store-uri ./mlruns

# Visitar: http://localhost:5000
```

### 3. Cargar un Modelo Entrenado

```python
import mlflow

# Opción 1: Cargar el mejor modelo usando run_id
run_id = "abc123..."  # Del archivo best_model_info.json
model = mlflow.xgboost.load_model(f"runs:/{run_id}/model")

# Opción 2: Cargar desde Model Registry
model = mlflow.xgboost.load_model("models:/housing-price-production/Production")

# Opción 3: Cargar versión específica
model = mlflow.xgboost.load_model("models:/housing-price-production/1")
```

### 4. Registrar en Model Registry

```bash
# Registrar el mejor modelo en Model Registry
python src/model_register.py --stage Staging

# O con DVC
dvc repro model_register
```

## 📊 Estructura de `mlruns/`

```
mlruns/
└── <experiment_id>/              # ID del experimento
    ├── <run_id_1>/               # Experimento 1: Tuned
    │   ├── artifacts/
    │   │   ├── model/
    │   │   │   ├── MLmodel
    │   │   │   ├── model.json
    │   │   │   └── requirements.txt
    │   │   ├── model_info.json
    │   │   ├── shap_summary_exp1_tuned.png
    │   │   ├── shap_importance_bar_exp1_tuned.png
    │   │   └── feature_importance_*.png
    │   ├── metrics/
    │   │   ├── test_rmse
    │   │   ├── test_r2
    │   │   └── ...
    │   ├── params/
    │   │   ├── n_estimators
    │   │   ├── max_depth
    │   │   └── ...
    │   └── tags/
    │       └── mlflow.runName
    ├── <run_id_2>/               # Experimento 2: Important Features
    └── <run_id_3>/               # Experimento 3: Tuned Selected
```

## 🔍 Comparar Experimentos

En MLflow UI:
1. Seleccionar múltiples runs
2. Click en "Compare"
3. Ver métricas, parámetros y artifacts lado a lado

O programáticamente:

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()
experiment = client.get_experiment_by_name("housing-price-prediction")

# Obtener todos los runs del experimento
runs = client.search_runs(
    experiment_ids=[experiment.experiment_id],
    order_by=["metrics.test_rmse ASC"]
)

# Mejor modelo
best_run = runs[0]
print(f"Best Run ID: {best_run.info.run_id}")
print(f"Test RMSE: {best_run.data.metrics['test_rmse']}")
print(f"Test R²: {best_run.data.metrics['test_r2']}")
```

## 🎨 Visualización de SHAP y Feature Importance

Todos los plots ahora están en:
```
mlruns/<experiment_id>/<run_id>/artifacts/
├── shap_summary_exp1_tuned.png
├── shap_importance_bar_exp1_tuned.png
├── feature_importance_weight_exp1.png
├── feature_importance_gain_exp1.png
└── feature_importance_cover_exp1.png
```

Acceder en MLflow UI o programáticamente:

```python
# Descargar artifact
client.download_artifacts(run_id, "shap_summary_exp1_tuned.png", dst_path="./plots")
```

## 🔄 Migración desde Código Antiguo

Si tienes código que carga modelos con `joblib.load()`:

**Antes:**
```python
model = joblib.load("models/xgboost_model.pkl")
```

**Después:**
```python
import mlflow
import json

# Leer run_id del mejor modelo
with open("mlartifacts/training/best_model_info.json") as f:
    info = json.load(f)
    run_id = info["mlflow_run_id"]

# Cargar desde MLflow
model = mlflow.xgboost.load_model(f"runs:/{run_id}/model")
```

## 📦 Deployment

Para producción, puedes:

1. **Opción 1: Usar MLflow Model Registry**
   ```python
   model = mlflow.xgboost.load_model("models:/housing-price-production/Production")
   ```

2. **Opción 2: Exportar como pkl (backward compatibility)**
   ```bash
   python src/model_register.py --stage Production
   # Crea models/production/latest/model.pkl
   ```

3. **Opción 3: Servir con MLflow**
   ```bash
   mlflow models serve -m "models:/housing-price-production/Production" -p 5001
   ```

## 🧹 Limpieza

Para eliminar archivos duplicados antiguos:

```bash
# ⚠️ Solo después de verificar que todo funciona
rm -rf mlartifacts/training/best_model.pkl
rm -rf models/xgboost_model.pkl
rm -rf models/metrics.json
rm -rf models/model_info.json
```

## ✅ Ventajas del Nuevo Enfoque

1. **🎯 Single Source of Truth**: `mlruns/` es la única fuente
2. **🚀 Menos Código**: MLflow autologging maneja todo
3. **📊 Mejor Tracking**: Historial completo de experimentos
4. **🔍 Fácil Comparación**: UI de MLflow para comparar runs
5. **💾 Ahorro de Espacio**: Sin duplicación de archivos
6. **🔄 Reproducibilidad**: run_id garantiza el modelo exacto
7. **📈 Artifacts Centralizados**: Todos los plots y datos juntos
8. **🏆 Model Registry**: Gestión de versiones y stages

## 📚 Referencias

- [MLflow XGBoost Autolog](https://mlflow.org/docs/latest/python_api/mlflow.xgboost.html#mlflow.xgboost.autolog)
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html)
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html)
- [Ejemplo similar en producción](https://github.com/entbappy/End-to-end-Youtube-Sentiment/blob/main/notebooks/6_experiment_5_xgboost_with_hpt.ipynb)

## 🤝 Soporte

Si tienes problemas con la migración, revisa:
1. Que `mlflow.xgboost.autolog()` esté activado con `log_models=True`
2. Que el archivo `best_model_info.json` contenga el `mlflow_run_id`
3. Que el directorio `mlruns/` exista y tenga el experimento correcto
4. Que MLflow UI muestre los modelos en artifacts
