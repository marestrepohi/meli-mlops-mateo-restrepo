import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pipelineSteps = [
  { name: "Data Preprocessing", status: "completed", duration: "2m 15s" },
  { name: "Model Training", status: "completed", duration: "8m 42s" },
  { name: "Model Evaluation", status: "completed", duration: "1m 33s" },
  { name: "Model Deployment", status: "running", duration: "0m 45s" },
  { name: "Health Check", status: "pending", duration: "-" },
];

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
  running: { icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  pending: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" },
};

const Pipeline = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live <span className="bg-gradient-accent bg-clip-text text-transparent">Pipeline</span> Execution
          </h2>
          <p className="text-xl text-muted-foreground">
            Boston Housing Price Prediction Model - Training Run #47
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur border-border shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Pipeline Status</h3>
              <p className="text-sm text-muted-foreground mt-1">Started 12 minutes ago</p>
            </div>
            <Button variant="hero">
              <Play className="w-4 h-4" />
              Retrain Model
            </Button>
          </div>

          <div className="space-y-4">
            {pipelineSteps.map((step, index) => {
              const config = statusConfig[step.status as keyof typeof statusConfig];
              const Icon = config.icon;
              
              return (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/30 transition-all"
                >
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color} ${step.status === 'running' ? 'animate-spin' : ''}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{step.name}</h4>
                      <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Duration: {step.duration}</p>
                  </div>

                  {step.status === 'completed' && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-accent">Success</div>
                      <div className="text-xs text-muted-foreground">Exit code: 0</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                <span className="text-muted-foreground">Overall Progress:</span>
              </div>
              <span className="font-medium">4/5 stages completed</span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary w-4/5 transition-all duration-500" />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Pipeline;
