import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Home, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  return (
    <div className="p-8 space-y-8">
      {/* Hero Section - Housing Project */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge variant="outline" className="mb-3 bg-green-50 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              En Producción
            </Badge>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Home className="h-8 w-8 text-primary" />
              Housing Price Prediction
            </h2>
            <p className="text-muted-foreground mb-4 max-w-2xl">
              Pipeline ML completo con DVC, MLflow y API REST. Predice precios de viviendas
              usando XGBoost con un R² de 91.7%. Incluye 3 experimentos, feature selection con SHAP,
              y monitoreo en tiempo real con drift detection.
            </p>
            <div className="flex gap-3">
              <Link to="/housing">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  Ver Proyecto
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/housing/api-demo">
                <Button size="lg" variant="outline" className="gap-2">
                  Probar API
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-3 ml-8">
              <StatCard label="R² Score" value="91.7%" />
              <StatCard label="RMSE" value="2.46" />
              <StatCard label="Features" value="10/13" />
              <StatCard label="Experimentos" value="3" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Todos los Proyectos</h1>
            <p className="text-muted-foreground mt-1">Administra tus proyectos MLOps</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Housing Project Card */}
          <Link to="/housing">
            <Card className="bg-project-card border-primary/50 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                    <Home className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge variant="default" className="bg-green-600">Producción</Badge>
                </div>
                <CardTitle className="text-xl">Housing Price Prediction</CardTitle>
                <CardDescription className="text-project-card-foreground/70">
                  Predicción de precios con XGBoost y MLflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pipeline:</span>
                    <span className="font-medium">DVC (4 stages)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-medium">XGBoost</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última actualización:</span>
                    <span className="font-medium">Hoy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Other Projects */}
          <Card className="bg-project-card border-border hover:shadow-md transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <FolderKanban className="w-6 h-6 text-muted-foreground" />
                </div>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <CardTitle className="text-xl">Production Models</CardTitle>
              <CardDescription className="text-project-card-foreground/70">
                Entorno principal para modelos en producción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelos:</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pipelines Activos:</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="font-medium">--</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dashboard Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Overview</h2>
        <Dashboard />
      </div>
    </div>
  );
};

// Helper Component
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-primary/20 rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

export default Index;
