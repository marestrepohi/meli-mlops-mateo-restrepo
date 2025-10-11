# 🏠 Housing Price Prediction - MLOps Project

[![ML Pipeline CI/CD](https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions/workflows/ml-pipeline.yml/badge.svg)](https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions/workflows/ml-pipeline.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![MLflow](https://img.shields.io/badge/MLflow-2.8+-orange.svg)](https://mlflow.org/)

Un sistema completo de MLOps para predecir precios de viviendas utilizando el dataset Boston Housing. Incluye pipeline de entrenamiento reproducible, API REST, monitoreo, containerización con Docker y CI/CD con GitHub Actions.

## 📑 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Inicio Rápido](#-inicio-rápido)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Pipeline de Entrenamiento](#-pipeline-de-entrenamiento)
- [API REST](#-api-rest)
- [Monitoreo](#-monitoreo)
- [Despliegue](#-despliegue)
- [Decisiones Técnicas](#-decisiones-técnicas)
- [Mejoras Futuras](#-mejoras-futuras)
- [Uso de Herramientas AI](#-uso-de-herramientas-ai)

## ✨ Características

### 🎯 Funcionalidades Core
- **Pipeline de ML Reproducible**: Entrenamiento automatizado con versionado completo
- **Configuración Centralizada**: `params.yaml` para hiperparámetros y configuraciones
- **API REST**: Endpoints para predicciones individuales y en batch
- **Tracking con MLflow**: Seguimiento de experimentos, métricas y artefactos visuales
- **Artefactos de Evaluación**: Plots automáticos (residuals, feature importance, predictions)
- **Monitoreo en Producción**: Métricas de performance, latencia y drift detection
- **Containerización**: Docker y docker-compose para despliegue portable
- **CI/CD**: Pipeline automatizado con GitHub Actions
- **Testing**: Suite de tests unitarios e integración

### 🔧 Stack Tecnológico
- **ML Framework**: scikit-learn
- **API**: FastAPI + Uvicorn
- **Tracking**: MLflow (open-source)
- **Containerización**: Docker + docker-compose
- **Testing**: pytest
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom metrics + Prometheus-ready

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                     │
│              (Testing, Linting, Building, Deploy)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   Training Pipeline                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐             │
│  │   Data     │→ │Preprocess  │→ │  Train   │             │
│  │  Download  │  │  & Split   │  │ Multiple │             │
│  └────────────┘  └────────────┘  │  Models  │             │
│                                   └─────┬────┘             │
│                                         ↓                   │
│                  ┌──────────────────────────────────┐      │
│                  │      MLflow Tracking Server      │      │
│                  │  • Experiments  • Metrics        │      │
│                  │  • Parameters   • Artifacts      │      │
│                  └──────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────┐
│                   Production API (FastAPI)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /predict    │  │   /health    │  │   /metrics   │     │
│  │  /batch      │  │  /model/info │  │ /admin/reload│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │            Model Monitor                         │     │
│  │  • Latency tracking  • Prediction logging        │     │
│  │  • Data drift        • Performance metrics       │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash


# Construir y levantar servicios
docker-compose up --build

# Acceder a:
# - API: http://localhost:8000/docs
# - MLflow: http://localhost:5000
```

### Opción 2: Local

```bash


# Setup inicial
chmod +x setup.sh train.sh run_api.sh
./setup.sh

# Activar entorno virtual
source venv/bin/activate

# Descargar datos
python src/download_data.py

# Entrenar modelo
./train.sh

# Iniciar API
./run_api.sh
```

### 📝 Probar la API

```bash
# Health check
curl http://localhost:8000/health

# Predicción individual
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "CRIM": 0.00632,
    "ZN": 18.0,
    "INDUS": 2.31,
    "CHAS": 0.0,
    "NOX": 0.538,
    "RM": 6.575,
    "AGE": 65.2,
    "DIS": 4.0900,
    "RAD": 1.0,
    "TAX": 296.0,
    "PTRATIO": 15.3,
    "B": 396.90,
    "LSTAT": 4.98
  }'

# Métricas
curl http://localhost:8000/metrics
```

## 📁 Estructura del Proyecto

```
server/
├── src/
│   ├── config.py           # Configuración centralizada
│   ├── download_data.py    # Descarga del dataset
│   ├── preprocessing.py    # Pipeline de preprocesamiento
│   ├── train.py           # Pipeline de entrenamiento
│   ├── main.py            # API FastAPI
│   └── monitoring.py      # Sistema de monitoreo
├── tests/
│   └── test_system.py     # Tests unitarios
├── data/                  # Datasets (gitignored)
├── models/                # Modelos entrenados (gitignored)
├── logs/                  # Logs de predicciones
├── mlruns/               # MLflow tracking
├── requirements.txt      # Dependencias Python
├── setup.py             # Instalación del paquete
├── Dockerfile           # Imagen Docker
├── docker-compose.yml   # Orquestación de servicios
├── setup.sh            # Script de setup
├── train.sh            # Script de entrenamiento
└── run_api.sh          # Script para iniciar API
```

## 🔬 Pipeline de Entrenamiento

### Componentes

1. **Data Download** (`download_data.py`)
   - Descarga automática desde Kaggle usando `kagglehub`
   - Validación de datos (missing values, tipos, estadísticas)
   - Guardado en formato CSV

2. **Preprocessing** (`preprocessing.py`)
   - Limpieza de datos (missing values, duplicados)
   - Identificación automática de features y target
   - Split train/test (80/20)
   - Standardización con `StandardScaler`
   - Persistencia del preprocessor para inferencia

3. **Training** (`train.py`)
   - Entrenamiento de múltiples modelos:
     - Linear Regression (baseline)
     - Ridge Regression
     - Random Forest Regressor
     - Gradient Boosting Regressor
   - Tracking automático con MLflow:
     - Parámetros
     - Métricas (RMSE, MAE, R²)
     - Artefactos (modelo, preprocessor)
   - Selección del mejor modelo
   - Guardado en `/models/production/`

### Métricas Evaluadas

- **RMSE**: Error cuadrático medio (penaliza outliers)
- **MAE**: Error absoluto medio (interpretable)
- **R²**: Varianza explicada (0-1, mayor es mejor)

### Reproducibilidad

- Seeds fijos (`random_state=42`)
- Versionado de código con Git
- Tracking completo con MLflow
- Configuración centralizada (`.env` y `params.yaml`)

### 📋 Configuración con params.yaml

**NUEVO:** El proyecto ahora incluye `params.yaml` para centralizar hiperparámetros y configuraciones, inspirado en [mejores prácticas de MLOps](https://github.com/entbappy/End-to-end-Youtube-Sentiment).

#### Beneficios

- ✅ **Experimentación sin modificar código**: Cambia hiperparámetros editando YAML
- ✅ **Reproducibilidad**: Versionado de configuraciones con Git
- ✅ **Tracking automático**: MLflow registra todos los parámetros
- ✅ **Colaboración**: Equipo puede compartir configuraciones fácilmente

#### Ejemplo de Uso

```yaml
# params.yaml
model_building:
  random_forest:
    n_estimators: 200     # Cambiar de 100 a 200
    max_depth: 15         # Aumentar profundidad
    min_samples_split: 5  # Reducir overfitting
```

```bash
# Reentrenar con nuevos parámetros

python src/train.py
```

MLflow automáticamente registra todos los cambios y permite comparar experimentos.

#### Artefactos Visuales Mejorados

El pipeline ahora genera automáticamente plots de evaluación en cada entrenamiento:

- **Predictions vs Actual**: Visualiza precisión del modelo
- **Residuals Plot**: Detecta patrones en errores
- **Residuals Distribution**: Valida normalidad de residuos
- **Feature Importance**: Top 15 features más importantes (RF/GB)

Todos los plots se guardan automáticamente en MLflow como artefactos.

#### Guía Completa

Ver [PARAMS_GUIDE.md](PARAMS_GUIDE.md) para:
- Explicación detallada de cada parámetro
- Ejemplos de tuning
- Best practices
- Troubleshooting

## 🌐 API REST

### Endpoints Principales

#### `POST /predict`
Predicción individual de precio de vivienda.

**Request:**
```json
{
  "CRIM": 0.00632,
  "ZN": 18.0,
  "INDUS": 2.31,
  "CHAS": 0.0,
  "NOX": 0.538,
  "RM": 6.575,
  "AGE": 65.2,
  "DIS": 4.0900,
  "RAD": 1.0,
  "TAX": 296.0,
  "PTRATIO": 15.3,
  "B": 396.90,
  "LSTAT": 4.98
}
```

**Response:**
```json
{
  "prediction": 30.12,
  "model_version": "1.0.0",
  "inference_time": 0.0023
}
```

#### `POST /predict/batch`
Predicciones en batch para múltiples entradas.

#### `GET /health`
Health check del servicio.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "uptime_hours": 2.5,
  "total_predictions": 157,
  "warnings": []
}
```

#### `GET /metrics`
Métricas de monitoreo.

**Response:**
```json
{
  "total_predictions": 157,
  "avg_inference_time": 0.0024,
  "p95_inference_time": 0.0035,
  "avg_prediction": 22.5,
  "std_prediction": 9.2,
  "uptime_hours": 2.5
}
```

#### `GET /model/info`
Información del modelo en producción.

#### `POST /admin/reload`
Recargar modelo sin reiniciar el servicio.

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Monitoreo

### Sistema de Monitoreo (`monitoring.py`)

El sistema incluye monitoreo comprehensivo en producción:

#### 1. **Métricas de Performance**
- Latencia de inferencia (avg, p50, p95, p99)
- Throughput (predicciones/hora)
- Uptime del servicio

#### 2. **Logging de Predicciones**
- Todas las predicciones se registran con:
  - Timestamp
  - Features de entrada
  - Predicción
  - Tiempo de inferencia
- Guardado periódico en `/logs/`

#### 3. **Data Drift Detection**
- Comparación de estadísticas de features vs baseline
- Alerta si mean se desvía > 2 std
- Útil para detectar cambios en distribución de datos

#### 4. **Health Checks**
- Verificación de estado del modelo
- Detección de anomalías (ej. alta latencia)
- Status: `healthy`, `degraded`, `warning`

### Ejemplo de Uso

```python
from monitoring import monitor

# El monitor se actualiza automáticamente con cada predicción
metrics = monitor.get_metrics()
health = monitor.get_health_status()
drift = monitor.detect_drift(baseline_stats)
```

## 🐳 Despliegue

### Docker Compose

El proyecto incluye `docker-compose.yml` con dos servicios:

1. **MLflow Server** (Puerto 5000)
   - Tracking server
   - Backend: file system
   - Artifacts: local storage

2. **API Service** (Puerto 8000)
   - FastAPI application
   - Auto-reload en desarrollo
   - Health checks configurados

```bash
# Desarrollo
docker-compose up

# Producción (detached)
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Escalar API
docker-compose up --scale api=3
```

### Kubernetes (Ejemplo)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: housing-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: housing-api
  template:
    metadata:
      labels:
        app: housing-api
    spec:
      containers:
      - name: api
        image: housing-price-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: MLFLOW_TRACKING_URI
          value: "http://mlflow-service:5000"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 💡 Decisiones Técnicas

### 1. **Stack Agnóstico Cloud**
**Decisión**: Usar solo herramientas open-source (MLflow, FastAPI, Docker)

**Justificación**:
- ✅ Portabilidad total entre proveedores
- ✅ Sin vendor lock-in
- ✅ Control completo del stack
- ✅ Costos predecibles
- ❌ Menos features managed (auto-scaling, managed infra)

**Alternativas consideradas**: AWS SageMaker, Google AI Platform, Azure ML

### 2. **MLflow para Experiment Tracking**
**Decisión**: MLflow open-source con backend de archivos

**Justificación**:
- ✅ Industry standard
- ✅ UI integrada para visualización
- ✅ Versionado de modelos
- ✅ Fácil migración a backends robustos (PostgreSQL, S3)
- ✅ API Python simple

**Alternativas consideradas**: Weights & Biases, Neptune.ai, DVC

### 3. **FastAPI como Framework Web**
**Decisión**: FastAPI sobre Flask/Django

**Justificación**:
- ✅ Performance superior (async/await)
- ✅ Validación automática con Pydantic
- ✅ Documentación auto-generada (OpenAPI/Swagger)
- ✅ Type hints nativos
- ✅ Diseñado para APIs modernas

**Benchmarks**: ~3x más rápido que Flask en I/O bound tasks

### 4. **Múltiples Modelos con Selección Automática**
**Decisión**: Entrenar 4 modelos y seleccionar el mejor por RMSE

**Justificación**:
- ✅ Validación de que modelo simple no es suficiente
- ✅ Comparación justa con mismos datos
- ✅ Random Forest ganó consistentemente (mejor bias-variance tradeoff)
- ✅ Tracking de todos los experimentos

**Modelos probados**:
1. Linear Regression (baseline)
2. Ridge (regularización L2)
3. Random Forest (ensemble, no lineal)
4. Gradient Boosting (ensemble secuencial)

### 5. **Monitoreo In-Process**
**Decisión**: Monitoreo dentro del proceso de la API

**Justificación**:
- ✅ Simplicidad (no requiere infra adicional)
- ✅ Suficiente para MVP
- ✅ Fácil evolución a Prometheus/Grafana
- ❌ No persistente entre reinicios

**Mejora futura**: Exportar a Prometheus + Grafana

### 6. **StandardScaler vs Min-Max**
**Decisión**: StandardScaler para normalización

**Justificación**:
- ✅ No asume rango fijo [0,1]
- ✅ Robusto a outliers
- ✅ Funciona bien con modelos lineales y tree-based
- ✅ Preserva estructura de outliers

### 7. **Estructura Modular**
**Decisión**: Separación clara de concerns

**Justificación**:
- ✅ Testeable independientemente
- ✅ Reutilizable (preprocessing en train e inference)
- ✅ Extensible (fácil agregar nuevos modelos)
- ✅ Mantenible

```
config.py          → Configuración centralizada
preprocessing.py   → Lógica de datos
train.py          → Pipeline de entrenamiento
main.py           → API
monitoring.py     → Observabilidad
```

## 🚀 Mejoras Futuras

### Corto Plazo (1-2 sprints)

1. **Feature Engineering**
   - Interacciones entre features (RM * DIS)
   - Transformaciones no lineales (log, sqrt)
   - Binning de variables continuas

2. **Hyperparameter Tuning**
   - Grid Search o Random Search
   - Optuna para optimización bayesiana
   - Validación cruzada k-fold

3. **Model Validation**
   - Cross-validation en entrenamiento
   - Análisis de residuos
   - Feature importance

4. **Testing Mejorado**
   - Tests de integración end-to-end
   - Tests de carga (locust)
   - Contract testing para API

### Medio Plazo (3-6 meses)

5. **Monitoreo Avanzado**
   - Integración con Prometheus + Grafana
   - Alertas automáticas (PagerDuty, Slack)
   - Dashboards de métricas de negocio

6. **Data Drift Detection Robusto**
   - Kolmogorov-Smirnov test
   - Population Stability Index (PSI)
   - Reentrenamiento automático si drift > threshold

7. **A/B Testing**
   - Framework para probar modelos nuevos
   - Traffic splitting
   - Métricas de negocio

8. **Model Registry**
   - Versionado de modelos con MLflow Registry
   - Staging → Production promotion
   - Rollback automático

### Largo Plazo (6-12 meses)

9. **Feature Store**
   - Feast o Tecton
   - Features compartidas entre modelos
   - Consistencia train/serve

10. **Advanced Deployment**
    - Blue-green deployment
    - Canary releases
    - Shadow mode

11. **AutoML**
    - Auto-sklearn o H2O AutoML
    - Exploración automática de modelos
    - Feature engineering automático

12. **Seguridad**
    - Autenticación API (OAuth2, API keys)
    - Rate limiting
    - Input validation más estricta
    - Encriptación de datos sensibles

13. **Escalabilidad**
    - Kubernetes con HPA
    - Cache de predicciones (Redis)
    - Batch inference optimizado
    - GPU para modelos complejos

14. **Compliance & Governance**
    - Lineage de datos
    - Explicabilidad (SHAP, LIME)
    - Audit logs
    - GDPR compliance

## 🤖 Uso de Herramientas AI

Este proyecto fue desarrollado con asistencia de **GitHub Copilot** y **GPT-4** en las siguientes áreas:

### Copilot (Inline suggestions)
- ✅ Autocompletado de funciones repetitivas
- ✅ Generación de docstrings
- ✅ Sugerencias de tipo hints
- ✅ Patrones de código comunes

### GPT-4 (Chat-based)
- ✅ Diseño de arquitectura MLOps
- ✅ Revisión de decisiones técnicas
- ✅ Generación de tests unitarios
- ✅ Escritura de documentación
- ✅ Troubleshooting de errores

### Código Escrito Manualmente
- ✅ Lógica de negocio core (preprocessing, training)
- ✅ Configuración de MLflow
- ✅ Diseño de API endpoints
- ✅ Integración de componentes

### Validación
- ✅ Todo el código fue revisado manualmente
- ✅ Tests ejecutados y pasando
- ✅ Best practices validadas
- ✅ Security considerations aplicadas

**Nota**: Las herramientas AI aceleraron el desarrollo ~30-40%, especialmente en tareas repetitivas y documentación.

## 📚 Referencias

- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [scikit-learn Documentation](https://scikit-learn.org/)
- [Boston Housing Dataset](https://www.kaggle.com/datasets/altavish/boston-housing-dataset)
- [MLOps Best Practices](https://ml-ops.org/)
- [Google MLOps Principles](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

## 👤 Autor

**Mateo Restrepo**
- GitHub: [@marestrepohi](https://github.com/marestrepohi)
- Proyecto: Prueba Técnica MLOps - MercadoLibre

## 📄 Licencia

Este proyecto es para fines educativos y de evaluación técnica.

---

**¿Preguntas?** Abre un issue o contacta al autor.

**Para la presentación**: Revisar secciones de Arquitectura, Decisiones Técnicas y Mejoras Futuras. 🚀
