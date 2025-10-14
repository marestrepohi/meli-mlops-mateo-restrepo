import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Loader2, 
  Play, 
  RefreshCw,
  Server,
  Sparkles
} from "lucide-react";
// import { toast } from "sonner";

// API Base URL - usa el proxy de Vite en desarrollo
const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8000";

interface HealthResponse {
  status: string;
  model_loaded: boolean;
  scaler_loaded: boolean;
  model_name?: string;
  model_version?: string;
  model_stage?: string;
  uptime_seconds: number;
  total_predictions: number;
}

interface PredictionResponse {
  prediction: number;
  model_name: string;
  model_version: string;
  model_stage: string;
  inference_time: number;
  features_used: string[];
}

interface PredictionInput {
  CRIM: number;
  ZN?: number;
  INDUS?: number;
  CHAS?: number;
  NOX: number;
  RM: number;
  AGE: number;
  DIS: number;
  RAD: number;
  TAX: number;
  PTRATIO: number;
  B: number;
  LSTAT: number;
}

const defaultValues: PredictionInput = {
  CRIM: 0.00632,
  ZN: 18.0,
  INDUS: 2.31,
  CHAS: 0.0,
  NOX: 0.538,
  RM: 6.575,
  AGE: 65.2,
  DIS: 4.0900,
  RAD: 1.0,
  TAX: 296.0,
  PTRATIO: 15.3,
  B: 396.90,
  LSTAT: 4.98,
};

const featureDescriptions: Record<string, string> = {
  CRIM: "Per capita crime rate by town",
  ZN: "Proportion of residential land zoned (optional)",
  INDUS: "Proportion of non-retail business acres (optional)",
  CHAS: "Charles River dummy variable (optional)",
  NOX: "Nitric oxides concentration",
  RM: "Average number of rooms per dwelling",
  AGE: "Proportion of units built before 1940",
  DIS: "Distance to employment centers",
  RAD: "Accessibility to highways",
  TAX: "Property tax rate per $10,000",
  PTRATIO: "Pupil-teacher ratio",
  B: "Proportion of Black residents",
  LSTAT: "% lower status of population",
};

