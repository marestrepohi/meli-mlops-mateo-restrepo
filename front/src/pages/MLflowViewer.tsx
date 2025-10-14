import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { mlflowAPI } from '@/lib/api';
import { Loader2, FlaskConical, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Experiment {
  experiment_id: string;
  name: string;
  lifecycle_stage: string;
}

interface Run {
  run_id: string;
  experiment_id: string;
  status: string;
  start_time: string;
  end_time: string;
  metrics: Record<string, number>;
  params: Record<string, string>;
  tags: Record<string, string>;
}

interface RunDetails {
  run_id: string;
  experiment_id: string;
  status: string;
  start_time: string;
  end_time: string;
  artifact_uri: string;
  metrics: Record<string, number>;
  params: Record<string, string>;
  tags: Record<string, string>;
}

const MLflowViewer = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    if (selectedExperiment) {
      loadRuns(selectedExperiment);
    }
  }, [selectedExperiment]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await mlflowAPI.getExperiments();
      setExperiments(data.experiments || []);

      if (data.experiments && data.experiments.length > 0) {
        const defaultExp = data.experiments.find((e: Experiment) => e.name === 'housing-price-prediction') || data.experiments[0];
        setSelectedExperiment(defaultExp.name);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading experiments');
    } finally {
      setLoading(false);
    }
  };

  const loadRuns = async (experimentName: string) => {
    try {
      setLoadingRuns(true);
      const data = await mlflowAPI.getRuns(experimentName, 20);
      const sortedRuns = data.runs.sort((a: Run, b: Run) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setRuns(sortedRuns);
      setSelectedRun(null);
      setRunDetails(null);
    } catch (err: any) {
      console.error('Error loading runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      setLoadingDetails(true);
      setSelectedRun(runId);
      const data = await mlflowAPI.getRunDetails(runId);
      setRunDetails(data);
    } catch (err: any) {
      console.error('Error loading run details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'finished':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'finished':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const prepareMetricsChart = () => {
    if (runs.length === 0) return [];
    
    return runs
      .slice(0, 10)
      .reverse()
      .map((run, idx) => ({
        run: `Run ${idx + 1}`,
        rmse: run.metrics.rmse || 0,
        r2: run.metrics.r2_score || 0,
        mae: run.metrics.mae || 0,
      }));
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
          <h1 className="text-4xl font-bold">MLflow Viewer</h1>
          <p className="text-muted-foreground mt-2">Experiment tracking and model registry</p>
        </div>
      </div>

      {/* Experiment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Experiments
          </CardTitle>
          <CardDescription>Select an experiment to view runs</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select experiment" />
            </SelectTrigger>
            <SelectContent>
              {experiments.map((exp) => (
                <SelectItem key={exp.experiment_id} value={exp.name}>
                  {exp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Metrics Overview Chart */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Metrics Trends
            </CardTitle>
            <CardDescription>Performance metrics across recent runs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareMetricsChart()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="run" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rmse" stroke="#ef4444" strokeWidth={2} name="RMSE" />
                <Line type="monotone" dataKey="mae" stroke="#f59e0b" strokeWidth={2} name="MAE" />
                <Line type="monotone" dataKey="r2" stroke="#10b981" strokeWidth={2} name="R² Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedRun}>Run Details</TabsTrigger>
        </TabsList>

        {/* Runs List */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Runs</CardTitle>
              <CardDescription>
                {loadingRuns ? 'Loading runs...' : `${runs.length} runs found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRuns ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : runs.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No runs found for this experiment. Train a model to create runs.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {runs.map((run, idx) => (
                    <div
                      key={run.run_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRun === run.run_id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => loadRunDetails(run.run_id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="font-medium">Run #{runs.length - idx}</span>
                          <Badge className={getStatusColor(run.status)}>
                            {run.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(run.start_time)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">RMSE</p>
                          <p className="text-sm font-medium">{run.metrics.rmse?.toFixed(4) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">R² Score</p>
                          <p className="text-sm font-medium">{run.metrics.r2_score?.toFixed(4) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">MAE</p>
                          <p className="text-sm font-medium">{run.metrics.mae?.toFixed(4) || 'N/A'}</p>
                        </div>
                      </div>

                      {run.params && Object.keys(run.params).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(run.params).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Run Details */}
        <TabsContent value="details" className="space-y-4">
          {loadingDetails ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ) : runDetails ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Run Information</CardTitle>
                  <CardDescription>Run ID: {runDetails.run_id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge className={getStatusColor(runDetails.status)}>
                        {runDetails.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Experiment ID</p>
                      <p className="text-sm text-muted-foreground">{runDetails.experiment_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">{formatDate(runDetails.start_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">{formatDate(runDetails.end_time)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(runDetails.metrics).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="text-xl font-bold">{value.toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(runDetails.params).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {runDetails.tags && Object.keys(runDetails.tags).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(runDetails.tags).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLflowViewer;
