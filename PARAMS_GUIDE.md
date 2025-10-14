# 📋 Guía de Parámetros - params.yaml

## 📚 Índice

- [Introducción](#introducción)
- [Estructura del Archivo](#estructura-del-archivo)
- [Configuración por Sección](#configuración-por-sección)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Best Practices](#best-practices)

---

## Introducción

El archivo `params.yaml` centraliza **todos los hiperparámetros y configuraciones** del proyecto MLOps, siguiendo las mejores prácticas de la industria. Este enfoque permite:

✅ **Experimentación sin modificar código**  
✅ **Reproducibilidad completa** de experimentos  
✅ **Tracking automático** en MLflow  
✅ **Versionado de configuraciones** con Git  
✅ **Colaboración eficiente** entre miembros del equipo  

### ¿Por qué params.yaml?

Inspirado en repositorios de referencia como [End-to-end-Youtube-Sentiment](https://github.com/entbappy/End-to-end-Youtube-Sentiment), `params.yaml`:

- Separa configuración de código
- Facilita A/B testing de hiperparámetros
- Permite configuraciones por ambiente (dev/staging/prod)
- Es estándar en pipelines de CI/CD

---

## Estructura del Archivo

```yaml
# params.yaml tiene 15 secciones principales:

1. data_ingestion          # Descarga y split de datos
2. preprocessing           # Limpieza y transformación
3. model_building          # Hiperparámetros de modelos
4. model_evaluation        # Métricas y validación
5. mlflow                  # Configuración de tracking
6. api                     # Configuración del servidor
7. monitoring              # Observabilidad y alertas
8. pipeline                # Automatización del pipeline
9. feature_engineering     # Creación de features (experimental)
10. hyperparameter_tuning  # Optimización bayesiana (experimental)
11. reproducibility        # Semillas y determinismo
12. logging                # Configuración de logs
13. performance            # Optimizaciones de rendimiento
14. data_validation        # Validación de inputs
15. deployment             # Configuración de despliegue
```

---

## Configuración por Sección

### 1. Data Ingestion

Controla cómo se descarga y divide el dataset:

```yaml
data_ingestion:
  test_size: 0.2           # 80% train, 20% test
  random_state: 42         # Reproducibilidad
  shuffle: true            # Mezclar antes del split
```

**Cuándo modificar:**
- `test_size`: Para más datos de validación (ej: 0.3 = 30%)
- `random_state`: Para diferentes splits (mantener en 42 para reproducibilidad)
- `shuffle`: Poner en `false` si datos tienen orden temporal

### 2. Preprocessing

Define cómo se limpian y transforman los datos:

```yaml
preprocessing:
  scaling_method: "standard"  # standard, minmax, robust
  handle_missing: "drop"      # drop, mean, median, mode
  remove_duplicates: true
  outlier_detection: false    # Experimental
```

**Cuándo modificar:**
- `scaling_method`: 
  - `standard`: Para datos con distribución normal (por defecto)
  - `minmax`: Para datos con rango específico
  - `robust`: Para datos con outliers
- `handle_missing`: Estrategia para valores faltantes
- `outlier_detection`: Activar para detectar anomalías

### 3. Model Building

**Los hiperparámetros más importantes para experimentar:**

#### Random Forest (Recomendado para empezar)

```yaml
random_forest:
  n_estimators: 100        # ⬆️ Más árboles = mejor precisión (más lento)
  max_depth: 10            # ⬆️ Mayor profundidad = más overfitting
  min_samples_split: 2     # ⬆️ Mayor valor = menos overfitting
  min_samples_leaf: 1
  max_features: "sqrt"     # sqrt, log2, null (todas)
```

**Consejos de tuning:**
- `n_estimators`: Probar 50, 100, 200, 300
- `max_depth`: Probar 5, 10, 15, 20, null (sin límite)
- `max_features`: "sqrt" es buen default

#### Gradient Boosting

```yaml
gradient_boosting:
  n_estimators: 100
  learning_rate: 0.1       # ⬇️ Menor = entrenamiento más lento pero mejor
  max_depth: 3             # ⬇️ Menor que RF para evitar overfitting
```

**Consejos de tuning:**
- `learning_rate`: Probar 0.01, 0.05, 0.1, 0.2
- Reducir `learning_rate` y aumentar `n_estimators` suele mejorar

### 4. Model Evaluation

```yaml
model_evaluation:
  metrics:
    - "rmse"               # Métrica principal
    - "mae"
    - "r2"
  
  generate_plots: true     # ⬇️ Poner false para entrenamientos rápidos
  min_r2_score: 0.7        # Alerta si R² < 0.7
  max_rmse: 10.0           # Alerta si RMSE > 10
```

**Plots generados automáticamente:**
- Prediction vs Actual
- Residuals plot
- Residuals distribution
- Feature importance (si aplica)

### 5. MLflow Configuration

```yaml
mlflow:
  tracking_uri: "http://localhost:5000"
  experiment_name: "housing-price-prediction"
  log_artifacts: true      # Guardar plots y archivos
  log_model: true
  log_plots: true
```

### 6. Monitoring

```yaml
monitoring:
  enabled: true
  drift_detection_enabled: false  # Activar para detectar data drift
  drift_threshold: 0.1
  latency_threshold_ms: 100       # Alerta si > 100ms
```

**Para producción:**
- Activar `drift_detection_enabled`
- Ajustar `latency_threshold_ms` según SLA
- Configurar `error_rate_threshold`

---

## Ejemplos de Uso

### Ejemplo 1: Entrenar con más árboles

```yaml
# params.yaml
random_forest:
  n_estimators: 200  # Cambiar de 100 a 200
  max_depth: 10
```

```bash
# Reentrenar
make train

# O manualmente
python src/train.py
```

MLflow automáticamente registrará el cambio de `n_estimators: 200`.

### Ejemplo 2: Experimentar con Gradient Boosting más agresivo

```yaml
gradient_boosting:
  n_estimators: 200
  learning_rate: 0.05    # Más conservador
  max_depth: 4           # Más profundo
```

### Ejemplo 3: Test size diferente

```yaml
data_ingestion:
  test_size: 0.3  # 30% para test (más validación)
```

### Ejemplo 4: Cross-validation 10-fold

```yaml
model_building:
  cv_folds: 10  # Más robusto pero más lento
```

### Ejemplo 5: Activar detección de outliers

```yaml
preprocessing:
  outlier_detection: true
  outlier_method: "iqr"      # Inter-Quartile Range
  outlier_threshold: 1.5
```

---

## Best Practices

### ✅ DO

1. **Versionado con Git**
   ```bash
   git add params.yaml
   git commit -m "feat: increase n_estimators to 200"
   ```

2. **Documentar cambios significativos**
   ```yaml
   # params.yaml
   random_forest:
     n_estimators: 200  # Aumentado de 100 para mejorar R²
   ```

3. **Usar archivos por ambiente**
   ```bash
   params.dev.yaml      # Desarrollo (rápido)
   params.staging.yaml  # Pre-producción
   params.prod.yaml     # Producción (optimizado)
   ```

4. **Experimentar de forma sistemática**
   ```bash
   # Experimento 1
   vim params.yaml  # n_estimators: 100
   make train

   # Experimento 2
   vim params.yaml  # n_estimators: 200
   make train
   
   # Comparar en MLflow UI
   open http://localhost:5000
   ```

### ❌ DON'T

1. **No hardcodear hiperparámetros en código**
   ```python
   # ❌ MAL
   model = RandomForestRegressor(n_estimators=100)
   
   # ✅ BIEN
   params = load_params('params.yaml')
   model = RandomForestRegressor(**params['random_forest'])
   ```

2. **No ignorar warnings de validación**
   ```yaml
   model_evaluation:
     min_r2_score: 0.7  # Prestar atención si se viola
   ```

3. **No desactivar logging en experimentación**
   ```yaml
   mlflow:
     log_artifacts: true  # Mantener true para debug
   ```

---

## Integración con el Proyecto

### Cómo el Código Lee params.yaml

```python
# src/train.py

import yaml

# Cargar parámetros
with open('params.yaml', 'r') as f:
    params = yaml.safe_load(f)

# Usar en entrenamiento
rf_params = params['model_building']['random_forest']
model = RandomForestRegressor(**rf_params)
```

### Tracking Automático en MLflow

Todos los parámetros de `params.yaml` se registran automáticamente en MLflow:

```python
# Automático en src/train.py
mlflow.log_params(params)
```

Ver en MLflow UI: http://localhost:5000

---

## Escenarios Avanzados

### Hyperparameter Tuning con Optuna

```yaml
hyperparameter_tuning:
  enabled: true           # Activar búsqueda automática
  method: "bayesian"      # Optimización bayesiana
  n_trials: 50            # 50 experimentos
  
  rf_search_space:
    n_estimators: [50, 100, 200, 300]
    max_depth: [5, 10, 15, 20, null]
```

```bash
# Ejecutar tuning
python src/hyperparameter_tuning.py  # (Experimental)
```

### Feature Engineering

```yaml
feature_engineering:
  enabled: true
  polynomial_features: true
  poly_degree: 2
  
  interaction_features: true
  interactions:
    - ["RM", "DIS"]       # Rooms x Distance
    - ["LSTAT", "PTRATIO"]
```

---

## Troubleshooting

### Problema: Modelo no mejora

**Solución:**
1. Aumentar `n_estimators`
2. Ajustar `learning_rate` (más bajo)
3. Cambiar `max_features`

### Problema: Overfitting (train >> test)

**Solución:**
1. Reducir `max_depth`
2. Aumentar `min_samples_split`
3. Activar `cross_validation`

### Problema: Training muy lento

**Solución:**
1. Reducir `n_estimators`
2. Reducir `cv_folds`
3. Desactivar `generate_plots` durante experimentación

---

## Referencias

- [Documentación MLflow](https://mlflow.org/docs/latest/index.html)
- [Scikit-learn Parameters](https://scikit-learn.org/stable/modules/ensemble.html)
- [DVC Pipelines](https://dvc.org/doc/user-guide/pipelines)
- [Repo de Referencia](https://github.com/entbappy/End-to-end-Youtube-Sentiment)

---

## Próximos Pasos

1. ✅ Experimentar con diferentes `n_estimators`
2. ✅ Comparar modelos en MLflow UI
3. ✅ Activar cross-validation
4. ⏭️ Implementar hyperparameter tuning (Optuna)
5. ⏭️ Agregar DVC para versionado de datos
6. ⏭️ Configurar environments (dev/staging/prod)

---

**¿Preguntas?** Consulta el README principal o abre un issue.
