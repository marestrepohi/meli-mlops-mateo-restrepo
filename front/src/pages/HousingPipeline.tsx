/**
 * DVC Pipeline Visualization
 * Shows the 4 stages of the ML pipeline with dependencies and outputs
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Activity, 
  BarChart3, 
  Rocket, 
  CheckCircle2,
  ArrowRight,
  FileText,
  Code,
  GitBranch,
  Play,
  ExternalLink,
  Filter,
  Shuffle,
  Split,
  Scale,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 1,
    name: 'data_ingestion',
    title: 'Data Ingestion',
    icon: <Database className="h-6 w-6" />,
    description: 'Descarga datos desde Kaggle y genera reporte EDA',
    command: 'python src/data_ingestion.py',
    deps: ['src/data_ingestion.py'],
    outputs: [
      'data/raw/HousingData.csv',
      'data/reports/raw_eda_report_2025-10-14.html',
      'data/reports/eda_data.json'
    ],
    params: [],
    duration: '~15s',
    status: 'completed'
  },
  {
    id: 2,
    name: 'data_preparation',
    title: 'Data Preparation',
    icon: <Activity className="h-6 w-6" />,
    description: 'Limpieza, transformación, splitting y escalado de datos',
    command: 'python src/data_preparation.py',
    deps: ['src/data_preparation.py', 'data/raw/HousingData.csv'],
    outputs: [
      'data/processed/train.csv',
      'data/processed/test.csv',
      'data/processed/X_train.csv',
      'data/processed/X_test.csv',
      'data/processed/y_train.csv',
      'data/processed/y_test.csv',
      'models/standard_scaler.pkl'
    ],
    params: [
      'data_ingestion.target_column',
      'preprocessing.processed_data_dir',
      'data_preparation.test_size',
      'data_preparation.random_state'
    ],
    duration: '~5s',
    status: 'completed'
  },
  {
    id: 3,
    name: 'model_train',
    title: 'Model Training',
    icon: <BarChart3 className="h-6 w-6" />,
    description: '3 experimentos XGBoost con SHAP y MLflow tracking',
    command: 'python src/model_train.py',
    deps: [
      'src/model_train.py',
      'data/processed/train.csv',
      'data/processed/test.csv',
      'models/standard_scaler.pkl'
    ],
    outputs: [
      'mlartifacts/training/best_model.pkl',
      'mlartifacts/training/best_model_info.json',
      'mlartifacts/training/best_metrics.json',
      'mlartifacts/training/experiments_summary.json'
    ],
    params: [
      'model_training.xgboost.*',
      'mlflow.tracking_uri',
      'mlflow.experiment_name'
    ],
    duration: '~2m 30s',
    status: 'completed',
    experiments: [
      '01_hyperparameter_tuning',
      '02_important_features',
      '03_tuning_on_selected'
    ]
  },
  {
    id: 4,
    name: 'model_register',
    title: 'Model Registration',
    icon: <Rocket className="h-6 w-6" />,
    description: 'Registro del mejor modelo en MLflow Registry',
    command: 'python src/model_register.py --stage Staging',
    deps: [
      'src/model_register.py',
      'mlartifacts/training/best_model_info.json',
      'mlartifacts/training/best_metrics.json',
      'mlartifacts/training/best_model.pkl',
      'models/standard_scaler.pkl'
    ],
    outputs: [
      'mlartifacts/registry/registered_model_info.json',
      'mlartifacts/registry/registration_metrics.json',
      'models/production/'
    ],
    params: ['mlflow.*'],
    duration: '~10s',
    status: 'completed'
  }
];

export default function HousingPipeline() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <GitBranch className="h-8 w-8 text-primary" />
          Pipeline DVC
        </h1>
        <p className="text-muted-foreground">
          Pipeline de Machine Learning orquestado con Data Version Control
        </p>
      </div>

      {/* Pipeline Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Arquitectura del Pipeline</CardTitle>
          <CardDescription>
            4 stages reproducibles con control de versiones de datos y modelos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Code className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              dvc repro
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground mt-4">
            Ejecuta el comando anterior para reproducir todo el pipeline desde cero. DVC
            detecta automáticamente qué stages necesitan ejecutarse basándose en los cambios.
          </p>
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <div className="space-y-6">
        {PIPELINE_STAGES.map((stage, index) => (
          <div key={stage.id} className="relative">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {stage.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{stage.title}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {stage.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {stage.status}
                    </Badge>
                    <Badge variant="secondary">{stage.duration}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{stage.description}</p>

                {/* Command */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Comando
                  </h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    {stage.command}
                  </div>
                </div>

                {/* Dependencies */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Dependencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {stage.deps.map((dep, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">Outputs</h4>
                    {stage.name === 'data_ingestion' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/projects/housing-prediction/data/reports/raw_eda_report_2025-10-14.html', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Reporte EDA
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stage.outputs.map((output, i) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">
                        {output}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                {stage.params.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Parámetros (params.yaml)</h4>
                    <div className="flex flex-wrap gap-2">
                      {stage.params.map((param, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experiments (for model_train) */}
                {stage.experiments && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Experimentos MLflow</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {stage.experiments.map((exp, i) => (
                        <Card key={i} className="p-3">
                          <p className="font-mono text-xs mb-1">{exp}</p>
                          <Badge variant="secondary" className="text-xs">Run #{i + 1}</Badge>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Transformation Pipeline (for data_preparation) */}
                {stage.name === 'data_preparation' && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Pipeline de Transformación</h4>
                    <div className="space-y-3">
                      {/* Step 1: Handle Missing Values */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">1. Manejo de Valores Faltantes</p>
                          <p className="text-xs text-muted-foreground">
                            Imputación de 120 valores NA (1.69% del dataset) con la mediana de cada variable
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Step 2: Remove Outliers */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">2. Eliminación de Outliers</p>
                          <p className="text-xs text-muted-foreground">
                            Método IQR para detectar y remover valores extremos en variables numéricas
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Step 3: Feature Engineering */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Shuffle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">3. Ingeniería de Features</p>
                          <p className="text-xs text-muted-foreground">
                            Transformaciones y creación de nuevas features basadas en las 13 variables originales
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Step 4: Train/Test Split */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Split className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">4. División Train/Test</p>
                          <p className="text-xs text-muted-foreground">
                            80% entrenamiento (405 registros) / 20% prueba (101 registros) - random_state=42
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Step 5: Feature Scaling */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Scale className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">5. Escalado de Features</p>
                          <p className="text-xs text-muted-foreground">
                            StandardScaler para normalizar todas las features (media=0, std=1)
                          </p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>

                      {/* Results Summary */}
                      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-primary">506</p>
                            <p className="text-xs text-muted-foreground">Registros iniciales</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-primary">13</p>
                            <p className="text-xs text-muted-foreground">Features finales</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-primary">100%</p>
                            <p className="text-xs text-muted-foreground">Datos limpios</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Arrow between stages */}
            {index < PIPELINE_STAGES.length - 1 && (
              <div className="flex justify-center my-4">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Metrics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Métricas del Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Stages Totales</p>
              <p className="text-2xl font-bold">4</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tiempo Total</p>
              <p className="text-2xl font-bold">~3m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Artefactos Generados</p>
              <p className="text-2xl font-bold">15+</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Ejecución</p>
              <p className="text-2xl font-bold">Hoy</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DVC Commands */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comandos DVC Útiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CommandCard
              command="dvc repro"
              description="Ejecuta todo el pipeline"
            />
            <CommandCard
              command="dvc dag"
              description="Visualiza el grafo del pipeline"
            />
            <CommandCard
              command="dvc metrics show"
              description="Muestra métricas de todos los stages"
            />
            <CommandCard
              command="dvc params diff"
              description="Compara parámetros entre commits"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Component
interface CommandCardProps {
  command: string;
  description: string;
}

function CommandCard({ command, description }: CommandCardProps) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <code className="font-mono text-sm font-semibold">{command}</code>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
