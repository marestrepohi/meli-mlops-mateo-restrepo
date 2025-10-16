# 🚀 Flujo Completo Actualizado - 4 Servicios en Cascada

## ✅ Nueva Arquitectura con 4 Servicios Independientes

```
┌─────────────────────────────────────────────────────────────────┐
│                        make start                                │
│         (docker-compose build + up -d en cascada)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         │
    ┌───────────────────┐            │
    │  1. DVC Pipeline  │            │
    │  (dvc-pipeline)   │            │
    └───────┬───────────┘            │
            │                         │
            │ • dvc init --no-scm     │
            │ • dvc repro             │
            │   - data_ingestion      │
            │   - data_preparation    │
            │   - model_train         │
            │                         │
            │ Genera:                 │
            │ - data/processed/       │
            │ - models/production/    │
            │ - mlruns/               │
            │                         │
            │ ✅ COMPLETA → EXIT      │
            │   (service_completed)   │
            │                         │
            └────────┬────────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │   2. MLflow UI     │
            │   (mlflow)         │
            │   Port: 5000       │
            └────────┬───────────┘
                     │
                     │ Espera: dvc-pipeline completed ✅
                     │ Verifica: mlruns/ existe
                     │ mlflow ui --host 0.0.0.0 --port 5000
                     │ --backend-store-uri file:///app/mlruns
                     │
                     │ ✅ HEALTHY
                     │
                     └────────┬────────────────
                              │
                              ▼
                     ┌────────────────────┐
                     │   3. FastAPI       │
                     │   (api)            │
                     │   Port: 8000       │
                     └────────┬───────────┘
                              │
                              │ Espera: mlflow healthy ✅
                              │ uvicorn api.main:app --reload
                              │ --host 0.0.0.0 --port 8000
                              │
                              │ ✅ HEALTHY
                              │
                              └────────┬────────────────
                                       │
                                       ▼
                              ┌────────────────────┐
                              │   4. Frontend      │
                              │   (frontend)       │
                              │   Port: 8080       │
                              └────────────────────┘
                                       │
                                       │ Espera: api healthy ✅
                                       │ npm install
                                       │ npm run dev --port 8080
                                       │
                                       │ Consume:
                                       │ - API: localhost:8000
                                       │ - MLflow: localhost:5000
                                       │
                                       │ Folders (volumes):
                                       │ - data/ → public/data/
                                       │ - mlruns/ → public/mlruns/
                                       │ - models/ → public/models/
                                       │
                                       ✅ HEALTHY
```

---

## 📋 Dependencias entre Servicios

| Servicio | Depende de | Condición | Acción |
|----------|-----------|-----------|--------|
| `dvc-pipeline` | - | - | Ejecuta pipeline y termina |
| `mlflow` | `dvc-pipeline` | `service_completed_successfully` | Inicia solo si DVC completó exitosamente |
| `api` | `mlflow` | `service_healthy` | Inicia solo si MLflow está healthy |
| `frontend` | `api` | `service_healthy` | Inicia solo si API está healthy |

---

## 🎯 Orden de Ejecución (Automático)

### Paso 1: DVC Pipeline Container
```bash
# Container: mlops-housing-dvc-pipeline
# Restart: no (se ejecuta UNA vez y termina)

1. dvc init --no-scm --force
2. dvc repro
   ├─ data_ingestion (descarga Kaggle + EDA)
   ├─ data_preparation (limpieza + split + scaler)
   └─ model_train (3 experimentos XGBoost + MLflow)
3. ✅ Completa y sale (exit code 0)
4. tail -f /dev/null (mantiene contenedor vivo para logs)

Outputs generados:
- data/processed/*.csv
- models/production/latest/{model.pkl, scaler.pkl, metadata.json}
- models/model_info.json
- mlruns/[experiment_id]/
```

### Paso 2: MLflow UI Container
```bash
# Container: mlops-housing-mlflow
# Port: 5000
# Depends: dvc-pipeline (completed_successfully)

1. Espera a que mlruns/ exista y tenga contenido
2. mlflow ui --host 0.0.0.0 --port 5000 --backend-store-uri file:///app/mlruns
3. Health check: curl http://localhost:5000
4. ✅ Marca como healthy cuando responde

UI disponible: http://localhost:5000
```

### Paso 3: FastAPI Container
```bash
# Container: mlops-housing-api
# Port: 8000
# Depends: mlflow (healthy)

1. Espera 10s para que MLflow esté estable
2. uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
3. Carga modelo de: models/production/latest/model.pkl
4. Health check: curl http://localhost:8000/health
5. ✅ Marca como healthy cuando /health responde

API disponible: http://localhost:8000
Swagger: http://localhost:8000/docs
```

### Paso 4: Frontend Container
```bash
# Container: mlops-housing-frontend
# Port: 8080
# Depends: api (healthy)

1. Espera 10s para que API esté estable
2. npm install
3. npm run dev -- --host 0.0.0.0 --port 8080
4. Health check: wget http://localhost:8080
5. ✅ Marca como healthy cuando responde

Frontend disponible: http://localhost:8080

Variables de entorno:
- VITE_API_URL=http://localhost:8000
- VITE_MLFLOW_URL=http://localhost:5000

Volumes montados (read-only):
- data/ → /app/public/data/
- mlruns/ → /app/public/mlruns/
- models/ → /app/public/models/
```

