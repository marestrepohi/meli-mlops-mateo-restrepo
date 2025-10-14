import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Sidebar = () => {
  return (
    <aside className="w-64 p-4 space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Estado del modelo</h3>
        <div className="space-y-2">
          {[
            { label: "En Producción", count: 8, active: true },
            { label: "En Entrenamiento", count: 3 },
            { label: "En Pruebas", count: 5 },
            { label: "Detenidos", count: 2 },
          ].map((status, i) => (
            <label key={i} className="flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded">
              <span className={status.active ? "text-foreground" : "text-muted-foreground"}>
                {status.label}
              </span>
              <span className="text-muted-foreground text-sm">({status.count})</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Tipo de modelo</h3>
        <div className="space-y-2">
          {[
            "Random Forest (5)",
            "XGBoost (4)",
            "Neural Network (3)",
            "Regresión Lineal (2)",
            "SVM (1)",
          ].map((type, i) => (
            <label key={i} className="flex items-center cursor-pointer hover:bg-muted p-2 rounded text-sm text-muted-foreground">
              {type}
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Precisión</h3>
        <div className="space-y-2">
          {[
            "Más de 95% (6)",
            "90% - 95% (5)",
            "80% - 90% (3)",
            "Menos de 80% (1)",
          ].map((range, i) => (
            <label key={i} className="flex items-center cursor-pointer hover:bg-muted p-2 rounded text-sm text-muted-foreground">
              {range}
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-accent/10 border-accent/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚡</span>
          <span className="font-semibold text-sm">Envíos gratis</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Reentrenamientos automáticos incluidos
        </p>
      </Card>
    </aside>
  );
};

export default Sidebar;
