# 🚀 Quick Start Guide

Esta guía te ayudará a tener el proyecto corriendo en menos de 5 minutos.

## 📋 Pre-requisitos

- Python 3.10+
- Docker y Docker Compose (para opción Docker)
- Git

## Opción 1: Docker (⚡ MÁS RÁPIDO)

```bash
# 1. Navegar al directorio del servidor


# 2. Levantar servicios
docker-compose up --build

# 3. ¡Listo! 
# - API: http://localhost:8000/docs
# - MLflow: http://localhost:5000
```

**Nota**: La primera vez construirá las imágenes (~5 min). Siguientes ejecuciones son instantáneas.

## Opción 2: Local Development

```bash
# 1. Navegar al directorio del servidor


# 2. Setup inicial (crear venv, instalar deps)
chmod +x setup.sh train.sh run_api.sh
./setup.sh

# 3. Activar entorno virtual
source venv/bin/activate

# 4. Descargar datos
python src/download_data.py

# 5. Entrenar modelo
./train.sh
# O usar make: make train

# 6. Iniciar API
./run_api.sh
# O usar make: make run-api
```

## Opción 3: Con Makefile (Recomendado)

```bash


# Ver todos los comandos disponibles
make help

# Setup completo
make setup

# Pipeline completo (descarga + entrenamiento)
make pipeline

# Iniciar API
make run-api

# O con Docker
make docker-up-build
```

## 🧪 Probar la API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Predicción
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
  }'
```

### 3. Ver Documentación Interactiva
Abre en tu navegador: http://localhost:8000/docs

## 📊 Ver Experimentos en MLflow

Abre en tu navegador: http://localhost:5000

Aquí podrás ver:
- Todos los modelos entrenados
- Métricas comparativas
- Parámetros utilizados
- Artefactos (modelos guardados)

## 🔄 Workflow Típico

```bash
# 1. Modificar código/parámetros
vim src/train.py

# 2. Reentrenar
make train

# 3. Recargar modelo en API (sin reiniciar)
curl -X POST http://localhost:8000/admin/reload

# 4. Probar nueva predicción
make test-api-predict
```

## 🐛 Troubleshooting

### Error: "Model not loaded"
**Solución**: Entrenar el modelo primero con `make train` o `./train.sh`

### Error: "Port 8000 already in use"
**Solución**: Detener proceso existente:
```bash
lsof -ti:8000 | xargs kill -9
```

### Error: Docker build falla
**Solución**: Limpiar y reintentar:
```bash
docker-compose down
docker system prune -f
docker-compose up --build
```

### MLflow no abre
**Solución**: Verificar que esté corriendo:
```bash
# Local
pgrep -f "mlflow server"

# Docker
docker-compose ps
```

## 📚 Siguientes Pasos

1. **Leer el README completo**: `../README.md`
2. **Explorar el código**: Empieza por `src/main.py`
3. **Ejecutar tests**: `make test`
4. **Modificar hiperparámetros**: Ver `src/config.py`
5. **Agregar features**: Modificar `src/preprocessing.py`

## 🎯 Comandos Útiles con Make

```bash
make help              # Ver todos los comandos
make pipeline          # Descarga datos + entrena modelo
make test              # Ejecutar tests
make lint              # Verificar código
make format            # Formatear código
make docker-up-build   # Docker: build + up
make docker-logs       # Ver logs de Docker
make clean             # Limpiar archivos temporales
```

## 💡 Tips

1. **Desarrollo rápido**: Usa `make run-api-dev` para auto-reload al cambiar código
2. **Debug**: Agrega prints o usa debugger de VS Code
3. **Performance**: Mide con `make test-api-predict` y revisa `/metrics`
4. **Experimentos**: Cada `make train` crea una nueva run en MLflow

---

**¿Problemas?** Abre un issue en el repositorio o contacta al autor.
