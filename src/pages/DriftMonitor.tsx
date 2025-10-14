import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { driftAPI } from '@/lib/api';
import { Loader2, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

interface DriftResult {
  feature: string;
  p_value: number;
  drift_detected: boolean;
  severity: string;
}

interface DriftAlert {
  timestamp: string;
  feature: string;
  severity: string;
  p_value: number;
  message: string;
}

const DriftMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const [driftResults, setDriftResults] = useState<DriftResult[]>([]);
  const [alerts, setAlerts] = useState<DriftAlert[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await driftAPI.getAlerts(30);
      const sortedAlerts = data.alerts.sort((a: DriftAlert, b: DriftAlert) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setAlerts(sortedAlerts);
    } catch (err: any) {
      setError(err.message || 'Error loading drift alerts');
    } finally {
      setLoading(false);
    }
  };

  const detectDrift = async () => {
    try {
      setDetecting(true);
      setError(null);

      // For demo purposes, we'll use synthetic data
      // In production, this would come from your actual current data
      const currentData = {
        CRIM: Array.from({ length: 100 }, () => Math.random() * 10),
        ZN: Array.from({ length: 100 }, () => Math.random() * 100),
        INDUS: Array.from({ length: 100 }, () => Math.random() * 30),
        CHAS: Array.from({ length: 100 }, () => Math.round(Math.random())),
        NOX: Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.3),
        RM: Array.from({ length: 100 }, () => Math.random() * 4 + 3),
        AGE: Array.from({ length: 100 }, () => Math.random() * 100),
        DIS: Array.from({ length: 100 }, () => Math.random() * 10 + 1),
        RAD: Array.from({ length: 100 }, () => Math.floor(Math.random() * 24) + 1),
        TAX: Array.from({ length: 100 }, () => Math.random() * 500 + 200),
        PTRATIO: Array.from({ length: 100 }, () => Math.random() * 10 + 12),
        B: Array.from({ length: 100 }, () => Math.random() * 100 + 300),
        LSTAT: Array.from({ length: 100 }, () => Math.random() * 30 + 2),
      };

      const data = await driftAPI.detectDrift(currentData);
      setDriftResults(data.results || []);
      setLastCheck(new Date());
      
      // Reload alerts to see if new ones were created
      await loadAlerts();
    } catch (err: any) {
      setError(err.message || 'Error detecting drift');
    } finally {
      setDetecting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const driftSummary = {
    total: driftResults.length,
    detected: driftResults.filter(r => r.drift_detected).length,
    high: driftResults.filter(r => r.severity === 'high').length,
    medium: driftResults.filter(r => r.severity === 'medium').length,
    low: driftResults.filter(r => r.severity === 'low').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Drift Monitor</h1>
          <p className="text-muted-foreground mt-2">Data drift detection and alerts</p>
        </div>
        <Button onClick={detectDrift} disabled={detecting}>
          {detecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Drift Detection
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {driftResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driftSummary.total}</div>
              <p className="text-xs text-muted-foreground">Analyzed features</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drift Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{driftSummary.detected}</div>
              <p className="text-xs text-muted-foreground">Features with drift</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driftSummary.high}</div>
              <p className="text-xs text-muted-foreground">Critical alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Check</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">Last detection run</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drift Detection Results */}
      {driftResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Drift Detection Results</CardTitle>
            <CardDescription>
              Kolmogorov-Smirnov test results (p-value threshold: 0.05)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={driftResults}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} />
                <YAxis dataKey="feature" type="category" />
                <Tooltip />
                <Bar dataKey="p_value" name="P-Value">
                  {driftResults.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-2">
              <h3 className="font-medium mb-2">Feature Status</h3>
              {driftResults.map((result) => (
                <div
                  key={result.feature}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.drift_detected ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-medium">{result.feature}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      p-value: {result.p_value.toFixed(4)}
                    </span>
                    <Badge className={getSeverityBadgeClass(result.severity)}>
                      {result.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drift Alerts History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts (Last 30 Days)</CardTitle>
          <CardDescription>
            {alerts.length} alerts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                No drift alerts in the last 30 days. System is operating normally.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50"
                >
                  <AlertTriangle 
                    className="h-5 w-5 flex-shrink-0 mt-0.5" 
                    style={{ color: getSeverityColor(alert.severity) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.feature}</span>
                      <Badge className={getSeverityBadgeClass(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(alert.timestamp)} • p-value: {alert.p_value.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {driftSummary.high > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> {driftSummary.high} feature(s) showing high severity drift. 
            Consider retraining the model with fresh data to maintain prediction accuracy.
          </AlertDescription>
        </Alert>
      )}

      {driftSummary.detected === 0 && driftResults.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            No drift detected. The data distribution remains consistent with the training data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DriftMonitor;
