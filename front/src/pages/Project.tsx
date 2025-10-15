import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  GitBranch, 
  Database, 
  FileText, 
  Plus, 
  RefreshCw, 
  Play, 
  Pause, 
  Download,
  Trash2,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Project = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("models");

  const models = [
    { id: 1, name: "sentiment-classifier-v2", version: "2.1.0", status: "active", accuracy: "94.5%" },
    { id: 2, name: "image-recognition", version: "1.8.3", status: "active", accuracy: "91.2%" },
    { id: 3, name: "fraud-detection", version: "3.0.1", status: "training", accuracy: "96.8%" },
  ];

  const pipelines = [
    { id: 1, name: "daily-training-pipeline", status: "running", lastRun: "2 hours ago" },
    { id: 2, name: "data-preprocessing", status: "stopped", lastRun: "1 day ago" },
    { id: 3, name: "model-evaluation", status: "running", lastRun: "30 min ago" },
  ];

  const artifacts = [
    { id: 1, name: "training-dataset-v1.csv", size: "2.4 GB", created: "2024-10-10" },
    { id: 2, name: "model-weights.h5", size: "156 MB", created: "2024-10-14" },
    { id: 3, name: "validation-results.json", size: "4.2 MB", created: "2024-10-13" },
  ];

  const runs = [
    { id: 1, name: "Training Run #245", status: "completed", duration: "2h 34m", date: "2024-10-14" },
    { id: 2, name: "Training Run #244", status: "failed", duration: "45m", date: "2024-10-13" },
    { id: 3, name: "Training Run #243", status: "completed", duration: "3h 12m", date: "2024-10-12" },
  ];

  const handleAddModel = () => {
    toast({ title: "Agregar Modelo", description: "Funcionalidad para agregar modelo" });
  };

  const handleRefresh = () => {
    toast({ title: "Actualizado", description: "Datos actualizados correctamente" });
  };

  const handleRunPipeline = (name: string) => {
    toast({ title: "Pipeline Iniciado", description: `${name} ha sido iniciado` });
  };

  const handleDownload = (name: string) => {
    toast({ title: "Descargando", description: `Descargando ${name}` });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Production Models</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus modelos, pipelines y artefactos</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="pipelines" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="artifacts" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Artifacts
          </TabsTrigger>
          <TabsTrigger value="runs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Runs
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Modelos</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Button size="sm" onClick={handleAddModel}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Modelo
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{model.name}</CardTitle>
                      <CardDescription>Versión {model.version}</CardDescription>
                    </div>
                    <Badge variant={model.status === "active" ? "default" : "secondary"}>
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Precisión: </span>
                      <span className="font-medium">{model.accuracy}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pipelines</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pipeline
            </Button>
          </div>

          <div className="grid gap-4">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription>Última ejecución: {pipeline.lastRun}</CardDescription>
                    </div>
                    <Badge variant={pipeline.status === "running" ? "default" : "secondary"}>
                      {pipeline.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRunPipeline(pipeline.name)}
                    >
                      {pipeline.status === "running" ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Detener
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Ejecutar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Artifacts Tab */}
        <TabsContent value="artifacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Artifacts</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Subir Artifact
            </Button>
          </div>

          <div className="grid gap-4">
            {artifacts.map((artifact) => (
              <Card key={artifact.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{artifact.name}</CardTitle>
                      <CardDescription>
                        {artifact.size} • Creado {artifact.created}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(artifact.name)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Runs</h2>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>

          <div className="grid gap-4">
            {runs.map((run) => (
              <Card key={run.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{run.name}</CardTitle>
                      <CardDescription>
                        {run.date} • Duración: {run.duration}
                      </CardDescription>
                    </div>
                    <Badge variant={run.status === "completed" ? "default" : "destructive"}>
                      {run.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Logs
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Project;
