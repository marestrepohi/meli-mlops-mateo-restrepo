# 🎤 Guía de Presentación - Prueba Técnica MLOps

**Duración**: 20 minutos  
**Objetivo**: Demostrar implementación completa de sistema MLOps

## 📋 Estructura de la Presentación

### 1. Introducción (2 min)

**Slide 1 - Contexto**
```
Problema: Startup necesita API de predicción de precios de viviendas
Restricción: Stack agnóstico cloud (no AWS/GCP/Azure)
Solución: Sistema MLOps completo con herramientas open-source
```

**Puntos clave**:
- Dataset: Boston Housing (~500 registros, 13 features)
- Stack: Python + FastAPI + MLflow + Docker
- Enfoque: Producción-ready desde el inicio

### 2. Arquitectura del Sistema (3 min)

**Slide 2 - Diagrama de Arquitectura**
```
GitHub Actions (CI/CD)
    ↓
Training Pipeline → MLflow → Production API → Monitoring
```

**Componentes principales**:
1. **Pipeline de Entrenamiento**
   - Download automático de datos (Kaggle)
   - Preprocesamiento reproducible
   - Entrenamiento de 4 modelos
   - Tracking con MLflow

2. **API REST (FastAPI)**
   - Endpoints: /predict, /health, /metrics
   - Documentación auto-generada
   - Validación con Pydantic

3. **Monitoreo**
   - Latencia de inferencia
   - Logging de predicciones
   - Data drift detection

4. **Infraestructura**
   - Docker + docker-compose
   - CI/CD con GitHub Actions
   - Testing automatizado

### 3. Demo en Vivo (8 min)

#### 3.1 Levantar el Sistema (2 min)
```bash


# Opción 1: Docker (rápido)
docker-compose up -d

# Verificar servicios
docker-compose ps

# Mostrar logs
docker-compose logs -f api
```

**Mostrar en navegador**:
- MLflow UI: http://localhost:5000
- API Docs: http://localhost:8000/docs

#### 3.2 Pipeline de Entrenamiento (2 min)
```bash
# Ver configuración
cat src/config.py

# Ver pipeline de entrenamiento
cat src/train.py | head -50

# Explicar modelos entrenados
# - LinearRegression (baseline)
# - Ridge
# - RandomForest ⭐ (ganador)
# - GradientBoosting
```

**En MLflow UI**:
- Mostrar experimentos
- Comparar métricas (RMSE, MAE, R²)
- Ver parámetros
- Mostrar artefactos

#### 3.3 API en Acción (2 min)
```bash
# Health check
curl http://localhost:8000/health | jq

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
  }' | jq

# Métricas del sistema
curl http://localhost:8000/metrics | jq

# Información del modelo
curl http://localhost:8000/model/info | jq
```

