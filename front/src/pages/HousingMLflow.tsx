/**
 * MLflow UI Integration Page
 * Embeds the MLflow tracking UI in an iframe
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, RefreshCw, Info, Sparkles } from 'lucide-react';

const MLFLOW_URL = 'http://localhost:5000';
const EXPERIMENT_ID = '434179164881858349';

export default function HousingMLflow() {
  const [iframeKey, setIframeKey] = useState(0);
  const [currentView, setCurrentView] = useState<'experiments' | 'models' | 'full'>('experiments');

  const refreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const getIframeUrl = () => {
    switch (currentView) {
      case 'experiments':
        return `${MLFLOW_URL}/#/experiments/${EXPERIMENT_ID}`;
      case 'models':
        return `${MLFLOW_URL}/#/models`;
      case 'full':
        return MLFLOW_URL;
      default:
        return `${MLFLOW_URL}/#/experiments/${EXPERIMENT_ID}`;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-[1800px]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          MLflow Tracking Server
        </h1>
        <p className="text-muted-foreground">
          Servidor de tracking de experimentos de Machine Learning
        </p>
      </div>

      {/* Info Banner */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            MLflow UI integrado desde{' '}
            <code className="text-xs font-mono">http://localhost:5000</code>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getIframeUrl(), '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en Nueva Pestaña
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshIframe}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* View Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecciona la Vista</CardTitle>
          <CardDescription>
            Navega por diferentes secciones de MLflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={currentView === 'experiments' ? 'default' : 'outline'}
              onClick={() => setCurrentView('experiments')}
              className="flex-1"
            >
              Experimentos
              <Badge variant="secondary" className="ml-2">
                housing-price-prediction
              </Badge>
            </Button>
            <Button
              variant={currentView === 'models' ? 'default' : 'outline'}
              onClick={() => setCurrentView('models')}
              className="flex-1"
            >
              Model Registry
            </Button>
            <Button
              variant={currentView === 'full' ? 'default' : 'outline'}
              onClick={() => setCurrentView('full')}
              className="flex-1"
            >
              Vista Completa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Experimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-1">housing-price-prediction</div>
            <p className="text-xs text-muted-foreground">
              ID: {EXPERIMENT_ID}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Runs Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Experimentos ejecutados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mejor Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-1">02_important_features</div>
            <p className="text-xs text-muted-foreground">
              R² 91.7%, RMSE 2.46
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MLflow Iframe */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="w-full overflow-hidden rounded-lg border"
            style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}
          >
            <iframe
              key={iframeKey}
              src={getIframeUrl()}
              className="w-full h-full"
              title="MLflow Tracking UI"
              style={{ border: 'none' }}
              onError={(e) => {
                console.error('Error loading MLflow UI:', e);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">💡 Cómo usar MLflow UI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">Vista de Experimentos</h4>
            <p className="text-sm text-muted-foreground">
              Visualiza todos los runs del experimento housing-price-prediction. Compara métricas,
              parámetros y artefactos entre diferentes ejecuciones.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Model Registry</h4>
            <p className="text-sm text-muted-foreground">
              Gestiona modelos registrados, versiones y stages (Staging, Production).
              Aquí encontrarás el modelo XGBoost en producción.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Vista Completa</h4>
            <p className="text-sm text-muted-foreground">
              Acceso completo al MLflow UI con todos los experimentos, modelos y configuraciones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Alert className="mt-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota técnica:</strong> MLflow debe estar ejecutándose en{' '}
          <code>http://localhost:5000</code>. Si no ves la interfaz, inicia el servidor con:{' '}
          <code className="block mt-2 p-2 bg-muted rounded">
            cd python && mlflow ui --host 0.0.0.0 --port 5000
          </code>
        </AlertDescription>
      </Alert>
    </div>
  );
}