---

## 🔍 Comandos de Monitoreo

### Estado de Servicios
```bash
make ps
```
Resultado esperado:
```
NAME                        STATUS                      PORTS
mlops-housing-dvc-pipeline  Exited (0)                  -
mlops-housing-mlflow        Up (healthy)                0.0.0.0:5000->5000/tcp
mlops-housing-api           Up (healthy)                0.0.0.0:8000->8000/tcp
mlops-housing-frontend      Up (healthy)                0.0.0.0:8080->8080/tcp
```

### Logs Individuales
```bash
make logs-dvc       # Ver ejecución del pipeline DVC
make logs-mlflow    # Ver logs de MLflow UI
make logs-api       # Ver logs de FastAPI
make logs-frontend  # Ver logs de Vite dev server
make logs           # Ver todos los logs
```

### Health Checks
```bash
make test
```
Resultado esperado:
```
🧪 Testing services...
  ✅ FastAPI is running
  ✅ MLflow is running
  ✅ Frontend is running
```

---

## 🛠️ Solución de Problemas

### DVC Pipeline no completa
```bash
# Ver logs
make logs-dvc

# Errores comunes:
# - Credenciales Kaggle faltantes (ya configuradas en docker-compose)
# - Falta data/raw/HousingData.csv (se copia en Dockerfile)
```

### MLflow no inicia
```bash
# Verificar que DVC completó
docker-compose ps dvc-pipeline  # Debe mostrar "Exited (0)"

# Verificar que mlruns existe
ls -la mlruns/

# Ver logs
make logs-mlflow
```

### API no inicia
```bash
# Verificar que MLflow está healthy
docker-compose ps mlflow  # Debe mostrar "Up (healthy)"

# Verificar modelo existe
ls -la models/production/latest/

# Ver logs
make logs-api
```

### Frontend no inicia
```bash
# Verificar que API está healthy
docker-compose ps api  # Debe mostrar "Up (healthy)"

# Ver logs
make logs-frontend
```

---

## 📊 Dockerfile - Qué se Copia

```dockerfile
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y git curl build-essential

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar SOLO archivos necesarios (NO .dvc/, NO data completa)
COPY dvc.yaml params.yaml ./
COPY src/ ./src/
COPY api/ ./api/
COPY data/raw/ ./data/raw/  # ✅ Dataset original

# Crear directorios que se llenarán con volumes
RUN mkdir -p data/processed data/predictions models mlruns
```

**NO se copia:**
- `.dvc/` (se inicializa con `dvc init --no-scm` en runtime)
- `data/processed/` (generado por DVC pipeline)
- `models/` (generado por DVC pipeline)
- `mlruns/` (generado por DVC pipeline)
- `front/` (usa imagen node:20-alpine directa)

---

## 🎬 Inicio Completo desde Cero

```bash
# 1. Detener todo
make down

# 2. Limpiar volumes (opcional)
make clean

# 3. Iniciar pipeline completo
make start

# 4. Monitorear progreso
make logs-dvc      # Ver DVC ejecutándose (5-10 min)

# 5. Una vez DVC completa, verificar servicios
make ps            # Ver estado
make test          # Health checks

# 6. Acceder a los servicios
# - MLflow UI: http://localhost:5000
# - API Swagger: http://localhost:8000/docs
# - Frontend: http://localhost:8080
```

---

## ⏱️ Tiempos Estimados

| Fase | Tiempo | Progreso |
|------|--------|----------|
| Build imágenes | ~2 min | make build |
| DVC Pipeline | ~5-10 min | logs-dvc |
| MLflow UI | ~10s | logs-mlflow |
| FastAPI | ~5s | logs-api |
| Frontend (npm install + vite) | ~30s | logs-frontend |
| **TOTAL** | **~8-13 min** | make start |

---

## ✅ Checklist Final

- [ ] DVC pipeline completó sin errores (`Exited (0)`)
- [ ] MLflow UI muestra experimentos en http://localhost:5000
- [ ] API responde en http://localhost:8000/health
- [ ] API Swagger funciona en http://localhost:8000/docs
- [ ] Frontend carga en http://localhost:8080
- [ ] Frontend puede hacer requests a API
- [ ] Frontend puede mostrar MLflow UI embebido
- [ ] Carpetas sincronizadas: data/, mlruns/, models/ visibles en frontend

---

## 🔗 URLs de Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| MLflow UI | http://localhost:5000 | Experimentos y métricas |
| FastAPI Health | http://localhost:8000/health | Health check |
| FastAPI Swagger | http://localhost:8000/docs | Documentación interactiva |
| FastAPI Predict | http://localhost:8000/predict | Endpoint de predicción |
| Frontend | http://localhost:8080 | UI principal del proyecto |

---

## 🎓 Resumen de Cambios vs Versión Anterior

### ❌ Antes (3 servicios):
```
backend: DVC + MLflow + API (todo en uno)
mlflow: Redundante
frontend: OK
```
**Problema:** Backend hacía TODO y nunca terminaba de ejecutar DVC limpiamente

### ✅ Ahora (4 servicios):
```
dvc-pipeline: SOLO ejecuta DVC y termina
mlflow: SOLO UI de MLflow
api: SOLO FastAPI
frontend: SOLO Vite
```
**Ventaja:** Cada servicio una responsabilidad, cascada ordenada con health checks
