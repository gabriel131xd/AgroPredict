import { CheckCircle2, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

export function IrrigationStatus({
  recommend,
  size = "default",
}: {
  recommend: boolean
  size?: "default" | "lg"
}) {
  const Icon = recommend ? Droplets : CheckCircle2
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-5 py-4",
        recommend
          ? "border-accent/40 bg-accent/10"
          : "border-primary/40 bg-primary/10",
        size === "lg" && "px-7 py-6",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-lg",
          size === "lg" ? "size-14" : "size-11",
          recommend ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary",
        )}
      >
        <Icon className={size === "lg" ? "size-7" : "size-5.5"} />
      </div>
      <div className="leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Status da irrigação
        </p>
        <p
          className={cn(
            "font-semibold tracking-tight",
            size === "lg" ? "text-xl" : "text-base",
            recommend ? "text-accent" : "text-primary",
          )}
        >
          {recommend ? "Necessita irrigação" : "Não necessita irrigação"}
        </p>
      </div>
    </div>
  )
}
