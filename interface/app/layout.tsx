import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: "AgroPredict — Agricultura Inteligente",
  description:
    "Plataforma de agricultura inteligente e previsão de irrigação para Petrolina/PE.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#101418",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark bg-background">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
