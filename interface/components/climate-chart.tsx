"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { DadosDia } from "@/lib/api"
import type { ClimateVariableKey } from "@/lib/data"

function formatDate(iso: string, long = false) {
  const d = new Date(iso + "T12:00:00")
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: long ? "long" : "short",
  }).format(d)
}

export function ClimateChart({
  data,
  variable,
  label,
  unit,
  color,
  type = "area",
}: {
  data: DadosDia[]
  variable: ClimateVariableKey
  label: string
  unit: string
  color: string
  type?: "area" | "line" | "bar"
}) {
  const config = {
    [variable]: { label, color },
  } satisfies ChartConfig

  const chartData = data.map((d) => ({ date: d.data, [variable]: d[variable] }))
  const fillId = `fill-${variable}`

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
      <XAxis
        dataKey="date"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
        tickFormatter={(v) => formatDate(v)}
        stroke="var(--muted-foreground)"
        fontSize={11}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        width={36}
        stroke="var(--muted-foreground)"
        fontSize={11}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(v) => formatDate(v as string, true)}
            formatter={(value) => (
              <span className="font-mono font-medium">
                {value}
                {unit}
              </span>
            )}
          />
        }
      />
    </>
  )

  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      {type === "bar" ? (
        <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          {axes}
          <Bar dataKey={variable} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : type === "line" ? (
        <LineChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          {axes}
          <Line
            dataKey={variable}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      ) : (
        <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {axes}
          <Area
            dataKey={variable}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${fillId})`}
          />
        </AreaChart>
      )}
    </ChartContainer>
  )
}
