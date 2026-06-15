"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DriftResult } from "@/lib/api"
import { getVariableMeta } from "@/lib/data"

const config = {
  media_referencia: { label: "Média de referência", color: "var(--muted-foreground)" },
  media_atual: { label: "Média atual", color: "var(--chart-2)" },
} satisfies ChartConfig

export function DriftChart({ data }: { data: DriftResult[] }) {
  const chartData = data.map((item) => ({
    variavel: getVariableMeta(item.variavel).label,
    media_referencia: item.media_referencia,
    media_atual: item.media_atual,
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
      <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="variavel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={70}
          fontSize={10}
        />
        <YAxis tickLine={false} axisLine={false} width={42} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="media_referencia" fill="var(--color-media_referencia)" radius={4} />
        <Bar dataKey="media_atual" fill="var(--color-media_atual)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
