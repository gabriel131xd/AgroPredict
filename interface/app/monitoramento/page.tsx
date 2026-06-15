"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DriftChart } from "@/components/drift-chart"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state"
import { getDrift, type DriftResponse } from "@/lib/api"
import { getVariableMeta } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function MonitoramentoPage() {
  const [data, setData] = useState<DriftResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getDrift()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Calculando drift com dados reais..." />
  if (error) return <ErrorState message={error} />
  if (!data || data.resultados.length === 0) return <EmptyState />

  const driftCount = data.resultados.filter((item) => item.status === "DRIFT DETECTADO").length

  return (
    <div className="space-y-6">
      <Card className={driftCount ? "border-destructive/30" : "border-primary/30"}>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex size-11 items-center justify-center rounded-lg", driftCount ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")}>
              {driftCount ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div>
              <p className="font-semibold">{driftCount ? "Drift detectado" : "Sistema estável"}</p>
              <p className="text-sm text-muted-foreground">{driftCount} de {data.resultados.length} variáveis acima do limiar de 20%</p>
            </div>
          </div>
          <Badge variant="outline">
            Referência: {data.periodo_referencia.inicio} a {data.periodo_referencia.fim}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {data.resultados.map((item) => {
          const meta = getVariableMeta(item.variavel)
          const TrendIcon = item.diferenca_percentual >= 0 ? TrendingUp : TrendingDown
          return (
            <Card key={item.variavel} className="gap-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{meta.label}</span>
                <Badge variant="outline" className={item.status === "DRIFT DETECTADO" ? "border-destructive/40 text-destructive" : "border-primary/40 text-primary"}>
                  {item.status}
                </Badge>
              </div>
              <p className="text-2xl font-semibold">{item.media_atual.toFixed(2)}<span className="ml-1 text-sm font-normal text-muted-foreground">{meta.unit}</span></p>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendIcon className="size-3.5" />
                <span>{item.diferenca_percentual > 0 ? "+" : ""}{item.diferenca_percentual}%</span>
                <span className="text-muted-foreground">vs. {item.media_referencia.toFixed(2)}{meta.unit}</span>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Médias de referência e período atual</CardTitle>
        </CardHeader>
        <CardContent>
          <DriftChart data={data.resultados} />
          <p className="mt-2 text-xs text-muted-foreground">
            Período atual: {data.periodo_atual.inicio} a {data.periodo_atual.fim}.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
