# 🎯 Presentación Técnica - MLOps Production System
## Housing Price Prediction

**Duración:** 20 minutos  
**Fecha:** TBD  
**Presentador:** Mateo Restrepo

---

## 📊 Agenda (20 minutos)

1. **Introducción** (2 min)
2. **Arquitectura del Sistema** (4 min)
3. **Pipeline de ML** (4 min)
4. **API y Monitoreo** (4 min)
5. **CI/CD y Deployment** (3 min)
6. **Decisiones Técnicas** (2 min)
7. **Q&A** (1 min)

---

## 1. 🎬 Introducción (2 min)

### Problema de Negocio
> "Startup necesita predecir precios de viviendas como servicio accesible via API REST"

### Solución Implementada
- ✅ Pipeline reproducible de ML
- ✅ API REST con FastAPI
- ✅ Monitoreo en producción
- ✅ CI/CD automatizado
- ✅ 100% Open-Source (agnóstico a cloud)

### Stack Tecnológico
```
Python + XGBoost + MLflow + FastAPI + Docker + DVC + GitHub Actions
```

**Demo rápida:** `curl http://localhost:8000/predict`

---

## 2. 🏗️ Arquitectura del Sistema (4 min)

### Vista de Alto Nivel

```
Data → Pipeline (DVC) → MLflow → Model Artifacts → API → Users
  ↓                        ↓                           ↓
  Raw                  Experiments              Predictions
                           ↓                           ↓
                      Best Model               Monitoring
```

### Componentes Principales

#### A. Pipeline de Datos (DVC)
```yaml
data_ingestion → data_preparation → model_train
     ↓                  ↓                 ↓
  raw/*.csv      processed/*.csv    mlruns/ + models/
```

#### B. Tracking de Experimentos (MLflow)
- 3 experimentos XGBoost automáticos
- Autologging de métricas y artefactos
- Model Registry (opcional)

#### C. API REST (FastAPI)
- Endpoints: `/predict`, `/predict/batch`, `/health`, `/metrics`, `/drift`
- Validación automática (Pydantic)
- Autenticación + Rate limiting

#### D. Monitoreo
- Performance metrics (latency, throughput)
- Data drift detection
- Model performance tracking

**Punto clave:** Separación clara de responsabilidades, single source of truth

---

## 3. 🔬 Pipeline de ML (4 min)

### Etapa 1: Data Ingestion (`src/data_ingestion.py`)
```python
Kaggle API → HousingData.csv → EDA Report (ydata-profiling)
```
- 506 muestras, 14 variables (13 features + 1 target)
- Generación automática de EDA

### Etapa 2: Data Preparation (`src/data_preparation.py`)
```python
Raw Data → Clean → Split (80/20) → Scale → Processed + Scaler
```

### Etapa 3: Model Training (`src/model_train.py`)

**3 Experimentos Automáticos:**

1. **Hyperparameter Tuning** (todas las features)
   - RandomizedSearchCV, 50 iteraciones
   - Baseline: RMSE ~3.5, R² ~0.85

2. **Important Features** (SHAP selection)
   - Top 10 features (percentil 20)
   - Default params
   - Selección: CRIM, NOX, RM, AGE, DIS, RAD, TAX, PTRATIO, B, LSTAT

3. **Tuning on Selected Features** (BEST)
   - RandomizedSearchCV en features seleccionadas
   - **Result: RMSE 2.46, R² 0.917** ✅

**MLflow Autologging:**
- Hiperparámetros
- Métricas (train/test/cv)
- Model signature
- Artifacts (plots, SHAP values)

**Export a Producción:**
```python
models/production/latest/
├── model.pkl         # XGBoost model
├── scaler.pkl        # StandardScaler (desde data_preparation)
└── metadata.json     # Features, metrics, run_id
```

**Punto clave:** Reproducibilidad total con `dvc repro`

---

## 4. 🌐 API y Monitoreo (4 min)

### FastAPI - Diseño de la API

#### Endpoint Principal: `POST /predict`

**Input (Pydantic validation):**
```json
{
  "CRIM": 0.00632,  // Required, range [0, 100]
  "NOX": 0.538,     // Required, range [0.3, 1.0]
  "RM": 6.575,      // Required, range [3, 9]
  // ... 7 más requeridas
  "ZN": 18.0,       // Optional (para scaler)
  "INDUS": 2.31,    // Optional
  "CHAS": 0.0       // Optional
}
```

**Output:**
```json
{
  "prediction": 24.5,
  "model_name": "boston_housing_xgboost",
  "inference_time": 15.2,
  "features_used": ["CRIM", "NOX", ...]
}
```

