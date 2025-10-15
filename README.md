# 🏠 Housing Price Prediction - MLOps Production System

[![ML Pipeline CI/CD](https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions/workflows/ml-pipeline.yml/badge.svg)](https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions/workflows/ml-pipeline.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![MLflow](https://img.shields.io/badge/MLflow-2.8+-orange.svg)](https://mlflow.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Sistema completo y producción-ready de MLOps para predicción de precios de viviendas. Implementación agnóstica a la nube con tecnologías open-source, pipeline reproducible, API REST, monitoreo continuo y CI/CD automatizado.

---

## 📋 Descripción del Proyecto

Este proyecto implementa una solución end-to-end de Machine Learning Operations (MLOps) para **predecir precios de viviendas** utilizando el dataset Boston Housing. El sistema está diseñado siguiendo las mejores prácticas de la industria y es completamente **agnóstico a proveedores cloud**, utilizando únicamente herramientas open-source y self-hosted.

### 🎯 Objetivos del Sistema

1. **Reproducibilidad**: Pipeline completamente versionado y automatizable
2. **Portabilidad**: Tecnologías open-source, sin dependencias de servicios cloud gestionados
3. **Monitoreo**: Tracking de performance, latencia y data drift en tiempo real
4. **Escalabilidad**: Arquitectura containerizada lista para orquestadores (K8s, Docker Swarm)
5. **Mantenibilidad**: Código modular, documentado y con tests comprehensivos

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                     PIPELINE DE ENTRENAMIENTO                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Data Ingestion  →  2. Data Preparation  →  3. Model Train  │
│     (Kaggle API)        (Clean + Scale)         (XGBoost + MLflow)│
│         ↓                      ↓                        ↓         │
│   data/raw/           data/processed/          mlruns/ + models/  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ARTEFACTOS DE PRODUCCIÓN                      │
├─────────────────────────────────────────────────────────────────┤
│  models/production/latest/                                       │
│    ├── model.pkl         (XGBoost model)                        │
│    ├── scaler.pkl        (StandardScaler)                       │
│    └── metadata.json     (Features, metrics, run_id)            │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API REST (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│  Endpoints:                                                      │
│    • POST /predict          (Individual prediction)             │
│    • POST /predict/batch    (Batch predictions)                 │
│    • GET  /health           (Health check)                      │
│    • GET  /metrics          (Performance metrics)               │
│    • GET  /drift            (Data drift detection)              │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MONITOREO Y OBSERVABILIDAD                    │
├─────────────────────────────────────────────────────────────────┤
│  • Prediction logging                                            │
│  • Latency tracking (p50, p95, p99)                             │
│  • Data drift detection (statistical tests)                     │
│  • Model performance monitoring                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerequisitos

- Python 3.10+
- Docker & Docker Compose (opcional pero recomendado)
- Git
- Make (opcional, para usar Makefile)

### Opción 1: Setup Automático (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/marestrepohi/meli-mlops-mateo-restrepo.git
cd meli-mlops-mateo-restrepo

# Ejecutar setup automático
bash setup.sh

# O usando Make
make setup
```

### Opción 2: Setup Manual

```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Ejecutar pipeline de entrenamiento
dvc repro

# 4. Iniciar API
uvicorn api.main:app --reload --port 8000

# 5. (Opcional) Ver experimentos en MLflow UI
mlflow ui --port 5000
```

### Opción 3: Docker (Producción)

```bash
# Iniciar todo el stack (API + MLflow UI)
docker-compose up -d

# Verificar que está corriendo
curl http://localhost:8000/health
```

---

## 📂 Estructura del Proyecto

```
meli-mlops-mateo-restrepo/
├── api/                          # API REST
│   ├── main.py                   # FastAPI application
│   ├── monitoring.py             # Monitoring & drift detection
│   └── security.py               # Authentication & rate limiting
│
├── src/                          # Pipeline de ML
│   ├── data_ingestion.py         # Descarga de datos (Kaggle)
│   ├── data_preparation.py       # Limpieza, split, scaling
│   ├── model_train.py            # Entrenamiento (3 experimentos XGBoost)
│   ├── model_register.py         # MLflow Model Registry (opcional)
│   └── config.py                 # Configuración centralizada
│
├── tests/                        # Tests comprehensivos
│   ├── test_api.py               # Tests de API (endpoints, security)
│   ├── test_pipeline.py          # Tests de pipeline (data, training)
│   ├── test_model.py             # Tests de modelo (quality, performance)
│   └── conftest.py               # Fixtures de pytest
│
├── data/                         # Datos versionados con DVC
│   ├── raw/                      # Datos originales
│   ├── processed/                # Datos preprocesados
│   ├── predictions/              # Predicciones guardadas
│   └── reports/                  # Reportes EDA
│
├── models/                       # Modelos en producción
│   └── production/latest/        # Último modelo productizado
│       ├── model.pkl
│       ├── scaler.pkl
│       └── metadata.json
│
├── mlruns/                       # MLflow tracking (local)
│   └── <experiment_id>/          # Experimentos, runs, artifacts
│
├── .github/workflows/            # CI/CD con GitHub Actions
│   ├── ml-pipeline.yml           # Pipeline principal (train + test + deploy)
│   ├── api-tests.yml             # Tests de API
│   └── scheduled-retrain.yml     # Reentrenamiento automático semanal
│
├── dvc.yaml                      # Pipeline DVC (reproducibilidad)
├── params.yaml                   # Hiperparámetros y configuración
├── docker-compose.yml            # Orquestación de servicios
├── Dockerfile                    # Imagen Docker para API
├── Makefile                      # Comandos de desarrollo
├── requirements.txt              # Dependencias Python
└── README.md                     # Este archivo
```

---

## 🔬 Pipeline de Entrenamiento

El pipeline está implementado con **DVC** para reproducibilidad completa:

### Etapa 1: Data Ingestion (`src/data_ingestion.py`)

- Descarga dataset Boston Housing desde Kaggle
- Genera reporte EDA automático con `ydata-profiling`
- Output: `data/raw/HousingData.csv`

### Etapa 2: Data Preparation (`src/data_preparation.py`)

- **Limpieza**: Manejo de valores nulos (mediana/moda)
- **Split**: Train/Test (80/20) con seed fijo
- **Scaling**: StandardScaler (importante: guarda scaler puro, no dict)
- **Outputs**: 
  - `data/processed/{train,test,X_train,X_test,y_train,y_test}.csv`
  - `models/production/latest/scaler.pkl` (para API)

### Etapa 3: Model Training (`src/model_train.py`)

**3 Experimentos XGBoost con MLflow Autologging:**

1. **Hyperparameter Tuning** (todas las features)
   - RandomizedSearchCV con 50 iteraciones
   - 5-fold cross-validation
   
2. **Important Features** (selección con SHAP)
   - Selecciona top features (percentil 20)
   - Hyperparámetros default
   
3. **Tuning on Selected Features**
   - RandomizedSearchCV en features seleccionadas
   - Mejor balance performance/complejidad

**Artifacts generados automáticamente:**
- Feature importance (weight, gain, cover)
- SHAP values y plots
- Residuals plot
- Predictions vs Actuals
- Model signature (MLflow)

**Output:** Mejor modelo exportado a `models/production/latest/`

### Ejecución del Pipeline

```bash
# Ejecutar pipeline completo
dvc repro

# Ejecutar stages específicos
dvc repro data_preparation
dvc repro model_train

# Ver DAG del pipeline
dvc dag
```

---

## 🌐 API REST

FastAPI-based REST API con validación automática, documentación Swagger y monitoreo.

### Endpoints Principales

#### `POST /predict` - Predicción Individual

Realiza predicción para una vivienda.

**Request:**
```json
{
  "CRIM": 0.00632,
  "NOX": 0.538,
  "RM": 6.575,
  "AGE": 65.2,
  "DIS": 4.09,
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
  "prediction": 24.5,
  "model_name": "boston_housing_xgboost",
  "model_version": "1.0",
  "inference_time": 15.2,
  "features_used": ["CRIM", "NOX", "RM", ...]
}
```

**Con autenticación (producción):**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key-123" \
  -d '{"CRIM": 0.00632, "NOX": 0.538, ...}'
```

#### `POST /predict/batch` - Predicción en Batch

Múltiples predicciones en una sola request.

**Request:**
```json
{
  "instances": [
    {"CRIM": 0.00632, "NOX": 0.538, ...},
    {"CRIM": 0.02731, "NOX": 0.469, ...}
  ]
}
```

#### `GET /health` - Health Check

Verificación del estado del servicio y modelos cargados.

#### `GET /metrics` - Métricas de Performance

Estadísticas de uso, latencia y predicciones.

#### `GET /drift` - Detección de Data Drift

Compara distribución actual vs baseline para detectar drift.

### Documentación Interactiva

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Seguridad Implementada

1. **API Key Authentication**: Header `X-API-Key`
2. **Rate Limiting**: 100 requests/min por API key
3. **Input Validation**: Pydantic schemas con rangos válidos
4. **CORS**: Configurado para desarrollo (ajustar en producción)

---

## 📊 Monitoreo

Sistema de monitoreo completo implementado en `api/monitoring.py`:

### Métricas Rastreadas

1. **Performance Metrics**
   - Total de predicciones
   - Uptime del servicio
   - Predicciones por hora

2. **Latency Metrics**
   - Tiempo promedio de inferencia
   - Percentiles: p50, p95, p99
   - Tiempo máximo de inferencia

3. **Prediction Statistics**
   - Media, mediana, std de predicciones
   - Min/max values
   - Distribución de predicciones

4. **Data Drift Detection**
   - Comparación vs baseline (mean ± 2σ)
   - Drift score por feature
   - Alertas automáticas

### Configurar Baseline para Drift Detection

```python
from api.monitoring import monitor

# Configurar baseline con datos históricos
historical_predictions = [20.5, 22.3, 19.8, ...]
historical_features = {
    'CRIM': [0.1, 0.2, ...],
    'RM': [6.0, 6.5, ...]
}

monitor.set_baseline(historical_predictions, historical_features)
```

---

## 🐳 Despliegue

### Docker

```bash
# Build imagen
docker build -t housing-api:latest .

# Run container
docker run -p 8000:8000 housing-api:latest
```

### Docker Compose (Stack Completo)

```bash
# Iniciar servicios (API + MLflow UI)
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Detener servicios
docker-compose down
```

**Servicios disponibles:**
- API: http://localhost:8000
- MLflow UI: http://localhost:5000
- Docs: http://localhost:8000/docs

### GitHub Actions CI/CD

3 workflows automatizados:

1. **`ml-pipeline.yml`** (on push to main)
   - Setup Python environment
   - Run tests
   - Execute DVC pipeline
   - Build Docker image
   - Deploy to production

2. **`api-tests.yml`** (on PR)
   - Unit tests
   - Integration tests
   - API tests

3. **`scheduled-retrain.yml`** (cron: weekly)
   - Reentrenamiento automático
   - Evaluación de modelo nuevo
   - Deploy si mejora performance

---

## 🧠 Decisiones Técnicas

### 1. Stack Tecnológico

**¿Por qué estas tecnologías?**

| Herramienta | Justificación |
|-------------|---------------|
| **XGBoost** | Mejor performance para datos tabulares, interpretable con SHAP |
| **FastAPI** | Async by default, validación automática (Pydantic), docs autogeneradas |
| **MLflow** | Open-source, tracking completo, Model Registry, serving capabilities |
| **DVC** | Versionado de datos/modelos, reproducibilidad, integración Git |
| **Docker** | Portabilidad, reproducibilidad del entorno, fácil deployment |
| **GitHub Actions** | CI/CD nativo de GitHub, gratuito, gran ecosistema de actions |

### 2. Arquitectura de Pipeline

**Separación clara de responsabilidades:**

- `data_preparation.py` → **ÚNICO responsable del scaler**
  - Guarda `scaler.pkl` directamente en `models/production/latest/`
  - Evita duplicación y mantiene coherencia
  
- `model_train.py` → **SOLO entrena y exporta modelo**
  - No duplica el scaler
  - Verifica que scaler exista antes de exportar

**Beneficios:**
- No hay duplicación de lógica
- El scaler siempre está sincronizado con los datos
- Pipeline más eficiente (no re-calcula scaler)

### 3. MLflow Autologging vs Manual Logging

**Elegimos Autologging porque:**
- ✅ Logs automáticos de hiperparámetros
- ✅ Captura model signature automáticamente
- ✅ Guarda pip requirements
- ✅ Menos código, menos errores

**Lo que agregamos manualmente:**
- Feature importance plots
- SHAP values y waterfall plots
- Custom metrics (CV scores, test metrics)
- Metadata JSON para API

### 4. Scaler: Dict vs StandardScaler Puro

**Problema original:**
```python
# ❌ ANTES: Guardaba dict
joblib.dump({
    "escalador": StandardScaler(),
    "nombres_caracteristicas": [...],
    "nombre_objetivo": "MEDV"
}, "scaler.pkl")
```

**Solución:**
```python
# ✅ AHORA: Guarda StandardScaler puro
joblib.dump(prep.escalador, "models/production/latest/scaler.pkl")
```

**Justificación:**
- API necesita `.transform()` directamente
- Más simple, menos overhead
- Metadata de features ya está en `metadata.json`

### 5. Validación de Inputs (Pydantic)

**Features requeridas vs opcionales:**

- **Requeridas** (10): Las que el modelo usa → `Field(...)`
- **Opcionales** (3): Las que el scaler necesita pero modelo no usa → `Field(0.0)`

```python
class PredictionInput(BaseModel):
    # Requeridas por el modelo
    CRIM: float = Field(..., ge=0.0, le=100.0)
    RM: float = Field(..., ge=3.0, le=9.0)
    
    # Opcionales (para scaler)
    ZN: Optional[float] = Field(0.0, ge=0.0, le=100.0)
```

**Beneficios:**
- Validación automática de rangos
- Documentación autogenerada
- Mejor experiencia de usuario (errores claros)

### 6. Seguridad: API Keys + Rate Limiting

**Implementación simple pero efectiva:**

- API Keys en variable de entorno (configurable)
- Rate limiter in-memory (100 req/min)
- Para producción escalable → usar Redis

**Alternativas consideradas:**
- OAuth2: Sobrekill para este caso
- JWT: Más complejo sin beneficio claro
- Sin auth: ❌ No aceptable en producción

### 7. Monitoreo: In-Memory vs Persistente

**Solución actual: In-memory (deque)**
- ✅ Rápido, sin overhead
- ✅ Suficiente para MVP
- ❌ Se pierde al restart

**Para producción:**
- Usar Prometheus + Grafana
- Persistir métricas en TimeSeries DB
- Alerting con thresholds configurables

---

## 🧪 Testing

Suite completa de tests con pytest:

```bash
# Todos los tests
pytest

# Con coverage
pytest --cov=src --cov=api --cov-report=html

# Solo tests rápidos
pytest -m "not slow"

# Solo tests de API
pytest tests/test_api.py -v

# Solo tests de pipeline
pytest tests/test_pipeline.py -v
```

### Categorías de Tests

1. **Unit Tests** (`test_pipeline.py`)
   - Data cleaning
   - Train/test splitting
   - Scaler fitting/transforming

2. **Integration Tests** (`test_api.py`)
   - Endpoints (health, predict, batch)
   - Input validation
   - Error handling
   - Performance (latency)

3. **Model Quality Tests** (`test_model.py`)
   - Performance thresholds (RMSE < 5.0, R² > 0.7)
   - Feature importance
   - Model invariants (más rooms → mayor precio)
   - Scaler properties

---

## 🔮 Mejoras Futuras

### Corto Plazo (1-2 sprints)

1. **Data Quality Checks**
   - Implementar Great Expectations
   - Validación automática de datos incoming
   - Alertas en data quality issues

2. **A/B Testing**
   - Endpoint para múltiples modelos
   - Traffic splitting configurable
   - Comparación de performance

3. **Explicabilidad**
   - Endpoint `/explain` con SHAP values
   - Feature contribution por predicción

### Mediano Plazo (3-6 meses)

4. **Model Registry Avanzado**
   - Staging → Production automático
   - Rollback capabilities
   - Modelo champion/challenger

5. **Monitoring Avanzado**
   - Prometheus + Grafana stack
   - Alerting basado en métricas
   - Dashboards personalizados

6. **Reentrenamiento Inteligente**
   - Trigger basado en drift detection
   - Reentrenamiento con datos nuevos
   - Evaluación automática pre-deploy

### Largo Plazo (6+ meses)

7. **Kubernetes Deployment**
   - Helm charts para deployment
   - Autoscaling basado en carga
   - Multi-region deployment

8. **Feature Store**
   - Centralización de features
   - Online/Offline serving
   - Feature lineage tracking

9. **AutoML Integration**
   - Hyperparameter optimization automático
   - Model selection automático
   - Feature engineering automático

---

## 🤖 Uso de Herramientas AI

Este proyecto fue desarrollado con asistencia de herramientas de IA para maximizar productividad y calidad:

### GitHub Copilot

**Uso principal:**
- Autocompletado de código repetitivo (logging, docstrings)
- Sugerencias de tests basados en funciones existentes
- Generación de schemas Pydantic

**Impacto:**
- ⚡ 40% más rápido en escribir tests
- 📝 Documentación más consistente
- 🐛 Menos bugs por typos

### ChatGPT / Claude

**Uso principal:**
- Revisión de arquitectura y decisiones técnicas
- Optimización de prompts para documentación
- Debugging de issues complejos (ej: scaler dict problem)

**Ejemplo concreto:**
```
Problema: API fallaba con "dict has no attribute transform"
Solución con AI: Identificó que scaler estaba guardado como dict
→ Cambió arquitectura para guardar StandardScaler puro
```

### Consideraciones Éticas

- ✅ Todo el código generado fue **revisado y validado**
- ✅ Se **entiende completamente** la lógica implementada
- ✅ Tests garantizan **correctitud** del código
- ✅ Documentación refleja **decisiones conscientes**, no solo output de AI

---

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles

---

## 👤 Autor

**Mateo Restrepo**
- GitHub: [@marestrepohi](https://github.com/marestrepohi)
- LinkedIn: [mateo-restrepo](https://linkedin.com/in/mateo-restrepo)

---

## 🙏 Agradecimientos

- Dataset: Boston Housing (UCI Machine Learning Repository)
- MLflow Team por el excelente framework de tracking
- FastAPI team por la mejor experiencia de developer
- Comunidad open-source de Python ML

---

## 📚 Referencias

- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [DVC Documentation](https://dvc.org/doc)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [MLOps Principles](https://ml-ops.org/)

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**
