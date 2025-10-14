# Frontend Integration Summary

## 🎯 Implementación Completada

Se ha integrado completamente un frontend interactivo con **6 páginas principales** que muestran todos los pasos del pipeline MLOps:

### 📄 Páginas Implementadas

#### 1. **Dashboard** (`/`)
- Página principal con overview del sistema
- Acceso rápido a todas las funcionalidades

#### 2. **EDA Explorer** (`/eda`)
- **Dataset Info**: Filas, columnas, tipos de datos, memoria
- **Estadísticas Descriptivas**: Tabla completa con mean, std, quartiles
- **Distribuciones**: Histogramas interactivos por feature
- **Correlación**: Matriz de correlación con heatmap
- **Feature Importance**: Gráfico de barras con importancias del modelo

#### 3. **Data Lineage** (`/lineage`)
- **Timeline de Versiones**: Lista cronológica de todos los datasets
- **Comparación**: Selector de 2 versiones para comparar
- **Cambios Detectados**:
  - Diferencias en filas/columnas
  - Features añadidas/removidas
  - Cambios estadísticos (mean, std, min, max)

#### 4. **MLflow Viewer** (`/mlflow`)
- **Selector de Experimentos**: Dropdown con todos los experimentos
- **Lista de Runs**: Ordenados por fecha con métricas
- **Gráfico de Tendencias**: Visualización de RMSE, MAE, R² a través de runs
- **Detalles de Run**: Métricas, parámetros, tags completos

#### 5. **Drift Monitor** (`/drift`)
- **Detección de Drift**: Botón para ejecutar test KS
- **Resultados por Feature**: P-values y drift detectado
- **Clasificación de Severidad**: Low, Medium, High
- **Gráfico de P-values**: Visualización de todos los features
- **Historial de Alertas**: Últimos 30 días
- **Recomendaciones**: Sugerencias de reentrenamiento

#### 6. **Data Generator** (`/generator`)
- **Configuración**:
  - Slider de samples (50-1000)
  - Slider de drift factor (0.0-2.0)
  - Selección de features específicas
- **Preview**: Estadísticas del dataset generado
- **Visualización**: Gráficos de mean y std
- **Guardar**: Funcionalidad para salvar datasets

## 🔌 Backend API Implementado

Se creó el módulo **`src/analytics.py`** con 18 endpoints:

### EDA Endpoints (5)
```
GET /api/v1/eda/dataset-info
GET /api/v1/eda/statistics?feature={optional}
GET /api/v1/eda/distribution?feature=X&bins=30
GET /api/v1/eda/correlation
GET /api/v1/eda/feature-importance
```

### Lineage Endpoints (2)
```
GET /api/v1/lineage/versions
GET /api/v1/lineage/changes?version1=X&version2=Y
```

### MLflow Endpoints (3)
```
GET /api/v1/mlflow/experiments
GET /api/v1/mlflow/runs?experiment_name=X&limit=10
GET /api/v1/mlflow/run/{run_id}
```

### Drift Endpoints (2)
```
POST /api/v1/drift/detect
GET /api/v1/drift/alerts?days=7
```

### Synthetic Data Endpoints (2)
```
POST /api/v1/synthetic/generate?n_samples=100&drift_factor=0.5&drift_features=X,Y
POST /api/v1/synthetic/save?name=dataset_name
```

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

**Backend:**
- `src/analytics.py` - Módulo completo de analytics con 18 endpoints

**Frontend:**
- `front/src/lib/api.ts` - Cliente API centralizado con todos los endpoints
- `front/src/pages/EDAExplorer.tsx` - Página de análisis exploratorio
- `front/src/pages/DataLineage.tsx` - Página de linaje de datos
- `front/src/pages/MLflowViewer.tsx` - Página de visualización MLflow
- `front/src/pages/DriftMonitor.tsx` - Página de monitoreo de drift
- `front/src/pages/DataGenerator.tsx` - Página de generación de datos
- `front/.env` - Variables de entorno (VITE_API_URL)

**Scripts:**
- `start.sh` - Script para iniciar backend + frontend automáticamente
- `stop.sh` - Script para detener todos los servicios

**Documentación:**
- `FRONTEND_GUIDE.md` - Guía completa del frontend con ejemplos

### Archivos Modificados

**Frontend:**
- `front/src/App.tsx` - Agregadas rutas para las 6 páginas
- `front/src/components/Navbar.tsx` - Navegación con enlaces a todas las páginas
- `front/package.json` - Agregada dependencia `axios`

**Backend:**
- `src/main.py` - Incluido router de analytics
- `requirements.txt` - Agregados scipy, matplotlib, seaborn

