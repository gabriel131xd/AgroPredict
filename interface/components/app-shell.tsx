"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Droplets,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  LineChart,
  MapPin,
  Menu,
  Sprout,
  Workflow,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LOCATION } from "@/lib/data"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Visão Geral" },
  { href: "/analise", label: "Análise Climática", icon: LineChart, group: "Visão Geral" },
  { href: "/previsao", label: "Previsão de Irrigação", icon: Droplets, group: "Visão Geral" },
  { href: "/monitoramento", label: "Monitoramento & Drift", icon: Activity, group: "Inteligência" },
  { href: "/experimentos", label: "Experimentos de ML", icon: FlaskConical, group: "Inteligência" },
  { href: "/pipeline", label: "Pipeline do Sistema", icon: Workflow, group: "Inteligência" },
  { href: "/culturas", label: "Configuração de Culturas", icon: Sprout, group: "Configuração" },
]

const GROUPS = ["Visão Geral", "Inteligência", "Configuração"]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">AgroPredict</p>
          <p className="text-[11px] text-muted-foreground">Agricultura Inteligente</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {GROUPS.map((group) => (
          <div key={group} className="space-y-1">
            <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {group}
            </p>
            {NAV.filter((item) => item.group === group).map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <MapPin className="size-4 text-accent" />
          <div className="leading-tight">
            <p className="text-xs font-medium">{LOCATION.city} — {LOCATION.state}</p>
            <p className="text-[10px] text-muted-foreground">{LOCATION.region}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = NAV.find((item) => item.href === pathname)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4" aria-label="Fechar menu">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
              {current?.label ?? "Dashboard"}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Dados processados pelo pipeline AgroPredict
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" />
            API FastAPI
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
