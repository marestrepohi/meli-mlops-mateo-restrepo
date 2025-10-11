# MLOps Frontend Documentation

## Overview

The frontend provides a comprehensive interface for visualizing and interacting with all MLOps pipeline components including EDA, data lineage, MLflow experiments, drift detection, and synthetic data generation.

## Pages

### 1. Dashboard (`/`)
Main landing page with system overview and quick access to all features.

### 2. EDA Explorer (`/eda`)
**Purpose:** Interactive exploratory data analysis

**Features:**
- Dataset information (rows, columns, memory usage)
- Descriptive statistics table (mean, std, min, max, quartiles)
- Feature distribution histograms with selectable features
- Correlation matrix heatmap
- Feature importance bar chart

**API Calls:**
- `GET /api/v1/eda/dataset-info`
- `GET /api/v1/eda/statistics`
- `GET /api/v1/eda/distribution?feature=X&bins=30`
- `GET /api/v1/eda/correlation`
- `GET /api/v1/eda/feature-importance`

### 3. Data Lineage (`/lineage`)
**Purpose:** Track dataset versions and changes over time

**Features:**
- Timeline of all dataset versions with metadata
- Side-by-side version comparison
- Statistical differences visualization
- Added/removed features tracking
- Row and column change indicators

**API Calls:**
- `GET /api/v1/lineage/versions`
- `GET /api/v1/lineage/changes?version1=X&version2=Y`

### 4. MLflow Viewer (`/mlflow`)
**Purpose:** Experiment tracking and model registry visualization

**Features:**
- Experiment selection dropdown
- Runs list with metrics (RMSE, R², MAE)
- Metrics trends line chart
- Detailed run information with parameters
- Run status indicators (finished, failed, running)
- Tags and artifact URI display

**API Calls:**
- `GET /api/v1/mlflow/experiments`
- `GET /api/v1/mlflow/runs?experiment_name=X&limit=10`
- `GET /api/v1/mlflow/run/{run_id}`

### 5. Drift Monitor (`/drift`)
**Purpose:** Data drift detection and alert management

**Features:**
- Run drift detection button
- Feature-by-feature drift status (KS test)
- Severity classification (low, medium, high)
- P-value visualization with bar chart
- Alert history (last 30 days)
- Retraining recommendations

**API Calls:**
- `POST /api/v1/drift/detect` (with current data payload)
- `GET /api/v1/drift/alerts?days=30`

**Drift Detection:**
- Uses Kolmogorov-Smirnov statistical test
- Threshold: p-value < 0.05 indicates drift
- Severity: High (p < 0.01), Medium (p < 0.05), Low (p >= 0.05)

### 6. Data Generator (`/generator`)
**Purpose:** Generate synthetic datasets with configurable drift

**Features:**
- Sample size slider (50-1000)
- Drift factor slider (0.0-2.0)
- Feature selection checkboxes
- Real-time statistics preview
- Save dataset functionality
- Statistics visualization chart

**API Calls:**
- `POST /api/v1/synthetic/generate?n_samples=100&drift_factor=0.5&drift_features=X,Y`
- `POST /api/v1/synthetic/save?name=dataset_name`

**Parameters:**
- `n_samples`: Number of synthetic samples to generate
- `drift_factor`: Amount of drift (0 = no drift, 2 = max drift)
- `drift_features`: List of features to apply drift (empty = all)

## Installation & Setup

### Prerequisites
```bash
# Backend must be running
python src/main.py

# Or with Docker
docker-compose up
```

### Frontend Setup
```bash
cd front

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Access the app at: `http://localhost:5173`

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| React Router v6 | Routing |
| Axios | HTTP client |
| TanStack Query | Data fetching |
| Recharts | Charts & graphs |
| shadcn/ui | UI components |
| Tailwind CSS | Styling |

## API Client (`src/lib/api.ts`)

Centralized API client with all backend endpoints organized by category:

