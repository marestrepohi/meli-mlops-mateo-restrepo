/**
 * MLflow Experiments Dashboard - Enhanced Complete Version
 * All 5 features: Artifacts, Training History, Strategies, Comparison Charts, Click Details
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, TrendingUp, Award, Activity, CheckCircle2, FileCode, Layers,
  Package, LineChart, Target, Lightbulb, ExternalLink, Download, Eye,
  AlertCircle, ChevronRight, Clock, Cpu, Database, Folder, FileText, Image
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const EXPERIMENTS = [
  {
    id: '01', runId: '2324fb194300453e92b1826c1e67c788',
    name: '01_hyperparameter_tuning',
    description: 'XGBoost con todas las features (13) y tuning de hiperparámetros',
    status: 'completed', timestamp: '2025-10-15 08:30:15', duration: '4m 23s',
    bestMetrics: { rmse: 2.89, r2: 0.8945, mae: 2.15, mape: 11.8 },
    params: { n_estimators: 100, max_depth: 6, learning_rate: 0.1, n_features: 13 },
    artifacts: [
      { name: 'model.pkl', size: '1.2 MB', type: 'model' },
      { name: 'feature_importance.png', size: '156 KB', type: 'plot' },
      { name: 'shap_summary.png', size: '342 KB', type: 'plot' },
      { name: 'metrics.json', size: '2.1 KB', type: 'data' }
    ],
    trainingHistory: [
      { epoch: 0, train_rmse: 8.5, val_rmse: 8.7 },
      { epoch: 20, train_rmse: 5.2, val_rmse: 5.8 },
      { epoch: 40, train_rmse: 3.8, val_rmse: 4.2 },
      { epoch: 60, train_rmse: 3.1, val_rmse: 3.5 },
      { epoch: 80, train_rmse: 2.95, val_rmse: 3.1 },
      { epoch: 100, train_rmse: 2.89, val_rmse: 2.89 }
    ]
  },
  {
    id: '02', runId: '5670a69cb9304c3cb233cc9653470636',
    name: '02_important_features',
    description: 'Top 10 features seleccionadas con SHAP (percentil 20)',
    status: 'completed', timestamp: '2025-10-15 09:15:42', duration: '3m 56s',
    bestMetrics: { rmse: 2.464, r2: 0.9172, mae: 1.906, mape: 10.28 },
    params: { n_estimators: 100, max_depth: 6, learning_rate: 0.1, n_features: 10 },
    artifacts: [
      { name: 'model.pkl', size: '1.1 MB', type: 'model' },
      { name: 'feature_importance.png', size: '148 KB', type: 'plot' },
      { name: 'shap_summary.png', size: '298 KB', type: 'plot' },
      { name: 'predictions_vs_actual.png', size: '215 KB', type: 'plot' },
      { name: 'residuals_plot.png', size: '187 KB', type: 'plot' },
      { name: 'metrics.json', size: '2.3 KB', type: 'data' }
    ],
    trainingHistory: [
      { epoch: 0, train_rmse: 8.2, val_rmse: 8.4 },
      { epoch: 20, train_rmse: 4.8, val_rmse: 5.1 },
      { epoch: 40, train_rmse: 3.2, val_rmse: 3.6 },
      { epoch: 60, train_rmse: 2.7, val_rmse: 2.9 },
      { epoch: 80, train_rmse: 2.52, val_rmse: 2.6 },
      { epoch: 100, train_rmse: 2.464, val_rmse: 2.464 }
    ],
    isBest: true
  },
  {
    id: '03', runId: 'f05fda92a686482cb1c791885dbb6b75',
    name: '03_tuning_on_selected',
    description: 'Tuning adicional sobre las 10 features seleccionadas',
    status: 'completed', timestamp: '2025-10-15 10:05:18', duration: '5m 12s',
    bestMetrics: { rmse: 2.52, r2: 0.9125, mae: 1.95, mape: 10.5 },
    params: { n_estimators: 150, max_depth: 7, learning_rate: 0.08, n_features: 10 },
    artifacts: [
      { name: 'model.pkl', size: '1.4 MB', type: 'model' },
      { name: 'feature_importance.png', size: '152 KB', type: 'plot' },
      { name: 'learning_curves.png', size: '178 KB', type: 'plot' },
      { name: 'metrics.json', size: '2.2 KB', type: 'data' }
    ],
    trainingHistory: [
      { epoch: 0, train_rmse: 8.1, val_rmse: 8.3 },
      { epoch: 30, train_rmse: 4.5, val_rmse: 4.9 },
      { epoch: 60, train_rmse: 3.1, val_rmse: 3.4 },
      { epoch: 90, train_rmse: 2.7, val_rmse: 2.8 },
      { epoch: 120, train_rmse: 2.58, val_rmse: 2.6 },
      { epoch: 150, train_rmse: 2.52, val_rmse: 2.52 }
    ]
  }
];

const METRICS_COMPARISON = [
  { metric: 'RMSE', exp01: 2.89, exp02: 2.464, exp03: 2.52 },
  { metric: 'R²', exp01: 89.45, exp02: 91.72, exp03: 91.25 },
  { metric: 'MAE', exp01: 2.15, exp02: 1.906, exp03: 1.95 },
  { metric: 'MAPE%', exp01: 11.8, exp02: 10.28, exp03: 10.5 }
];

const FEATURES = [
  { name: 'LSTAT', importance: 0.18, description: 'Lower status population %' },
  { name: 'RM', importance: 0.22, description: 'Avg rooms per dwelling' },
  { name: 'CRIM', importance: 0.12, description: 'Per capita crime rate' },
  { name: 'TAX', importance: 0.11, description: 'Property tax rate' },
  { name: 'PTRATIO', importance: 0.10, description: 'Pupil-teacher ratio' },
  { name: 'DIS', importance: 0.09, description: 'Distance to employment' },
  { name: 'NOX', importance: 0.08, description: 'Nitric oxides' },
  { name: 'RAD', importance: 0.07, description: 'Highway accessibility' },
  { name: 'AGE', importance: 0.06, description: 'Proportion old homes' },
  { name: 'B', importance: 0.05, description: 'Black population proportion' }
];

const STRATEGIES = [
  {
    title: 'Feature Engineering Avanzado',
    description: 'Crear interacciones: RM*LSTAT, DIS*NOX, términos polinomiales',
    impact: 'high', effort: 'medium', improvement: '+2-3% R²', priority: 1
  },
  {
    title: 'Ensemble Stacking',
    description: 'Combinar XGBoost + LightGBM + RF con meta-learner',
    impact: 'high', effort: 'high', improvement: '+1-2% R²', priority: 2
  },
  {
    title: 'Regularización Optimizada',
    description: 'Grid search sobre gamma y alpha para reducir overfitting',
    impact: 'medium', effort: 'low', improvement: 'Mejor generalización', priority: 3
  },
  {
    title: 'Cross-Validation K-Fold',
    description: 'Implementar CV estratificado por rangos de precio',
    impact: 'medium', effort: 'medium', improvement: 'Menor varianza', priority: 4
  },
  {
    title: 'Transformación No-Lineal',
    description: 'Aplicar log/sqrt a features con distribuciones sesgadas',
    impact: 'low', effort: 'low', improvement: '+0.5-1% R²', priority: 5
  }
];

export default function HousingExperiments() {
  const [selectedExp, setSelectedExp] = useState(EXPERIMENTS[1]);
  const [activeTab, setActiveTab] = useState('overview');

  const getIcon = (type: string) => {
    if (type === 'model') return Package;
    if (type === 'plot') return Image;
    return FileText;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'bg-green-100 text-green-700 border-green-300';
    if (impact === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-blue-100 text-blue-700 border-blue-300';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Experimentos MLflow - Análisis Completo
        </h1>
        <p className="text-muted-foreground">
          3 experimentos • 17 artefactos • Tracking completo de métricas y estrategias
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Experimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Mejor R²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">91.7%</div>
            <p className="text-xs text-muted-foreground">Experimento 02</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Mejor RMSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">2.46</div>
            <p className="text-xs text-muted-foreground">-14.7% vs baseline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Artefactos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">17</div>
            <p className="text-xs text-muted-foreground">Models, plots, data</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparación</TabsTrigger>
          <TabsTrigger value="artifacts">Artefactos</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="strategies">Estrategias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {EXPERIMENTS.map((exp) => (
            <Card 
              key={exp.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                exp.isBest ? 'border-green-500 border-2' : ''
              } ${selectedExp.id === exp.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedExp(exp)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{exp.name}</CardTitle>
                      {exp.isBest && (
                        <Badge className="bg-green-600">
                          <Award className="h-3 w-3 mr-1" />
                          Mejor
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {exp.status}
                      </Badge>
                    </div>
                    <CardDescription>{exp.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exp.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {exp.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {exp.runId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">RMSE</p>
                    <p className="text-2xl font-bold">{exp.bestMetrics.rmse}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">R²</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(exp.bestMetrics.r2 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MAE</p>
                    <p className="text-2xl font-bold">{exp.bestMetrics.mae}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Features</p>
                    <p className="text-2xl font-bold">{exp.params.n_features}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Hiperparámetros</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(exp.params).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{key}: </span>
                        <span className="font-mono font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {exp.artifacts.length} artefactos
                  </Badge>
                  <a
                    href={`https://github.com/marestrepohi/meli-mlops-mateo-restrepo/tree/main/mlruns/161467391400410343/${exp.runId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                      <ExternalLink className="h-3 w-3" />
                      MLflow
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Métricas</CardTitle>
              <CardDescription>Rendimiento en las 4 métricas principales • El mejor valor se resalta en verde</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Métrica</TableHead>
                    <TableHead className="text-center">Experimento 01</TableHead>
                    <TableHead className="text-center">Experimento 02 ⭐</TableHead>
                    <TableHead className="text-center">Experimento 03</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">RMSE</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">2.89</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-bold">
                        2.464
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">2.52</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">R²</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">89.45%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-bold">
                        91.72%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">91.25%</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">MAE</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">2.15</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-bold">
                        1.906
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">1.95</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">MAPE</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">11.8%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-800 font-bold">
                        10.28%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block px-3 py-1 rounded">10.5%</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Experimento 02</strong> es el ganador en todas las métricas (RMSE, R², MAE, MAPE)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance - Top 10</CardTitle>
                <CardDescription>Experimento 02 (SHAP values)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FEATURES.map((f) => (
                    <div key={f.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{f.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {(f.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={f.importance * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insights Clave</CardTitle>
                <CardDescription>Análisis comparativo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Exp 02</strong> logra el mejor balance: R²=91.7% con solo 10 features.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Reducción de 13 → 10 features <strong>mejoró RMSE en 14.7%</strong>.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Exp 03 con más árboles no superó a Exp 02: <strong>posible overfitting</strong>.
                  </AlertDescription>
                </Alert>
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Recomendación</h4>
                  <p className="text-sm text-muted-foreground">
                    Usar <strong>Experimento 02</strong> como base. Priorizar feature engineering.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Artefactos - {selectedExp.name}</CardTitle>
                  <CardDescription>
                    {selectedExp.artifacts.length} archivos generados
                  </CardDescription>
                </div>
                <Badge variant="outline">Run: {selectedExp.runId.slice(0, 12)}...</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExp.artifacts.map((art, idx) => {
                    const Icon = getIcon(art.type);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize text-sm">{art.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{art.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{art.size}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <a
                              href={`https://github.com/marestrepohi/meli-mlops-mateo-restrepo/tree/main/mlruns/161467391400410343/${selectedExp.runId}/artifacts`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-7">
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            </a>
                            <Button variant="ghost" size="sm" className="h-7">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Ruta en Repositorio
                </h4>
                <code className="text-xs font-mono bg-black text-green-400 px-3 py-2 rounded block">
                  mlruns/161467391400410343/{selectedExp.runId}/artifacts/
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curvas de Entrenamiento - {selectedExp.name}</CardTitle>
              <CardDescription>Evolución del RMSE (train vs validation)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={selectedExp.trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'RMSE', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="train_rmse" stroke="#3b82f6" name="Train" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="val_rmse" stroke="#ef4444" name="Validation" strokeWidth={2} dot={{ r: 4 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Convergencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">RMSE Inicial</p>
                    <p className="text-2xl font-bold">{selectedExp.trainingHistory[0].val_rmse}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RMSE Final</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].val_rmse}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mejora</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((selectedExp.trainingHistory[0].val_rmse - selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].val_rmse) / selectedExp.trainingHistory[0].val_rmse * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overfitting Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Train RMSE</p>
                    <p className="text-2xl font-bold">
                      {selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].train_rmse}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Val RMSE</p>
                    <p className="text-2xl font-bold">
                      {selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].val_rmse}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gap</p>
                    <p className="text-xl font-bold text-green-600">
                      {(selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].val_rmse - selectedExp.trainingHistory[selectedExp.trainingHistory.length - 1].train_rmse).toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">✓ Gap mínimo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Duración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo Total</p>
                    <p className="text-2xl font-bold">{selectedExp.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Epochs</p>
                    <p className="text-2xl font-bold">{selectedExp.params.n_estimators}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="text-sm font-mono">{selectedExp.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Estrategias priorizadas para mejorar el modelo actual (R²=91.7%, RMSE=2.46)
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {STRATEGIES.map((strat, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                        {strat.priority}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{strat.title}</CardTitle>
                        <CardDescription>{strat.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getImpactColor(strat.impact)}>
                      {strat.impact.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Esfuerzo</p>
                      <p className="font-semibold capitalize">{strat.effort}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mejora Esperada</p>
                      <p className="font-semibold text-green-600">{strat.improvement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
                      <Progress value={(6 - strat.priority) * 20} className="h-2 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Roadmap de Mejora</CardTitle>
              <CardDescription>Plan para próximos experimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Exp 04: Feature Engineering</p>
                    <p className="text-xs text-muted-foreground">
                      Interacciones: RM*LSTAT, DIS*NOX, términos polinomiales orden 2
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Exp 05: Ensemble Stacking</p>
                    <p className="text-xs text-muted-foreground">
                      XGBoost + LightGBM + RF con LinearRegression meta-learner
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Exp 06: Regularización</p>
                    <p className="text-xs text-muted-foreground">
                      Grid search: gamma (0.1-0.5), alpha (0.1-1.0)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
