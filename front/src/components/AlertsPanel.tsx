import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"

interface AlertItem {
  message: string
  original: string
  severity: 'info' | 'warning' | 'error' | 'success'
  category: string
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(alerts.map(a => a.category)))]
  const severities = ['all', 'warning', 'info']

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const categoryMatch = filterCategory === 'all' || alert.category === filterCategory
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity
    return categoryMatch && severityMatch
  })

  // Group alerts by category
  const alertsByCategory = filteredAlerts.reduce((acc, alert) => {
    const cat = alert.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(alert)
    return acc
  }, {} as Record<string, AlertItem[]>)

  // Get icon and styling based on severity
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'warning':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        }
      case 'error':
        return {
          icon: AlertCircle,
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        }
      case 'success':
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        }
      default:
        return {
          icon: Info,
          variant: 'default' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        }
    }
  }

  // Translate category names
  const getCategoryDisplayName = (category: string) => {
    const translations: Record<string, string> = {
      'correlación': 'Correlación',
      'datos_faltantes': 'Datos Faltantes',
      'distribución': 'Distribución',
      'valores_cero': 'Valores Cero',
      'unicidad': 'Unicidad',
      'general': 'General',
      'all': 'Todas las Categorías',
    }
    return translations[category] || category
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Calidad de Datos</CardTitle>
        <CardDescription>
          {alerts.length} alertas detectadas durante el análisis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="space-x-1">
            <span className="text-sm font-medium">Categoría:</span>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filterCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(cat)}
              >
                {getCategoryDisplayName(cat)}
              </Button>
            ))}
          </div>
        </div>

        {/* Alerts Count */}
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline">
            {filteredAlerts.length} alertas mostradas
          </Badge>
          <Badge variant="secondary">
            {filteredAlerts.filter(a => a.severity === 'warning').length} advertencias
          </Badge>
          <Badge variant="default">
            {filteredAlerts.filter(a => a.severity === 'info').length} informativas
          </Badge>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {Object.entries(alertsByCategory).map(([category, categoryAlerts]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {getCategoryDisplayName(category)} ({categoryAlerts.length})
              </h3>
              {categoryAlerts.map((alert, index) => {
                const config = getSeverityConfig(alert.severity)
                const Icon = config.icon

                return (
                  <Alert key={index} variant={config.variant} className={config.bgColor}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <AlertTitle className="text-sm font-semibold">
                      {getCategoryDisplayName(alert.category)}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>
                  </Alert>
                )
              })}
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No se encontraron alertas para los filtros seleccionados.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
