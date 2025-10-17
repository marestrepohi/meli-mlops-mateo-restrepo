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
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useSidebar } from "@/contexts/SidebarContext";

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
              className={`w-full h-10 ${
                isActive ? "bg-card text-foreground font-medium" : "text-sidebar-foreground hover:bg-card/50 hover:text-foreground"
              }`}
              asChild
            >
              <Link to={to}>
                <Icon className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
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
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-sm">{label}</span>
      </Link>
    </Button>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  // Check if we're in a project page
  const isInHousingProject = location.pathname.startsWith('/housing');
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} border-r border-border bg-sidebar h-screen fixed top-0 pt-16 flex flex-col transition-all duration-300 ease-in-out z-40`}>
      {/* Contenido con scroll si es necesario */}
      <div className={`flex-1 ${isCollapsed ? 'p-2' : 'px-3 py-2'} overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent`}>
        {/* Botón Volver al Inicio - Solo visible en proyectos */}
        {isInHousingProject && (
          <nav className={isCollapsed ? 'mb-1' : 'mb-2'}>
            {isCollapsed ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                      asChild
                    >
                      <Link to="/">
                        <Home className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    <p>Volver al Inicio</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full justify-center h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                asChild
              >
                <Link to="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Volver al Inicio</span>
                </Link>
              </Button>
            )}
          </nav>
        )}

        {/* Housing Project Section - Only show when in project */}
        {isInHousingProject && (
          <>
            {!isCollapsed && <Separator className="mb-1" />}
            
            <div>
              {/* Título del proyecto - solo cuando expandido */}
              {!isCollapsed && (
                <div className="px-2 py-1.5 mb-1.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-primary" />
                    Housing Price Prediction
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    Gestiona modelos, pipelines y artefactos
                  </p>
                </div>
              )}

              {/* Overview */}
              <nav className={isCollapsed ? 'mb-1' : 'mb-2'}>
                <MenuItem 
                  to="/housing" 
                  icon={Sparkles} 
                  label="Overview" 
                  isActive={isActive('/housing')} 
                  isCollapsed={isCollapsed} 
                />
              </nav>

              {!isCollapsed && <Separator className="my-1.5" />}

              {/* Modelos Section */}
              <div className={isCollapsed ? 'mb-1' : 'mb-2'}>
                {!isCollapsed && (
                  <h4 className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    Modelos
                  </h4>
                )}
                <nav className="space-y-0.5">
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
              <div className={isCollapsed ? 'mb-1' : 'mb-1.5'}>
                {!isCollapsed && (
                  <h4 className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Pipelines
                  </h4>
                )}
                <nav className="space-y-0.5">
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
              <div className={isCollapsed ? 'mb-1' : 'mb-1.5'}>
                {!isCollapsed && (
                  <h4 className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Artefactos
                  </h4>
                )}
                <nav className="space-y-0.5">
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
              <div className={isCollapsed ? 'mb-1' : 'mb-1.5'}>
                {!isCollapsed && (
                  <h4 className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Runs
                  </h4>
                )}
                <nav className="space-y-0.5">
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

      {/* Toggle Button - Parte inferior */}
      <div className={`border-t border-border ${isCollapsed ? 'p-2' : 'p-3'}`}>
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className={`w-full ${isCollapsed ? 'h-10 justify-center' : 'h-9 justify-start'} hover:bg-card/50`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">Contraer</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
