"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  LineChart as LineIcon,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClimateChart } from "@/components/climate-chart"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state"
import {
  getDadosClimaticos,
  getResumo,
  type ClimateResponse,
} from "@/lib/api"
import {
  CLIMATE_VARIABLES,
  MONTHS,
  getVariableMeta,
  type ClimateVariableKey,
} from "@/lib/data"

export default function AnalisePage() {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [month, setMonth] = useState("todos")
  const [variable, setVariable] = useState<ClimateVariableKey>("temperatura_maxima")
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [response, setResponse] = useState<ClimateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadInitialData() {
      try {
        const resumo = await getResumo()
        setStart(resumo.periodo_inicial)
        setEnd(resumo.periodo_final)
        setResponse(
          await getDadosClimaticos({
            inicio: resumo.periodo_inicial,
            fim: resumo.periodo_final,
            variavel: "temperatura_maxima",
          }),
        )
      } catch (err) {
        setResponse(null)
        setError(err instanceof Error ? err.message : "Erro ao consultar os dados.")
      } finally {
        setLoading(false)
      }
    }
    void loadInitialData()
  }, [])

  const data = response?.dados ?? []
  const meta = getVariableMeta(variable)
  const stats = useMemo(() => {
    const values = data.map((row) => row[variable])
    if (values.length === 0) return null
    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    const first = values[0]
    const last = values.at(-1) ?? first
    return {
      average: average.toFixed(2),
      max: Math.max(...values).toFixed(2),
      min: Math.min(...values).toFixed(2),
      delta: first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100,
    }
  }, [data, variable])
  const hasForecast = data.some((row) => row.fonte === "forecast")

  async function applyPeriod() {
    if (Boolean(start) !== Boolean(end)) {
      setError("Informe a data inicial e a data final.")
      return
    }

    if (start && end && start > end) {
      setError("A data inicial deve ser anterior ou igual à data final.")
      return
    }

    setLoading(true)
    setError("")
    try {
      setResponse(
        await getDadosClimaticos({
          inicio: start || undefined,
          fim: end || undefined,
          mes: month === "todos" ? undefined : Number(month),
          variavel: variable,
        }),
      )
    } catch (err) {
      setResponse(null)
      setError(err instanceof Error ? err.message : "Erro ao consultar os dados.")
    } finally {
      setLoading(false)
    }
  }

  function handleMonthChange(value: string | null) {
    const selectedMonth = value ?? "todos"
    setMonth(selectedMonth)

    if (selectedMonth !== "todos") {
      setStart("")
      setEnd("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[0.8fr_1fr_1fr_1fr_auto] xl:items-end">
          <Filter label="Mês">
            <Select value={month} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {MONTHS.map((monthName, index) => (
                  <SelectItem key={monthName} value={String(index + 1)}>{monthName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
          <Filter label="Data inicial">
            <input
              type="date"
              value={start}
              onInput={(event) => setStart(event.currentTarget.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </Filter>
          <Filter label="Data final">
            <input
              type="date"
              value={end}
              onInput={(event) => setEnd(event.currentTarget.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </Filter>
          <Filter label="Variável climática">
            <Select value={variable} onValueChange={(value) => value && setVariable(value as ClimateVariableKey)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIMATE_VARIABLES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
          <Button onClick={applyPeriod} className="gap-2">
            <Search className="size-4" />
            Gerar gráfico
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : !stats || !response ? (
        <EmptyState message="Nenhum dado climático foi encontrado para o período." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Origem: {response.origem}
            </Badge>
            <Badge variant="secondary">
              {response.periodo_inicial} a {response.periodo_final}
            </Badge>
          </div>

          {hasForecast && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-center gap-3 p-4 text-sm text-warning">
                <AlertTriangle className="size-5 shrink-0" />
                Dados futuros são estimativas de previsão da Open-Meteo, limitadas a 5 dias.
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <QuickStat label="Média" value={`${stats.average}${meta.unit}`} />
            <QuickStat label="Máxima" value={`${stats.max}${meta.unit}`} />
            <QuickStat label="Mínima" value={`${stats.min}${meta.unit}`} />
            <QuickStat
              label="Variação no período"
              value={`${stats.delta > 0 ? "+" : ""}${stats.delta.toFixed(1)}%`}
              trend={stats.delta}
            />
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">{meta.label} ({data.length} registros)</CardTitle>
              <div className="flex rounded-lg border bg-muted/40 p-1">
                <Button size="sm" variant={chartType === "line" ? "secondary" : "ghost"} onClick={() => setChartType("line")}>
                  <LineIcon className="mr-1.5 size-4" /> Linha
                </Button>
                <Button size="sm" variant={chartType === "bar" ? "secondary" : "ghost"} onClick={() => setChartType("bar")}>
                  <BarChart3 className="mr-1.5 size-4" /> Colunas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClimateChart data={data} variable={variable} label={meta.label} unit={meta.unit} color={meta.color} type={chartType} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">{label}</label>{children}</div>
}

function QuickStat({ label, value, trend }: { label: string; value: string; trend?: number }) {
  const Icon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  return (
    <Card className="gap-1 p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {Icon && <Icon className="size-4 text-primary" />}
      </div>
    </Card>
  )
}