```typescript
// EDA
edaAPI.getDatasetInfo()
edaAPI.getStatistics(feature?)
edaAPI.getDistribution(feature, bins)
edaAPI.getCorrelation()
edaAPI.getFeatureImportance()

// Lineage
lineageAPI.getVersions()
lineageAPI.compareVersions(version1, version2)

// MLflow
mlflowAPI.getExperiments()
mlflowAPI.getRuns(experimentName, limit)
mlflowAPI.getRunDetails(runId)

// Drift
driftAPI.detectDrift(currentData)
driftAPI.getAlerts(days)

// Synthetic
syntheticAPI.generateData(nSamples, driftFactor, driftFeatures)
syntheticAPI.saveDataset(data, name)

// Prediction (existing)
predictionAPI.predict(features)
predictionAPI.batchPredict(samples)
predictionAPI.getHealth()
predictionAPI.getMetrics()
predictionAPI.getModelInfo()
```

## Component Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Navbar.tsx       # Navigation with active route highlighting
│   ├── Dashboard.tsx    # Dashboard widgets
│   ├── Features.tsx     # Feature showcase
│   └── ...
├── pages/
│   ├── Index.tsx            # Main dashboard
│   ├── EDAExplorer.tsx      # EDA analysis page
│   ├── DataLineage.tsx      # Version tracking page
│   ├── MLflowViewer.tsx     # Experiment viewer
│   ├── DriftMonitor.tsx     # Drift detection page
│   ├── DataGenerator.tsx    # Synthetic data page
│   └── NotFound.tsx         # 404 page
├── lib/
│   ├── api.ts          # API client
│   └── utils.ts        # Utility functions
├── App.tsx             # Router configuration
└── main.tsx           # Entry point
```

## Usage Examples

### Example 1: View EDA
1. Navigate to `/eda`
2. View dataset information in summary cards
3. Switch between tabs: Statistics, Distribution, Correlation, Importance
4. Select different features in Distribution tab
5. Examine correlation heatmap

### Example 2: Compare Data Versions
1. Go to `/lineage`
2. View timeline of all versions
3. Select version1 (older) and version2 (newer)
4. Click "Compare Versions"
5. Review changes: rows, columns, features, statistics

### Example 3: Monitor Drift
1. Navigate to `/drift`
2. Click "Run Drift Detection"
3. View p-values for each feature
4. Check severity indicators
5. Review alert history
6. Take action on high-severity alerts

### Example 4: Generate Test Data
1. Go to `/generator`
2. Set samples to 200
3. Set drift factor to 1.5
4. Select features: CRIM, RM, LSTAT
5. Click "Generate Synthetic Data"
6. Review statistics preview
7. Save as "test_drift_dataset"

### Example 5: Track MLflow Runs
1. Visit `/mlflow`
2. Select experiment "housing-price-prediction"
3. View runs sorted by date
4. Click a run to see details
5. Compare metrics across runs
6. Check parameters used

## Development Tips

### Adding a New Page
1. Create page component in `src/pages/YourPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/Navbar.tsx`
4. Create API functions in `src/lib/api.ts` if needed

### Styling Guidelines
- Use Tailwind CSS classes
- Use shadcn/ui components for consistency
- Follow existing color scheme (primary, secondary, muted)
- Make responsive: mobile-first approach

### API Integration Pattern
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await yourAPI.getData();
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

## Troubleshooting

### Issue: API Connection Failed
**Solution:**
- Check backend is running: `curl http://localhost:8000/health`
- Verify CORS is enabled in backend
- Check `.env` file has correct `VITE_API_URL`

### Issue: No Data Displayed
**Solution:**
- Run training first: `python src/train.py`
- Check MLflow server is running
- Verify data files exist in `data/` directory

### Issue: Charts Not Rendering
**Solution:**
- Check browser console for errors
- Ensure Recharts is installed: `npm list recharts`
- Verify data format matches chart requirements

### Issue: Build Errors
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .vite
npm install

# Check TypeScript errors
npm run lint
```

## Performance Optimization

1. **Lazy Loading:** Pages are loaded on-demand via React Router
2. **API Caching:** TanStack Query caches API responses
3. **Chart Optimization:** Recharts renders efficiently with ResponsiveContainer
4. **Bundle Size:** Vite code-splits automatically

## Security Considerations

- API URL is configurable via environment variables
- No sensitive data stored in localStorage
- CORS properly configured on backend
- Input validation on all forms

## Future Enhancements

- [ ] Real-time updates via WebSockets
- [ ] Export charts as images
- [ ] Download datasets as CSV
- [ ] User authentication
- [ ] Custom dashboard layouts
- [ ] Dark mode toggle
- [ ] Multi-language support

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Recharts Examples](https://recharts.org/en-US/examples)
- [React Router](https://reactrouter.com/)
