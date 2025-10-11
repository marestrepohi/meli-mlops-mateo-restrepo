import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { syntheticAPI } from '@/lib/api';
import { Loader2, Download, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SyntheticData {
  data: Record<string, number[]>;
  metadata: {
    n_samples: number;
    drift_factor: number;
    drift_features: string[];
    timestamp: string;
  };
}

const FEATURES = [
  'CRIM', 'ZN', 'INDUS', 'CHAS', 'NOX', 'RM', 
  'AGE', 'DIS', 'RAD', 'TAX', 'PTRATIO', 'B', 'LSTAT'
];

const DataGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [nSamples, setNSamples] = useState(100);
  const [driftFactor, setDriftFactor] = useState(0.5);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [generatedData, setGeneratedData] = useState<SyntheticData | null>(null);
  const [datasetName, setDatasetName] = useState('');

  const generateData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await syntheticAPI.generateData(
        nSamples,
        driftFactor,
        selectedFeatures.length > 0 ? selectedFeatures : undefined
      );

      setGeneratedData(data);
      setSuccess(`Successfully generated ${nSamples} samples with drift factor ${driftFactor}`);
    } catch (err: any) {
      setError(err.message || 'Error generating synthetic data');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    if (!generatedData || !datasetName.trim()) {
      setError('Please provide a dataset name');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await syntheticAPI.saveDataset(generatedData.data, datasetName);
      setSuccess(`Dataset saved as "${datasetName}"`);
      setDatasetName('');
    } catch (err: any) {
      setError(err.message || 'Error saving dataset');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const selectAllFeatures = () => {
    setSelectedFeatures(FEATURES);
  };

  const clearSelection = () => {
    setSelectedFeatures([]);
  };

  const getFeatureStats = (feature: string) => {
    if (!generatedData) return null;

    const values = generatedData.data[feature];
    if (!values) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, std, min, max };
  };

  const prepareChartData = () => {
    if (!generatedData) return [];

    return FEATURES.slice(0, 6).map(feature => {
      const stats = getFeatureStats(feature);
      return {
        feature,
        mean: stats?.mean.toFixed(2) || 0,
        std: stats?.std.toFixed(2) || 0,
      };
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Synthetic Data Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate synthetic data with configurable drift for testing
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generator Configuration
            </CardTitle>
            <CardDescription>Configure synthetic data generation parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number of Samples */}
            <div className="space-y-2">
              <Label htmlFor="n_samples">Number of Samples: {nSamples}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="n_samples"
                  min={50}
                  max={1000}
                  step={50}
                  value={[nSamples]}
                  onValueChange={(value) => setNSamples(value[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={nSamples}
                  onChange={(e) => setNSamples(Math.max(50, Math.min(1000, parseInt(e.target.value) || 50)))}
                  className="w-24"
                />
              </div>
            </div>

            {/* Drift Factor */}
            <div className="space-y-2">
              <Label htmlFor="drift_factor">
                Drift Factor: {driftFactor.toFixed(2)}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="drift_factor"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[driftFactor]}
                  onValueChange={(value) => setDriftFactor(value[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={driftFactor}
                  onChange={(e) => setDriftFactor(Math.max(0, Math.min(2, parseFloat(e.target.value) || 0)))}
                  step="0.1"
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                0.0 = No drift, 2.0 = Maximum drift
              </p>
            </div>

            {/* Feature Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features to Apply Drift</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFeatures}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedFeatures.length === 0 
                  ? 'All features will have drift applied' 
                  : `${selectedFeatures.length} feature(s) selected`}
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <label
                      htmlFor={feature}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Synthetic Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Data Preview</CardTitle>
            <CardDescription>
              {generatedData 
                ? `${generatedData.metadata.n_samples} samples generated` 
                : 'Configure and generate data to see preview'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedData ? (
              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Samples</p>
                    <p className="text-2xl font-bold">{generatedData.metadata.n_samples}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drift Factor</p>
                    <p className="text-2xl font-bold">{generatedData.metadata.drift_factor}</p>
                  </div>
                </div>

                {generatedData.metadata.drift_features.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Drift Applied To:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedData.metadata.drift_features.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Statistics */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Feature Statistics (Sample)</p>
                  <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                    {FEATURES.slice(0, 5).map((feature) => {
                      const stats = getFeatureStats(feature);
                      if (!stats) return null;
                      return (
                        <div key={feature} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{feature}</span>
                          <span className="text-muted-foreground">
                            μ={stats.mean.toFixed(2)} σ={stats.std.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Section */}
                <div className="border-t pt-4 space-y-2">
                  <Label htmlFor="dataset_name">Save Dataset As:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dataset_name"
                      placeholder="my_synthetic_dataset"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                    />
                    <Button
                      onClick={saveData}
                      disabled={saving || !datasetName.trim()}
                      variant="secondary"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dataset will be saved to data/ directory
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Generate data to see preview</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Chart */}
      {generatedData && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Statistics Visualization</CardTitle>
            <CardDescription>Mean and standard deviation for selected features</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="mean" fill="#3b82f6" name="Mean" />
                <Bar dataKey="std" fill="#10b981" name="Std Dev" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Synthetic Data Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Purpose:</strong> Generate synthetic datasets to test model behavior under different data conditions.
          </p>
          <p>
            <strong>Drift Factor:</strong> Controls how much the generated data deviates from the original distribution. 
            Higher values create more significant drift, useful for testing model robustness.
          </p>
          <p>
            <strong>Feature Selection:</strong> Choose specific features to apply drift, or leave empty to apply drift to all features.
          </p>
          <p>
            <strong>Use Cases:</strong> Testing drift detection, model retraining scenarios, stress testing, and validation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataGenerator;
