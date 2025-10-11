# 🏗️ Guía de Construcción del Workspace

Esta guía explica cómo construir y ejecutar todo el proyecto desde cero.

## 📋 Pre-requisitos

### Requerimientos de Sistema
- **OS**: Linux, macOS, o Windows con WSL2
- **Python**: 3.10 o superior
- **Docker**: 20.10+ (opcional pero recomendado)
- **Docker Compose**: 2.0+ (opcional pero recomendado)
- **Git**: Para control de versiones
- **Make**: Para comandos simplificados (opcional)

### Verificar instalaciones
```bash
python3 --version  # Debe ser 3.10+
docker --version   # Si usas Docker
docker-compose --version
git --version
make --version     # Opcional
```

## 🚀 Construcción del Proyecto

### Método 1: Docker (⭐ Recomendado)

Este es el método más rápido y portable.

```bash
# 1. Clonar el repositorio
git clone https://github.com/marestrepohi/meli-mlops-mateo-restrepo.git
cd meli-mlops-mateo-restrepo/server

# 2. Construir y levantar servicios
docker-compose up --build

# Esto iniciará:
# - MLflow tracking server en http://localhost:5000
# - API de predicción en http://localhost:8000

# 3. En otra terminal, verificar que todo funciona
curl http://localhost:8000/health
```

**Nota**: La primera construcción toma ~5-10 minutos. Las siguientes son instantáneas.

### Método 2: Instalación Local

Para desarrollo local con hot-reload.

```bash
# 1. Navegar al directorio del servidor


# 2. Ejecutar script de setup
chmod +x setup.sh train.sh run_api.sh
./setup.sh

# Este script:
# - Crea un entorno virtual (venv)
# - Instala todas las dependencias
# - Crea directorios necesarios
# - Copia archivo .env

# 3. Activar entorno virtual
source venv/bin/activate

# 4. Descargar dataset
python src/download_data.py

# 5. Iniciar MLflow tracking server (en una terminal)
mlflow server \
    --host 0.0.0.0 \
    --port 5000 \
    --backend-store-uri file://$(pwd)/mlruns \
    --default-artifact-root file://$(pwd)/mlartifacts

# 6. En otra terminal, entrenar modelo
source venv/bin/activate
./train.sh

# O directamente:
python src/train.py

# 7. Iniciar API (en otra terminal)
source venv/bin/activate
./run_api.sh

# O directamente:
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Método 3: Con Makefile

Si tienes `make` instalado, usa los comandos simplificados.

```bash


# Ver todos los comandos disponibles
make help

# Setup completo
make setup

# Activar entorno
source venv/bin/activate

# Pipeline completo (descarga + entrenamiento)
make pipeline

# Iniciar MLflow en background
make run-mlflow &

# Iniciar API
make run-api
```

## 🧪 Verificación de la Construcción

### 1. Verificar MLflow
```bash
# Abrir en navegador
open http://localhost:5000

# O con curl
curl http://localhost:5000/health
```

**Debe mostrar**: UI de MLflow con experimentos

### 2. Verificar API
```bash
# Health check
curl http://localhost:8000/health

# Debe retornar:
# {
#   "status": "healthy",
#   "model_loaded": true,
#   "uptime_hours": 0.0,
#   "total_predictions": 0,
#   "warnings": []
# }

# Documentación
open http://localhost:8000/docs
```

### 3. Hacer una predicción de prueba
```bash
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

# Debe retornar:
# {
#   "prediction": 30.12,
#   "model_version": "1.0.0",
#   "inference_time": 0.0023
# }
```

### 4. Ejecutar tests
```bash
# Con make
make test

# O directamente
pytest tests/ -v --cov=src

# Debe pasar todos los tests
```

## 📂 Estructura de Directorios Creada

Después de la construcción, tendrás:

```
server/
├── venv/                    # Virtual environment
├── data/
│   ├── boston_housing.csv   # Dataset descargado
│   ├── dataset_info.txt     # Info del dataset
│   └── raw/
│       └── boston_housing_raw.csv
├── models/
│   └── production/
│       ├── model.joblib         # Modelo entrenado
│       ├── preprocessor.joblib  # Preprocessor
│       ├── metrics.json         # Métricas
│       └── model_info.txt       # Info del modelo
├── mlruns/                  # MLflow tracking data
├── mlartifacts/            # MLflow artifacts
└── logs/                   # Prediction logs
```

## 🐛 Troubleshooting

### Error: "No module named 'src'"
```bash
# Solución: Instalar el paquete

