import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Zap, CheckCircle2 } from "lucide-react";

const metrics = [
  {
    label: "Model Accuracy",
    value: "94.7%",
    change: "+2.3%",
    icon: Target,
    trend: "up",
    color: "text-accent"
  },
  {
    label: "MAE Score",
    value: "2.84",
    change: "-0.12",
    icon: TrendingUp,
    trend: "up",
    color: "text-primary"
  },
  {
    label: "Inference Time",
    value: "87ms",
    change: "-15ms",
    icon: Zap,
    trend: "up",
    color: "text-accent"
  },
  {
    label: "Success Rate",
    value: "99.8%",
    change: "+0.2%",
    icon: CheckCircle2,
    trend: "up",
    color: "text-primary"
  }
];

const Metrics = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Model <span className="bg-gradient-primary bg-clip-text text-transparent">Performance</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Real-time metrics from production environment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:shadow-glow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-background ${metric.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    metric.trend === 'up' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-3xl font-bold group-hover:scale-105 transition-transform">
                    {metric.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.label}
                  </div>
                </div>

                <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color === 'text-accent' ? 'bg-accent' : 'bg-primary'} rounded-full transition-all`}
                    style={{ width: '75%' }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-card to-muted/20 border-border">
            <h3 className="text-2xl font-semibold mb-4">Latest Training Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Training Dataset</div>
                <div className="font-medium text-lg">Boston Housing (506 samples)</div>
                <div className="text-sm text-muted-foreground mt-1">Train/Test Split: 80/20</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Model Type</div>
                <div className="font-medium text-lg">Random Forest Regressor</div>
                <div className="text-sm text-muted-foreground mt-1">100 estimators, max_depth=10</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Last Updated</div>
                <div className="font-medium text-lg">2 hours ago</div>
                <div className="text-sm text-muted-foreground mt-1">Auto-retrain enabled</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Environment</div>
                <div className="font-medium text-lg">Production (v2.4.1)</div>
                <div className="text-sm text-muted-foreground mt-1">Docker container</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Metrics;
