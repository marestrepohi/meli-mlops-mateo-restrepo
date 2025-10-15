import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const pipelinesData = [
  {
    id: 1,
    name: "Training Pipeline",
    status: "running",
    lastRun: "2 hours ago",
    success: 45,
    failed: 2,
  },
  {
    id: 2,
    name: "Data Preprocessing",
    status: "completed",
    lastRun: "5 hours ago",
    success: 120,
    failed: 0,
  },
  {
    id: 3,
    name: "Model Evaluation",
    status: "idle",
    lastRun: "1 day ago",
    success: 89,
    failed: 5,
  },
];

const Pipelines = () => {
  const handleCreatePipeline = () => {
    toast({
      title: "Create Pipeline",
      description: "Pipeline creation wizard will open here.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your ML pipelines and workflows
          </p>
        </div>
        <Button size="sm" onClick={handleCreatePipeline}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pipelinesData.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                <Badge
                  variant={
                    pipeline.status === "running"
                      ? "default"
                      : pipeline.status === "completed"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {pipeline.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Last run: {pipeline.lastRun}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Success</div>
                  <div className="text-lg font-semibold text-green-600">
                    {pipeline.success}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Failed</div>
                  <div className="text-lg font-semibold text-red-600">
                    {pipeline.failed}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Pipelines;
