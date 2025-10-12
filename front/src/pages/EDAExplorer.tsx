import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { edaAPI } from '@/lib/api';
import { Loader2, Database, TrendingUp, Activity, Info, HelpCircle } from 'lucide-react';

// Diccionario con explicaciones detalladas de cada feature del dataset California Housing
const FEATURE_DESCRIPTIONS: Record<string, { name: string; description: string; interpretation: string }> = {
  'MedInc': {
    name: 'Median Income',
    description: 'Ingreso mediano en bloques (en decenas de miles de dólares)',
    interpretation: 'Valores más altos indican áreas con mayor poder adquisitivo. Rango típico: 0.5-15.0'
  },
  'HouseAge': {
    name: 'House Age',
    description: 'Edad mediana de las viviendas en el bloque',
    interpretation: 'Edad promedio de las casas en años. Casas más antiguas pueden tener menor valor, pero ubicaciones céntricas suelen ser más antiguas.'
  },
  'AveRooms': {
    name: 'Average Rooms',
    description: 'Número promedio de habitaciones por vivienda',
    interpretation: 'Más habitaciones generalmente indica viviendas más grandes y costosas. Valores muy altos pueden indicar hoteles o edificios comerciales.'
  },
  'AveBedrms': {
    name: 'Average Bedrooms',
    description: 'Número promedio de dormitorios por vivienda',
    interpretation: 'Indica el tamaño típico de las viviendas. Valores normales: 1-3 dormitorios por hogar.'
  },
  'Population': {
    name: 'Population',
    description: 'Población total en el bloque',
    interpretation: 'Densidad poblacional del área. Alta población puede indicar zonas urbanas densas o edificios de apartamentos.'
  },
  'AveOccup': {
    name: 'Average Occupancy',
    description: 'Número promedio de ocupantes por vivienda',
    interpretation: 'Promedio de personas por hogar. Valores altos pueden indicar hacinamiento o viviendas multifamiliares.'
  },
  'Latitude': {
    name: 'Latitude',
    description: 'Latitud del bloque (coordenada geográfica)',
    interpretation: 'Ubicación norte-sur en California. Valores más altos corresponden a áreas más al norte del estado.'
  },
  'Longitude': {
    name: 'Longitude',
    description: 'Longitud del bloque (coordenada geográfica)',
    interpretation: 'Ubicación este-oeste en California. Valores más negativos están más cerca del océano Pacífico.'
  },
  'MedHouseVal': {
    name: 'Median House Value',
    description: 'Valor mediano de la vivienda (en cientos de miles de dólares)',
    interpretation: 'Variable objetivo a predecir. Representa el precio típico de vivienda en el área. Rango: 0.15-5.0 (=$15k-$500k)'
  }
};

// Explicaciones de métricas estadísticas
const METRIC_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'mean': {
    name: 'Media',
    description: 'Promedio aritmético de todos los valores. Indica el valor central típico.'
  },
  'std': {
    name: 'Desviación Estándar',
    description: 'Mide la dispersión de los datos. Valores altos indican mayor variabilidad.'
  },
  'min': {
    name: 'Mínimo',
    description: 'Valor más bajo observado en el dataset para esta variable.'
  },
  'max': {
    name: 'Máximo',
    description: 'Valor más alto observado en el dataset para esta variable.'
  },
  '25%': {
    name: 'Percentil 25 (Q1)',
    description: 'El 25% de los datos están por debajo de este valor. Límite inferior del rango intercuartil.'
  },
  '50%': {
    name: 'Mediana (Q2)',
    description: 'Valor central que divide los datos en dos mitades iguales. Más robusto que la media ante outliers.'
  },
  '75%': {
    name: 'Percentil 75 (Q3)',
    description: 'El 75% de los datos están por debajo de este valor. Límite superior del rango intercuartil.'
  },
  'skewness': {
    name: 'Asimetría (Skewness)',
    description: 'Mide la simetría de la distribución. Valores cercanos a 0 indican simetría. Valores positivos: cola hacia la derecha, negativos: cola hacia la izquierda.'
  },
  'kurtosis': {
    name: 'Curtosis (Kurtosis)',
    description: 'Mide el "peso" de las colas de la distribución. Valores altos indican más outliers extremos.'
  }
};

