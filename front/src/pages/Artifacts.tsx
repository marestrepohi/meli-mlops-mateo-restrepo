import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const artifactsData = [
  {
    id: 1,
    name: "trained_model_v1.pkl",
    type: "Model",
    size: "45.2 MB",
    created: "Jan 15, 2025",
  },
  {
    id: 2,
    name: "preprocessed_data.csv",
    type: "Dataset",
    size: "120.5 MB",
    created: "Jan 14, 2025",
  },
  {
    id: 3,
    name: "evaluation_results.json",
    type: "Metrics",
    size: "2.3 KB",
    created: "Jan 15, 2025",
  },
  {
    id: 4,
    name: "feature_importance.png",
    type: "Visualization",
    size: "450 KB",
    created: "Jan 13, 2025",
  },
];

const Artifacts = () => {
  const handleDownload = (name: string) => {
    toast({
      title: "Downloading artifact",
      description: `Downloading ${name}...`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Artifacts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your ML artifacts and outputs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifactsData.map((artifact) => (
          <Card key={artifact.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  {artifact.type === "Model" ? (
                    <Database className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm truncate">{artifact.name}</CardTitle>
                  <div className="text-xs text-muted-foreground">{artifact.type}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{artifact.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{artifact.created}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleDownload(artifact.name)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Artifacts;