**Documentación:**
- `README.md` - Actualizado con info del frontend y nuevo quickstart

## 🛠 Tecnologías Utilizadas

### Frontend Stack
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Recharts** - Gráficos interactivos
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilos

### Backend Additions
- **scipy** - Tests estadísticos (KS test)
- **matplotlib** - Generación de plots
- **seaborn** - Visualizaciones mejoradas

## 🚀 Cómo Usar

### Inicio Rápido
```bash
# Opción 1: Script automático
./start.sh

# Opción 2: Manual
# Terminal 1 - Backend
python src/main.py

# Terminal 2 - Frontend
cd front
npm install
npm run dev
```

### Acceso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Navegación
1. **Dashboard** - Overview general
2. **EDA Explorer** - Analizar datos y features
3. **Data Lineage** - Ver versiones y cambios
4. **MLflow Viewer** - Revisar experimentos y runs
5. **Drift Monitor** - Detectar drift y ver alertas
6. **Data Generator** - Crear datos sintéticos para pruebas

## 📊 Funcionalidades Destacadas

### Detección de Drift
- Test estadístico: **Kolmogorov-Smirnov**
- Threshold: p-value < 0.05
- Clasificación automática de severidad
- Alertas persistentes
- Recomendaciones de reentrenamiento

### Generación de Datos Sintéticos
- Basado en distribución original del dataset
- Drift configurable por feature
- Factor de drift ajustable (0.0 - 2.0)
- Guardado automático con metadata
- Útil para:
  - Testing de drift detection
  - Simulaciones de reentrenamiento
  - Validación de modelo bajo diferentes condiciones

### Visualizaciones Interactivas
- **Histogramas**: Con bins configurables
- **Heatmaps**: Matriz de correlación
- **Bar Charts**: Feature importance, statistics
- **Line Charts**: Trends de métricas MLflow
- **Tables**: Comparación de versiones, runs, estadísticas

### Data Lineage
- **Versionado automático**: Cada entrenamiento crea nueva versión
- **Metadata completa**: Timestamp, shape, file path
- **Comparación detallada**: Statistical diffs feature por feature
- **Tracking de cambios**: Added/removed features

## 🔄 Flujo de Trabajo Típico

1. **Entrenar modelo inicial**
   ```bash
   python src/train.py
   ```

2. **Iniciar sistema**
   ```bash
   ./start.sh
   ```

3. **Explorar en frontend**:
   - Ver EDA del dataset
   - Revisar linaje de versiones
   - Analizar runs en MLflow
   - Ejecutar drift detection
   - Generar datos sintéticos

4. **Monitorear y actuar**:
   - Si hay drift alto → Reentrenar
   - Comparar nuevos vs viejos runs
   - Validar mejoras con métricas

## 📈 Métricas y KPIs Visualizados

### En EDA
- Dataset shape (rows × columns)
- Memory usage
- Estadísticas descriptivas (8 métricas por feature)
- Correlaciones (matriz completa)
- Feature importances

### En MLflow
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- R² Score
- MSE (Mean Squared Error)
- Trends a través de runs

### En Drift Monitor
- P-values por feature (KS test)
- Features con drift detectado
- Severidad por feature
- Count de alertas

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Loading States**: Spinners durante carga
- **Error Handling**: Alertas claras de errores
- **Active Navigation**: Highlighting de ruta activa
- **Interactive Charts**: Hover tooltips, zoom
- **Color Coding**: Severidad, status, métricas
- **Search & Filter**: En tablas y listas
- **Real-time Updates**: Refresh de datos

## 🔐 Configuración

### Environment Variables
```env
# front/.env
VITE_API_URL=http://localhost:8000
```

### CORS
Ya configurado en backend (`src/main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Próximos Pasos Sugeridos

1. **Autenticación**: Agregar login/usuarios
2. **WebSockets**: Updates en tiempo real
3. **Export**: Descargar charts como PNG
4. **CSV Download**: Exportar datasets/resultados
5. **Custom Dashboards**: Layouts personalizables
6. **Notifications**: Push notifications para alertas
7. **Dark Mode**: Toggle de tema
8. **Multi-language**: i18n support

## 🎉 Resultado Final

✅ **6 páginas completas** mostrando todo el pipeline MLOps
✅ **18 endpoints de API** para analytics
✅ **Visualizaciones interactivas** con Recharts
✅ **Drift detection** funcional con KS test
✅ **Datos sintéticos** generables on-demand
✅ **Lineage tracking** completo
✅ **MLflow integration** total
✅ **Scripts de inicio/parada** automatizados
✅ **Documentación completa** y ejemplos

El sistema está **completamente funcional** y listo para demostrar todas las capacidades MLOps del proyecto! 🚀
