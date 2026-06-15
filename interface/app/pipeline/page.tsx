import {
  Cloud,
  DownloadCloud,
  Wrench,
  Layers,
  Brain,
  FlaskConical,
  Server,
  LayoutDashboard,
  Droplets,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    title: "Open-Meteo API",
    desc: "Fonte de dados climáticos horários e diários para Petrolina/PE.",
    icon: Cloud,
    tone: "accent",
  },
  {
    title: "Coleta Automática",
    desc: "Job agendado que ingere e armazena novas observações.",
    icon: DownloadCloud,
    tone: "accent",
  },
  {
    title: "Tratamento dos Dados",
    desc: "Limpeza, normalização e tratamento de valores ausentes.",
    icon: Wrench,
    tone: "primary",
  },
  {
    title: "Feature Engineering",
    desc: "Cálculo de evapotranspiração, índice de seca e janelas móveis.",
    icon: Layers,
    tone: "primary",
  },
  {
    title: "Treinamento do Modelo",
    desc: "Treino e validação de classificadores de irrigação.",
    icon: Brain,
    tone: "warning",
  },
  {
    title: "MLflow",
    desc: "Rastreamento de experimentos, métricas e versionamento.",
    icon: FlaskConical,
    tone: "warning",
  },
  {
    title: "API FastAPI",
    desc: "Serviço REST que expõe previsões e dados climáticos.",
    icon: Server,
    tone: "primary",
  },
  {
    title: "Dashboard",
    desc: "Visualização executiva e análise interativa dos dados.",
    icon: LayoutDashboard,
    tone: "accent",
  },
  {
    title: "Previsão de Irrigação",
    desc: "Recomendação final entregue ao produtor agrícola.",
    icon: Droplets,
    tone: "primary",
  },
]

const toneMap: Record<string, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  warning: "bg-warning/15 text-warning border-warning/30",
}

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-2 p-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Arquitetura
            </Badge>
            <span className="text-xs text-muted-foreground">Fluxo de dados ponta a ponta</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Pipeline do AgroPredict</h2>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            Do ingestão dos dados climáticos brutos à recomendação de irrigação, cada
            etapa é automatizada e monitorada. A estrutura está pronta para integração
            com um backend FastAPI.
          </p>
        </CardContent>
      </Card>

      <div className="mx-auto grid max-w-2xl gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.title}>
              <Card className="group transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl border",
                      toneMap[step.tone],
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="font-medium tracking-tight">{step.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>

              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-1.5" aria-hidden="true">
                  <div className="relative flex h-7 w-px items-center justify-center bg-gradient-to-b from-primary/60 to-accent/40">
                    <span className="absolute -bottom-1">
                      <ChevronDown className="size-4 animate-bounce text-primary/70" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
