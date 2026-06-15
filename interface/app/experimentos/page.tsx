"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleCheck, CircleX, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state"
import { getExperimentosMlflow, type MlflowExperiment } from "@/lib/api"

function formatDate(value: string | null) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function ExperimentosPage() {
  const [experiments, setExperiments] = useState<MlflowExperiment[]>([])
  const [statusFilter, setStatusFilter] = useState("todos")
  const [modelFilter, setModelFilter] = useState("todos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getExperimentosMlflow()
      .then((response) => setExperiments(response.experimentos))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const models = useMemo(
    () => Array.from(new Set(experiments.map((item) => item.modelo).filter(Boolean))),
    [experiments],
  )
  const statuses = useMemo(
    () => Array.from(new Set(experiments.map((item) => item.status))),
    [experiments],
  )
  const rows = experiments.filter(
    (item) =>
      (statusFilter === "todos" || item.status === statusFilter) &&
      (modelFilter === "todos" || item.modelo === modelFilter),
  )

  if (loading) return <LoadingState label="Consultando experimentos no MLflow..." />
  if (error) {
    return (
      <ErrorState
        message={error.includes("Endpoint ainda não implementado") ? "Endpoint ainda não implementado" : error}
      />
    )
  }
  if (experiments.length === 0) {
    return <EmptyState message="Nenhum experimento foi registrado no MLflow." />
  }

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Experimentos registrados</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{experiments.length} runs retornados pelo MLflow</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={modelFilter} onValueChange={(value) => value && setModelFilter(value)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os modelos</SelectItem>
              {models.map((model) => <SelectItem key={model} value={model!}>{model}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>n_estimators</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const finished = item.status === "FINISHED"
                const Icon = finished ? CircleCheck : CircleX
                return (
                  <TableRow key={item.run_id}>
                    <TableCell className="font-mono text-xs">{item.run_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={finished ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>
                        <Icon className="mr-1.5 size-3.5" />{item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {item.accuracy === null ? "Não informado" : `${(item.accuracy * 100).toFixed(2)}%`}
                    </TableCell>
                    <TableCell>{item.modelo ?? "Não informado"}</TableCell>
                    <TableCell>{item.n_estimators ?? "Não informado"}</TableCell>
                    <TableCell>{formatDate(item.start_time)}</TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Search className="mx-auto mb-2 size-5" />
                    Nenhum experimento corresponde aos filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
