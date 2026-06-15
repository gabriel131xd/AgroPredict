"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Flame,
  Sun,
  Thermometer,
  ThermometerSnowflake,
  Wind,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IrrigationStatus } from "@/components/irrigation-status"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state"
import {
  getPrevisaoPorData,
  type PredictionByDateResponse,
} from "@/lib/api"
import { cn } from "@/lib/utils"

function isoToday(offsetDays = 0) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function PrevisaoPage() {
  const [date, setDate] = useState(isoToday())
  const [result, setResult] = useState<PredictionByDateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!date) return
    setLoading(true)
    setError("")
    setResult(null)
    getPrevisaoPorData(date)
      .then(setResult)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [date])

  const day = result?.dados_climaticos
  const metrics = day
    ? [
        { label: "Temp. máxima", value: `${day.temperatura_maxima}°C`, icon: Thermometer, tone: "text-destructive" },
        { label: "Temp. mínima", value: `${day.temperatura_minima}°C`, icon: ThermometerSnowflake, tone: "text-accent" },
        { label: "Precipitação", value: `${day.precipitacao} mm`, icon: CloudRain, tone: "text-accent" },
        { label: "Vento máximo", value: `${day.vento_maximo} km/h`, icon: Wind, tone: "text-muted-foreground" },
        { label: "Umidade média", value: `${day.umidade_media}%`, icon: Droplets, tone: "text-accent" },
        { label: "Radiação solar", value: `${day.radiacao_solar} MJ/m²`, icon: Sun, tone: "text-warning" },
        { label: "Evapotranspiração", value: `${day.evapotranspiracao} mm`, icon: Wind, tone: "text-primary" },
        { label: "Índice de seca", value: day.indice_seca.toFixed(2), icon: Flame, tone: "text-warning" },
      ]
    : []

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Selecione uma data</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input
              type="date"
              value={date}
              max={isoToday(5)}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Datas históricas usam a base local quando disponíveis. Datas futuras são limitadas a cinco dias.
            </p>
          </CardContent>
        </Card>
        {result?.tipo === "previsão futura" && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex gap-3 p-4 text-sm text-warning">
              <AlertTriangle className="size-5 shrink-0" />
              Os dados climáticos desta data são estimativas da Open-Meteo.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
          <LoadingState label="Buscando dados e consultando o modelo..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !result || !day ? (
          <EmptyState message="Nenhum dado disponível para a data selecionada." />
        ) : (
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">Dados climáticos de {day.data}</CardTitle>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant="outline">Origem: {result.origem}</Badge>
                  <Badge variant="secondary">{result.tipo}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {metrics.map((metric) => {
                    const Icon = metric.icon
                    return (
                      <div key={metric.label} className="rounded-lg border bg-muted/30 p-3.5">
                        <Icon className={cn("size-4.5", metric.tone)} />
                        <p className="mt-2 text-lg font-semibold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">Resultado do modelo</CardTitle>
                {result.probabilidade !== undefined && result.probabilidade !== null && (
                  <Badge variant="secondary">
                    Probabilidade: {(result.probabilidade * 100).toFixed(1)}%
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <IrrigationStatus recommend={result.precisa_irrigar} size="lg" />
                <p className="mt-4 text-sm text-muted-foreground">{result.explicacao}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
