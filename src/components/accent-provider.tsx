"use client"

import * as React from "react"

export type AccentColor = {
  name: string
  label: string
  value: string // oklch value
  foreground: string // oklch value for text on primary
}

export const accentColors: AccentColor[] = [
  { name: "default", label: "Branco (Padrão)", value: "oklch(0.98 0 0)", foreground: "oklch(0.04 0 0)" },
  { name: "indigo", label: "Índigo", value: "oklch(0.65 0.2 260)", foreground: "oklch(0.98 0 0)" },
  { name: "emerald", label: "Esmeralda", value: "oklch(0.75 0.18 160)", foreground: "oklch(0.04 0 0)" },
  { name: "acid", label: "Verde Ácido", value: "oklch(0.85 0.22 110)", foreground: "oklch(0.04 0 0)" },
  { name: "blue", label: "Azul Elétrico", value: "oklch(0.7 0.15 240)", foreground: "oklch(0.98 0 0)" },
  { name: "rose", label: "Rosa Choque", value: "oklch(0.7 0.2 0)", foreground: "oklch(0.98 0 0)" },
  { name: "amber", label: "Âmbar", value: "oklch(0.8 0.15 65)", foreground: "oklch(0.04 0 0)" },
]

type AccentContextType = {
  accent: AccentColor
  setAccent: (name: string) => void
}

const AccentContext = React.createContext<AccentContextType | undefined>(undefined)

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<AccentColor>(accentColors[0])

  // Load from localstorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("app-accent-color")
    if (saved) {
      const found = accentColors.find(c => c.name === saved)
      if (found) setAccentState(found)
    }
  }, [])

  // Apply CSS variable
  React.useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--primary", accent.value)
    root.style.setProperty("--primary-foreground", accent.foreground)
    localStorage.setItem("app-accent-color", accent.name)
  }, [accent])

  const setAccent = (name: string) => {
    const found = accentColors.find(c => c.name === name)
    if (found) setAccentState(found)
  }

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  )
}

export const useAccent = () => {
  const context = React.useContext(AccentContext)
  if (!context) throw new Error("useAccent must be used within AccentProvider")
  return context
}
