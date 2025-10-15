/**
 * Model Monitoring Dashboard
 * Real-time monitoring with drift detection, metrics, and performance tracking
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  RefreshCw,
  Target,
  Info
} from 'lucide-react';
import { housingAPI, MonitoringStats, DriftInfo } from '@/services/housingAPI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AlertManager from '@/components/AlertManager';

export default function HousingMonitoring() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [drift, setDrift] = useState<DriftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, driftData] = await Promise.all([
        housingAPI.getMonitoringStats(),
        housingAPI.getDriftInfo().catch(() => null),
      ]);

      setStats(statsData);
      setDrift(driftData);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async () => {
    try {
      const result = await housingAPI.setBaseline();
      toast({
        title: "✅ Baseline configurado",
        description: `Baseline establecido con ${result.baseline_stats?.count || 0} predicciones`,
      });
      loadMonitoringData();
    } catch (err: any) {
      toast({
        title: "❌ Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando datos de monitoreo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Monitoreo en Producción
          </h1>
          <p className="text-muted-foreground">
            Seguimiento en tiempo real del modelo housing-price-prediction
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSetBaseline}>
            <Target className="h-4 w-4 mr-2" />
            Configurar Baseline
          </Button>
          <Button variant="default" onClick={loadMonitoringData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Last Update */}
      <div className="mb-4 text-sm text-muted-foreground">
        Última actualización: {lastUpdate.toLocaleTimeString()}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription>
            {error}. Verifica que la API esté ejecutándose en http://localhost:8000
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="metrics">📊 Métricas y Drift</TabsTrigger>
          <TabsTrigger value="alerts">🔔 Alertas Automáticas</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">{/* Original monitoring content will go here */}

      {/* Drift Alert */}
      {drift?.drift_detected && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ Drift Detectado</AlertTitle>
          <AlertDescription>
            La distribución de predicciones ha cambiado significativamente respecto al baseline.
            {drift.drift_score && ` (Score: ${drift.drift_score.toFixed(2)})`}
            <div className="mt-2 text-xs">
              Baseline mean: ${((drift.baseline_mean || 0) * 1000).toLocaleString()} | 
              Current mean: ${((drift.current_mean || 0) * 1000).toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Baseline Not Configured Alert */}
      {drift && !drift.baseline_configured && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Baseline No Configurado</AlertTitle>
          <AlertDescription>
            Para detectar drift, primero debes configurar un baseline con el botón "Configurar Baseline".
            El baseline se creará con las predicciones actuales en el sistema.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Predicciones Totales"
          value={stats?.total_predictions || 0}
          subtitle={`${stats?.predictions_per_hour || 0} por hora`}
          trend="up"
        />
        
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          title="Latencia Promedio"
          value={`${stats?.inference_stats?.mean_ms?.toFixed(1) || 0}ms`}
          subtitle="Tiempo de inferencia"
          trend={stats?.inference_stats?.mean_ms && stats.inference_stats.mean_ms < 100 ? 'up' : 'neutral'}
        />
        
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          title="Última Predicción"
          value={stats?.last_prediction_time 
            ? new Date(stats.last_prediction_time).toLocaleTimeString() 
            : 'N/A'}
          subtitle="Timestamp"
          trend="neutral"
        />
        
        <MetricCard
          icon={drift?.drift_detected ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          title="Estado del Modelo"
          value={drift?.drift_detected ? 'Drift' : 'Saludable'}
          subtitle={drift?.drift_detected ? 'Requiere atención' : 'Sin anomalías'}
          trend={drift?.drift_detected ? 'down' : 'up'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Predicciones</CardTitle>
            <CardDescription>
              Distribución de los valores predichos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.prediction_stats && stats.prediction_stats.mean ? (
              <div className="space-y-4">
                <StatRow label="Media" value={`$${((stats.prediction_stats.mean || 0) * 1000).toLocaleString()}`} />
                <StatRow label="Desviación Estándar" value={`$${((stats.prediction_stats.std || 0) * 1000).toLocaleString()}`} />
                <StatRow label="Mínimo" value={`$${((stats.prediction_stats.min || 0) * 1000).toLocaleString()}`} />
                <StatRow label="Máximo" value={`$${((stats.prediction_stats.max || 0) * 1000).toLocaleString()}`} />
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Percentiles</h4>
                  <div className="space-y-2">
                    <StatRow label="Q25" value={`$${((stats.prediction_stats.q25 || 0) * 1000).toLocaleString()}`} />
                    <StatRow label="Mediana" value={`$${((stats.prediction_stats.median || 0) * 1000).toLocaleString()}`} />
                    <StatRow label="Q75" value={`$${((stats.prediction_stats.q75 || 0) * 1000).toLocaleString()}`} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay suficientes predicciones para mostrar estadísticas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Predicciones Recientes</CardTitle>
            <CardDescription>
              Últimas 10 predicciones realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recent_predictions && stats.recent_predictions.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_predictions.map((pred, idx) => (
                  <div 
                    key={idx}
                    className="flex justify-between items-center p-2 bg-muted rounded"
                  >
                    <Badge variant="secondary" className="text-sm">
                      #{stats.total_predictions - stats.recent_predictions.length + idx + 1}
                    </Badge>
                    <span className="font-mono text-sm font-semibold">
                      ${(pred * 1000).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay predicciones recientes. Realiza algunas predicciones en la página de API Demo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Drift Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Detección de Drift</CardTitle>
            <CardDescription>
              Monitoreo de cambios en la distribución de predicciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drift ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${drift.drift_detected ? 'bg-red-100' : 'bg-green-100'}`}>
                    {drift.drift_detected ? (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {drift.drift_detected ? 'Drift Detectado' : 'Sin Drift'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {drift.drift_score !== null ? 
                        `Score: ${drift.drift_score.toFixed(2)} desviaciones estándar` :
                        'Drift score no disponible'
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  {drift.baseline_mean !== null && (
                    <div>
                      <h4 className="font-semibold mb-2">Baseline</h4>
                      <div className="space-y-1 text-sm">
                        <StatRow label="Media" value={`$${((drift.baseline_mean || 0) * 1000).toLocaleString()}`} />
                        <StatRow label="Std" value={`$${((drift.baseline_std || 0) * 1000).toLocaleString()}`} />
                      </div>
                    </div>
                  )}

                  {drift.current_mean !== null && (
                    <div>
                      <h4 className="font-semibold mb-2">Actual</h4>
                      <div className="space-y-1 text-sm">
                        <StatRow label="Media" value={`$${((drift.current_mean || 0) * 1000).toLocaleString()}`} />
                        <StatRow label="Muestras" value={stats?.total_predictions || 0} />
                      </div>
                    </div>
                  )}
                </div>

                {drift.drift_detected && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Acción recomendada:</strong> Investiga cambios en los datos de entrada,
                      verifica la calidad de las features, y considera reentrenar el modelo si el drift persiste.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hay baseline configurado
                </p>
                <Button variant="outline" size="sm" onClick={handleSetBaseline}>
                  Configurar Baseline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Health */}
        <Card>
          <CardHeader>
            <CardTitle>Salud del Modelo</CardTitle>
            <CardDescription>
              Indicadores clave de rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HealthIndicator
              label="Disponibilidad"
              status="healthy"
              value="100%"
              description="API respondiendo correctamente"
            />
            <HealthIndicator
              label="Latencia"
              status={stats && stats.inference_stats?.mean_ms && stats.inference_stats.mean_ms < 100 ? "healthy" : "warning"}
              value={`${stats?.inference_stats?.mean_ms?.toFixed(1) || 0}ms`}
              description="Tiempo promedio < 100ms"
            />
            <HealthIndicator
              label="Predicciones"
              status="healthy"
              value={stats?.total_predictions || 0}
              description="Total de inferencias realizadas"
            />
            <HealthIndicator
              label="Drift"
              status={drift?.drift_detected ? "error" : "healthy"}
              value={drift?.drift_detected ? "Detectado" : "OK"}
              description="Monitoreo de distribución"
            />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Acciones de Monitoreo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" onClick={handleSetBaseline} className="justify-start">
              <Target className="h-4 w-4 mr-2" />
              Actualizar Baseline
            </Button>
            <Button variant="outline" onClick={loadMonitoringData} className="justify-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar Datos
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Configurar Alertas
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <AlertManager 
            onAlert={(alert) => {
              // Handle alert callback if needed
              console.log('New alert:', alert);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ icon, title, value, subtitle, trend }: MetricCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={trendColors[trend]}>{icon}</div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

interface HealthIndicatorProps {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  value: string | number;
  description: string;
}

function HealthIndicator({ label, status, value, description }: HealthIndicatorProps) {
  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle2 className="h-4 w-4" /> },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <AlertTriangle className="h-4 w-4" /> },
    error: { color: 'text-red-600', bg: 'bg-red-100', icon: <AlertTriangle className="h-4 w-4" /> },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm">{label}</p>
          <Badge variant="outline" className={config.color}>
            {value}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
