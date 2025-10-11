import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { edaAPI } from '@/lib/api';
import { Loader2, Database, TrendingUp, Activity } from 'lucide-react';

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
          <Card>
            <CardHeader>
              <CardTitle>Descriptive Statistics</CardTitle>
              <CardDescription>Statistical summary of all features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      <th className="text-right p-2">Count</th>
                      <th className="text-right p-2">Mean</th>
                      <th className="text-right p-2">Std</th>
                      <th className="text-right p-2">Min</th>
                      <th className="text-right p-2">25%</th>
                      <th className="text-right p-2">50%</th>
                      <th className="text-right p-2">75%</th>
                      <th className="text-right p-2">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.map((stat) => (
                      <tr key={stat.feature} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{stat.feature}</td>
                        <td className="text-right p-2">{stat.count}</td>
                        <td className="text-right p-2">{stat.mean.toFixed(2)}</td>
                        <td className="text-right p-2">{stat.std.toFixed(2)}</td>
                        <td className="text-right p-2">{stat.min.toFixed(2)}</td>
                        <td className="text-right p-2">{stat['25%'].toFixed(2)}</td>
                        <td className="text-right p-2">{stat['50%'].toFixed(2)}</td>
                        <td className="text-right p-2">{stat['75%'].toFixed(2)}</td>
                        <td className="text-right p-2">{stat.max.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Distribution</CardTitle>
              <CardDescription>Histogram of feature values</CardDescription>
              <Select value={selectedFeature} onValueChange={setSelectedFeature}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {datasetInfo?.features.map((feature) => (
                    <SelectItem key={feature} value={feature}>
                      {feature}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {distribution && (
                <>
                  <div className="flex gap-4 mb-4">
                    <Badge variant="outline">Mean: {distribution.mean.toFixed(2)}</Badge>
                    <Badge variant="outline">Std: {distribution.std.toFixed(2)}</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={distribution.bins.map((bin, idx) => ({
                        bin: bin.toFixed(2),
                        count: distribution.counts[idx] || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Correlation Tab */}
        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Matrix</CardTitle>
              <CardDescription>Feature correlations</CardDescription>
            </CardHeader>
            <CardContent>
              {correlation && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left p-1"></th>
                        {correlation.features.map((feature) => (
                          <th key={feature} className="text-center p-1 font-medium">
                            {feature}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlation.features.map((feature, i) => (
                        <tr key={feature}>
                          <td className="text-left p-1 font-medium">{feature}</td>
                          {correlation.matrix[i].map((value, j) => (
                            <td
                              key={j}
                              className="text-center p-1"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${Math.abs(value)})`,
                                color: Math.abs(value) > 0.5 ? 'white' : 'inherit',
                              }}
                            >
                              {value.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Importance Tab */}
        <TabsContent value="importance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance</CardTitle>
              <CardDescription>Model feature importances from latest training</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={featureImportance}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" />
                  <Tooltip />
                  <Bar dataKey="importance">
                    {featureImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorForImportance(entry.importance)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EDAExplorer;
