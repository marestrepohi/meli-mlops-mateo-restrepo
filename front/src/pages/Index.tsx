import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Home, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 'housing',
      gradient: 'from-primary/10 to-primary/5',
      border: 'border-primary/20',
      badge: { color: 'bg-green-50 text-green-700 border-green-300', icon: CheckCircle2, text: 'En Producción' },
      icon: Home,
      iconColor: 'text-primary',
      title: 'Housing Price Prediction',
      description: 'Pipeline ML completo con DVC, MLflow y API REST. Predice precios de viviendas usando XGBoost con un R² de 91.7%. Incluye 3 experimentos, feature selection con SHAP, y monitoreo en tiempo real con drift detection.',
      buttons: [
        { to: '/housing', text: 'Ver Proyecto', variant: 'default' as const, icon: Sparkles },
        { to: '/housing/api-demo', text: 'Probar API', variant: 'outline' as const }
      ],
      stats: [
        { label: 'R² Score', value: '91.7%' },
        { label: 'RMSE', value: '2.46' },
        { label: 'Features', value: '10/13' },
        { label: 'Experimentos', value: '3' }
      ]
    },
    {
      id: 'llm',
      gradient: 'from-purple-500/10 to-pink-500/5',
      border: 'border-purple-500/20',
      badge: { color: 'bg-blue-50 text-blue-700 border-blue-300', icon: Sparkles, text: 'En Desarrollo' },
      icon: Sparkles,
      iconColor: 'text-purple-600',
      title: 'Agente LLM GenAI',
      description: 'Sistema de IA Generativa con evaluación y monitoreo de LLMs usando MLflow. Incluye integración con modelos de OpenAI/Llama, evaluación automática de respuestas, y detección de drift en calidad de generación.',
      link: { href: 'https://mlflow.org/docs/latest/genai/eval-monitor/quickstart/', text: 'MLflow GenAI Quickstart' },
      buttons: [
        { text: 'Ver Proyecto', variant: 'outline' as const, icon: Sparkles, className: 'border-purple-600 text-purple-600 hover:bg-purple-50' },
        { external: 'https://mlflow.org/docs/latest/genai/eval-monitor/quickstart/', text: 'Documentación MLflow', variant: 'outline' as const }
      ],
      stats: [
        { label: 'Modelo Base', value: 'GPT-4' },
        { label: 'Evaluaciones', value: '0' },
        { label: 'Prompts', value: '0' },
        { label: 'Estado', value: 'Dev' }
      ]
    }
  ];

  // Auto-rotate slides every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const currentHero = heroSlides[currentSlide];
  const BadgeIcon = currentHero.badge.icon;
  const TitleIcon = currentHero.icon;

  return (
    <div className="p-8 space-y-8">
      {/* Hero Carousel */}
      <div className="relative">
        <div className={`bg-gradient-to-r ${currentHero.gradient} border ${currentHero.border} rounded-lg p-8 transition-all duration-500`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="outline" className={`mb-3 ${currentHero.badge.color}`}>
                <BadgeIcon className="h-3 w-3 mr-1" />
                {currentHero.badge.text}
              </Badge>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TitleIcon className={`h-8 w-8 ${currentHero.iconColor}`} />
                {currentHero.title}
              </h2>
              <p className="text-muted-foreground mb-4 max-w-2xl">
                {currentHero.description}
                {currentHero.link && (
                  <>
                    {' '}Basado en{' '}
                    <a 
                      href={currentHero.link.href}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      {currentHero.link.text}
                    </a>
                    .
                  </>
                )}
              </p>
              <div className="flex gap-3">
                {currentHero.buttons.map((button, idx) => (
                  button.to ? (
                    <Link key={idx} to={button.to}>
                      <Button size="lg" variant={button.variant} className={`gap-2 ${button.className || ''}`}>
                        {button.icon && <button.icon className="h-5 w-5" />}
                        {button.text}
                        {idx === 0 && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </Link>
                  ) : (
                    <a key={idx} href={button.external} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" variant={button.variant} className={`gap-2 ${button.className || ''}`}>
                        {button.text}
                      </Button>
                    </a>
                  )
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-3 ml-8">
                {currentHero.stats.map((stat, idx) => (
                  <StatCard key={idx} label={stat.label} value={stat.value} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-3 mt-6">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-3 rounded-full transition-all cursor-pointer hover:opacity-80 ${
                idx === currentSlide ? 'w-10 bg-primary' : 'w-3 bg-primary/30'
              }`}
              aria-label={`Ir a proyecto ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Todos los Proyectos</h1>
            <p className="text-muted-foreground mt-1">Administra tus proyectos MLOps</p>
          </div>
          <Link to="/new-project">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </Link>
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

          {/* LLM Agent Project Card */}
          <Card className="bg-project-card border-purple-500/50 hover:shadow-lg transition-shadow cursor-pointer hover:border-purple-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <Badge variant="default" className="bg-blue-600">En Desarrollo</Badge>
              </div>
              <CardTitle className="text-xl">Agente LLM GenAI</CardTitle>
              <CardDescription className="text-project-card-foreground/70">
                IA Generativa con MLflow y evaluación de LLMs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="font-medium">MLflow GenAI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo Base:</span>
                  <span className="font-medium">GPT-4 / Llama</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="font-medium">Hoy</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coming Soon Project */}
          <Link to="/new-project">
            <Card className="bg-project-card border-border hover:shadow-md transition-shadow cursor-pointer hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-700">Disponible</Badge>
                </div>
                <CardTitle className="text-xl">Nuevo Proyecto</CardTitle>
                <CardDescription className="text-project-card-foreground/70">
                  Crea un nuevo proyecto MLOps desde cero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Proyecto
                </Button>
              </CardContent>
            </Card>
          </Link>
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