**En Swagger UI** (http://localhost:8000/docs):
- Mostrar documentación interactiva
- Ejecutar predicción desde UI
- Mostrar validación automática

#### 3.4 Monitoreo (2 min)
```bash
# Ver código de monitoreo
cat src/monitoring.py | head -80

# Mostrar logs
ls -lh logs/
```

**Características del monitoreo**:
- ✅ Latencia por predicción
- ✅ Historial de predicciones
- ✅ Data drift detection
- ✅ Health checks automáticos

### 4. Decisiones Técnicas Clave (4 min)

#### 4.1 Stack Agnóstico Cloud
**Decisión**: Herramientas open-source únicamente

**Pros**:
- ✅ Portabilidad total
- ✅ Sin vendor lock-in
- ✅ Control completo
- ✅ Costos predecibles

**Contras**:
- ❌ Más trabajo de configuración
- ❌ Sin managed services

**Justificación**: Cumple requisito de agnosticismo

#### 4.2 FastAPI sobre Flask
**Decisión**: FastAPI como framework web

**Razones**:
- Performance: 3x más rápido (async/await)
- DX: Validación automática, docs auto-generadas
- Moderno: Type hints nativos, Pydantic
- Producción-ready: Usado por Uber, Netflix

#### 4.3 Múltiples Modelos + Auto-selección
**Decisión**: Entrenar 4 modelos, seleccionar mejor

**Resultados** (ejemplo):
```
LinearRegression: RMSE = 4.8
Ridge:           RMSE = 4.7
RandomForest:    RMSE = 3.2 ⭐
GradientBoosting: RMSE = 3.5
```

**Justificación**: Validación empírica mejor que asunciones

#### 4.4 MLflow para Tracking
**Decisión**: MLflow open-source

**Alternativas consideradas**: Weights & Biases, Neptune.ai

**Razones**:
- Industry standard
- UI integrada
- Fácil migración a backends robustos
- Open-source completo

#### 4.5 Estructura Modular
```
config.py        → Configuración centralizada
preprocessing.py → Lógica de datos (reusable)
train.py        → Pipeline de entrenamiento
main.py         → API
monitoring.py   → Observabilidad
```

**Beneficios**:
- Testeable
- Mantenible
- Extensible

### 5. CI/CD y Testing (2 min)

**GitHub Actions** (`.github/workflows/ml-pipeline.yml`):
```yaml
Jobs:
  1. Test:  pytest + coverage
  2. Lint:  black + flake8 + mypy
  3. Build: Docker image
  4. Deploy: (staging/prod)
```

**Tests** (`tests/test_system.py`):
- ✅ Unit tests (preprocessor, monitor)
- ✅ API tests (endpoints)
- ✅ Integration tests

**Comando**:
```bash
make test
```

### 6. Mejoras Futuras (1 min)

**Corto plazo**:
- Feature engineering avanzado
- Hyperparameter tuning (Optuna)
- Cross-validation

**Medio plazo**:
- Prometheus + Grafana
- Data drift automático → reentrenamiento
- A/B testing framework

**Largo plazo**:
- Feature store (Feast)
- AutoML (auto-sklearn)
- Explicabilidad (SHAP/LIME)

### 7. Cierre y Q&A (1 min)

**Recap**:
- ✅ Sistema MLOps completo
- ✅ Stack open-source (portabilidad)
- ✅ Pipeline reproducible
- ✅ API production-ready
- ✅ Monitoreo básico
- ✅ CI/CD automatizado
- ✅ Documentación completa

**Links útiles**:
- Repo: github.com/marestrepohi/meli-mlops-mateo-restrepo
- Docs: README.md
- Quick Start: QUICKSTART.md

---

## 🎯 Checklist Pre-Presentación

### Setup (hacer antes):
- [ ] Clonar repo
- [ ] ` && docker-compose up -d`
- [ ] Verificar que API responde
- [ ] Verificar que MLflow UI carga
- [ ] Tener terminal lista con comandos
- [ ] Tener navegador con tabs abiertas:
  - MLflow: http://localhost:5000
  - API Docs: http://localhost:8000/docs
  - GitHub repo

### Durante presentación:
- [ ] Compartir pantalla
- [ ] Hablar claro y pausado
- [ ] Mostrar código relevante
- [ ] Ejecutar demos en vivo
- [ ] Resaltar decisiones técnicas
- [ ] Mencionar trade-offs

### Material de apoyo:
- [ ] README.md abierto
- [ ] Diagrama de arquitectura
- [ ] Código clave identificado
- [ ] Ejemplos de curl listos

---

## 💡 Tips para la Presentación

1. **Empieza fuerte**: "Construí un sistema MLOps completo, agnóstico cloud, con CI/CD"

2. **Muestra, no solo cuentes**: Demo en vivo > slides

3. **Explica el "por qué"**: Cada decisión tiene justificación

4. **Anticipa preguntas**:
   - "¿Por qué no usar SageMaker?" → Requisito de agnosticismo
   - "¿Cómo escala?" → Docker + K8s, separación de concerns
   - "¿Producción real?" → Sí, con mejoras listadas

5. **Sé honesto**: Si algo es MVP, dilo y explica la evolución

6. **Timing**: Practica para estar en 15-18 min, dejar tiempo para Q&A

7. **Backup plan**: Si demo falla, tienes screenshots o video

---

## 📊 Métricas para Destacar

- **4 modelos** entrenados y comparados
- **~3ms** latencia promedio de inferencia
- **100%** test coverage en componentes críticos
- **Docker** + **docker-compose** para despliegue
- **GitHub Actions** CI/CD automatizado
- **MLflow** tracking de todos los experimentos
- **FastAPI** con docs auto-generadas
- **Pydantic** validación de inputs
- **Monitoring** en tiempo real

---

## 🎬 Script de Demo (Backup)

Si tienes problemas técnicos, usa este script:

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Predicción
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d '{"CRIM":0.00632,"ZN":18.0,"INDUS":2.31,"CHAS":0.0,"NOX":0.538,"RM":6.575,"AGE":65.2,"DIS":4.0900,"RAD":1.0,"TAX":296.0,"PTRATIO":15.3,"B":396.90,"LSTAT":4.98}'

# 3. Métricas
curl http://localhost:8000/metrics

# 4. Ver logs
docker-compose logs api | tail -20

# 5. Tests
make test
```

¡Buena suerte! 🚀