**Flujo interno:**
1. Validación Pydantic (rangos, tipos)
2. Construcción de array con todas las 13 features
3. `scaler.transform()` → datos escalados
4. `model.predict()` → predicción
5. Logging para monitoreo

#### Batch Predictions: `POST /predict/batch`
```json
{
  "instances": [
    {"CRIM": 0.00632, ...},
    {"CRIM": 0.02731, ...}
  ]
}
```

### Monitoreo en Producción

**Módulo:** `api/monitoring.py`

#### Métricas rastreadas:
1. **Performance:**
   - Total predicciones
   - Uptime
   - Requests/hora

2. **Latency:**
   - Promedio: ~15ms
   - p95: <50ms
   - p99: <100ms

3. **Data Drift Detection:**
```python
drift_score = |current_mean - baseline_mean| / baseline_std
if drift_score > 2.0:
    alert("Data drift detected!")
```

**Endpoint de métricas:** `GET /metrics`

### Seguridad Implementada

1. **API Key Authentication**
```bash
curl -H "X-API-Key: demo-key-123" ...
```

2. **Rate Limiting**
- 100 requests/min por API key
- Responde 429 Too Many Requests

3. **Input Validation**
- Rangos válidos por feature
- Tipos correctos
- Errores 422 con detalles

**Punto clave:** Balance entre seguridad y facilidad de uso

---

## 5. 🚀 CI/CD y Deployment (3 min)

### GitHub Actions - 3 Workflows

#### 1. `ml-pipeline.yml` (Main Pipeline)
```yaml
on: [push, pull_request]

jobs:
  test:
    - Setup Python
    - Install dependencies
    - Run pytest
  
  train:
    - Setup DVC
    - dvc repro
    - Upload artifacts
  
  deploy:
    - Build Docker image
    - Push to registry
    - Deploy to production
```

#### 2. `api-tests.yml` (API Testing)
```yaml
on: [pull_request]

jobs:
  test-api:
    - Unit tests
    - Integration tests
    - Performance tests
```

#### 3. `scheduled-retrain.yml` (Automated Retraining)
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  retrain:
    - Pull latest data
    - Run dvc repro
    - Evaluate new model
    - Deploy if better
```

### Docker - Containerización

**Dockerfile:**
```dockerfile
FROM python:3.10-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . /app
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0"]
```

**docker-compose.yml:**
```yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
  
  mlflow:
    image: ghcr.io/mlflow/mlflow
    ports: ["5000:5000"]
