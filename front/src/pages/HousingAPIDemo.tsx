/**
 * Interactive API Demo for Housing Price Prediction
 * Allows users to input house features and get real-time predictions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  TrendingUp,
  Home,
  MapPin
} from 'lucide-react';
import { housingAPI, HousePredictionInput, PredictionResponse } from '@/services/housingAPI';

// Ejemplos preconfigurados con las 13 variables
const EXAMPLES = {
  luxury: {
    name: 'Casa de Lujo',
    data: { 
      CRIM: 0.01, ZN: 18.0, INDUS: 2.31, CHAS: 0, NOX: 0.4, RM: 8.5, AGE: 10, 
      DIS: 6.0, RAD: 2, TAX: 250, PTRATIO: 14, B: 396, LSTAT: 2 
    }
  },
  average: {
    name: 'Casa Promedio',
    data: { 
      CRIM: 0.25, ZN: 0, INDUS: 7.0, CHAS: 0, NOX: 0.5, RM: 6.2, AGE: 60, 
      DIS: 4.0, RAD: 5, TAX: 300, PTRATIO: 17, B: 390, LSTAT: 10 
    }
  },
  budget: {
    name: 'Casa Económica',
    data: { 
      CRIM: 1.5, ZN: 0, INDUS: 15.0, CHAS: 0, NOX: 0.65, RM: 5.0, AGE: 85, 
      DIS: 2.5, RAD: 8, TAX: 400, PTRATIO: 20, B: 350, LSTAT: 20 
    }
  }
};

export default function HousingAPIDemo() {
  const [features, setFeatures] = useState<HousePredictionInput>({
    CRIM: 0.00632,
    ZN: 18.0,
    INDUS: 2.31,
    CHAS: 0,
    NOX: 0.538,
    RM: 6.575,
    AGE: 65.2,
    DIS: 4.09,
    RAD: 1,
    TAX: 296,
    PTRATIO: 15.3,
    B: 396.9,
    LSTAT: 4.98
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await housingAPI.predict(features);
      setPrediction(result);
      
      const price = result.prediction || result.predicted_price || 0;
      toast({
        title: "✅ Predicción exitosa",
        description: `Precio estimado: $${(price * 1000).toLocaleString()}`,
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ Error en la predicción",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: keyof typeof EXAMPLES) => {
    setFeatures(EXAMPLES[example].data);
    setPrediction(null);
    setError(null);
  };

  const updateFeature = (key: keyof HousePredictionInput, value: string) => {
    setFeatures(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Prueba la API de Predicción
        </h1>
        <p className="text-muted-foreground">
          Ingresa las características de una vivienda y obtén una estimación de precio en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ejemplos Rápidos</CardTitle>
              <CardDescription>Prueba con casos preconfigurados</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {Object.entries(EXAMPLES).map(([key, example]) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => loadExample(key as keyof typeof EXAMPLES)}
                  className="flex-1"
                >
                  {example.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Feature Input */}
          <Card>
            <CardHeader>
              <CardTitle>Características de la Vivienda</CardTitle>
              <CardDescription>
                13 variables del Boston Housing Dataset (el modelo selecciona las necesarias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="location" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="location">Ubicación</TabsTrigger>
                  <TabsTrigger value="property">Propiedad</TabsTrigger>
                  <TabsTrigger value="neighborhood">Vecindario</TabsTrigger>
                </TabsList>

                <TabsContent value="location" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureInput
                      label="CRIM"
                      description="Tasa de criminalidad per cápita"
                      value={features.CRIM}
                      onChange={(v) => updateFeature('CRIM', v)}
                      min={0}
                      max={100}
                      step={0.01}
                    />
                    <FeatureInput
                      label="ZN"
                      description="% terreno residencial (>25k sq.ft)"
                      value={features.ZN}
                      onChange={(v) => updateFeature('ZN', v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                    <FeatureInput
                      label="INDUS"
                      description="% acres comerciales no retail"
                      value={features.INDUS}
                      onChange={(v) => updateFeature('INDUS', v)}
                      min={0}
                      max={30}
                      step={0.1}
                    />
                    <FeatureInput
                      label="CHAS"
                      description="Río Charles (1=sí, 0=no)"
                      value={features.CHAS}
                      onChange={(v) => updateFeature('CHAS', v)}
                      min={0}
                      max={1}
                      step={1}
                    />
                    <FeatureInput
                      label="DIS"
                      description="Distancia a centros laborales"
                      value={features.DIS}
                      onChange={(v) => updateFeature('DIS', v)}
                      min={0}
                      max={20}
                      step={0.1}
                    />
                    <FeatureInput
                      label="RAD"
                      description="Índice acceso a autopistas"
                      value={features.RAD}
                      onChange={(v) => updateFeature('RAD', v)}
                      min={1}
                      max={24}
                      step={1}
                    />
                    <FeatureInput
                      label="NOX"
                      description="Concentración de óxidos nítricos"
                      value={features.NOX}
                      onChange={(v) => updateFeature('NOX', v)}
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="property" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureInput
                      label="RM"
                      description="Promedio de habitaciones"
                      value={features.RM}
                      onChange={(v) => updateFeature('RM', v)}
                      min={0}
                      max={15}
                      step={0.1}
                    />
                    <FeatureInput
                      label="AGE"
                      description="% viviendas construidas pre-1940"
                      value={features.AGE}
                      onChange={(v) => updateFeature('AGE', v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                    <FeatureInput
                      label="TAX"
                      description="Tasa impuesto predial/$10k"
                      value={features.TAX}
                      onChange={(v) => updateFeature('TAX', v)}
                      min={0}
                      max={1000}
                      step={1}
                    />
                    <FeatureInput
                      label="PTRATIO"
                      description="Ratio alumno-profesor"
                      value={features.PTRATIO}
                      onChange={(v) => updateFeature('PTRATIO', v)}
                      min={10}
                      max={25}
                      step={0.1}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="neighborhood" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FeatureInput
                      label="B"
                      description="Índice proporción afroamericanos"
                      value={features.B}
                      onChange={(v) => updateFeature('B', v)}
                      min={0}
                      max={400}
                      step={1}
                    />
                    <FeatureInput
                      label="LSTAT"
                      description="% población bajo estatus"
                      value={features.LSTAT}
                      onChange={(v) => updateFeature('LSTAT', v)}
                      min={0}
                      max={40}
                      step={0.1}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <Button 
                  onClick={handlePredict} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Prediciendo...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Predecir Precio
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Prediction Result */}
          <Card className={prediction ? 'border-green-500' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!prediction && !error && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Ingresa las características y haz clic en "Predecir Precio"
                  </p>
                </div>
              )}

              {prediction && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Predicción Exitosa
                    </Badge>
                    <p className="text-sm text-muted-foreground mb-2">Precio Estimado</p>
                    <p className="text-4xl font-bold text-primary">
                      ${((prediction.prediction || prediction.predicted_price || 0) * 1000).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rango inferior (90%)</span>
                      <span className="font-semibold">
                        ${(((prediction.prediction || prediction.predicted_price || 0) * 1000) * 0.9).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rango superior (110%)</span>
                      <span className="font-semibold">
                        ${(((prediction.prediction || prediction.predicted_price || 0) * 1000) * 1.1).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tiempo de inferencia</span>
                      <span className="font-semibold">
                        {(prediction.inference_time || prediction.inference_time_ms || 0).toFixed(1)}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modelo</span>
                      <span className="font-semibold">{prediction.model_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ID Predicción</span>
                      <span className="font-mono text-xs">{prediction.prediction_id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sobre las Variables</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>
                <strong>RM</strong> y <strong>LSTAT</strong> son las variables más importantes 
                según el análisis SHAP.
              </p>
              <p>
                El modelo fue entrenado con 10 de las 13 features originales del dataset 
                Boston Housing, seleccionadas por su mayor poder predictivo.
              </p>
              <p className="text-xs">
                Modelo: XGBoost Regressor | R²: 91.7% | RMSE: 2.46
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Component
interface FeatureInputProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

function FeatureInput({ label, description, value, onChange, min, max, step }: FeatureInputProps) {
  return (
    <div>
      <Label htmlFor={label} className="text-sm font-semibold">
        {label}
      </Label>
      <p className="text-xs text-muted-foreground mb-1">{description}</p>
      <Input
        id={label}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="font-mono"
      />
    </div>
  );
}
