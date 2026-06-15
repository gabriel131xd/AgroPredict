"use client"

import { useEffect, useState } from "react"
import {
  CalendarDays,
  CloudRain,
  Droplets,
  MapPin,
  Sprout,
  Thermometer,
  Waves,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state"
import { getResumo, type Resumo } from "@/lib/api"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getResumo()
      .then(setResumo)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState label="Carregando resumo do dataset..." />
  if (error) return <ErrorState message={error} />
  if (!resumo || resumo.total_dias_analisados === 0) {
    return <EmptyState message="O dataset final não possui registros." />
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Visão geral do dataset</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Dados climáticos processados de {resumo.localizacao}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Período de {formatDate(resumo.periodo_inicial)} a{" "}
              {formatDate(resumo.periodo_final)}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-background/60 px-4 py-3">
            <Sprout className="size-5 text-primary" />
            <span className="text-sm">Pipeline real conectado</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Dias analisados"
          value={resumo.total_dias_analisados}
          icon={CalendarDays}
          hint="registros no dataset"
        />
        <StatCard
          label="Irrigação recomendada"
          value={resumo.dias_com_necessidade_irrigacao}
          icon={Droplets}
          tone="accent"
          hint="dias classificados"
        />
        <StatCard
          label="Temperatura máx. média"
          value={resumo.temperatura_maxima_media}
          unit="°C"
          icon={Thermometer}
          tone="destructive"
          hint="média do período"
        />
        <StatCard
          label="Chuva acumulada"
          value={resumo.chuva_acumulada}
          unit="mm"
          icon={CloudRain}
          tone="accent"
          hint="soma do período"
        />
        <StatCard
          label="Umidade média"
          value={resumo.umidade_media}
          unit="%"
          icon={Waves}
          tone="accent"
          hint="média do período"
        />
        <StatCard
          label="Evapotranspiração"
          value={resumo.evapotranspiracao_media}
          unit="mm"
          icon={Sprout}
          hint="média do período"
        />
        <StatCard
          label="Período inicial"
          value={formatDate(resumo.periodo_inicial)}
          icon={CalendarDays}
          tone="muted"
        />
        <StatCard
          label="Localização"
          value={resumo.localizacao}
          icon={MapPin}
          tone="warning"
        />
      </div>
    </div>
  )
}
