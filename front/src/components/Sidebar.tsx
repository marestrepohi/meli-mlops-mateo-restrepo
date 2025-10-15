import { 
  Home, 
  FolderKanban, 
  Sparkles, 
  Activity, 
  GitBranch, 
  BarChart3, 
  Play, 
  Box, 
  Layers,
  Database,
  FileText,
  TrendingUp,
  Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Sidebar = () => {
  const location = useLocation();
  
  // Check if we're in a project page
  const isInHousingProject = location.pathname.startsWith('/housing');
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 border-r border-border bg-sidebar h-screen sticky top-0 pt-16 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Main Navigation - Always visible */}
        <nav className="space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start ${
              isActive('/') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
            }`}
            asChild
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-3" />
              Inicio
            </Link>
          </Button>
        </nav>

        {/* Housing Project Section - Only show when in project */}
        {isInHousingProject && (
          <>
            <Separator />
            
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Housing Price Prediction
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Gestiona modelos, pipelines y artefactos
                </p>
              </div>

              {/* Overview */}
              <nav className="space-y-1 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start ${
                    isActive('/housing') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                  }`}
                  asChild
                >
                  <Link to="/housing">
                    <Sparkles className="w-4 h-4 mr-3" />
                    Overview
                  </Link>
                </Button>
              </nav>

              <Separator className="my-3" />

              {/* Modelos Section */}
              <div className="mb-4">
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Box className="h-3 w-3" />
                  Modelos
                </h4>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/code') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/code">
                      <Code2 className="w-3 h-3 mr-2" />
                      Código
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/api-demo') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/api-demo">
                      <Play className="w-3 h-3 mr-2" />
                      API Demo
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/monitoring') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/monitoring">
                      <Activity className="w-3 h-3 mr-2" />
                      Monitoreo
                    </Link>
                  </Button>
                </nav>
              </div>

              {/* Pipelines Section */}
              <div className="mb-4">
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <GitBranch className="h-3 w-3" />
                  Pipelines
                </h4>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/pipeline') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/pipeline">
                      <GitBranch className="w-3 h-3 mr-2" />
                      Pipeline DVC
                    </Link>
                  </Button>
                </nav>
              </div>

              {/* Artefactos Section */}
              <div className="mb-4">
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-3 w-3" />
                  Artefactos
                </h4>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/eda') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/eda">
                      <Database className="w-3 h-3 mr-2" />
                      EDA Report
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/mlflow') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/mlflow">
                      <FileText className="w-3 h-3 mr-2" />
                      MLflow UI
                    </Link>
                  </Button>
                </nav>
              </div>

              {/* Runs Section */}
              <div className="mb-4">
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Runs
                </h4>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start pl-6 ${
                      isActive('/housing/experiments') ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    asChild
                  >
                    <Link to="/housing/experiments">
                      <BarChart3 className="w-3 h-3 mr-2" />
                      Experimentos
                    </Link>
                  </Button>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