pip install -e .
```

### Error: "Model not loaded"
```bash
# Solución: Entrenar el modelo primero

source venv/bin/activate
python src/train.py
```

### Error: "Port 8000 already in use"
```bash
# Solución: Matar proceso existente
lsof -ti:8000 | xargs kill -9

# O usar otro puerto
uvicorn src.main:app --port 8001
```

### Error: "MLflow connection failed"
```bash
# Solución: Verificar que MLflow esté corriendo
pgrep -f "mlflow server"

# Si no está corriendo, iniciarlo
mlflow server --host 0.0.0.0 --port 5000
```

### Error: Docker build falla
```bash
# Solución: Limpiar caché de Docker
docker system prune -a -f
docker-compose build --no-cache
```

### Error: "kagglehub download failed"
```bash
# Solución: El dataset se descarga automáticamente
# Si falla, verificar conexión a internet
# O descargar manualmente desde:
# https://www.kaggle.com/datasets/altavish/boston-housing-dataset
```

## 🔄 Reconstruir Después de Cambios

### Si modificas código de entrenamiento
```bash
# Reentrenar modelo
make train
# O: python src/train.py

# Recargar modelo en API (sin reiniciar)
curl -X POST http://localhost:8000/admin/reload
```

### Si modificas código de API
```bash
# Si usaste --reload, se recarga automáticamente
# Si no, reiniciar:
# Ctrl+C para detener
# Luego: make run-api
```

### Si modificas dependencias
```bash
# Reinstalar
pip install -r requirements.txt

# Con Docker
docker-compose build --no-cache
docker-compose up
```

## 🧹 Limpiar el Workspace

### Limpieza ligera (cachés Python)
```bash
make clean
```

### Limpieza profunda (incluye modelos y datos)
```bash
make clean-all
```

### Limpiar Docker
```bash
docker-compose down -v
docker system prune -a -f
```

## 📊 Comandos Útiles Post-Construcción

### Monitoreo
```bash
# Ver métricas del sistema
make test-api-metrics

# Ver logs de la API
tail -f logs/*.log

# Con Docker
docker-compose logs -f api
```

### Testing
```bash
# Ejecutar todos los tests
make test

# Tests con coverage
make test-verbose

# Solo linting
make lint

# Formatear código
make format
```

### Experimentación
```bash
# Reentrenar con diferentes parámetros
# Editar src/config.py o src/train.py
vim src/train.py
make train

# Comparar en MLflow
open http://localhost:5000
```

## 🎯 Checklist de Construcción Exitosa

- [ ] Python 3.10+ instalado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (venv o Docker)
- [ ] Dataset descargado en `data/boston_housing.csv`
- [ ] Modelo entrenado en `models/production/`
- [ ] MLflow UI accesible en http://localhost:5000
- [ ] API respondiendo en http://localhost:8000
- [ ] `/health` retorna status healthy
- [ ] `/predict` hace predicciones correctas
- [ ] Tests pasan con `make test`
- [ ] Documentación accesible en http://localhost:8000/docs

## 📚 Recursos Adicionales

- **README principal**: `../README.md`
- **Quick Start**: `QUICKSTART.md`
- **Presentación**: `../PRESENTATION.md`
- **Summary**: `../PROJECT_SUMMARY.md`

## 🆘 Obtener Ayuda

Si tienes problemas:

1. **Revisa logs**:
   ```bash
   # Docker
   docker-compose logs api
   
   # Local
   tail -f logs/*.log
   ```

2. **Verifica servicios**:
   ```bash
   # Docker
   docker-compose ps
   
   # Local
   pgrep -f "mlflow\|uvicorn"
   ```

3. **Limpia y reconstruye**:
   ```bash
   make clean-all
   make setup
   make pipeline
   ```

4. **Revisa issues** en el repositorio de GitHub

---

**¡Listo para construir! 🚀**

Si todo funciona correctamente, deberías poder:
- Ver experimentos en MLflow
- Hacer predicciones vía API
- Ejecutar tests exitosamente
- Ver métricas de monitoreo

**Siguiente paso**: Revisar `QUICKSTART.md` para uso básico o `PRESENTATION.md` para la demo.