interface DatasetInfo {
  rows: number;
  columns: number;
  features: string[];
  missing_values: Record<string, number>;
  dtypes: Record<string, string>;
  memory_usage: string;
}

interface Statistics {
  feature: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  '25%': number;
  '50%': number;
  '75%': number;
  max: number;
  skewness?: number;
  kurtosis?: number;
}

interface Distribution {
  feature: string;
  bins: number[];
  counts: number[];
  mean: number;
  std: number;
  median?: number;
  total?: number;
}

interface Correlation {
  features: string[];
  matrix: number[][];
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

const EDAExplorer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [correlation, setCorrelation] = useState<Correlation | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFeature) {
      loadDistribution(selectedFeature);
    }
  }, [selectedFeature]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [info, stats, corr, importance] = await Promise.all([
        edaAPI.getDatasetInfo(),
        edaAPI.getStatistics(),
        edaAPI.getCorrelation(),
        edaAPI.getFeatureImportance(),
      ]);

      setDatasetInfo(info);
      setStatistics(stats.statistics || []);
      setCorrelation(corr);
      setFeatureImportance(importance.importances || []);

      if (info.features && info.features.length > 0) {
        setSelectedFeature(info.features[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadDistribution = async (feature: string) => {
    try {
      const dist = await edaAPI.getDistribution(feature, 30);
      setDistribution(dist);
    } catch (err: any) {
      console.error('Error loading distribution:', err);
    }
  };

  const getColorForImportance = (value: number) => {
    const normalized = value / Math.max(...featureImportance.map(f => f.importance));
    if (normalized > 0.7) return '#10b981';
    if (normalized > 0.4) return '#3b82f6';
    return '#8b5cf6';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">EDA Explorer</h1>
          <p className="text-muted-foreground mt-2">Exploratory Data Analysis</p>
        </div>
      </div>

      {/* Dataset Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasetInfo?.rows.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Dataset samples</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasetInfo?.columns}</div>
            <p className="text-xs text-muted-foreground">Total columns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasetInfo?.memory_usage}</div>
            <p className="text-xs text-muted-foreground">Total memory</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="statistics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="importance">Feature Importance</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {/* Guía de métricas */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-blue-600" />
                Guía de Métricas Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-blue-900">📊 Media & Desviación Estándar</p>
                  <p className="text-muted-foreground">Miden el centro y dispersión de los datos</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">📈 Percentiles (25%, 50%, 75%)</p>
                  <p className="text-muted-foreground">Dividen los datos en cuartos para entender distribución</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">🎯 Min & Max</p>
                  <p className="text-muted-foreground">Rango completo de valores observados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Descriptivas por Variable</CardTitle>
              <CardDescription>Resumen estadístico completo de todas las variables del dataset California Housing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Variable</th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['mean'].description}>
                        Media
                        <HelpCircle className="inline h-3 w-3 ml-1 text-muted-foreground" />
                      </th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['std'].description}>
                        Desv. Est.
                        <HelpCircle className="inline h-3 w-3 ml-1 text-muted-foreground" />
                      </th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['min'].description}>Min</th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['25%'].description}>Q1 (25%)</th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['50%'].description}>Mediana</th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['75%'].description}>Q3 (75%)</th>
                      <th className="text-right p-2" title={METRIC_DESCRIPTIONS['max'].description}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.map((stat) => {
                      const featureInfo = FEATURE_DESCRIPTIONS[stat.feature];
                      return (
                        <tr key={stat.feature} className="border-b hover:bg-muted/50 group">
                          <td className="p-2">
                            <div className="font-medium">{stat.feature}</div>
                            {featureInfo && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-semibold">{featureInfo.name}</span>
                                <p className="mt-0.5">{featureInfo.description}</p>
                                <p className="mt-0.5 text-blue-600">💡 {featureInfo.interpretation}</p>
                              </div>
                            )}
                          </td>
                          <td className="text-right p-2 font-mono">{stat.mean.toFixed(3)}</td>
                          <td className="text-right p-2 font-mono">{stat.std.toFixed(3)}</td>
                          <td className="text-right p-2 font-mono text-xs">{stat.min.toFixed(2)}</td>
                          <td className="text-right p-2 font-mono text-xs">{stat['25%'].toFixed(2)}</td>
                          <td className="text-right p-2 font-mono font-semibold">{stat['50%'].toFixed(2)}</td>
                          <td className="text-right p-2 font-mono text-xs">{stat['75%'].toFixed(2)}</td>
                          <td className="text-right p-2 font-mono text-xs">{stat.max.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          {/* Explicación de la variable seleccionada */}
          {selectedFeature && FEATURE_DESCRIPTIONS[selectedFeature] && (
            <Card className="bg-green-50/50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-5 w-5 text-green-600" />
                  {FEATURE_DESCRIPTIONS[selectedFeature].name} ({selectedFeature})
                </CardTitle>
                <CardDescription className="text-sm">
                  <p className="mt-2">{FEATURE_DESCRIPTIONS[selectedFeature].description}</p>
                  <p className="mt-2 text-green-700 font-medium">
                    💡 Interpretación: {FEATURE_DESCRIPTIONS[selectedFeature].interpretation}
                  </p>
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Variable</CardTitle>
              <CardDescription>Histograma mostrando la frecuencia de valores. Permite identificar patrones, outliers y forma de la distribución.</CardDescription>
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Seleccionar variable" />
                </SelectTrigger>
                <SelectContent>
                  {datasetInfo?.features.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature} {FEATURE_DESCRIPTIONS[feature] ? `- ${FEATURE_DESCRIPTIONS[feature].name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {distribution && (
                <>
                  <div className="flex gap-4 mb-4 flex-wrap">
                    <Badge variant="outline" className="text-sm">
                      Media: {distribution.mean.toFixed(3)}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Mediana: {distribution.median?.toFixed(3) || 'N/A'}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Desv. Est.: {distribution.std.toFixed(3)}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Total: {distribution.total?.toLocaleString() || 'N/A'} valores
                    </Badge>
                  </div>
                  
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-semibold text-blue-900">📊 Cómo interpretar este histograma:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-muted-foreground">
                      <li><strong>Barras altas:</strong> Valores más frecuentes en el dataset</li>
                      <li><strong>Forma de campana:</strong> Distribución normal (ideal para muchos modelos)</li>
                      <li><strong>Asimetría:</strong> Si tiene cola larga hacia un lado, puede necesitar transformación</li>
                      <li><strong>Picos múltiples:</strong> Pueden indicar subgrupos en los datos</li>
                    </ul>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={distribution.bins.slice(0, -1).map((bin, idx) => ({
                        bin: bin.toFixed(2),
                        count: distribution.counts[idx] || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="bin" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        label={{ value: 'Valor de la Variable', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value) => [`${value} muestras`, 'Frecuencia']}
                        labelFormatter={(label) => `Rango: ~${label}`}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correlation Tab */}
        <TabsContent value="correlation" className="space-y-4">
          {/* Guía de correlación */}
          <Card className="bg-purple-50/50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-purple-600" />
                ¿Qué es la Correlación?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  La <strong>correlación</strong> mide la relación lineal entre dos variables. Los valores van de -1 a +1:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <p className="font-semibold text-red-900">📉 Correlación Negativa (-1 a -0.5)</p>
                    <p className="text-xs text-muted-foreground">Cuando una variable aumenta, la otra disminuye</p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="font-semibold text-gray-900">➖ Sin Correlación (-0.5 a 0.5)</p>
                    <p className="text-xs text-muted-foreground">No hay relación lineal clara entre variables</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <p className="font-semibold text-blue-900">📈 Correlación Positiva (0.5 a 1)</p>
                    <p className="text-xs text-muted-foreground">Cuando una variable aumenta, la otra también</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>💡 Importante:</strong> Alta correlación entre features puede causar multicolinealidad, 
                  afectando el rendimiento del modelo. La diagonal siempre es 1 (correlación de una variable consigo misma).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matriz de Correlación</CardTitle>
              <CardDescription>
                Correlaciones entre todas las variables. Colores más oscuros indican mayor correlación (positiva o negativa).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {correlation && (
                <>
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
                    <p className="text-xs font-medium">
                      <span className="inline-block w-4 h-4 bg-blue-200 mr-2"></span>Color claro = Correlación débil (≈0)
                      <span className="inline-block w-4 h-4 bg-blue-800 ml-4 mr-2"></span>Color oscuro = Correlación fuerte (≈±1)
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-2 border bg-muted/50"></th>
                          {correlation.features.map((feature) => (
                            <th key={feature} className="text-center p-2 border bg-muted/50 font-medium">
                              {feature}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {correlation.features.map((feature, i) => (
                          <tr key={feature}>
                            <td className="text-left p-2 border bg-muted/50 font-medium">{feature}</td>
                            {correlation.matrix[i].map((value, j) => {
                              const absValue = Math.abs(value);
                              const isStrong = absValue > 0.7;
                              const isModerate = absValue > 0.4 && absValue <= 0.7;
                              
                              return (
                                <td
                                  key={j}
                                  className="text-center p-2 border font-mono"
                                  style={{
                                    backgroundColor: value >= 0 
                                      ? `rgba(59, 130, 246, ${absValue})` 
                                      : `rgba(239, 68, 68, ${absValue})`,
                                    color: absValue > 0.5 ? 'white' : 'inherit',
                                    fontWeight: isStrong ? 'bold' : 'normal'
                                  }}
                                  title={`${feature} vs ${correlation.features[j]}: ${value.toFixed(3)}`}
                                >
                                  {value.toFixed(2)}
                                  {isStrong && ' 🔥'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Importance Tab */}
        <TabsContent value="importance" className="space-y-4">
          {/* Guía de Feature Importance */}
          <Card className="bg-amber-50/50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-amber-600" />
                ¿Qué es Feature Importance (Importancia de Variables)?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  <strong>Feature Importance</strong> indica cuánto contribuye cada variable a las predicciones del modelo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <p className="font-semibold text-green-900">🟢 Alta Importancia</p>
                    <p className="text-xs text-muted-foreground">
                      Variables críticas para el modelo. Cambios pequeños afectan mucho la predicción.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="font-semibold text-gray-900">⚪ Baja Importancia</p>
                    <p className="text-xs text-muted-foreground">
                      Variables menos relevantes. Podrían eliminarse para simplificar el modelo.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>💡 Uso práctico:</strong> Identifica qué datos son más importantes recolectar y monitorear. 
                  Variables con importancia muy baja pueden removerse sin afectar el rendimiento.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importancia de Variables del Modelo</CardTitle>
              <CardDescription>
                Ranking de variables según su contribución al modelo en producción (Gradient Boosting). 
                Valores más altos = mayor impacto en las predicciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featureImportance.length > 0 ? (
                <>
                  {/* Lista detallada con explicaciones */}
                  <div className="mb-6 space-y-2">
                    {featureImportance
                      .sort((a, b) => b.importance - a.importance)
                      .map((item, idx) => {
                        const featureInfo = FEATURE_DESCRIPTIONS[item.feature];
                        const percentage = (item.importance * 100).toFixed(1);
                        
                        return (
                          <div key={item.feature} className="border rounded-lg p-3 hover:bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={idx < 3 ? "default" : "outline"}>
                                  #{idx + 1}
                                </Badge>
                                <span className="font-semibold">{item.feature}</span>
                                {featureInfo && (
                                  <span className="text-xs text-muted-foreground">
                                    - {featureInfo.name}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-lg" style={{ color: getColorForImportance(item.importance) }}>
                                {percentage}%
                              </span>
                            </div>
                            {featureInfo && (
                              <p className="text-xs text-muted-foreground ml-12">
                                {featureInfo.description}
                              </p>
                            )}
                            <div className="ml-12 mt-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: getColorForImportance(item.importance)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Gráfico de barras */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Visualización Comparativa</h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={featureImportance.sort((a, b) => b.importance - a.importance)}
                        layout="vertical"
                        margin={{ left: 100, right: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" label={{ value: 'Importancia', position: 'insideBottom', offset: -5 }} />
                        <YAxis dataKey="feature" type="category" />
                        <Tooltip 
                          formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Importancia']}
                          labelFormatter={(label) => {
                            const info = FEATURE_DESCRIPTIONS[label as string];
                            return info ? `${label} (${info.name})` : label;
                          }}
                        />
                        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                          {featureImportance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColorForImportance(entry.importance)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertDescription>
                    No hay datos de feature importance disponibles. Entrena un modelo primero.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EDAExplorer;
