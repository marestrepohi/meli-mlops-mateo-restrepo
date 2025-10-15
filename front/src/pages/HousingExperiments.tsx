/**
 * MLflow Experiments Dashboard
 * Shows all experiments, runs, metrics, and artifacts
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Activity,
  CheckCircle2,
  FileCode,
  Layers
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Datos basados en best_model_info.json
const EXPERIMENTS = [
  {
    id: '01',
    name: '01_hyperparameter_tuning',
    description: 'XGBoost con todas las features (13) y tuning de hiperparámetros',
    status: 'completed',
    runs: 1,
    bestMetrics: {
      rmse: 2.89,
      r2: 0.8945,
      mae: 2.15,
      mape: 11.8
    },
    params: {
      n_estimators: 100,
      max_depth: 6,
      learning_rate: 0.1,
      n_features: 13
    }
  },
  {
    id: '02',
    name: '02_important_features',
    description: 'Top 10 features seleccionadas con SHAP (percentil 20)',
    status: 'completed',
    runs: 1,
    bestMetrics: {
      rmse: 2.464,
      r2: 0.9172,
      mae: 1.906,
      mape: 10.28
    },
    params: {
      n_estimators: 100,
      max_depth: 6,
      learning_rate: 0.1,
      n_features: 10
    },
    isBest: true
  },
  {
    id: '03',
    name: '03_tuning_on_selected',
    description: 'Tuning adicional sobre las 10 features seleccionadas',
    status: 'completed',
    runs: 1,
    bestMetrics: {
      rmse: 2.52,
      r2: 0.9125,
      mae: 1.95,
      mape: 10.5
    },
    params: {
      n_estimators: 150,
      max_depth: 7,
      learning_rate: 0.08,
      n_features: 10
    }
  }
];

const SELECTED_FEATURES = [
  { name: 'CRIM', importance: 0.12, description: 'Per capita crime rate' },
  { name: 'NOX', importance: 0.08, description: 'Nitric oxides concentration' },
  { name: 'RM', importance: 0.22, description: 'Average number of rooms' },
  { name: 'AGE', importance: 0.06, description: 'Proportion built before 1940' },
  { name: 'DIS', importance: 0.09, description: 'Distance to employment centers' },
  { name: 'RAD', importance: 0.07, description: 'Accessibility to highways' },
  { name: 'TAX', importance: 0.11, description: 'Property tax rate' },
  { name: 'PTRATIO', importance: 0.10, description: 'Pupil-teacher ratio' },
  { name: 'B', importance: 0.05, description: 'Proportion of Black residents' },
  { name: 'LSTAT', importance: 0.18, description: 'Lower status population %' }
];

export default function HousingExperiments() {
  const [selectedExperiment, setSelectedExperiment] = useState(EXPERIMENTS[1]); // Best one

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Experimentos MLflow
        </h1>
        <p className="text-muted-foreground">
          3 experimentos ejecutados con XGBoost para optimizar el modelo de predicción
        </p>
      </div>

      {/* Summary Cards */}
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
              <TrendingUp className="h-4 w-4" />
              Mejor R²
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">91.7%</div>
            <p className="text-xs text-muted-foreground">Experimento #2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Mejor RMSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.46</div>
            <p className="text-xs text-muted-foreground">02_important_features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10/13</div>
            <p className="text-xs text-muted-foreground">Seleccionadas con SHAP</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="experiments">Experimentos</TabsTrigger>
          <TabsTrigger value="comparison">Comparación</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          {EXPERIMENTS.map((exp) => (
            <Card 
              key={exp.id}
              className={exp.isBest ? 'border-green-500 border-2' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{exp.name}</CardTitle>
                      {exp.isBest && (
                        <Badge variant="default" className="bg-green-600">
                          <Award className="h-3 w-3 mr-1" />
                          Mejor Modelo
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {exp.status}
                      </Badge>
                    </div>
                    <CardDescription>{exp.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard label="RMSE" value={exp.bestMetrics.rmse} />
                  <MetricCard label="R²" value={exp.bestMetrics.r2} isPercentage />
                  <MetricCard label="MAE" value={exp.bestMetrics.mae} />
                  <MetricCard label="MAPE" value={exp.bestMetrics.mape} suffix="%" />
                  <MetricCard label="Features" value={exp.params.n_features} />
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Hiperparámetros</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(exp.params).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="font-mono text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Métricas</CardTitle>
              <CardDescription>
                Comparación lado a lado de los 3 experimentos ejecutados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experimento</TableHead>
                    <TableHead className="text-right">RMSE ↓</TableHead>
                    <TableHead className="text-right">R² ↑</TableHead>
                    <TableHead className="text-right">MAE ↓</TableHead>
                    <TableHead className="text-right">MAPE ↓</TableHead>
                    <TableHead className="text-right">Features</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EXPERIMENTS.map((exp) => (
                    <TableRow key={exp.id} className={exp.isBest ? 'bg-green-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {exp.name}
                          {exp.isBest && <Award className="h-4 w-4 text-green-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {exp.bestMetrics.rmse.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(exp.bestMetrics.r2 * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {exp.bestMetrics.mae.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {exp.bestMetrics.mape.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {exp.params.n_features}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">🏆 Ganador: 02_important_features</h4>
                <p className="text-sm text-muted-foreground">
                  El experimento con feature selection (SHAP) superó al baseline, logrando 
                  mejor RMSE (2.464 vs 2.89) y R² (91.72% vs 89.45%) usando solo 10 de 13 features.
                  Esto demuestra que menos features pueden producir mejores resultados eliminando ruido.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance (SHAP)</CardTitle>
              <CardDescription>
                10 features seleccionadas del experimento ganador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SELECTED_FEATURES
                  .sort((a, b) => b.importance - a.importance)
                  .map((feature) => (
                    <div key={feature.name}>
                      <div className="flex justify-between mb-1">
                        <div>
                          <span className="font-mono font-semibold">{feature.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {feature.description}
                          </span>
                        </div>
                        <span className="font-semibold">
                          {(feature.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${feature.importance * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Top 3 Features</h4>
                  <ul className="text-sm space-y-1">
                    <li>🥇 <strong>RM</strong> (22%) - Número de habitaciones</li>
                    <li>🥈 <strong>LSTAT</strong> (18%) - % población bajo estatus</li>
                    <li>🥉 <strong>CRIM</strong> (12%) - Tasa de criminalidad</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Features Excluidas</h4>
                  <ul className="text-sm space-y-1">
                    <li>❌ <strong>ZN</strong> - Zonas residenciales</li>
                    <li>❌ <strong>INDUS</strong> - Proporción no retail</li>
                    <li>❌ <strong>CHAS</strong> - Río Charles</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Artifacts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Artefactos Generados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ArtifactBadge name="best_model.pkl" type="Model" />
            <ArtifactBadge name="best_model_info.json" type="Metadata" />
            <ArtifactBadge name="best_metrics.json" type="Metrics" />
            <ArtifactBadge name="experiments_summary.json" type="Summary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function MetricCard({ label, value, isPercentage, suffix }: any) {
  const displayValue = isPercentage ? (value * 100).toFixed(2) : value.toFixed(3);
  const finalSuffix = isPercentage ? '%' : suffix || '';

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold">
        {displayValue}{finalSuffix}
      </p>
    </div>
  );
}

function ArtifactBadge({ name, type }: { name: string; type: string }) {
  return (
    <div className="p-3 border rounded-lg">
      <Badge variant="secondary" className="mb-2 text-xs">{type}</Badge>
      <p className="font-mono text-xs truncate">{name}</p>
    </div>
  );
}
