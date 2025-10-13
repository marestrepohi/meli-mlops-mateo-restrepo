import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface VariableCardProps {
  name: string
  data: {
    type: string
    statistics: {
      count: number
      mean: number
      std: number
      min: number
      max: number
      '25%': number
      '50%': number
      '75%': number
      skewness: number
      kurtosis: number
    }
    missing: {
      n_missing: number
      p_missing: number
    }
    histogram: {
      counts?: number[]
      bin_edges?: number[]
    }
    n_distinct: number
    n_zeros: number
  }
}

export function VariableCard({ name, data }: VariableCardProps) {
  const { statistics, missing, histogram, n_distinct, n_zeros } = data

  // Prepare histogram data
  const histogramData = histogram.counts && histogram.bin_edges
    ? histogram.counts.map((count, index) => ({
        bin: histogram.bin_edges![index].toFixed(2),
        count: count,
      }))
    : []

  // Determine skewness indicator
  const getSkewnessInfo = (skew: number) => {
    if (skew > 1) return { label: "Sesgada a la derecha", color: "text-orange-600", icon: TrendingUp }
    if (skew < -1) return { label: "Sesgada a la izquierda", color: "text-blue-600", icon: TrendingDown }
    return { label: "Simétrica", color: "text-green-600", icon: Minus }
  }

  const skewnessInfo = getSkewnessInfo(statistics.skewness)
  const SkewnessIcon = skewnessInfo.icon

  // Determine kurtosis info
  const getKurtosisInfo = (kurt: number) => {
    if (kurt > 3) return "Leptocúrtica (picos)"
    if (kurt < 3) return "Platicúrtica (plana)"
    return "Normal"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">{name}</CardTitle>
          <Badge variant="outline">{data.type}</Badge>
        </div>
        <CardDescription>
          {n_distinct} valores distintos • {n_zeros > 0 && `${n_zeros} ceros • `}
          {statistics.count} observaciones
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Missing Values Alert */}
        {missing.p_missing > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{missing.n_missing}</strong> valores faltantes ({(missing.p_missing * 100).toFixed(1)}%)
            </AlertDescription>
          </Alert>
        )}

        {/* Histogram */}
        {histogramData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Distribución</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="bin" 
                  fontSize={10}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => parseFloat(value).toFixed(0)}
                />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value) => [`Frecuencia: ${value}`, '']}
                  labelFormatter={(label) => `Valor: ${label}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${220 + index * 5}, 70%, 50%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatItem label="Media" value={statistics.mean.toFixed(3)} />
          <StatItem label="Desv. Est." value={statistics.std.toFixed(3)} />
          <StatItem label="Mínimo" value={statistics.min.toFixed(3)} />
          <StatItem label="Q1 (25%)" value={statistics['25%'].toFixed(3)} />
          <StatItem label="Mediana" value={statistics['50%'].toFixed(3)} />
          <StatItem label="Q3 (75%)" value={statistics['75%'].toFixed(3)} />
          <StatItem label="Máximo" value={statistics.max.toFixed(3)} />
          <StatItem label="Rango" value={(statistics.max - statistics.min).toFixed(3)} />
          <StatItem label="IQR" value={(statistics['75%'] - statistics['25%']).toFixed(3)} />
        </div>

        {/* Distribution Characteristics */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-semibold">Características de Distribución</h4>
          <div className="flex items-center gap-2 text-sm">
            <SkewnessIcon className={`h-4 w-4 ${skewnessInfo.color}`} />
            <span className="font-medium">Asimetría:</span>
            <span className={skewnessInfo.color}>{skewnessInfo.label}</span>
            <Badge variant="secondary" className="ml-auto">
              {statistics.skewness.toFixed(2)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Curtosis:</span>
            <span className="text-muted-foreground">{getKurtosisInfo(statistics.kurtosis)}</span>
            <Badge variant="secondary" className="ml-auto">
              {statistics.kurtosis.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-semibold">{value}</p>
    </div>
  )
}
