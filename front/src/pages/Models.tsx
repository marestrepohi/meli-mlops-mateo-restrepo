import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Filter, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const modelsData = [
  {
    name: "iris_logistic_regression",
    id: "1f42d62d",
    version: "v1.3.0",
    updated: "Feb 3, 2025 16:45",
    author: "Theresa Webb",
    authorInitials: "TW",
    tags: ["Predictive", "Growth", "Insights"],
    status: "Deployment" as const,
  },
  {
    name: "RevenueRise",
    id: "2a53e73e",
    version: "v2.0.1",
    updated: "Jan 15, 2025 09:20",
    author: "Cameron Williams",
    authorInitials: "CW",
    tags: ["Growth", "Predictive", "Financial"],
    status: "Staging" as const,
  },
  {
    name: "RiskGuardian",
    id: "3b64f84f",
    version: "v1.5.3",
    updated: "Mar 8, 2025 11:05",
    author: "Wade Warren",
    authorInitials: "WW",
    tags: ["Security", "Detection"],
    status: "Deployment" as const,
  },
  {
    name: "FraudFind",
    id: "4c75g95g",
    version: "v3.1.0",
    updated: "Apr 21, 2025 14:30",
    author: "Cameron Williams",
    authorInitials: "CW",
    tags: ["Detection", "Security", "Predictive"],
    status: "In Progress" as const,
  },
  {
    name: "TrendExplorer",
    id: "5d86h06h",
    version: "v2.2.2",
    updated: "Feb 28, 2025 18:55",
    author: "Theresa Webb",
    authorInitials: "TW",
    tags: ["Insights", "Predictive", "Growth"],
    status: "Deployment" as const,
  },
];

const tagColors = {
  "Predictive": "bg-green-50 text-green-700 border-green-200",
  "Growth": "bg-blue-50 text-blue-700 border-blue-200",
  "Insights": "bg-orange-50 text-orange-700 border-orange-200",
  "Financial": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Security": "bg-pink-50 text-pink-700 border-pink-200",
  "Detection": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const Models = () => {
  const [search, setSearch] = useState("");

  const filteredModels = modelsData.filter(model => 
    model.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    toast({
      title: "Refreshing models",
      description: "Fetching latest model data...",
    });
  };

  const handleAddModel = () => {
    toast({
      title: "Add new model",
      description: "This feature will open the model creation dialog.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Models</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your ML models
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddModel}>
            <Plus className="w-4 h-4 mr-2" />
            Add a Model
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search models..."
            className="bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Latest Version</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.map((model) => (
              <TableRow key={model.id} className="hover:bg-muted/50 cursor-pointer">
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
  );
};

export default Models;
