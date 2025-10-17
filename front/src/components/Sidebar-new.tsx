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
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check if we're in a project page
  const isInHousingProject = location.pathname.startsWith('/housing');
  
  const isActive = (path: string) => location.pathname === path;

  // Component for menu items that handles collapsed state
  const NavItem = ({ 
    to, 
    icon: Icon, 
    label, 
    nested = false 
  }: { 
    to: string; 
    icon: any; 
    label: string; 
    nested?: boolean;
  }) => {
    const active = isActive(to);
    const buttonContent = (
      <>
        <Icon className={isCollapsed ? "h-5 w-5" : "h-4 w-4"} />
        {!isCollapsed && <span className="ml-2">{label}</span>}
      </>
    );

    const buttonClasses = `w-full h-9 ${
      isCollapsed ? 'justify-center px-0' : nested ? 'justify-start pl-6' : 'justify-start'
    } ${active ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"}`;

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={buttonClasses}
                asChild
              >
                <Link to={to}>{buttonContent}</Link>
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
        className={buttonClasses}
        asChild
      >
        <Link to={to}>{buttonContent}</Link>
      </Button>
    );
  };

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } border-r border-border bg-sidebar h-screen fixed top-0 pt-16 flex flex-col transition-all duration-300 ease-in-out z-40`}
    >
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Toggle Button */}
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Botón Volver al Inicio - Solo visible en proyectos */}
        {isInHousingProject && (
          <>
            <nav className="space-y-1">
              {isCollapsed ? (
                <TooltipProvider delayDuration={100}>
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
                <NavItem to="/housing" icon={Sparkles} label="Overview" />
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
                  <NavItem to="/housing/code" icon={Code2} label="Código" nested={!isCollapsed} />
                  <NavItem to="/housing/api-demo" icon={Play} label="API Demo" nested={!isCollapsed} />
                  <NavItem to="/housing/monitoring" icon={Activity} label="Monitoreo" nested={!isCollapsed} />
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
                  <NavItem to="/housing/pipeline" icon={GitBranch} label="Pipeline DVC" nested={!isCollapsed} />
                  <NavItem to="/housing/actions" icon={Activity} label="GitHub Actions" nested={!isCollapsed} />
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
                  <NavItem to="/housing/eda" icon={Database} label="EDA Report" nested={!isCollapsed} />
                  <NavItem to="/housing/mlflow" icon={FileText} label="MLflow UI" nested={!isCollapsed} />
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
                  <NavItem to="/housing/experiments" icon={BarChart3} label="Experimentos" nested={!isCollapsed} />
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
