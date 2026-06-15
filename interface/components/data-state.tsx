import { AlertCircle, Database, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function LoadingState({ label = "Carregando dados reais..." }: { label?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">{label}</span>
      </CardContent>
    </Card>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex items-center justify-center gap-3 py-16 text-destructive">
        <AlertCircle className="size-5" />
        <span className="text-sm">{message}</span>
      </CardContent>
    </Card>
  )
}

export function EmptyState({ message = "Nenhum dado encontrado." }: { message?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
        <Database className="size-5" />
        <span className="text-sm">{message}</span>
      </CardContent>
    </Card>
  )
}
