/**
 * Housing Price Prediction Project Overview
 * Main dashboard showing project information, pipeline status, and quick stats
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  Activity, 
  Database, 
  BarChart3, 
  Rocket, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { housingAPI } from '@/services/housingAPI';

export default function HousingProject() {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [info, monitoring] = await Promise.all([
        housingAPI.getProductionInfo().catch(() => null),
        housingAPI.getMonitoringStats().catch(() => null),
      ]);
      
      setModelInfo(info);
      setStats(monitoring);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando información del proyecto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">Housing Price Prediction</h1>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Production
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">
            Pipeline ML completo: DVC → MLflow → API REST
          </p>
        </div>
        
        <Link to="/housing/api-demo">
          <Button size="lg" className="gap-2">
            <PlayCircle className="h-5 w-5" />
            Probar API
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo conectar con el backend. Asegúrate de que la API esté ejecutándose en{' '}
            <code className="text-xs">http://localhost:8000</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Sobre el Proyecto</CardTitle>
              <CardDescription>
                Solución MLOps completa para predicción de precios de viviendas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <a
                href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Database className="h-4 w-4" />
                  README
                </Button>
              </a>
              <a
                href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Objetivo</h4>
              <p className="text-sm text-muted-foreground">
                Predecir precios de viviendas utilizando características como ubicación, tamaño,
                calidad de construcción y condiciones del vecindario. Modelo entrenado con el 
                dataset Boston Housing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stack Tecnológico</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Python</Badge>
                <Badge variant="secondary">FastAPI</Badge>
                <Badge variant="secondary">XGBoost</Badge>
                <Badge variant="secondary">MLflow</Badge>
                <Badge variant="secondary">DVC</Badge>
                <Badge variant="secondary">Docker</Badge>
              </div>
            </div>
          </div>

          {modelInfo && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Modelo en Producción</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Algoritmo</p>
                  <p className="font-medium">{modelInfo.model_name || 'XGBRegressor'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Versión</p>
                  <p className="font-medium">{modelInfo.version || 'v1.0'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Features</p>
                  <p className="font-medium">{modelInfo.features?.length || 10} variables</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">R² Score</p>
                  <p className="font-medium text-green-600">
                    {(modelInfo.metrics?.r2 * 100 || 91.7).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Pipeline DVC
          </CardTitle>
          <CardDescription>
            4 etapas de procesamiento orquestadas con Data Version Control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PipelineStage
              icon={<Database className="h-5 w-5" />}
              title="Data Ingestion"
              description="Descarga de datos desde Kaggle"
              status="completed"
            />
            <PipelineStage
              icon={<Activity className="h-5 w-5" />}
              title="Data Preparation"
              description="Limpieza y feature engineering"
              status="completed"
            />
            <PipelineStage
              icon={<BarChart3 className="h-5 w-5" />}
              title="Model Training"
              description="3 experimentos con XGBoost"
              status="completed"
            />
            <PipelineStage
              icon={<Rocket className="h-5 w-5" />}
              title="Model Registry"
              description="Registro en MLflow"
              status="completed"
            />
          </div>
          
          <div className="mt-4 flex justify-end">
            <Link to="/housing/pipeline">
              <Button variant="outline" size="sm" className="gap-2">
                Ver Pipeline Completo
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Predicciones Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.total_predictions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.predictions_per_hour || 0} por hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Latencia Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.avg_inference_time_ms?.toFixed(1) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiempo de inferencia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">RMSE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {modelInfo?.metrics?.rmse?.toFixed(2) || '2.46'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Error cuadrático medio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/housing/api-demo" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <PlayCircle className="h-4 w-4" />
                Probar API
              </Button>
            </Link>
            <Link to="/housing/experiments" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                Experimentos
              </Button>
            </Link>
            <Link to="/housing/monitoring" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="h-4 w-4" />
                Monitoreo
              </Button>
            </Link>
            <Link to="/housing/pipeline" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <GitBranch className="h-4 w-4" />
                Pipeline
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Component
interface PipelineStageProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
}

function PipelineStage({ icon, title, description, status }: PipelineStageProps) {
  const statusConfig = {
    completed: { color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="h-4 w-4" /> },
    running: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock className="h-4 w-4 animate-spin" /> },
    pending: { color: 'text-gray-400', bg: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> },
    failed: { color: 'text-red-600', bg: 'bg-red-50', icon: <AlertCircle className="h-4 w-4" /> },
  };

  const config = statusConfig[status];

  return (
    <div className={`p-4 rounded-lg border ${config.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={config.color}>{icon}</div>
        <div className={config.color}>{config.icon}</div>
      </div>
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
