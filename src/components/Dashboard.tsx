import ModelCard from "./ModelCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const models = [
  {
    id: "boston-housing",
    name: "Boston Housing Price Predictor",
    type: "Random Forest Regressor",
    accuracy: "94.7%",
    lastTrained: "hace 2 horas",
    status: "production" as const,
    rating: 4.8,
    reviews: 142,
    inferenceTime: "87ms",
  },
  {
    id: "credit-risk",
    name: "Credit Risk Assessment Model",
    type: "XGBoost Classifier",
    accuracy: "96.2%",
    lastTrained: "hace 1 día",
    status: "production" as const,
    rating: 4.9,
    reviews: 238,
    inferenceTime: "92ms",
  },
  {
    id: "customer-churn",
    name: "Customer Churn Prediction",
    type: "Neural Network",
    accuracy: "89.3%",
    lastTrained: "hace 12 min",
    status: "training" as const,
    rating: 4.5,
    reviews: 87,
    inferenceTime: "125ms",
  },
  {
    id: "product-recommendation",
    name: "Product Recommendation Engine",
    type: "Collaborative Filtering",
    accuracy: "91.8%",
    lastTrained: "hace 3 horas",
    status: "production" as const,
    rating: 4.7,
    reviews: 196,
    inferenceTime: "65ms",
  },
  {
    id: "fraud-detection",
    name: "Fraud Detection System",
    type: "Random Forest Classifier",
    accuracy: "97.5%",
    lastTrained: "hace 30 min",
    status: "testing" as const,
    rating: 4.9,
    reviews: 312,
    inferenceTime: "73ms",
  },
  {
    id: "demand-forecasting",
    name: "Demand Forecasting Model",
    type: "LSTM Network",
    accuracy: "88.6%",
    lastTrained: "hace 5 días",
    status: "production" as const,
    rating: 4.6,
    reviews: 124,
    inferenceTime: "156ms",
  },
  {
    id: "sentiment-analysis",
    name: "Sentiment Analysis Classifier",
    type: "BERT Fine-tuned",
    accuracy: "93.4%",
    lastTrained: "hace 1 hora",
    status: "production" as const,
    rating: 4.8,
    reviews: 267,
    inferenceTime: "112ms",
  },
  {
    id: "image-classification",
    name: "Image Classification Model",
    type: "ResNet-50",
    accuracy: "95.1%",
    lastTrained: "hace 8 horas",
    status: "testing" as const,
    rating: 4.7,
    reviews: 189,
    inferenceTime: "203ms",
  },
];

const Dashboard = () => {
  return (
    <div className="flex-1 p-4">
      {/* Header Banner */}
      <Card className="mb-6 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <h1 className="text-3xl font-bold mb-2">Modelos ML</h1>
        <p className="text-muted-foreground">
          ¡Encuentra los mejores modelos para tu proyecto cada día!
        </p>
      </Card>

      {/* Category Tabs */}
      <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
        {[
          { icon: "🎯", label: "Todas las ofertas" },
          { icon: "⚡", label: "Ofertas relámpago" },
          { icon: "💰", label: "Mejor precisión" },
          { icon: "🏋️", label: "Hasta 60% OFF" },
          { icon: "📱", label: "Edge Models" },
          { icon: "🔥", label: "Alta demanda" },
        ].map((tab, i) => (
          <button
            key={i}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted transition-colors"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Todos</h2>
        <p className="text-sm text-muted-foreground">{models.length} modelos disponibles</p>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {models.map((model, index) => (
          <ModelCard key={index} {...model} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
