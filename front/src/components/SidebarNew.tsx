import { 
  Home, 
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
  Code2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper component for menu items
const MenuItem = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed,
  isNested = false 
}: { 
  to: string; 
  icon: any; 
  label: string; 
  isActive: boolean; 
  isCollapsed: boolean;
  isNested?: boolean;
}) => {
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`w-full justify-center h-9 ${
                isActive ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
              }`}
              asChild
            >
              <Link to={to}>
                <Icon className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`w-full justify-start ${isNested ? 'pl-6' : ''} h-9 ${
        isActive ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
      }`}
      asChild
    >
      <Link to={to}>
        <Icon className="w-3.5 h-3.5 mr-2" />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if we're in a project page
  const isInHousingProject = location.pathname.startsWith('/housing');
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} border-r border-border bg-sidebar h-screen fixed top-0 pt-16 flex flex-col transition-all duration-300`}>
      <div className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent relative`}>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 z-50 h-6 w-6 rounded-full border border-border bg-sidebar hover:bg-card shadow-md"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Botón Volver al Inicio - Solo visible en proyectos */}
        {isInHousingProject && (
          <nav className="space-y-1">
            {isCollapsed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                      asChild
                    >
                      <Link to="/">
                        <Home className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Volver al Inicio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="default"
                className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                asChild
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-3" />
                  Volver al Inicio
                </Link>
              </Button>
            )}
          </nav>
        )}

        {/* Housing Project Section - Only show when in project */}
        {isInHousingProject && (
          <>
            <Separator />
            
            <div>
              {!isCollapsed && (
                <div className="px-3 py-2 mb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    Housing Price Prediction
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    Gestiona modelos, pipelines y artefactos
                  </p>
                </div>
              )}

              {/* Overview */}
              <nav className="space-y-1 mb-3">
                <MenuItem 
                  to="/housing"
                  icon={Sparkles}
                  label="Overview"
                  isActive={isActive('/housing')}
                  isCollapsed={isCollapsed}
                />
              </nav>

              <Separator className="my-2" />

              {/* Modelos Section */}
              <div className="mb-3">
                {!isCollapsed && (
                  <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Box className="h-3.5 w-3.5" />
                    Modelos
                  </h4>
                )}
                <nav className="space-y-1">
                  <MenuItem 
                    to="/housing/code"
                    icon={Code2}
                    label="Código"
                    isActive={isActive('/housing/code')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                  <MenuItem 
                    to="/housing/api-demo"
                    icon={Play}
                    label="API Demo"
                    isActive={isActive('/housing/api-demo')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                  <MenuItem 
                    to="/housing/monitoring"
                    icon={Activity}
                    label="Monitoreo"
                    isActive={isActive('/housing/monitoring')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                </nav>
              </div>

              {/* Pipelines Section */}
              <div className="mb-3">
                {!isCollapsed && (
                  <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5" />
                    Pipelines
                  </h4>
                )}
                <nav className="space-y-1">
                  <MenuItem 
                    to="/housing/pipeline"
                    icon={GitBranch}
                    label="Pipeline DVC"
                    isActive={isActive('/housing/pipeline')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                  <MenuItem 
                    to="/housing/actions"
                    icon={Activity}
                    label="GitHub Actions"
                    isActive={isActive('/housing/actions')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                </nav>
              </div>

              {/* Artefactos Section */}
              <div className="mb-3">
                {!isCollapsed && (
                  <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    Artefactos
                  </h4>
                )}
                <nav className="space-y-1">
                  <MenuItem 
                    to="/housing/eda"
                    icon={Database}
                    label="EDA Report"
                    isActive={isActive('/housing/eda')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                  <MenuItem 
                    to="/housing/mlflow"
                    icon={FileText}
                    label="MLflow UI"
                    isActive={isActive('/housing/mlflow')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
                </nav>
              </div>

              {/* Runs Section */}
              <div className="mb-3">
                {!isCollapsed && (
                  <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Runs
                  </h4>
                )}
                <nav className="space-y-1">
                  <MenuItem 
                    to="/housing/experiments"
                    icon={BarChart3}
                    label="Experimentos"
                    isActive={isActive('/housing/experiments')}
                    isCollapsed={isCollapsed}
                    isNested={!isCollapsed}
                  />
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
