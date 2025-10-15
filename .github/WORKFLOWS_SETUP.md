# GitHub Actions Setup Guide

Este documento explica cómo configurar los GitHub Actions workflows para tu pipeline MLOps.

## 📋 Workflows Disponibles

### 1. **MLOps Pipeline** (`ml-pipeline.yml`)
Pipeline completo de entrenamiento y despliegue:
- ✅ Tests y validación de código
- 📦 Entrenamiento con DVC
- 🐳 Build de imagen Docker
- 🚀 Deploy de la API

**Triggers:**
- Push a `main` o `develop`
- Pull requests a `main`
- Manual (`workflow_dispatch`)

### 2. **API Tests** (`api-tests.yml`)
Tests específicos para la API:
- Unit tests
- Integration tests
- Docker container tests

**Triggers:**
- Cambios en `api/`, `tests/`, `requirements.txt`
- Manual

### 3. **Scheduled Retraining** (`scheduled-retrain.yml`)
Reentrenamiento automático periódico:
- Ejecuta DVC pipeline completo
- Valida performance del modelo
- Guarda artifacts del nuevo modelo

**Triggers:**
- Cada domingo a las 2 AM UTC
- Manual

## 🔐 Configuración de Secrets

Debes configurar los siguientes secrets en tu repositorio de GitHub:

### Paso 1: Ir a Settings → Secrets and Variables → Actions

### Paso 2: Agregar los siguientes secrets:

#### **KAGGLE_USERNAME** (Requerido)
Tu nombre de usuario de Kaggle para descargar el dataset.

```
Valor: tu_usuario_kaggle
```

#### **KAGGLE_KEY** (Requerido)
Tu API key de Kaggle.

```
Cómo obtenerla:
1. Ve a https://www.kaggle.com/settings
2. Sección "API" → Click "Create New Token"
3. Se descargará kaggle.json con tu key
```

#### **GITHUB_TOKEN** (Automático)
Este secret se crea automáticamente por GitHub Actions, no necesitas configurarlo.

### Opcional: Secrets para Deployment

Si vas a deployar a un servicio cloud, agrega estos secrets según tu proveedor:

#### **AWS (ECS/EKS)**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
```

#### **Google Cloud (Cloud Run/GKE)**
```
GCP_PROJECT_ID
GCP_SA_KEY
```

#### **Azure (AKS/Container Apps)**
```
AZURE_CREDENTIALS
AZURE_SUBSCRIPTION_ID
```

#### **Heroku**
```
HEROKU_API_KEY
HEROKU_APP_NAME
```

## 🚀 Uso de los Workflows

### Ejecutar Pipeline Completo
```bash
# Se ejecuta automáticamente en push a main
git push origin main

# O ejecutar manualmente desde GitHub:
Actions → MLOps Pipeline → Run workflow
```

### Ejecutar Solo Tests de API
```bash
# Se ejecuta automáticamente en cambios de API
git push origin feature/api-update

# O ejecutar manualmente:
Actions → API Tests → Run workflow
```

### Forzar Reentrenamiento
```bash
# Ejecutar manualmente:
Actions → Scheduled Model Retraining → Run workflow
```

## 📊 Artifacts Generados

Los workflows generan los siguientes artifacts que puedes descargar:

### `model-artifacts`
- `models/production/latest/` - Modelo listo para API
- `models/model_info.json` - Info del mejor modelo
- `mlruns/` - Experimentos MLflow

### `processed-data`
- `data/processed/` - Datos procesados para entrenamiento

### `coverage-report`
- `coverage.xml` - Reporte de cobertura de tests

## 🔄 Flujo de Trabajo Recomendado

### Para Desarrollo
1. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commit
3. Push y crear Pull Request
4. GitHub Actions ejecutará tests automáticamente
5. Revisar resultados antes de merge

### Para Production
1. Merge a `main`
2. GitHub Actions ejecutará:
   - Tests completos
   - Entrenamiento con DVC
   - Build de Docker image
   - Deploy de API
3. Revisar summary en GitHub Actions

### Para Reentrenamiento
- Automático: Cada domingo a las 2 AM UTC
- Manual: Cuando sea necesario desde GitHub Actions UI

## 📝 Configuración Adicional

### Modificar Schedule de Reentrenamiento

Edita `.github/workflows/scheduled-retrain.yml`:

```yaml
on:
  schedule:
    # Cron syntax: minuto hora día mes día_semana
    - cron: '0 2 * * 0'  # Domingo 2 AM
    # Ejemplos:
    # - cron: '0 0 * * *'  # Diario a medianoche
    # - cron: '0 0 * * 1'  # Lunes a medianoche
    # - cron: '0 12 1 * *' # Primer día del mes al mediodía
```

### Habilitar Notificaciones

Para recibir notificaciones en Slack cuando falle el reentrenamiento:

1. Crear webhook en Slack
2. Agregar secret `SLACK_WEBHOOK_URL`
3. Descomentar la sección de notificaciones en `scheduled-retrain.yml`

## 🐛 Troubleshooting

### Error: "Kaggle credentials not found"
- Verificar que `KAGGLE_USERNAME` y `KAGGLE_KEY` estén configurados correctamente
- Los secrets distinguen mayúsculas/minúsculas

### Error: "Docker build failed"
- Verificar que `requirements.txt` esté actualizado
- Revisar logs del build en GitHub Actions

### Error: "Model artifacts not found"
- El entrenamiento debe completarse exitosamente primero
- Verificar que DVC pipeline no tenga errores

### API no pasa smoke tests
- Verificar que `models/production/latest/` contenga todos los archivos
- Revisar logs de la API en el job de deploy

## 📚 Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DVC Documentation](https://dvc.org/doc)
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en GitHub Actions
2. Verifica la configuración de secrets
3. Consulta este README
4. Abre un issue en el repositorio
