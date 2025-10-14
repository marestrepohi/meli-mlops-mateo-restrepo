import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Database, Info, HelpCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import EDAExplorer from "./EDAExplorer";
import DataLineage from "./DataLineage";
import MLflowViewer from "./MLflowViewer";
import DriftMonitor from "./DriftMonitor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ModelInfo {
  name: string;
  displayName: string;
  type: string;
  status: "production" | "available";
  r2Score: number;
  rmse: number;
  lastTrained: string;
  description: string;
}

const Models = () => {
  const models: ModelInfo[] = [
    {
      name: "GradientBoosting",
      displayName: "Gradient Boosting",
      type: "Ensemble",
      status: "production",
      r2Score: 0.7761,
      rmse: 0.5416,
      lastTrained: "2025-10-12",
      description: "Modelo de ensamble basado en árboles con gradiente descendente optimizado."
    },
    {
      name: "RandomForest",
      displayName: "Random Forest",
      type: "Ensemble",
      status: "available",
      r2Score: 0.7664,
      rmse: 0.5533,
      lastTrained: "2025-10-12",
      description: "Modelo de ensamble con múltiples árboles de decisión."
    },
    {
      name: "LinearRegression",
      displayName: "Linear Regression",
      type: "Linear",
      status: "available",
      r2Score: 0.5758,
      rmse: 0.7456,
      lastTrained: "2025-10-12",
      description: "Modelo de regresión lineal simple."
    },
    {
      name: "Ridge",
      displayName: "Ridge Regression",
      type: "Linear",
      status: "available",
      r2Score: 0.5758,
      rmse: 0.7456,
      lastTrained: "2025-10-12",
      description: "Regresión lineal con regularización L2."
    }
  ];

  const productionModel = models.find(m => m.status === "production");

  const getMetricsHistory = (model: ModelInfo) => [
    { date: "01/10", r2: 0.90, rmse: 0.65 },
    { date: "08/10", r2: 0.92, rmse: 0.60 },
    { date: "15/10", r2: 0.94, rmse: 0.58 },
    { date: "22/10", r2: 0.95, rmse: 0.56 },
    { date: "29/10", r2: model.r2Score, rmse: model.rmse },
  ];

  const featureImportance = [
    { feature: "RM", importance: 0.42 },
    { feature: "LSTAT", importance: 0.31 },
    { feature: "PTRATIO", importance: 0.12 },
    { feature: "DIS", importance: 0.08 },
    { feature: "NOX", importance: 0.04 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Model Components & Elements</h1>
            <p className="text-muted-foreground">
              Comprehensive information including General Information, business requirements, Approval, Interconnected models, and Documentation.
            </p>
          </div>

          {/* UNA CAJA DEL PROYECTO HOUSING PRICE PREDICTION */}
          <Accordion type="single" collapsible defaultValue="housing-project">
            <AccordionItem 
              value="housing-project" 
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-6 py-4 bg-card hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <Database className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg flex items-center gap-2">
                          Housing Price Prediction
                          <Badge className="bg-green-500 text-white">Active Project</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sistema de predicción de precios de vivienda • {models.length} modelos entrenados • En producción: {productionModel?.displayName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Models</div>
                      <div className="font-semibold">{models.length}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Dataset</div>
                      <div className="font-semibold">20,640</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Best R²</div>
                      <div className="font-semibold text-green-500">{(productionModel?.r2Score! * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
                
              <AccordionContent className="px-6 pb-6">
                <Tabs defaultValue="models" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    <TabsTrigger value="models">Trained Models</TabsTrigger>
                    <TabsTrigger value="eda">EDA</TabsTrigger>
                    <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
                    <TabsTrigger value="experiments">Experiments</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                  </TabsList>

                  {/* TAB: Modelos Entrenados */}
                  <TabsContent value="models" className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Modelos Entrenados</h3>
                      <p className="text-sm text-muted-foreground">
                        {models.length} modelos disponibles. El modelo con mejor desempeño (R² Score) está en producción.
                      </p>
                    </div>

                    {/* Explicación de métricas */}
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-blue-900">📊 Métricas de Evaluación del Modelo:</p>
                          <ul className="space-y-1 ml-4">
                            <li>
                              <strong>R² Score (Coeficiente de Determinación):</strong> Mide qué tan bien el modelo explica la variabilidad de los datos. 
                              Rango: 0-100%. <span className="text-green-600">Valores más altos = mejor modelo</span>. 
                              Un R² de 77% significa que el modelo explica el 77% de la variación en los precios.
                            </li>
                            <li>
                              <strong>RMSE (Root Mean Square Error):</strong> Error promedio de las predicciones en las mismas unidades que la variable objetivo. 
                              <span className="text-green-600">Valores más bajos = mejor modelo</span>. 
                              Representa cuánto se desvía típicamente la predicción del valor real.
                            </li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Modelo en Producción (destacado) */}
                    <Card className="border-green-500/30 bg-green-50/5">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {productionModel?.displayName}
                              <Badge className="bg-green-500 text-white">En Producción</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {productionModel?.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-3 bg-background rounded-lg border-2 border-green-200 relative group">
                            <HelpCircle className="absolute top-2 right-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-2xl font-bold text-green-500">
                              {(productionModel?.r2Score! * 100).toFixed(2)}%
                            </div>
                            <div className="text-sm text-muted-foreground">R² Score</div>
                            <div className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Calidad de ajuste del modelo
                            </div>
                          </div>
                          <div className="text-center p-3 bg-background rounded-lg border-2 border-blue-200 relative group">
                            <HelpCircle className="absolute top-2 right-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-xl font-bold">{productionModel?.rmse.toFixed(4)}</div>
                            <div className="text-sm text-muted-foreground">RMSE</div>
                            <div className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Error promedio de predicción
                            </div>
                          </div>
                          <div className="text-center p-3 bg-background rounded-lg">
                            <div className="text-sm font-medium">{productionModel?.type}</div>
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {productionModel?.type === "Ensemble" ? "Múltiples modelos combinados" : "Modelo único"}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-background rounded-lg">
                            <div className="text-sm font-medium">{productionModel?.lastTrained}</div>
                            <div className="text-sm text-muted-foreground">Last Trained</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Última actualización
                            </div>
                          </div>
                        </div>

                        {/* Feature Importance del modelo en producción */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Feature Importance (Importancia de Variables)</h4>
                            <div title="Muestra qué variables tienen más impacto en las predicciones">
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Variables con mayor importancia tienen más influencia en las predicciones del precio. 
                            El modelo en producción da mayor peso a estas características.
                          </p>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={featureImportance}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="feature" stroke="hsl(var(--muted-foreground))" />
                              <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Importancia', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                                formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Importancia']}
                              />
                              <Bar dataKey="importance" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Performance Evolution */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Performance Evolution (Evolución del Rendimiento)</h4>
                            <div title="Muestra cómo mejora el modelo a través del tiempo">
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Seguimiento histórico de métricas. <span className="text-blue-600 font-medium">R² debe subir</span> (mejor ajuste) y 
                            <span className="text-red-600 font-medium"> RMSE debe bajar</span> (menor error) con cada reentrenamiento.
                          </p>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={getMetricsHistory(productionModel!)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" label={{ value: 'Fecha', position: 'insideBottom', offset: -5 }} />
                              <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: 'Valor Métrica', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                                formatter={(value: any, name: string) => [
                                  name === 'R²' ? `${(value * 100).toFixed(1)}%` : value.toFixed(4), 
                                  name
                                ]}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '10px' }}
                                formatter={(value) => value === 'r2' ? 'R² Score (↑ mejor)' : 'RMSE (↓ mejor)'}
                              />
                              <Line type="monotone" dataKey="r2" stroke="#10b981" strokeWidth={3} name="R²" dot={{ fill: '#10b981', r: 4 }} />
                              <Line type="monotone" dataKey="rmse" stroke="#ef4444" strokeWidth={3} name="RMSE" dot={{ fill: '#ef4444', r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Otros modelos disponibles */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Otros Modelos Disponibles</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {models.filter(m => m.status !== "production").map((model) => (
                          <Card key={model.name} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <CardTitle className="text-base flex items-center justify-between">
                                <span>{model.displayName}</span>
                                <Badge variant="outline">{model.type}</Badge>
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {model.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">R² Score:</span>
                                <span className="font-semibold">{(model.r2Score * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">RMSE:</span>
                                <span className="font-semibold">{model.rmse.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Trained:</span>
                                <span className="text-xs">{model.lastTrained}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: EDA */}
                  <TabsContent value="eda">
                    <EDAExplorer />
                  </TabsContent>

                  {/* TAB: Data Lineage */}
                  <TabsContent value="lineage">
                    <DataLineage />
                  </TabsContent>

                  {/* TAB: Experiments (MLflow) */}
                  <TabsContent value="experiments">
                    <MLflowViewer />
                  </TabsContent>

                  {/* TAB: Monitoring (Drift) */}
                  <TabsContent value="monitoring">
                    <DriftMonitor />
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Models;
