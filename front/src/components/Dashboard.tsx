import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const models = [
  {
    name: "housing-price-production",
    id: "hp-prod-01",
    version: "v1.0",
    updated: "Oct 15, 2025 10:30",
    author: "Mateo Restrepo",
    authorInitials: "MR",
    tags: ["Producción", "Regresión", "XGBoost"],
    status: "Deployment" as const,
  },
  {
    name: "agente-llm-genai",
    id: "llm-gen-01",
    version: "v0.1.0",
    updated: "Oct 15, 2025 09:00",
    author: "Mateo Restrepo",
    authorInitials: "MR",
    tags: ["GenAI", "LLM", "En Desarrollo"],
    status: "In Progress" as const,
  },
];

const statusConfig = {
  "Deployment": { color: "bg-green-100 text-green-700 border-green-200", label: "En Producción" },
  "Staging": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Staging" },
  "In Progress": { color: "bg-blue-100 text-blue-700 border-blue-200", label: "En Desarrollo" },
  "Deprecated": { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Deprecado" },
};

const tagColors = {
  "Producción": "bg-green-50 text-green-700 border-green-200",
  "Regresión": "bg-blue-50 text-blue-700 border-blue-200",
  "XGBoost": "bg-orange-50 text-orange-700 border-orange-200",
  "GenAI": "bg-purple-50 text-purple-700 border-purple-200",
  "LLM": "bg-pink-50 text-pink-700 border-pink-200",
  "En Desarrollo": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const Dashboard = () => {
  return (
    <div className="flex-1 bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Modelos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra y rastrea tus modelos de ML
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Modelo
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar..."
              className="bg-card"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Models Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Última Versión</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model, index) => (
                <TableRow key={index} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <input type="checkbox" className="rounded border-border" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <span className="text-white text-xs font-bold">⚡</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {model.version}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {model.updated}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-muted">
                          {model.authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{model.author}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {model.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`text-xs ${tagColors[tag as keyof typeof tagColors]}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <span className="text-muted-foreground">⋮</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
