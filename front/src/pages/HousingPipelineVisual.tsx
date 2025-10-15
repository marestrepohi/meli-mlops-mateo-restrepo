/**
 * Housing DVC Pipeline Visualization
 * Visual representation of the DVC pipeline stages and dependencies
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Activity,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FileText,
  ExternalLink,
  Play,
  Code,
  Package,
  Folder,
  Calendar,
  Loader2
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  cmd: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  deps: string[];
  outs: string[];
  params?: string[];
  description: string;
  status: 'completed' | 'running' | 'pending';
}

interface OutputItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: string;
  description?: string;
}

export default function HousingPipelineVisual() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionConfig, setExecutionConfig] = useState({
    period: '',
    dataSource: ''
  });
  const [executionProgress, setExecutionProgress] = useState<{
    currentStage: string | null;
    completedStages: string[];
    logs: string[];
  }>({
    currentStage: null,
    completedStages: [],
    logs: []
  });

  // Mapeo de outputs detallados por stage
  const stageOutputs: Record<string, OutputItem[]> = {
    data_ingestion: [
      {
        name: 'raw',
        type: 'folder',
        path: 'data/raw/',
        description: 'Datos crudos descargados de Kaggle'
      },
      {
        name: 'HousingData.csv',
        type: 'file',
        path: 'data/raw/HousingData.csv',
        size: '45 KB',
        description: 'Dataset completo de precios de viviendas'
      },
      {
        name: 'reports',
        type: 'folder',
        path: 'data/reports/',
        description: 'Reportes de análisis exploratorio'
      },
      {
        name: 'eda_data.json',
        type: 'file',
        path: 'data/reports/eda_data.json',
        size: '125 KB',
        description: 'Estadísticas, correlaciones y alertas'
      },
      {
        name: 'raw_eda_report.html',
        type: 'file',
        path: 'data/reports/raw_eda_report_2025-10-15.html',
        size: '2.1 MB',
        description: 'Reporte HTML completo ydata-profiling'
      }
    ],
    data_preparation: [
      {
        name: 'processed',
        type: 'folder',
        path: 'data/processed/',
        description: 'Datasets procesados train/test'
      },
      {
        name: 'train.csv',
        type: 'file',
        path: 'data/processed/train.csv',
        size: '32 KB',
        description: 'Dataset de entrenamiento (80%)'
      },
      {
        name: 'test.csv',
        type: 'file',
        path: 'data/processed/test.csv',
        size: '8 KB',
        description: 'Dataset de prueba (20%)'
      },
      {
        name: 'X_train.csv',
        type: 'file',
        path: 'data/processed/X_train.csv',
        size: '28 KB',
        description: 'Features de entrenamiento'
      },
      {
        name: 'X_test.csv',
        type: 'file',
        path: 'data/processed/X_test.csv',
        size: '7 KB',
        description: 'Features de prueba'
      },
      {
        name: 'y_train.csv',
        type: 'file',
        path: 'data/processed/y_train.csv',
        size: '2 KB',
        description: 'Target de entrenamiento'
      },
      {
        name: 'y_test.csv',
        type: 'file',
        path: 'data/processed/y_test.csv',
        size: '0.5 KB',
        description: 'Target de prueba'
      },
      {
        name: 'standard_scaler.pkl',
        type: 'file',
        path: 'models/standard_scaler.pkl',
        size: '2.5 KB',
        description: 'StandardScaler entrenado'
      },
      {
        name: 'scaler.pkl (production)',
        type: 'file',
        path: 'models/production/latest/scaler.pkl',
        size: '2.5 KB',
        description: 'Scaler para producción'
      }
    ],
    model_train: [
      {
        name: 'production/latest',
        type: 'folder',
        path: 'models/production/latest/',
        description: 'Modelo y artefactos en producción'
      },
      {
        name: 'model.pkl',
        type: 'file',
        path: 'models/production/latest/model.pkl',
        size: '1.2 MB',
        description: 'XGBoost Regressor - mejor modelo'
      },
      {
        name: 'metadata.json',
        type: 'file',
        path: 'models/production/latest/metadata.json',
        size: '1.2 KB',
        description: 'Métricas: R²=0.82, RMSE=4.25'
      },
      {
        name: 'mlruns/161467391400410343',
        type: 'folder',
        path: 'mlruns/161467391400410343/',
        description: 'Experimentos MLflow trackeados'
      },
      {
        name: 'Experimento 1',
        type: 'file',
        path: 'mlruns/161467391400410343/2324fb194300453e92b1826c1e67c788/',
        description: 'Run ID: 2324fb19... | learning_rate=0.01'
      },
      {
        name: 'Experimento 2',
        type: 'file',
        path: 'mlruns/161467391400410343/5670a69cb9304c3cb233cc9653470636/',
        description: 'Run ID: 5670a69c... | learning_rate=0.05'
      },
      {
        name: 'Experimento 3 (Best)',
        type: 'file',
        path: 'mlruns/161467391400410343/f05fda92a686482cb1c791885dbb6b75/',
        description: 'Run ID: f05fda92... | learning_rate=0.1'
      }
    ]
  };

  const stages: PipelineStage[] = [
    {
      id: 'data_ingestion',
      name: 'Data Ingestion',
      cmd: 'python src/data_ingestion.py',
      icon: Database,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      deps: ['src/data_ingestion.py'],
      outs: [
        'data/raw/HousingData.csv',
        'data/reports/'
      ],
      description: 'Descarga datos desde Kaggle, genera dataset limpio y reporte EDA',
      status: 'completed'
    },
    {
      id: 'data_preparation',
      name: 'Data Preparation',
      cmd: 'python src/data_preparation.py',
      icon: Activity,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      deps: [
        'src/data_preparation.py',
        'data/raw/HousingData.csv'
      ],
      params: [
        'data_ingestion',
        'preprocessing',
        'data_preparation'
      ],
      outs: [
        'data/processed/',
        'models/standard_scaler.pkl',
        'models/production/latest/scaler.pkl'
      ],
      description: 'Limpieza, transformación y feature engineering. Genera StandardScaler para producción',
      status: 'completed'
    },
    {
      id: 'model_train',
      name: 'Model Training',
      cmd: 'python src/model_train.py',
      icon: Sparkles,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      deps: [
        'src/model_train.py',
        'data/processed/train.csv',
        'data/processed/test.csv'
      ],
      params: [
        'data_ingestion.target_column',
        'preprocessing.processed_data_dir',
        'mlflow.tracking_uri',
        'mlflow.experiment_name'
      ],
      outs: [
        'models/production/latest/model.pkl',
        'models/production/latest/metadata.json'
      ],
      description: 'Entrenamiento de 3 experimentos XGBoost con SHAP + MLflow. Exporta mejor modelo para API',
      status: 'completed'
    }
  ];

  const selectedStageData = stages.find(s => s.id === selectedStage);
  const selectedStageOutputs = selectedStage ? stageOutputs[selectedStage] : [];

  const handleExecutePipeline = async () => {
    if (!executionConfig.period || !executionConfig.dataSource) {
      alert('Por favor selecciona el período y la fuente de datos');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress({
      currentStage: null,
      completedStages: [],
      logs: []
    });

    // Simular ejecución del pipeline con logs en tiempo real
    const addLog = (message: string) => {
      setExecutionProgress(prev => ({
        ...prev,
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
      }));
    };

    const executeStage = (stageId: string, stageName: string, duration: number) => {
      return new Promise<void>((resolve) => {
        setExecutionProgress(prev => ({
          ...prev,
          currentStage: stageId
        }));
        
        addLog(`🔄 Iniciando: ${stageName}`);
        
        setTimeout(() => {
          setExecutionProgress(prev => ({
            ...prev,
            currentStage: null,
            completedStages: [...prev.completedStages, stageId]
          }));
          addLog(`✅ Completado: ${stageName}`);
          resolve();
        }, duration);
      });
    };

    try {
      addLog(`🚀 Iniciando ejecución del pipeline DVC`);
      addLog(`📊 Período: ${executionConfig.period}`);
      addLog(`💾 Fuente de datos: ${executionConfig.dataSource}`);
      addLog('');
      
      // Stage 1: Data Ingestion
      await executeStage('data_ingestion', 'Data Ingestion', 3000);
      addLog('   → data/raw/HousingData.csv generado');
      addLog('   → Reporte EDA creado');
      addLog('');
      
      // Stage 2: Data Preparation
      await executeStage('data_preparation', 'Data Preparation', 3500);
      addLog('   → Datos procesados: train.csv, test.csv');
      addLog('   → StandardScaler entrenado y guardado');
      addLog('');
      
      // Stage 3: Model Training
      await executeStage('model_train', 'Model Training', 4000);
      addLog('   → 3 experimentos ejecutados en MLflow');
      addLog('   → Mejor modelo exportado a producción');
      addLog('   → Métricas: R²=0.82, RMSE=4.25');
      addLog('');
      
      addLog('🎉 Pipeline ejecutado exitosamente!');
      
      setTimeout(() => {
        setIsExecuting(false);
        setShowExecuteDialog(false);
        
        // Reset config después de cerrar
        setTimeout(() => {
          setExecutionConfig({
            period: '',
            dataSource: ''
          });
          setExecutionProgress({
            currentStage: null,
            completedStages: [],
            logs: []
          });
        }, 500);
      }, 2000);
      
    } catch (error) {
      addLog('❌ Error en la ejecución del pipeline');
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pipeline DVC</h1>
          <p className="text-muted-foreground">
            Visualización del pipeline de Data Version Control
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/dvc.yaml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Code className="h-4 w-4" />
              Ver dvc.yaml
            </Button>
          </a>
          <Button 
            size="sm" 
            className="gap-2"
            onClick={() => setShowExecuteDialog(true)}
          >
            <Play className="h-4 w-4" />
            Ejecutar Pipeline
          </Button>
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Flow</CardTitle>
          <CardDescription>
            3 etapas principales: Ingestion → Preparation → Training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8">
            {stages.map((stage, index) => {
              const StageIcon = stage.icon;
              const isSelected = selectedStage === stage.id;
              const isRunning = executionProgress.currentStage === stage.id;
              const isCompleted = executionProgress.completedStages.includes(stage.id);
              const isPending = isExecuting && !isRunning && !isCompleted;

              return (
                <div key={stage.id} className="flex items-center flex-1">
                  {/* Stage Card */}
                  <div
                    className={`relative w-full cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isRunning ? 'ring-2 ring-yellow-500 animate-pulse' : ''}`}
                    onClick={() => setSelectedStage(isSelected ? null : stage.id)}
                  >
                    <Card className={`${stage.borderColor} border-2 ${isPending ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${stage.bgColor}`}>
                            {isRunning ? (
                              <Loader2 className={`h-5 w-5 ${stage.color} animate-spin`} />
                            ) : (
                              <StageIcon className={`h-5 w-5 ${stage.color}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : isRunning ? (
                                <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                              <h3 className="font-semibold text-sm">{stage.name}</h3>
                              {isRunning && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                  Ejecutando
                                </Badge>
                              )}
                              {isCompleted && isExecuting && (
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                  ✓ Completado
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {stage.description}
                            </p>
                          </div>
                        </div>

                        {/* Outputs Preview */}
                        <div className="space-y-1">
                          {stage.outs.slice(0, 2).map((out, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <Package className={`h-3 w-3 ${stage.color}`} />
                              <span className="text-muted-foreground truncate font-mono">
                                {out}
                              </span>
                            </div>
                          ))}
                          {stage.outs.length > 2 && (
                            <p className="text-xs text-muted-foreground pl-5">
                              +{stage.outs.length - 2} más...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center px-4">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>



      {/* Stage Details */}
      {selectedStageData && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <selectedStageData.icon className={`h-5 w-5 ${selectedStageData.color}`} />
                  {selectedStageData.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedStageData.description}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Command */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Comando
              </h4>
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm font-mono">{selectedStageData.cmd}</code>
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dependencias ({selectedStageData.deps.length})
              </h4>
              <div className="space-y-1">
                {selectedStageData.deps.map((dep, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono">{dep}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            {selectedStageData.params && selectedStageData.params.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Parámetros ({selectedStageData.params.length})
                </h4>
                <div className="space-y-1">
                  {selectedStageData.params.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded">
                      <Activity className="h-3 w-3 text-blue-600" />
                      <span className="font-mono text-blue-700">{param}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outputs Detallados */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Outputs Generados ({selectedStageOutputs.length})
              </h4>
              <div className="space-y-2">
                {selectedStageOutputs.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.type === 'folder' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {item.type === 'folder' ? (
                        <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.size && (
                        <Badge variant="secondary" className="text-xs">
                          {item.size}
                        </Badge>
                      )}
                      <a
                        href={`https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/${item.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm" className="h-7 gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Ver
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stages.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Etapas en el pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">✓</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas las etapas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Última Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Hoy</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline actualizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DVC Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Comandos DVC Útiles</CardTitle>
          <CardDescription>
            Ejecuta estos comandos para gestionar el pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm font-mono">dvc repro</code>
              <p className="text-xs text-muted-foreground mt-1">
                Ejecuta todo el pipeline
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm font-mono">dvc dag</code>
              <p className="text-xs text-muted-foreground mt-1">
                Muestra el grafo de dependencias
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm font-mono">dvc status</code>
              <p className="text-xs text-muted-foreground mt-1">
                Verifica estado del pipeline
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm font-mono">dvc push</code>
              <p className="text-xs text-muted-foreground mt-1">
                Sube artefactos al storage remoto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Click en cualquier etapa para ver detalles completos de dependencias, parámetros y outputs.
          El pipeline se ejecuta automáticamente con{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">dvc repro</code> en GitHub Actions.
        </AlertDescription>
      </Alert>

      {/* Execute Pipeline Dialog */}
      <Dialog open={showExecuteDialog} onOpenChange={(open) => !isExecuting && setShowExecuteDialog(open)}>
        <DialogContent 
          className={`${isExecuting ? 'sm:max-w-[700px]' : 'sm:max-w-[500px]'}`}
          onInteractOutside={(e) => isExecuting && e.preventDefault()}
          onEscapeKeyDown={(e) => isExecuting && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Ejecutar Pipeline DVC
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros para la ejecución del pipeline de entrenamiento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Período */}
            <div className="space-y-2">
              <Label htmlFor="period" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período de Datos
              </Label>
              <Select
                value={executionConfig.period}
                onValueChange={(value) => setExecutionConfig(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Selecciona el período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-Q4">2024 - Q4 (Oct-Dic)</SelectItem>
                  <SelectItem value="2025-Q1">2025 - Q1 (Ene-Mar)</SelectItem>
                  <SelectItem value="2025-Q2">2025 - Q2 (Abr-Jun)</SelectItem>
                  <SelectItem value="2025-Q3">2025 - Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="2025-Q4">2025 - Q4 (Oct-Dic)</SelectItem>
                  <SelectItem value="ultimo-año">Último año completo</SelectItem>
                  <SelectItem value="historico">Histórico completo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona el rango temporal de los datos a procesar
              </p>
            </div>

            {/* Fuente de Datos */}
            <div className="space-y-2">
              <Label htmlFor="dataSource" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Fuente de Datos
              </Label>
              <Select
                value={executionConfig.dataSource}
                onValueChange={(value) => setExecutionConfig(prev => ({ ...prev, dataSource: value }))}
              >
                <SelectTrigger id="dataSource">
                  <SelectValue placeholder="Selecciona la fuente de datos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kaggle">Kaggle - Housing Dataset</SelectItem>
                  <SelectItem value="local">Datos Locales (data/raw)</SelectItem>
                  <SelectItem value="s3">AWS S3 Bucket</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                  <SelectItem value="api">API Externa</SelectItem>
                  <SelectItem value="database">Base de Datos PostgreSQL</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Origen de los datos para el pipeline
              </p>
            </div>

            {/* Preview de configuración */}
            {executionConfig.period && executionConfig.dataSource && !isExecuting && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Configuración seleccionada:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">{executionConfig.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuente:</span>
                    <span className="font-medium">{executionConfig.dataSource}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Logs de ejecución en tiempo real */}
            {isExecuting && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Logs de Ejecución
                </Label>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto">
                  {executionProgress.logs.map((log, idx) => (
                    <div key={idx} className="mb-1">
                      {log}
                    </div>
                  ))}
                  {executionProgress.currentStage && (
                    <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Procesando...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExecuteDialog(false)}
              disabled={isExecuting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecutePipeline}
              disabled={!executionConfig.period || !executionConfig.dataSource || isExecuting}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Ejecutar Pipeline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
