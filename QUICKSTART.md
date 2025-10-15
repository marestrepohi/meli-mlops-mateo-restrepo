# 🚀 Quick Start Guide

Guía rápida para empezar a usar el pipeline MLOps.

## 📦 Setup Inicial

### Opción 1: Script Automático (Recomendado)
```bash
./setup.sh
source venv/bin/activate
```

### Opción 2: Usando Make
```bash
make setup
source venv/bin/activate
```

### Opción 3: Manual
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

## 🔑 Configurar Credenciales

1. Edita el archivo `.env`:
```bash
nano .env
```

2. Agrega tus credenciales de Kaggle:
```env
KAGGLE_USERNAME=tu_usuario
KAGGLE_KEY=tu_api_key
```

## 🎯 Ejecutar Pipeline Completo

```bash
# Opción 1: Con Make
make train

# Opción 2: Con DVC directamente
dvc repro

# Opción 3: Forzar todos los stages
make train-force
```

## 🚀 Iniciar API

```bash
# Desarrollo (con reload)
make api

# Producción (4 workers)
make api-prod

# Docker
make docker-up
```

La API estará disponible en:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **MLflow**: http://localhost:5000

## 🧪 Probar API

```bash
# Health check
curl http://localhost:8000/health

# Predicción simple
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "CRIM": 0.00632,
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

# Smoke test completo
make smoke-test
```

## 🐳 Docker

```bash
# Iniciar servicios
make docker-up

# Ver logs
make docker-logs

# Detener servicios
make docker-down

# Reiniciar
make docker-restart
```

## 🔄 GitHub Actions

### 1. Configurar Secrets

Ve a: `Settings → Secrets and variables → Actions`

Agrega:
- `KAGGLE_USERNAME`
- `KAGGLE_KEY`

### 2. Push para activar CI/CD

```bash
git add .
git commit -m "feat: setup MLOps pipeline"
git push origin main
```

### 3. Monitorear

Ve a la pestaña `Actions` en GitHub para ver el progreso.

## 📊 Comandos Útiles

```bash
# Ver todos los comandos disponibles
make help

# Ejecutar tests
make test

# Linting
make lint

# Formatear código
make format

# Ver estado de DVC
make dvc-status

# Ver DAG de DVC
make dvc-dag

# Estadísticas del proyecto
make stats

# Limpiar archivos temporales
make clean
```

## 📁 Estructura de Archivos

```
├── api/                    # Código de la API
├── src/                    # Código fuente del pipeline
├── data/
│   ├── raw/               # Datos crudos
│   ├── processed/         # Datos procesados
│   └── predictions/       # Predicciones guardadas
├── models/
│   └── production/
│       └── latest/        # Modelo en producción
├── mlruns/                # Experimentos MLflow
├── tests/                 # Tests
├── .github/
│   └── workflows/         # GitHub Actions
├── dvc.yaml              # Pipeline DVC
├── params.yaml           # Parámetros del proyecto
├── Makefile             # Comandos útiles
└── docker-compose.yml   # Configuración Docker
```

## 🔍 Troubleshooting

### Error: "Kaggle credentials not found"
```bash
# Verificar .env
cat .env

# O configurar manualmente
export KAGGLE_USERNAME=tu_usuario
export KAGGLE_KEY=tu_key
```

### Error: "Model not found"
```bash
# Entrenar el modelo primero
make train

# O verificar que existan los archivos
ls -la models/production/latest/
```

### API no responde
```bash
# Verificar que el modelo esté disponible
make validate-api

# Ver logs
docker-compose logs api
```

## 📚 Documentación Adicional

- **GitHub Actions**: `.github/WORKFLOWS_SETUP.md`
- **API Docs**: http://localhost:8000/docs (cuando API está corriendo)
- **MLflow UI**: http://localhost:5000 (cuando MLflow está corriendo)

## 🎓 Workflows Comunes

### Desarrollo de una nueva feature
```bash
# 1. Crear branch
git checkout -b feature/mi-feature

# 2. Hacer cambios
# ... editar código ...

# 3. Tests locales
make test
make lint

# 4. Push
git push origin feature/mi-feature

# 5. Crear PR en GitHub
# Los tests se ejecutarán automáticamente
```

### Actualizar modelo
```bash
# 1. Modificar parámetros
nano params.yaml

# 2. Reentrenar
make train-force

# 3. Validar
make smoke-test

# 4. Deploy
git add params.yaml models/
git commit -m "feat: update model parameters"
git push origin main
```

### Deploy a producción
```bash
# 1. Build y test local
make docker-build
make docker-up
make smoke-test

# 2. Push a main
git push origin main

# 3. GitHub Actions se encarga del resto
# - Tests
# - Build
# - Push a registry
# - Deploy
```

## ✅ Checklist de Setup

- [ ] Clonar repositorio
- [ ] Ejecutar `./setup.sh`
- [ ] Configurar `.env` con credenciales
- [ ] Ejecutar `make train`
- [ ] Iniciar API con `make api`
- [ ] Probar con `make smoke-test`
- [ ] Configurar secrets en GitHub
- [ ] Hacer push y verificar Actions

## 🆘 Ayuda

Si encuentras problemas:
1. Revisa esta guía
2. Consulta `make help`
3. Revisa logs: `docker-compose logs`
4. Lee `.github/WORKFLOWS_SETUP.md`
5. Abre un issue en GitHub

---

🎉 ¡Listo! Ya tienes tu pipeline MLOps funcionando.