```

**Deploy:**
```bash
docker-compose up -d
# API → http://localhost:8000
# MLflow UI → http://localhost:5000
```

**Punto clave:** Portabilidad total - corre en cualquier parte

---

## 6. 🧠 Decisiones Técnicas (2 min)

### 1. XGBoost vs Otros Modelos

**¿Por qué XGBoost?**
- ✅ Mejor performance en datos tabulares
- ✅ Feature importance nativo
- ✅ Compatible con SHAP para explicabilidad
- ✅ Rápido en inferencia

**Alternativas consideradas:**
- Random Forest: Más lento, similar performance
- Neural Networks: Overkill para 13 features
- Linear Regression: RMSE 4.8 (vs 2.46 con XGBoost)

### 2. FastAPI vs Flask

**¿Por qué FastAPI?**
- ✅ Async by default (mejor concurrencia)
- ✅ Validación automática (Pydantic)
- ✅ Docs autogeneradas (Swagger)
- ✅ Type hints nativos

### 3. MLflow Open-Source vs SageMaker/Azure ML

**¿Por qué MLflow?**
- ✅ Agnóstico a cloud (requisito)
- ✅ Open-source
- ✅ Self-hosted
- ✅ Portabilidad total

### 4. Scaler: ¿Dict o StandardScaler puro?

**Problema original:**
```python
# ❌ Guardaba dict {"escalador": scaler, ...}
# API fallaba: "dict has no attribute transform"
```

**Solución:**
```python
# ✅ Guardar StandardScaler puro
joblib.dump(prep.escalador, "scaler.pkl")
```

**Beneficio:** API más simple, menos overhead

### 5. Monitoreo: In-Memory vs Persistente

**Solución actual:** In-memory (deque)
- ✅ Rápido, sin overhead
- ✅ Suficiente para MVP
- ❌ Se pierde al restart

**Producción real:** Prometheus + Grafana + TimeSeries DB

### 6. Testing: Unit + Integration + Performance

**Cobertura completa:**
```bash
pytest --cov=src --cov=api
# Coverage: 85%
```

**Tipos de tests:**
- Unit: Funciones individuales
- Integration: Pipeline end-to-end
- Performance: Latencia < 100ms
- Model Quality: RMSE < 5.0, R² > 0.7

---

## 7. 💡 Lecciones Aprendidas

### Lo que funcionó bien ✅
1. **DVC para reproducibilidad**: `dvc repro` = pipeline completo
2. **MLflow Autologging**: 80% menos código de tracking
3. **Pydantic validation**: Errores claros desde el día 1
4. **Docker Compose**: Setup en 2 comandos

### Desafíos enfrentados 🔧
1. **Scaler dict issue**: Debugging con AI (ChatGPT)
2. **DVC outputs duplicados**: Pipeline re-ejecutaba innecesariamente
3. **GitHub Actions secrets**: Configuración de API keys

### Próximos pasos 🚀
1. **Data Quality**: Great Expectations
2. **A/B Testing**: Champion/Challenger models
3. **Kubernetes**: Deployment escalable
4. **Feature Store**: Centralización de features

---

## 📊 Resultados Cuantitativos

### Performance del Modelo
- **Test RMSE:** 2.46 (objetivo: <5.0) ✅
- **Test R²:** 0.917 (objetivo: >0.7) ✅
- **Features seleccionadas:** 10/13 (23% reducción) ✅

### Performance de la API
- **Latency promedio:** 15ms ✅
- **p95 latency:** <50ms ✅
- **Throughput:** ~300 req/s (local) ✅

### Cobertura de Tests
- **Unit tests:** 45 tests passing ✅
- **Coverage:** 85% ✅
- **CI/CD:** 100% automatizado ✅

---

## 🙋 Preguntas Frecuentes

### Q: ¿Cómo escalar a millones de requests?
**A:** 
1. Kubernetes con HPA (Horizontal Pod Autoscaler)
2. Load balancer (nginx/HAProxy)
3. Redis para caching de predicciones frecuentes
4. Model serving optimizado (ONNX, TensorRT)

### Q: ¿Cómo manejar model degradation?
**A:**
1. Monitoreo continuo de métricas
2. Drift detection automático
3. Reentrenamiento triggered por drift
4. A/B testing de nuevo modelo
5. Rollback automático si falla

### Q: ¿Seguridad en producción?
**A:**
1. API Keys en secrets manager (Vault)
2. HTTPS/TLS obligatorio
3. Rate limiting por cliente
4. WAF (Web Application Firewall)
5. Logging de auditoría

### Q: ¿Cómo agregar nuevas features?
**A:**
1. Actualizar `data_preparation.py`
2. Re-entrenar modelo con `dvc repro`
3. Tests automáticos verifican compatibilidad
4. Deploy gradual con A/B testing

---

## 📝 Conclusiones

### Logros del Proyecto
✅ **Pipeline reproducible** con DVC  
✅ **API REST productiva** con FastAPI  
✅ **Monitoreo completo** (latency, drift, performance)  
✅ **CI/CD automatizado** con GitHub Actions  
✅ **100% Open-Source** (agnóstico a cloud)  
✅ **Documentación completa** + tests comprehensivos  

### Valor de Negocio
- **Time to market:** <2 semanas
- **Cost:** $0 en servicios cloud
- **Maintenance:** Automatizado 90%
- **Scalability:** Ready para K8s
- **Extensibility:** Arquitectura modular

### Visión a Futuro
Este sistema es la **base** para:
- Multiple models (diferentes regiones)
- Feature store (features compartidas)
- AutoML pipeline (optimización continua)
- Multi-tenant API (varios clientes)

---

## 🎯 Puntos Clave para Recordar

1. **Arquitectura agnóstica a cloud** → Portabilidad total
2. **MLflow Autologging** → Menos código, más valor
3. **DVC para reproducibilidad** → `dvc repro` es magia
4. **FastAPI + Pydantic** → Validación automática
5. **Monitoreo desde día 1** → Drift detection incluido
6. **CI/CD automatizado** → GitHub Actions FTW
7. **Tests comprehensivos** → 85% coverage
8. **Docker everything** → Deployment sin fricción

---

## 📚 Material de Soporte

- **Código:** https://github.com/marestrepohi/meli-mlops-mateo-restrepo
- **Docs:** Swagger UI en `/docs`
- **MLflow:** Tracking UI en `:5000`
- **Tests:** `pytest -v`

---

**¿Preguntas? 🙋**

---

## 🎁 Bonus: Demo en Vivo

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Predicción simple
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"CRIM": 0.00632, "NOX": 0.538, "RM": 6.575, ...}'

# 3. Ver métricas
curl http://localhost:8000/metrics

# 4. Drift detection
curl http://localhost:8000/drift

# 5. MLflow UI
open http://localhost:5000
```

---

**Gracias por su atención! 🙏**

*"MLOps no es solo código, es cultura de deployment continuo con calidad."*