export default function APITester() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionInput>(defaultValues);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check API health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) throw new Error("API no disponible");
      const data = await response.json();
      setHealth(data);
      // toast.success("API conectada correctamente");
    } catch (err) {
      // toast.error("Error conectando con la API");
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictionInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? parseFloat(value) : undefined
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en la predicción");
      }

      const data: PredictionResponse = await response.json();
      setPrediction(data);
      // toast.success(`Predicción: $${data.prediction.toFixed(2)}k`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      // toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(defaultValues);
    setPrediction(null);
    setError(null);
  };

  const handleRandomize = () => {
    setFormData({
      CRIM: Math.random() * 10,
      ZN: Math.random() * 100,
      INDUS: Math.random() * 30,
      CHAS: Math.round(Math.random()),
      NOX: 0.3 + Math.random() * 0.5,
      RM: 4 + Math.random() * 4,
      AGE: Math.random() * 100,
      DIS: 1 + Math.random() * 10,
      RAD: Math.ceil(Math.random() * 24),
      TAX: 200 + Math.random() * 500,
      PTRATIO: 12 + Math.random() * 10,
      B: 200 + Math.random() * 200,
      LSTAT: Math.random() * 40,
    });
    // toast.info("Valores aleatorios generados");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Server className="h-10 w-10 text-primary" />
                API Tester
              </h1>
              <p className="text-muted-foreground mt-2">
                Prueba la API de predicción de precios de viviendas en tiempo real
              </p>
            </div>
            <Button
              onClick={checkHealth}
              variant="outline"
              disabled={healthLoading}
            >
              {healthLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Estado
            </Button>
          </div>

          {/* Health Status */}
          {health && (
            <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="font-semibold capitalize">{health.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="font-semibold">{health.model_version || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Predicciones</p>
                      <p className="font-semibold">{health.total_predictions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                      <p className="font-semibold">
                        {Math.floor(health.uptime_seconds / 60)}m
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <Badge variant="outline" className="text-xs">
                        {health.model_stage || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Entrada</CardTitle>
              <CardDescription>
                Ingresa las características de la vivienda (campos con * son requeridos por el modelo)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="required" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="required">Campos Requeridos (10)</TabsTrigger>
                  <TabsTrigger value="optional">Opcionales (3)</TabsTrigger>
                </TabsList>

                <TabsContent value="required" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(formData)
                      .filter(([key]) => !["ZN", "INDUS", "CHAS"].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key} className="flex items-center gap-2">
                            {key}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={key}
                            type="number"
                            step="0.00001"
                            value={value || ""}
                            onChange={(e) =>
                              handleInputChange(key as keyof PredictionInput, e.target.value)
                            }
                            placeholder={featureDescriptions[key]}
                          />
                          <p className="text-xs text-muted-foreground">
                            {featureDescriptions[key]}
                          </p>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="optional" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {["ZN", "INDUS", "CHAS"].map((key) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{key}</Label>
                        <Input
                          id={key}
                          type="number"
                          step="0.01"
                          value={formData[key as keyof PredictionInput] || ""}
                          onChange={(e) =>
                            handleInputChange(key as keyof PredictionInput, e.target.value)
                          }
                          placeholder={featureDescriptions[key]}
                        />
                        <p className="text-xs text-muted-foreground">
                          {featureDescriptions[key]}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex gap-2">
                <Button
                  onClick={handlePredict}
                  disabled={loading || !health?.model_loaded}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Prediciendo...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Predecir Precio
                    </>
                  )}
                </Button>
                <Button onClick={handleRandomize} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aleatorio
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Predicción</CardTitle>
              <CardDescription>
                Respuesta de la API con el precio predicho y metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!prediction && !error && (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <Server className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Ingresa los datos y haz clic en "Predecir Precio" para ver los resultados
                  </p>
                </div>
              )}

              {prediction && (
                <div className="space-y-6">
                  {/* Prediction Value */}
                  <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Precio Predicho</p>
                    <p className="text-5xl font-bold text-primary">
                      ${prediction.prediction.toFixed(2)}k
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      *Valor en miles de dólares
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="font-semibold">{prediction.model_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Versión</p>
                      <Badge variant="secondary">{prediction.model_version}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <Badge>{prediction.model_stage}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tiempo de Inferencia</p>
                      <p className="font-semibold">{prediction.inference_time.toFixed(2)}ms</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Features Used */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Features Utilizadas ({prediction.features_used.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {prediction.features_used.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* JSON Response */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Respuesta JSON</p>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(prediction, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Documentation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documentación de la API</CardTitle>
            <CardDescription>
              Ejemplos de uso de los endpoints disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`# Health Check
curl http://localhost:8000/health

# Predicción Individual
curl -X POST http://localhost:8000/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "CRIM": 0.00632,
    "NOX": 0.538,
    "RM": 6.575,
    "AGE": 65.2,
    "DIS": 4.09,
    "RAD": 1.0,
    "TAX": 296.0,
    "PTRATIO": 15.3,
    "B": 396.90,
    "LSTAT": 4.98
  }'

# Batch Prediction
curl -X POST http://localhost:8000/predict/batch \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": [
      {"CRIM": 0.00632, "NOX": 0.538, ...},
      {"CRIM": 0.02731, "NOX": 0.469, ...}
    ]
  }'`}
                </pre>
              </TabsContent>

              <TabsContent value="python" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`import requests

# Predicción Individual
response = requests.post(
    "http://localhost:8000/predict",
    json={
        "CRIM": 0.00632,
        "NOX": 0.538,
        "RM": 6.575,
        "AGE": 65.2,
        "DIS": 4.09,
        "RAD": 1.0,
        "TAX": 296.0,
        "PTRATIO": 15.3,
        "B": 396.90,
        "LSTAT": 4.98
    }
)

result = response.json()
print(f"Precio predicho: $" + str(result['prediction']) + "k")
print(f"Tiempo: " + str(result['inference_time']) + "ms")`}
                </pre>
              </TabsContent>

              <TabsContent value="javascript" className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
{`// Predicción Individual
const response = await fetch('http://localhost:8000/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    CRIM: 0.00632,
    NOX: 0.538,
    RM: 6.575,
    AGE: 65.2,
    DIS: 4.09,
    RAD: 1.0,
    TAX: 296.0,
    PTRATIO: 15.3,
    B: 396.90,
    LSTAT: 4.98
  })
});

const result = await response.json();
console.log('Precio predicho: $' + result.prediction.toFixed(2) + 'k');`}
                </pre>
              </TabsContent>
            </Tabs>

            <div className="mt-4">
              <Button variant="outline" asChild className="w-full">
                <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                  Ver Documentación Completa (Swagger)
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
