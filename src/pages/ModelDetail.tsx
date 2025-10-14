import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Database, GitBranch, AlertTriangle, TrendingUp, Clock, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import EDAExplorer from "./EDAExplorer";
import DataLineage from "./DataLineage";
import MLflowViewer from "./MLflowViewer";
import DriftMonitor from "./DriftMonitor";

interface ModelInfo {
  name: string;
  displayName: string;
  type: string;
  status: "production" | "available";
  r2Score: number;
  rmse: number;
  mae: number;
  lastTrained: string;
  description: string;
}

const modelData: { [key: string]: ModelInfo } = {
  GradientBoosting: {
    name: "GradientBoosting",
    displayName: "Gradient Boosting",
    type: "Ensemble",
    status: "production",
    r2Score: 0.7761,
    rmse: 0.5416,
    mae: 0.3710,
    lastTrained: "2025-10-12",
    description: "Modelo de ensamble basado en árboles con gradiente descendente optimizado."
  },
  RandomForest: {
    name: "RandomForest",
    displayName: "Random Forest",
    type: "Ensemble",
    status: "available",
    r2Score: 0.7664,
    rmse: 0.5533,
    mae: 0.3729,
    lastTrained: "2025-10-12",
    description: "Modelo de ensamble con múltiples árboles de decisión."
  },
  LinearRegression: {
    name: "LinearRegression",
    displayName: "Linear Regression",
    type: "Linear",
    status: "available",
    r2Score: 0.5758,
    rmse: 0.7456,
    mae: 0.5333,
    lastTrained: "2025-10-12",
    description: "Modelo de regresión lineal básico."
  },
  Ridge: {
    name: "Ridge",
    displayName: "Ridge Regression",
    type: "Linear",
    status: "available",
    r2Score: 0.5758,
    rmse: 0.7456,
    mae: 0.5333,
    lastTrained: "2025-10-12",
    description: "Regresión lineal con regularización L2."
  }
};

const ModelDetail = () => {
  const { modelName } = useParams<{ modelName: string }>();
  const model = modelName ? modelData[modelName] : null;

  if (!model) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Modelo no encontrado</p>
              <Link to="/" className="block mt-4">
                <Button variant="outline" className="w-full">Volver a modelos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metricsHistory = [
    { date: "01/10", r2: 0.92, rmse: 0.62, mae: 0.45 },
    { date: "08/10", r2: 0.93, rmse: 0.59, mae: 0.42 },
    { date: "15/10", r2: 0.94, rmse: 0.57, mae: 0.40 },
    { date: "22/10", r2: 0.95, rmse: 0.55, mae: 0.38 },
    { date: "29/10", r2: model.r2Score, rmse: model.rmse, mae: model.mae },
  ];

  const featureImportance = [
    { feature: "RM", importance: 0.42 },
    { feature: "LSTAT", importance: 0.31 },
    { feature: "PTRATIO", importance: 0.12 },
    { feature: "DIS", importance: 0.08 },
    { feature: "NOX", importance: 0.04 },
    { feature: "CRIM", importance: 0.03 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a modelos
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {model.displayName}
                {model.status === "production" && (
                  <Badge className="bg-green-500">En Producción</Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-2">{model.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                R² Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {(model.r2Score * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                RMSE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{model.rmse.toFixed(4)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                MAE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{model.mae.toFixed(4)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{model.type}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="eda">EDA</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
            <TabsTrigger value="experiments">MLflow</TabsTrigger>
            <TabsTrigger value="drift">Drift</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Modelo</CardTitle>
                <CardDescription>Detalles técnicos y métricas de rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Características</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Tipo de modelo:</span>
                        <span className="font-medium">{model.type}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant={model.status === "production" ? "default" : "outline"}>
                          {model.status === "production" ? "Producción" : "Disponible"}
                        </Badge>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Último entrenamiento:</span>
                        <span className="font-medium">{model.lastTrained}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Métricas de Evaluación</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">R² Score:</span>
                        <span className="font-medium">{(model.r2Score * 100).toFixed(2)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">RMSE:</span>
                        <span className="font-medium">{model.rmse.toFixed(4)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">MAE:</span>
                        <span className="font-medium">{model.mae.toFixed(4)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Dataset</h3>
                  <p className="text-sm text-muted-foreground">
                    California Housing Dataset - 20,640 muestras con 13 características
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="feature" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="importance" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Métricas</CardTitle>
                <CardDescription>Seguimiento histórico del rendimiento del modelo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="r2" stroke="hsl(var(--primary))" strokeWidth={2} name="R²" />
                    <Line type="monotone" dataKey="rmse" stroke="hsl(var(--destructive))" strokeWidth={2} name="RMSE" />
                    <Line type="monotone" dataKey="mae" stroke="hsl(var(--accent))" strokeWidth={2} name="MAE" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eda">
            <EDAExplorer />
          </TabsContent>

          <TabsContent value="lineage">
            <DataLineage />
          </TabsContent>

          <TabsContent value="experiments">
            <MLflowViewer />
          </TabsContent>

          <TabsContent value="drift">
            <DriftMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelDetail;
