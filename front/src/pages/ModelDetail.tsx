import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, TrendingUp, Database, BarChart3, GitBranch, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const ModelDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  // Mock data - in real app, fetch based on id
  const model = {
    id: id,
    name: "Boston Housing Price Predictor",
    type: "Random Forest Regressor",
    accuracy: "94.7%",
    status: "production" as const,
    inferenceTime: "87ms",
    lastTrained: "hace 2 horas",
  };

  // Historical metrics data
  const metricsHistory = [
    { date: "01/10", accuracy: 92.1, mae: 3.2, inference: 95 },
    { date: "08/10", accuracy: 92.8, mae: 3.0, inference: 91 },
    { date: "15/10", accuracy: 93.5, mae: 2.9, inference: 89 },
    { date: "22/10", accuracy: 94.1, mae: 2.85, inference: 88 },
    { date: "29/10", accuracy: 94.7, mae: 2.84, inference: 87 },
  ];

  // Dataset statistics
  const datasetStats = {
    name: "Boston Housing Dataset",
    samples: 506,
    features: 13,
    target: "MEDV (Median value)",
    split: "80/20 Train/Test",
    lastUpdated: "hace 1 semana",
  };

  // Feature importance data
  const featureImportance = [
    { feature: "RM (rooms)", importance: 0.42 },
    { feature: "LSTAT (% lower status)", importance: 0.31 },
    { feature: "PTRATIO (pupil-teacher)", importance: 0.12 },
    { feature: "DIS (distance to centers)", importance: 0.08 },
    { feature: "NOX (nitric oxides)", importance: 0.04 },
    { feature: "CRIM (crime rate)", importance: 0.03 },
  ];

  // Pipeline runs
  const pipelineRuns = [
    { id: 1, status: "completed", duration: "12m 30s", timestamp: "hace 2 horas", accuracy: "94.7%" },
    { id: 2, status: "completed", duration: "11m 45s", timestamp: "hace 1 día", accuracy: "94.1%" },
    { id: 3, status: "completed", duration: "12m 15s", timestamp: "hace 2 días", accuracy: "93.8%" },
    { id: 4, status: "failed", duration: "8m 20s", timestamp: "hace 3 días", accuracy: "-" },
    { id: 5, status: "completed", duration: "12m 05s", timestamp: "hace 4 días", accuracy: "93.5%" },
  ];

  const statusConfig = {
    production: { label: "EN PRODUCCIÓN", color: "bg-accent text-accent-foreground" },
    training: { label: "ENTRENANDO", color: "bg-primary text-primary-foreground" },
    testing: { label: "EN PRUEBAS", color: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{model.name}</h1>
              <div className="flex items-center gap-3">
                <Badge className={statusConfig[model.status].color}>
                  {statusConfig[model.status].label}
                </Badge>
                <span className="text-sm text-muted-foreground">{model.type}</span>
              </div>
            </div>
            <Button size="lg">
              <Play className="w-4 h-4 mr-2" />
              Retrain Model
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Precisión</span>
              </div>
              <div className="text-2xl font-bold">{model.accuracy}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Inferencia</span>
              </div>
              <div className="text-2xl font-bold">{model.inferenceTime}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Datos</span>
              </div>
              <div className="text-2xl font-bold">{datasetStats.samples}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Última actualización</span>
              </div>
              <div className="text-lg font-bold">{model.lastTrained}</div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="dataset">Dataset</TabsTrigger>
            <TabsTrigger value="eda">EDA</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Descripción del Modelo</h3>
              <p className="text-muted-foreground mb-4">
                Este modelo predice el valor medio de viviendas en Boston utilizando características como
                número de habitaciones, tasa de criminalidad, y distancia a centros de empleo.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Algoritmo</div>
                  <div className="font-medium">{model.type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Versión</div>
                  <div className="font-medium">v2.4.1</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Hiperparámetros</div>
                  <div className="font-medium">100 estimators, max_depth=10</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Entorno</div>
                  <div className="font-medium">Production (Docker)</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Importancia de Features</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureImportance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="feature" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }} 
                  />
                  <Bar dataKey="importance" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Evolución de Precisión</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))" 
                    }} 
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">MAE en el Tiempo</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))" 
                      }} 
                    />
                    <Line type="monotone" dataKey="mae" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Tiempo de Inferencia</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))" 
                      }} 
                    />
                    <Line type="monotone" dataKey="inference" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Dataset Tab */}
          <TabsContent value="dataset" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Información del Dataset</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Nombre</div>
                  <div className="font-medium">{datasetStats.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Muestras Totales</div>
                  <div className="font-medium">{datasetStats.samples}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Features</div>
                  <div className="font-medium">{datasetStats.features}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Variable Target</div>
                  <div className="font-medium">{datasetStats.target}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Split Train/Test</div>
                  <div className="font-medium">{datasetStats.split}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Última Actualización</div>
                  <div className="font-medium">{datasetStats.lastUpdated}</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Features del Dataset</h3>
              <div className="space-y-2">
                {[
                  { name: "CRIM", description: "Tasa de criminalidad per cápita" },
                  { name: "ZN", description: "Proporción de terreno residencial" },
                  { name: "INDUS", description: "Proporción de acres de negocio no minorista" },
                  { name: "CHAS", description: "Variable dummy del río Charles" },
                  { name: "NOX", description: "Concentración de óxidos nítricos" },
                  { name: "RM", description: "Número promedio de habitaciones por vivienda" },
                  { name: "AGE", description: "Proporción de unidades ocupadas construidas antes de 1940" },
                  { name: "DIS", description: "Distancias ponderadas a centros de empleo" },
                  { name: "RAD", description: "Índice de accesibilidad a autopistas radiales" },
                  { name: "TAX", description: "Tasa de impuesto a la propiedad" },
                  { name: "PTRATIO", description: "Relación alumno-maestro por ciudad" },
                  { name: "B", description: "Proporción de población afroamericana" },
                  { name: "LSTAT", description: "% de población de estatus bajo" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* EDA Tab */}
          <TabsContent value="eda" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Análisis Exploratorio de Datos</h3>
              <p className="text-muted-foreground mb-6">
                Visualización de las principales características y distribuciones del dataset
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">Correlación con Target</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RM (rooms)</span>
                      <div className="flex-1 mx-2 bg-background h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "70%" }}></div>
                      </div>
                      <span className="text-sm font-medium">0.70</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">LSTAT</span>
                      <div className="flex-1 mx-2 bg-background h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "74%" }}></div>
                      </div>
                      <span className="text-sm font-medium">-0.74</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PTRATIO</span>
                      <div className="flex-1 mx-2 bg-background h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "51%" }}></div>
                      </div>
                      <span className="text-sm font-medium">-0.51</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-6 rounded-lg">
                  <h4 className="font-semibold mb-2">Estadísticas Descriptivas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Media Target:</span>
                      <span className="font-medium">$22.5K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desv. Estándar:</span>
                      <span className="font-medium">$9.2K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mín / Máx:</span>
                      <span className="font-medium">$5K / $50K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valores Nulos:</span>
                      <span className="font-medium">0 (0%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Distribución del Target</h3>
              <div className="bg-muted p-6 rounded-lg text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-muted-foreground">
                  Gráfico de distribución de precios de vivienda
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Pipelines Tab */}
          <TabsContent value="pipelines" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Historial de Ejecuciones</h3>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Nueva Ejecución
                </Button>
              </div>
              
              <div className="space-y-3">
                {pipelineRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        className={
                          run.status === "completed"
                            ? "bg-accent text-accent-foreground"
                            : "bg-destructive text-destructive-foreground"
                        }
                      >
                        {run.status === "completed" ? "Completado" : "Fallido"}
                      </Badge>
                      <div>
                        <div className="font-medium">Ejecución #{run.id}</div>
                        <div className="text-sm text-muted-foreground">{run.timestamp}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Duración</div>
                        <div className="font-medium">{run.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Precisión</div>
                        <div className="font-medium">{run.accuracy}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Pipeline Stages</h3>
              <div className="space-y-3">
                {[
                  { name: "Data Preprocessing", time: "2m 15s" },
                  { name: "Feature Engineering", time: "1m 30s" },
                  { name: "Model Training", time: "8m 42s" },
                  { name: "Model Evaluation", time: "1m 33s" },
                  { name: "Model Deployment", time: "0m 45s" },
                ].map((stage, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-sm text-muted-foreground">{stage.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelDetail;
