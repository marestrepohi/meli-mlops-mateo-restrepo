import { Card } from "@/components/ui/card";

const Sidebar = () => {
  return (
    <aside className="w-64 p-4 space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Estado del modelo</h3>
        <div className="space-y-2">
          {[
            { label: "En Producción", count: 1, active: true },
            { label: "Disponibles", count: 3 },
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
            "Gradient Boosting (1)",
            "Random Forest (1)",
            "Regresión Lineal (1)",
            "Ridge (1)",
          ].map((type, i) => (
            <label key={i} className="flex items-center cursor-pointer hover:bg-muted p-2 rounded text-sm text-muted-foreground">
              {type}
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Precisión (R²)</h3>
        <div className="space-y-2">
          {[
            "75% - 80% (2)",
            "50% - 60% (2)",
          ].map((range, i) => (
            <label key={i} className="flex items-center cursor-pointer hover:bg-muted p-2 rounded text-sm text-muted-foreground">
              {range}
            </label>
          ))}
        </div>
      </Card>
    </aside>
  );
};

export default Sidebar;
