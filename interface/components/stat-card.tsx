import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Tone = "primary" | "accent" | "warning" | "destructive" | "muted"

const toneMap: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/15", text: "text-primary" },
  accent: { bg: "bg-accent/15", text: "text-accent" },
  warning: { bg: "bg-warning/15", text: "text-warning" },
  destructive: { bg: "bg-destructive/15", text: "text-destructive" },
  muted: { bg: "bg-muted", text: "text-muted-foreground" },
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "primary",
  trend,
  hint,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  tone?: Tone
  trend?: number
  hint?: string
}) {
  const t = toneMap[tone]
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("flex size-9 items-center justify-center rounded-lg", t.bg)}>
          <Icon className={cn("size-4.5", t.text)} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof trend === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 font-medium",
              trend >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  )
}
