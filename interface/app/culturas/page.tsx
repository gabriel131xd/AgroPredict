import { Lock, Sprout } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CulturasPage() {
  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-xl bg-accent/20 text-accent">
          <Sprout className="size-7" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Configuração de culturas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Funcionalidade planejada para versões futuras.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-accent/40 text-accent">
          <Lock className="size-3.5" />
          Visão futura
        </Badge>
      </CardContent>
    </Card>
  )
}
