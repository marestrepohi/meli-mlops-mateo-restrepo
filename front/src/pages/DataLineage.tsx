import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { lineageAPI } from '@/lib/api';
import { Loader2, GitBranch, ArrowRight, AlertCircle } from 'lucide-react';

interface DataVersion {
  version: string;
  timestamp: string;
  rows: number;
  columns: number;
  file_path: string;
}

interface VersionChanges {
  version1: string;
  version2: string;
  rows_diff: number;
  columns_diff: number;
  added_features: string[];
  removed_features: string[];
  statistics_diff: Record<string, {
    mean_diff: number;
    std_diff: number;
    min_diff: number;
    max_diff: number;
  }>;
}

const DataLineage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [selectedVersion1, setSelectedVersion1] = useState<string>('');
  const [selectedVersion2, setSelectedVersion2] = useState<string>('');
  const [changes, setChanges] = useState<VersionChanges | null>(null);
  const [loadingChanges, setLoadingChanges] = useState(false);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await lineageAPI.getVersions();
      const sortedVersions = data.versions.sort((a: DataVersion, b: DataVersion) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setVersions(sortedVersions);

      if (sortedVersions.length >= 2) {
        setSelectedVersion1(sortedVersions[1].version);
        setSelectedVersion2(sortedVersions[0].version);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading versions');
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!selectedVersion1 || !selectedVersion2) return;

    try {
      setLoadingChanges(true);
      const data = await lineageAPI.compareVersions(selectedVersion1, selectedVersion2);
      setChanges(data);
    } catch (err: any) {
      console.error('Error comparing versions:', err);
    } finally {
      setLoadingChanges(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRowsDiffColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
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
          <h1 className="text-4xl font-bold">Data Lineage</h1>
          <p className="text-muted-foreground mt-2">Track dataset versions and changes over time</p>
        </div>
      </div>

      {/* Version Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Dataset Versions Timeline
          </CardTitle>
          <CardDescription>All available dataset versions</CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No dataset versions found. Train a model to create the first version.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {versions.map((version, idx) => (
                <div key={version.version} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-shrink-0">
                    <Badge variant={idx === 0 ? 'default' : 'outline'}>
                      {idx === 0 ? 'Latest' : `v${versions.length - idx}`}
                    </Badge>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Version</p>
                      <p className="text-sm text-muted-foreground">{version.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Timestamp</p>
                      <p className="text-sm text-muted-foreground">{formatDate(version.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rows</p>
                      <p className="text-sm text-muted-foreground">{version.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Columns</p>
                      <p className="text-sm text-muted-foreground">{version.columns}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Comparison */}
      {versions.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare Versions</CardTitle>
            <CardDescription>Select two versions to see what changed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Version 1 (Older)</label>
                <Select value={selectedVersion1} onValueChange={setSelectedVersion1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.version} value={version.version}>
                        {version.version} - {formatDate(version.timestamp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Version 2 (Newer)</label>
                <Select value={selectedVersion2} onValueChange={setSelectedVersion2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.version} value={version.version}>
                        {version.version} - {formatDate(version.timestamp)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={compareVersions} 
              disabled={!selectedVersion1 || !selectedVersion2 || loadingChanges}
              className="w-full"
            >
              {loadingChanges ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comparing...
                </>
              ) : (
                'Compare Versions'
              )}
            </Button>

            {/* Comparison Results */}
            {changes && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Rows Change</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${getRowsDiffColor(changes.rows_diff)}`}>
                        {changes.rows_diff > 0 ? '+' : ''}{changes.rows_diff.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Columns Change</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-2xl font-bold ${getRowsDiffColor(changes.columns_diff)}`}>
                        {changes.columns_diff > 0 ? '+' : ''}{changes.columns_diff}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Feature Changes */}
                {(changes.added_features.length > 0 || changes.removed_features.length > 0) && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Feature Changes</h3>
                    {changes.added_features.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Added Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {changes.added_features.map((feature) => (
                            <Badge key={feature} variant="default" className="bg-green-600">
                              + {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {changes.removed_features.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Removed Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {changes.removed_features.map((feature) => (
                            <Badge key={feature} variant="destructive">
                              - {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Differences */}
                <div>
                  <h3 className="font-medium mb-2">Statistical Changes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Feature</th>
                          <th className="text-right p-2">Mean Δ</th>
                          <th className="text-right p-2">Std Δ</th>
                          <th className="text-right p-2">Min Δ</th>
                          <th className="text-right p-2">Max Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(changes.statistics_diff).map(([feature, stats]) => (
                          <tr key={feature} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{feature}</td>
                            <td className={`text-right p-2 ${getRowsDiffColor(stats.mean_diff)}`}>
                              {stats.mean_diff > 0 ? '+' : ''}{stats.mean_diff.toFixed(4)}
                            </td>
                            <td className={`text-right p-2 ${getRowsDiffColor(stats.std_diff)}`}>
                              {stats.std_diff > 0 ? '+' : ''}{stats.std_diff.toFixed(4)}
                            </td>
                            <td className={`text-right p-2 ${getRowsDiffColor(stats.min_diff)}`}>
                              {stats.min_diff > 0 ? '+' : ''}{stats.min_diff.toFixed(4)}
                            </td>
                            <td className={`text-right p-2 ${getRowsDiffColor(stats.max_diff)}`}>
                              {stats.max_diff > 0 ? '+' : ''}{stats.max_diff.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataLineage;
