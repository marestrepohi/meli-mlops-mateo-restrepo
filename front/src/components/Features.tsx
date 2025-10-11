import { Card } from "@/components/ui/card";
import { 
  Database, 
  Gauge, 
  RefreshCw, 
  Shield, 
  Zap, 
  GitBranch,
  FileJson,
  LineChart
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Pipeline Automation",
    description: "Automated ML pipelines with preprocessing, training, and evaluation stages. Fully reproducible and version-controlled.",
    color: "text-primary"
  },
  {
    icon: Zap,
    title: "REST API Deployment",
    description: "FastAPI-based inference endpoints with automatic scaling. Deploy models with a single command.",
    color: "text-accent"
  },
  {
    icon: Database,
    title: "Model Versioning",
    description: "Track and manage model versions with metadata, metrics, and artifacts. Never lose track of experiments.",
    color: "text-primary"
  },
  {
    icon: Gauge,
    title: "Real-time Monitoring",
    description: "Monitor model performance, drift detection, and system health in real-time dashboards.",
    color: "text-accent"
  },
  {
    icon: RefreshCw,
    title: "Automated Retraining",
    description: "Schedule automatic retraining pipelines based on performance thresholds or time intervals.",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "CI/CD Integration",
    description: "GitHub Actions workflows for automated testing, validation, and deployment of ML models.",
    color: "text-accent"
  },
  {
    icon: FileJson,
    title: "Docker Containerization",
    description: "Fully containerized environments ensuring consistency across development and production.",
    color: "text-primary"
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description: "Detailed metrics and visualizations for model performance, latency, and resource usage.",
    color: "text-accent"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Enterprise-Grade <span className="bg-gradient-primary bg-clip-text text-transparent">MLOps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to take machine learning models from experimentation to production
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow group cursor-pointer"
              >
                <Icon className={`w-10 h-10 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
