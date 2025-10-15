import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, Clock, Star } from "lucide-react";

interface ModelCardProps {
  name: string;
  type: string;
  accuracy: string;
  lastTrained: string;
  status: "production" | "training" | "testing";
  rating: number;
  reviews: number;
  inferenceTime: string;
  discount?: string;
}

const ModelCard = ({
  name,
  type,
  accuracy,
  lastTrained,
  status,
  rating,
  reviews,
  inferenceTime,
  discount,
}: ModelCardProps) => {
  const statusConfig = {
    production: { label: "EN PRODUCCIÓN", color: "bg-accent text-accent-foreground" },
    training: { label: "ENTRENANDO", color: "bg-primary text-primary-foreground" },
    testing: { label: "EN PRUEBAS", color: "bg-muted text-muted-foreground" },
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image/Visual Area */}
      <div className="relative bg-muted h-48 flex items-center justify-center">
        <div className="text-6xl opacity-20">📊</div>
        {discount && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
            {discount}
          </Badge>
        )}
        <Badge className={`absolute top-2 right-2 ${statusConfig[status].color}`}>
          {statusConfig[status].label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating) ? "fill-accent text-accent" : "text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-muted-foreground">({reviews})</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Precisión:</span>
            <span className="font-semibold text-primary">{accuracy}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Inferencia:</span>
            <span className="text-sm font-medium">{inferenceTime}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Tipo: {type}</div>
          <div className="text-xs text-muted-foreground">Actualizado: {lastTrained}</div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" size="sm">
            <Play className="w-4 h-4 mr-1" />
            Retrain
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            Métricas
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ModelCard;
