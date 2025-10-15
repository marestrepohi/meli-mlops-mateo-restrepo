import { Button } from "@/components/ui/button";
import { Activity, Brain, GitBranch } from "lucide-react";
import heroImage from "@/assets/hero-mlops.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="MLOps Platform" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm text-muted-foreground">Production-Ready MLOps Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
            ML Pipeline Management
            <br />
            <span className="text-foreground">Simplified</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy, monitor, and retrain machine learning models with enterprise-grade infrastructure. 
            From training to production in minutes.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="hero" size="lg">
              <Brain className="w-5 h-5" />
              Start Training
            </Button>
            <Button variant="outline" size="lg">
              <GitBranch className="w-5 h-5" />
              View Pipelines
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-glow">
              <Activity className="w-8 h-8 text-primary mb-3 mx-auto" />
              <div className="text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all hover:shadow-accent-glow">
              <Brain className="w-8 h-8 text-accent mb-3 mx-auto" />
              <div className="text-3xl font-bold text-foreground">&lt;100ms</div>
              <div className="text-sm text-muted-foreground">Average Inference</div>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-glow">
              <GitBranch className="w-8 h-8 text-primary mb-3 mx-auto" />
              <div className="text-3xl font-bold text-foreground">Auto</div>
              <div className="text-sm text-muted-foreground">Retraining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
    </section>
  );
};

export default Hero;
