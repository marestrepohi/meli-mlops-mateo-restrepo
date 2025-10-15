/**
 * Exploratory Data Analysis (EDA) Page
 * Displays EDA report and statistics from the data ingestion stage
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EDAData } from '@/types/eda';
import {
  parseHistogramForRecharts,
  extractStatistics,
  formatPercentage,
  getNumericVariables,
  getCategoricalVariables,
  getBoxPlotData,
  parseCorrelationMatrix,
  getVariablesWithMissing,
  getTypeDistribution,
  getMissingDataStats
} from '@/utils/eda-parser';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import {
  Database,
  FileText,
  AlertCircle,
  TrendingUp,
  Info,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// EDAData type imported from types/eda.ts

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function HousingEDA() {
  const [edaData, setEdaData] = useState<EDAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHtmlReport, setShowHtmlReport] = useState(false);

  useEffect(() => {
    loadEDAData();
  }, []);

  const loadEDAData = async () => {
    try {
      setLoading(true);
      
      // Load from symlinked JSON file instead of API
      console.log('Intentando cargar EDA data desde /data/reports/eda_data.json');
      const response = await fetch('/data/reports/eda_data.json');
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('Parseando JSON...');
        const data = await response.json();
        console.log('EDA data cargada exitosamente:', Object.keys(data));
        setEdaData(data);
      } else {
        console.error('EDA data file not found. Status:', response.status);
        setEdaData(null);
      }
    } catch (error) {
      console.error('Error loading EDA data:', error);
      setEdaData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Database className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando datos de EDA...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!edaData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar el reporte de EDA. Asegúrate de que el archivo existe en{' '}
            <code>data/reports/eda_data.json</code> o ejecuta el pipeline de datos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { table, variables } = edaData;

  // Prepare data for visualizations
  const typeDistribution = Object.entries(table.types).map(([name, value]) => ({
    name,
    value
  }));

  const missingDataStats = [
    { name: 'Con Datos', value: table.n - table.n_cells_missing },
    { name: 'Faltantes', value: table.n_cells_missing }
  ];

  // Get top variables with missing data
  const variablesWithMissing = Object.entries(variables)
    .filter(([_, data]: [string, any]) => data.n_missing && data.n_missing > 0)
    .map(([name, data]: [string, any]) => ({
      name,
      missing: data.n_missing,
      percentage: ((data.n_missing / table.n) * 100).toFixed(2)
    }))
    .sort((a, b) => b.missing - a.missing);

  // Get basic statistics for numeric variables
  const numericVariables = Object.entries(variables)
    .filter(([_, data]: [string, any]) => data.type === 'Numeric')
    .slice(0, 5); // Show first 5

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8 text-primary" />
          Análisis Exploratorio de Datos (EDA)
        </h1>
        <p className="text-muted-foreground">
          Reporte generado durante la etapa de Data Ingestion
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{table.n}</div>
            <p className="text-xs text-muted-foreground">Instancias totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{table.n_var}</div>
            <p className="text-xs text-muted-foreground">
              {table.types.Numeric} numéricas, {table.types.Categorical || 0} categóricas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Datos Faltantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(table.p_cells_missing * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {table.n_cells_missing} celdas faltantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Duplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{table.n_duplicates}</div>
            <p className="text-xs text-muted-foreground">
              {(table.p_duplicates * 100).toFixed(2)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="histograms" className="text-xs">Histogramas</TabsTrigger>
          <TabsTrigger value="correlations" className="text-xs">Correlaciones</TabsTrigger>
          <TabsTrigger value="scatter" className="text-xs">Relaciones</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs">Alertas</TabsTrigger>
          <TabsTrigger value="missing" className="text-xs">Faltantes/Duplicados</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Información del Análisis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {edaData.analysis?.title || 'Reporte de Perfilado'}
              </CardTitle>
              <CardDescription>
                Análisis generado: {edaData.analysis?.date_start ? new Date(edaData.analysis.date_start).toLocaleString('es-ES') : 'N/A'}
                {edaData.analysis?.date_end && ` - Completado: ${new Date(edaData.analysis.date_end).toLocaleString('es-ES', { timeStyle: 'short' })}`}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resumen del Dataset */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Resumen del Dataset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Observaciones" value={table.n.toLocaleString()} />
                <InfoRow label="Variables" value={table.n_var} />
                <InfoRow label="Celdas totales" value={(table.n * table.n_var).toLocaleString()} />
                <div className="border-t pt-2 mt-2">
                  <InfoRow label="Variables numéricas" value={table.types?.Numeric || 0} />
                  <InfoRow label="Variables categóricas" value={table.types?.Categorical || 0} />
                </div>
                <div className="border-t pt-2 mt-2">
                  <InfoRow label="Tamaño en memoria" value={`${(table.memory_size / 1024).toFixed(2)} KB`} />
                  <InfoRow label="Tamaño por registro" value={`${table.record_size.toFixed(2)} bytes`} />
                </div>
              </CardContent>
            </Card>

            {/* Datos Faltantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Datos Faltantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Celdas faltantes" value={table.n_cells_missing} />
                <InfoRow label="% de celdas faltantes" value={`${(table.p_cells_missing * 100).toFixed(2)}%`} />
                <InfoRow label="Variables con faltantes" value={`${table.n_vars_with_missing || 0} de ${table.n_var}`} />
                <InfoRow 
                  label="Variables 100% faltantes" 
                  value={Object.values(variables).filter((v: any) => v.p_missing === 1).length} 
                />
                
                <div className="pt-3 border-t">
                  {table.n_cells_missing === 0 ? (
                    <Badge variant="outline" className="w-full justify-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Sin datos faltantes
                    </Badge>
                  ) : table.p_cells_missing < 0.05 ? (
                    <Badge variant="secondary" className="w-full justify-center">
                      <Info className="h-3 w-3 mr-1" />
                      Pocos datos faltantes ({(table.p_cells_missing * 100).toFixed(2)}%)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="w-full justify-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Atención: {(table.p_cells_missing * 100).toFixed(2)}% faltantes
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calidad de Datos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Calidad de Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Duplicados" value={table.n_duplicates} />
                <InfoRow label="% duplicados" value={`${(table.p_duplicates * 100).toFixed(2)}%`} />
                
                <div className="pt-3 border-t">
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Sin duplicados
                    </Badge>
                    <Badge variant="secondary" className="w-full justify-center">
                      Dataset limpio
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Estadísticas de Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estadísticas Descriptivas de Variables
              </CardTitle>
              <CardDescription>
                Resumen estadístico completo de todas las variables del dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Variable</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-right">n</TableHead>
                      <TableHead className="text-right">Únicos</TableHead>
                      <TableHead className="text-right">Faltantes</TableHead>
                      <TableHead className="text-right">Media</TableHead>
                      <TableHead className="text-right">Std</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Q1</TableHead>
                      <TableHead className="text-right">Mediana</TableHead>
                      <TableHead className="text-right">Q3</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(variables).map(([name, data]: [string, any]) => (
                      <TableRow key={name}>
                        <TableCell className="font-mono font-semibold">{name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={data.type === 'Numeric' ? 'default' : 'secondary'} className="text-xs">
                            {data.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{data.n || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {data.n_distinct || 'N/A'}
                          <span className="text-muted-foreground ml-1">
                            ({((data.p_distinct || 0) * 100).toFixed(0)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {data.n_missing > 0 ? (
                            <span className="text-yellow-600 font-semibold">
                              {data.n_missing} ({((data.p_missing || 0) * 100).toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                        {data.type === 'Numeric' ? (
                          <>
                            <TableCell className="text-right font-mono text-xs">{data.mean?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data.std?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data.min?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data['25%']?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data['50%']?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data['75%']?.toFixed(2) || '-'}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{data.max?.toFixed(2) || '-'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-center text-muted-foreground text-xs" colSpan={7}>
                              Variable categórica - estadísticas no aplicables
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Alertas del Análisis
              </CardTitle>
              <CardDescription>
                Advertencias y hallazgos detectados por ydata-profiling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edaData.alerts && edaData.alerts.length > 0 ? (
                <div className="space-y-2">
                  {edaData.alerts.map((alert, index) => {
                    const isCorrelation = alert.includes('correlated');
                    const isMissing = alert.includes('missing');
                    const isImbalanced = alert.includes('imbalanced');
                    const isZeros = alert.includes('zeros');

                    return (
                      <Alert key={index} variant={isMissing || isImbalanced ? "destructive" : "default"}>
                        <div className="flex items-start gap-2">
                          {isCorrelation && <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />}
                          {isMissing && <AlertCircle className="h-4 w-4 mt-0.5" />}
                          {isImbalanced && <AlertTriangle className="h-4 w-4 mt-0.5" />}
                          {isZeros && <Info className="h-4 w-4 mt-0.5 text-gray-600" />}
                          <AlertDescription className="text-sm">
                            {alert}
                          </AlertDescription>
                        </div>
                      </Alert>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    No hay alertas detectadas en el análisis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histograms Tab */}
        <TabsContent value="histograms" className="space-y-6">
          {Object.entries(variables).map(([varName, varData]: [string, any]) => {
            const isNumeric = varData.type === 'Numeric';
            const isCategorical = varData.type === 'Categorical';
            
            return (
              <Card key={varName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {varName}
                      </CardTitle>
                      <CardDescription>
                        Tipo: {varData.type}
                      </CardDescription>
                    </div>
                    <Badge variant={isNumeric ? "default" : "secondary"}>
                      {varData.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Statistics */}
                    <div className="lg:col-span-1 space-y-3">
                      <h4 className="font-semibold text-sm border-b pb-2">Resumen Estadístico</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total observaciones:</span>
                          <span className="font-mono font-semibold">{varData.n || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valores únicos:</span>
                          <span className="font-mono font-semibold">
                            {varData.n_distinct || 'N/A'} ({((varData.p_distinct || 0) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valores faltantes:</span>
                          <span className="font-mono font-semibold">
                            {varData.n_missing || 0} ({((varData.p_missing || 0) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        
                        {isNumeric && (
                          <>
                            <div className="border-t pt-2 mt-2"></div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Media:</span>
                              <span className="font-mono font-semibold">{varData.mean?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Desv. Estándar:</span>
                              <span className="font-mono font-semibold">{varData.std?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mínimo:</span>
                              <span className="font-mono font-semibold">{varData.min?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Máximo:</span>
                              <span className="font-mono font-semibold">{varData.max?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="border-t pt-2 mt-2"></div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Q1 (25%):</span>
                              <span className="font-mono font-semibold">{varData['25%']?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mediana (50%):</span>
                              <span className="font-mono font-semibold">{varData['50%']?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Q3 (75%):</span>
                              <span className="font-mono font-semibold">{varData['75%']?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="border-t pt-2 mt-2"></div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Asimetría:</span>
                              <span className="font-mono font-semibold">{varData.skewness?.toFixed(4) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Curtosis:</span>
                              <span className="font-mono font-semibold">{varData.kurtosis?.toFixed(4) || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Histogram/Bar Chart */}
                    <div className="lg:col-span-2">
                      {isNumeric && varData.histogram ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">Histograma de Frecuencia</h4>
                            <div className="flex items-center gap-3 text-[10px]">
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-red-500"></div>
                                <span className="text-red-600">Media</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-green-500"></div>
                                <span className="text-green-600">Mediana</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-px border-t border-dashed border-blue-500"></div>
                                <span className="text-blue-600">Q1/Q3</span>
                              </div>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={varData.histogram.counts.map((count: number, idx: number) => ({
                                range: `${varData.histogram.bin_edges[idx].toFixed(1)}-${varData.histogram.bin_edges[idx + 1].toFixed(1)}`,
                                x: varData.histogram.bin_edges[idx],
                                count: count
                              }))}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="x"
                                type="number"
                                domain={[varData.min || 'dataMin', varData.max || 'dataMax']}
                                label={{ value: varName, position: 'bottom' }}
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis 
                                label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white p-2 border rounded shadow-sm">
                                        <p className="text-xs font-semibold">{payload[0].payload.range}</p>
                                        <p className="text-xs">Frecuencia: {payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" fill="#8884d8" />
                              
                              {/* Línea vertical para Media - Rojo */}
                              {varData.mean !== undefined && (
                                <ReferenceLine 
                                  x={varData.mean} 
                                  stroke="#ef4444" 
                                  strokeWidth={2}
                                  label={{ 
                                    value: `Media: ${varData.mean.toFixed(2)}`, 
                                    position: 'top',
                                    fill: '#ef4444',
                                    fontSize: 10,
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                              
                              {/* Línea vertical para Mediana (50%) - Verde */}
                              {varData['50%'] !== undefined && (
                                <ReferenceLine 
                                  x={varData['50%']} 
                                  stroke="#22c55e" 
                                  strokeWidth={3}
                                  label={{ 
                                    value: `Mediana: ${varData['50%'].toFixed(2)}`, 
                                    position: 'top',
                                    fill: '#22c55e',
                                    fontSize: 10,
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                              
                              {/* Línea vertical para Q1 (25%) - Azul */}
                              {varData['25%'] !== undefined && (
                                <ReferenceLine 
                                  x={varData['25%']} 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  label={{ 
                                    value: `Q1: ${varData['25%'].toFixed(2)}`, 
                                    position: 'top',
                                    fill: '#3b82f6',
                                    fontSize: 10,
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                              
                              {/* Línea vertical para Q3 (75%) - Azul */}
                              {varData['75%'] !== undefined && (
                                <ReferenceLine 
                                  x={varData['75%']} 
                                  stroke="#3b82f6" 
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  label={{ 
                                    value: `Q3: ${varData['75%'].toFixed(2)}`, 
                                    position: 'top',
                                    fill: '#3b82f6',
                                    fontSize: 10,
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : isCategorical && varData.value_counts_without_nan ? (
                        <div>
                          <h4 className="font-semibold text-sm mb-3">Distribución de Categorías (Top 20)</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={Object.entries(varData.value_counts_without_nan)
                                .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                                .slice(0, 20)
                                .map(([category, count]) => ({
                                  category: String(category),
                                  count: count as number
                                }))}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="category"
                                width={100}
                                tick={{ fontSize: 10 }}
                              />
                              <Tooltip />
                              <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            No hay datos de histograma disponibles para esta variable.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Matriz de Correlación
              </CardTitle>
              <CardDescription>
                Correlaciones entre todas las variables numéricas del dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edaData.correlations?.auto ? (
                (() => {
                  // ydata-profiling structure: array of objects
                  // Each object in array represents a row, keys are column names
                  const corrArray = edaData.correlations!.auto;
                  const allVarNames = Object.keys(corrArray[0]);
                  
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr>
                            <th className="border p-2 bg-muted font-mono sticky left-0 z-10"></th>
                            {allVarNames.map((varName, i) => (
                              <th key={i} className="border p-2 bg-muted font-mono min-w-[60px]">
                                {varName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {corrArray.map((row, rowIndex) => {
                            const rowVarName = allVarNames[rowIndex];
                            return (
                              <tr key={rowIndex}>
                                <td className="border p-2 font-mono font-bold bg-muted sticky left-0 z-10">
                                  {rowVarName}
                                </td>
                                {allVarNames.map((colName, colIndex) => {
                                  const value = row[colName];
                                  
                                  // Validar que el valor exista y sea un número
                                  if (value === undefined || value === null || isNaN(value)) {
                                    return (
                                      <td 
                                        key={colIndex} 
                                        className="border p-2 text-center font-mono text-muted-foreground"
                                      >
                                        -
                                      </td>
                                    );
                                  }
                                  
                                  const absValue = Math.abs(value);
                              
                              // Color gradient: strong correlation = red/blue, weak = white
                              let bgColor = 'rgb(255, 255, 255)';
                              if (absValue > 0.7) {
                                bgColor = value > 0 ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)';
                              } else if (absValue > 0.5) {
                                bgColor = value > 0 ? 'rgb(252, 165, 165)' : 'rgb(147, 197, 253)';
                              } else if (absValue > 0.3) {
                                bgColor = value > 0 ? 'rgb(254, 202, 202)' : 'rgb(191, 219, 254)';
                              }
                              
                              return (
                                <td 
                                  key={colIndex} 
                                  className="border p-2 text-center font-mono"
                                  style={{ backgroundColor: bgColor }}
                                  title={`${rowVarName} vs ${colName}: ${value.toFixed(3)}`}
                                >
                                  {value.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                      <span className="text-xs">Correlación positiva fuerte (&gt;0.7)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(59, 130, 246)' }}></div>
                      <span className="text-xs">Correlación negativa fuerte (&lt;-0.7)</span>
                    </div>
                  </div>
                </div>
                  );
                })()
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No hay datos de correlación disponibles
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scatter Plots - Relaciones Tab */}
        <TabsContent value="scatter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Relaciones
              </CardTitle>
              <CardDescription>
                Diagramas de dispersión de MEDV (precio de vivienda) vs otras variables generados por ydata-profiling
              </CardDescription>
            </CardHeader>
            <CardContent>
              {edaData.scatter?.MEDV && Object.keys(edaData.scatter.MEDV).length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(() => {
                    // Get correlation values for MEDV
                    const corrArray = edaData.correlations?.auto;
                    const medvIndex = corrArray ? Object.keys(corrArray[0]).indexOf('MEDV') : -1;
                    const medvCorrelations = medvIndex >= 0 && corrArray ? corrArray[medvIndex] : {};
                    
                    // Get scatter plots for MEDV vs other variables
                    return Object.entries(edaData.scatter.MEDV)
                      .filter(([varName, svg]) => svg && svg.length > 0 && varName !== 'MEDV')
                      .map(([varName, svgString]: [string, any]) => {
                        const correlation = medvCorrelations[varName];
                        const hasCorr = correlation !== undefined && correlation !== null && !isNaN(correlation);
                        
                        return (
                          <div key={varName} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-mono text-sm font-semibold">
                                MEDV vs {varName}
                              </h4>
                              {hasCorr && (
                                <Badge variant={Math.abs(correlation) > 0.5 ? "default" : "secondary"}>
                                  r = {correlation.toFixed(3)}
                                </Badge>
                              )}
                            </div>
                            <div 
                              className="w-full"
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <div 
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto'
                                }}
                                dangerouslySetInnerHTML={{ __html: svgString.replace(/<svg/, '<svg style="max-width: 100%; height: auto;"') }}
                              />
                            </div>
                            {hasCorr && (
                              <p className="text-xs text-muted-foreground mt-2 text-center">
                                {Math.abs(correlation) > 0.7 ? 'Correlación fuerte' : 
                                 Math.abs(correlation) > 0.5 ? 'Correlación moderada' : 
                                 Math.abs(correlation) > 0.3 ? 'Correlación débil' : 'Correlación muy débil'}
                                {correlation > 0 ? ' positiva' : ' negativa'}
                              </p>
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No hay diagramas de dispersión disponibles para MEDV. Asegúrate de ejecutar el pipeline de datos.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missing Data Tab */}
        <TabsContent value="missing" className="space-y-6">
          {/* Sección de Datos Faltantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Análisis de Datos Faltantes
              </CardTitle>
              <CardDescription>
                Visualización de la distribución y patrones de valores faltantes en el dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumen de Faltantes */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Resumen de Datos Faltantes</h4>
                  <div className="space-y-2">
                    <InfoRow 
                      label="Total de celdas faltantes" 
                      value={`${table.n_cells_missing} de ${table.n * table.n_var}`} 
                    />
                    <InfoRow 
                      label="Porcentaje de celdas faltantes" 
                      value={`${(table.p_cells_missing * 100).toFixed(2)}%`} 
                    />
                    <InfoRow 
                      label="Variables con faltantes" 
                      value={`${variablesWithMissing.length} de ${table.n_var}`} 
                    />
                    
                    <div className="pt-3 border-t">
                      {table.n_cells_missing === 0 ? (
                        <Badge variant="outline" className="w-full justify-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sin datos faltantes
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-full justify-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {table.n_cells_missing} valores faltantes detectados
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variables con Faltantes */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Variables con Datos Faltantes</h4>
                  {variablesWithMissing.length > 0 ? (
                    <div className="space-y-3">
                      {variablesWithMissing.map((variable) => (
                        <div key={variable.name}>
                          <div className="flex justify-between mb-1">
                            <span className="font-mono font-semibold text-sm">{variable.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {variable.missing} ({variable.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-yellow-500 rounded-full h-2"
                              style={{ width: `${variable.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                      <p className="text-sm text-muted-foreground">
                        ¡Excelente! No hay datos faltantes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualizaciones de Patrones de Faltantes */}
          {edaData.missing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Conteo de Nulos por Variable */}
              {edaData.missing.bar?.matrix && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conteo de Valores Faltantes</CardTitle>
                    <CardDescription className="text-xs">
                      {edaData.missing.bar.caption || 'Visualización de valores nulos por columna'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="w-full flex justify-center"
                      dangerouslySetInnerHTML={{ 
                        __html: edaData.missing.bar.matrix.replace(/<svg/, '<svg style="max-width: 100%; height: auto;"') 
                      }} 
                    />
                  </CardContent>
                </Card>
              )}

              {/* Matrix - Matriz de Faltantes */}
              {edaData.missing.matrix?.matrix && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Matriz de Datos Faltantes</CardTitle>
                    <CardDescription className="text-xs">
                      {edaData.missing.matrix.caption || 'Patrón de valores faltantes en el dataset'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="w-full flex justify-center"
                      dangerouslySetInnerHTML={{ 
                        __html: edaData.missing.matrix.matrix.replace(/<svg/, '<svg style="max-width: 100%; height: auto;"') 
                      }} 
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Heatmap de Correlación de Faltantes (si existe) */}
          {edaData.missing?.heatmap?.matrix && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Heatmap de Correlación de Valores Faltantes</CardTitle>
                <CardDescription className="text-xs">
                  {edaData.missing.heatmap.caption || 'Correlación entre patrones de valores faltantes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="w-full flex justify-center"
                  dangerouslySetInnerHTML={{ 
                    __html: edaData.missing.heatmap.matrix.replace(/<svg/, '<svg style="max-width: 100%; height: auto;"') 
                  }} 
                />
              </CardContent>
            </Card>
          )}

          {/* Sección de Duplicados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Análisis de Duplicados
              </CardTitle>
              <CardDescription>
                Registros duplicados en el dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resumen de Duplicados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{table.n_duplicates}</div>
                    <div className="text-xs text-muted-foreground">Registros duplicados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{(table.p_duplicates * 100).toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">Porcentaje del total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{table.n - table.n_duplicates}</div>
                    <div className="text-xs text-muted-foreground">Registros únicos</div>
                  </div>
                </div>

                {/* Lista de Duplicados */}
                {edaData.duplicates && edaData.duplicates.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Registros Duplicados Encontrados</h4>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Se encontraron {edaData.duplicates.length} registros duplicados. 
                        Se recomienda revisar y limpiar estos datos antes del análisis.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Índice</TableHead>
                            <TableHead>Detalles</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {edaData.duplicates.slice(0, 10).map((dup: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                              <TableCell className="text-xs">
                                <pre className="text-xs overflow-auto">{JSON.stringify(dup, null, 2)}</pre>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {edaData.duplicates.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Mostrando 10 de {edaData.duplicates.length} duplicados
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h4 className="font-semibold text-lg mb-2">¡Dataset Sin Duplicados!</h4>
                    <p className="text-sm text-muted-foreground">
                      No se encontraron registros duplicados en el dataset. 
                      Todos los {table.n} registros son únicos.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
      </Tabs>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
