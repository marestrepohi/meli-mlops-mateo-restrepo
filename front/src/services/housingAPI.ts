/**
 * API Client for Housing Price Prediction Backend
 * Connects to Python FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface HousePredictionInput {
  // Las 13 variables originales del Boston Housing Dataset
  CRIM: number;    // Per capita crime rate by town
  ZN: number;      // Proportion of residential land zoned for lots over 25,000 sq.ft.
  INDUS: number;   // Proportion of non-retail business acres per town
  CHAS: number;    // Charles River dummy variable (1 if tract bounds river; 0 otherwise)
  NOX: number;     // Nitric oxides concentration (parts per 10 million)
  RM: number;      // Average number of rooms per dwelling
  AGE: number;     // Proportion of owner-occupied units built prior to 1940
  DIS: number;     // Weighted distances to five Boston employment centres
  RAD: number;     // Index of accessibility to radial highways
  TAX: number;     // Full-value property-tax rate per $10,000
  PTRATIO: number; // Pupil-teacher ratio by town
  B: number;       // 1000(Bk - 0.63)^2 where Bk is the proportion of Black residents
  LSTAT: number;   // % lower status of the population
}

export interface PredictionResponse {
  prediction: number;
  model_name: string;
  model_version: string;
  model_stage: string;
  inference_time: number;
  features_used: string[];
  timestamp?: string;
  prediction_id?: string;
  // Backwards compatibility
  predicted_price?: number;
  inference_time_ms?: number;
}

export interface ModelInfo {
  model_name: string;
  version: string;
  stage: string;
  features: string[];
  metrics: {
    rmse: number;
    r2: number;
    mae: number;
    mape: number;
  };
  timestamp: string;
}

export interface MonitoringStats {
  total_predictions: number;
  uptime_hours: number;
  predictions_per_hour: number;
  prediction_stats: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    median?: number;
    q25?: number;
    q75?: number;
  };
  inference_stats: {
    mean_ms?: number;
    median_ms?: number;
    p50_ms?: number;
    p95_ms?: number;
    p99_ms?: number;
    max_ms?: number;
  };
  last_prediction_time?: string | null;
  recent_predictions: number[];
}

export interface DriftInfo {
  drift_detected: boolean;
  baseline_configured: boolean;
  drift_score: number | null;
  current_mean: number | null;
  baseline_mean: number | null;
  baseline_std: number | null;
  threshold?: number;
  recommendation?: string | null;
}

export interface ExperimentRun {
  run_id: string;
  experiment_name: string;
  status: string;
  metrics: {
    rmse: number;
    r2: number;
    mae: number;
    mape?: number;
  };
  params: Record<string, any>;
  start_time: string;
  end_time?: string;
}

class HousingPredictionAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Health & Info
  // ============================================================================

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  async getModelInfo(): Promise<ModelInfo> {
    return this.request('/model/info');
  }

  async getProductionInfo(): Promise<any> {
    return this.request('/model/production-info');
  }

  // ============================================================================
  // Predictions
  // ============================================================================

  async predict(input: HousePredictionInput): Promise<PredictionResponse> {
    return this.request('/predict', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async batchPredict(inputs: HousePredictionInput[]): Promise<PredictionResponse[]> {
    return this.request('/predict/batch', {
      method: 'POST',
      body: JSON.stringify({ predictions: inputs }),
    });
  }

  // ============================================================================
  // Monitoring
  // ============================================================================

  async getMonitoringStats(): Promise<MonitoringStats> {
    return this.request('/monitoring/stats');
  }

  async getDriftInfo(): Promise<DriftInfo> {
    return this.request('/monitoring/drift');
  }

  async setBaseline(): Promise<{ message: string; baseline_stats: any }> {
    return this.request('/monitoring/baseline', {
      method: 'POST',
    });
  }

  async getFeatureStats(): Promise<any> {
    return this.request('/monitoring/features');
  }

  async getMetrics(): Promise<any> {
    return this.request('/metrics');
  }

  // ============================================================================
  // MLflow Integration (if exposed)
  // ============================================================================

  async getExperiments(): Promise<any> {
    // This would need to be implemented in the backend
    return this.request('/mlflow/experiments').catch(() => {
      // Fallback: load from local JSON
      return {
        experiments: [
          {
            name: "01_hyperparameter_tuning",
            description: "XGBoost with all features",
            runs: 1
          },
          {
            name: "02_important_features", 
            description: "Top 10 features from SHAP",
            runs: 1
          },
          {
            name: "03_tuning_on_selected",
            description: "Tuning on selected features",
            runs: 1
          }
        ]
      };
    });
  }

  async getExperimentRuns(experimentName: string): Promise<ExperimentRun[]> {
    return this.request<ExperimentRun[]>(`/mlflow/experiments/${experimentName}/runs`).catch(() => []);
  }
}

// Export singleton instance
export const housingAPI = new HousingPredictionAPI();

// Export class for testing
export default HousingPredictionAPI;
