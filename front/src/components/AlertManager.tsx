/**
 * Alert Management System Component
 * Monitors drift and triggers automatic alerts based on configurable thresholds
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
  Settings,
  TrendingUp,
  Clock,
  Save
} from 'lucide-react';
import { housingAPI, DriftInfo } from '@/services/housingAPI';

export interface AlertConfig {
  enabled: boolean;
  threshold: number; // Number of standard deviations
  checkInterval: number; // Seconds between checks
  notifyOnDrift: boolean;
  autoSetBaseline: boolean;
}

interface AlertHistoryItem {
  timestamp: Date;
  type: 'drift' | 'info' | 'warning';
  message: string;
  driftScore?: number;
}

interface AlertManagerProps {
  onAlert?: (alert: AlertHistoryItem) => void;
}

export default function AlertManager({ onAlert }: AlertManagerProps) {
  const [config, setConfig] = useState<AlertConfig>({
    enabled: false,
    threshold: 2.0,
    checkInterval: 60, // 1 minute
    notifyOnDrift: true,
    autoSetBaseline: false,
  });

  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!config.enabled) return;

    // Check for drift at configured interval
    const interval = setInterval(() => {
      checkForDrift();
    }, config.checkInterval * 1000);

    // Initial check
    checkForDrift();

    return () => clearInterval(interval);
  }, [config.enabled, config.threshold, config.checkInterval]);

  const checkForDrift = async () => {
    if (isChecking) return;

    try {
      setIsChecking(true);
      const driftInfo: DriftInfo = await housingAPI.getDriftInfo();
      setLastCheck(new Date());

      if (!driftInfo.baseline_configured && config.autoSetBaseline) {
        // Auto-set baseline if configured
        await housingAPI.setBaseline();
        addAlert({
          timestamp: new Date(),
          type: 'info',
          message: 'Baseline configurado automáticamente',
        });
        return;
      }

      if (driftInfo.drift_detected && config.notifyOnDrift) {
        const alert: AlertHistoryItem = {
          timestamp: new Date(),
          type: 'drift',
          message: `Drift detectado con score: ${driftInfo.drift_score?.toFixed(2) || 'N/A'}`,
          driftScore: driftInfo.drift_score || undefined,
        };

        addAlert(alert);

        toast({
          title: "🚨 Drift Detectado",
          description: alert.message,
          variant: "destructive",
        });

        if (onAlert) {
          onAlert(alert);
        }
      }
    } catch (error) {
      console.error('Error checking drift:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const addAlert = (alert: AlertHistoryItem) => {
    setAlertHistory(prev => [alert, ...prev].slice(0, 20)); // Keep last 20 alerts
  };

  const handleSaveConfig = () => {
    toast({
      title: "✅ Configuración guardada",
      description: `Alertas ${config.enabled ? 'activadas' : 'desactivadas'}`,
    });
  };

  const clearHistory = () => {
    setAlertHistory([]);
    toast({
      title: "Historial limpiado",
      description: "Se eliminaron todas las alertas anteriores",
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Alertas
              </CardTitle>
              <CardDescription>
                Sistema automático de detección y notificación de drift
              </CardDescription>
            </div>
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Activado
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Desactivado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-base font-semibold">
                Activar Sistema de Alertas
              </Label>
              <p className="text-sm text-muted-foreground">
                Monitoreo automático cada {config.checkInterval} segundos
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          {/* Threshold Configuration */}
          <div className="space-y-2">
            <Label htmlFor="threshold">
              Umbral de Drift (σ desviaciones estándar)
            </Label>
            <div className="flex gap-2">
              <Input
                id="threshold"
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={config.threshold}
                onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) })}
                className="max-w-[120px]"
              />
              <span className="flex items-center text-sm text-muted-foreground">
                Score mayor a {config.threshold}σ activará alerta
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores comunes: 2σ (95%), 3σ (99.7%)
            </p>
          </div>

          {/* Check Interval */}
          <div className="space-y-2">
            <Label htmlFor="interval">
              Intervalo de Verificación (segundos)
            </Label>
            <div className="flex gap-2">
              <Input
                id="interval"
                type="number"
                min="10"
                max="3600"
                step="10"
                value={config.checkInterval}
                onChange={(e) => setConfig({ ...config, checkInterval: parseInt(e.target.value) })}
                className="max-w-[120px]"
              />
              <span className="flex items-center text-sm text-muted-foreground">
                ~{Math.round(3600 / config.checkInterval)} checks por hora
              </span>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyDrift" className="text-sm font-medium">
                  Notificar cuando se detecte drift
                </Label>
                <p className="text-xs text-muted-foreground">
                  Muestra un toast cuando el drift supera el umbral
                </p>
              </div>
              <Switch
                id="notifyDrift"
                checked={config.notifyOnDrift}
                onCheckedChange={(checked) => setConfig({ ...config, notifyOnDrift: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBaseline" className="text-sm font-medium">
                  Configurar baseline automáticamente
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si no hay baseline configurado, se creará uno automáticamente
                </p>
              </div>
              <Switch
                id="autoBaseline"
                checked={config.autoSetBaseline}
                onCheckedChange={(checked) => setConfig({ ...config, autoSetBaseline: checked })}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveConfig} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
            <Button onClick={checkForDrift} variant="outline" disabled={!config.enabled || isChecking}>
              <TrendingUp className={`h-4 w-4 mr-2 ${isChecking ? 'animate-pulse' : ''}`} />
              Verificar Ahora
            </Button>
          </div>

          {/* Status */}
          {config.enabled && lastCheck && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4" />
              Última verificación: {lastCheck.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Alertas</CardTitle>
              <CardDescription>
                Últimas 20 alertas generadas por el sistema
              </CardDescription>
            </div>
            {alertHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Limpiar Historial
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alertHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No hay alertas registradas</p>
              <p className="text-xs mt-1">
                {config.enabled 
                  ? "El sistema está monitoreando activamente"
                  : "Activa el sistema para comenzar el monitoreo"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertHistory.map((alert, idx) => (
                <Alert 
                  key={idx} 
                  variant={alert.type === 'drift' ? 'destructive' : 'default'}
                  className="relative"
                >
                  <div className="flex items-start gap-3">
                    {alert.type === 'drift' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <AlertTitle className="text-sm">
                        {alert.type === 'drift' ? 'Drift Detectado' : 'Información'}
                      </AlertTitle>
                      <AlertDescription className="text-xs">
                        {alert.message}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {alert.driftScore && (
                      <Badge variant="outline" className="text-xs">
                        {alert.driftScore.toFixed(2)}σ
                      </Badge>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
