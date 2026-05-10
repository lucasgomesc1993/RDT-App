"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export type AccentColor = {
  name: string
  label: string
  value: string // oklch value
  foreground: string // oklch value for text on primary
}

export const accentColors: AccentColor[] = [
  { name: "default", label: "Automático", value: "oklch(0.98 0 0)", foreground: "oklch(0.04 0 0)" },
  { name: "zinc", label: "Zinco", value: "oklch(0.45 0 0)", foreground: "oklch(0.98 0 0)" },
  { name: "red", label: "Vermelho", value: "oklch(0.6 0.2 20)", foreground: "oklch(0.98 0 0)" },
  { name: "rose", label: "Rosa", value: "oklch(0.65 0.2 350)", foreground: "oklch(0.98 0 0)" },
  { name: "orange", label: "Laranja", value: "oklch(0.7 0.15 45)", foreground: "oklch(0.04 0 0)" },
  { name: "amber", label: "Âmbar", value: "oklch(0.8 0.15 65)", foreground: "oklch(0.04 0 0)" },
  { name: "yellow", label: "Amarelo", value: "oklch(0.85 0.15 90)", foreground: "oklch(0.04 0 0)" },
  { name: "acid", label: "Limão", value: "oklch(0.85 0.22 110)", foreground: "oklch(0.04 0 0)" },
  { name: "emerald", label: "Esmeralda", value: "oklch(0.75 0.18 160)", foreground: "oklch(0.04 0 0)" },
  { name: "teal", label: "Petróleo", value: "oklch(0.65 0.15 190)", foreground: "oklch(0.98 0 0)" },
  { name: "cyan", label: "Ciano", value: "oklch(0.75 0.15 220)", foreground: "oklch(0.04 0 0)" },
  { name: "blue", label: "Azul", value: "oklch(0.7 0.15 240)", foreground: "oklch(0.98 0 0)" },
  { name: "indigo", label: "Índigo", value: "oklch(0.65 0.2 260)", foreground: "oklch(0.98 0 0)" },
  { name: "violet", label: "Violeta", value: "oklch(0.6 0.2 290)", foreground: "oklch(0.98 0 0)" },
  { name: "fuchsia", label: "Fúcsia", value: "oklch(0.65 0.2 320)", foreground: "oklch(0.98 0 0)" },
]

type AccentContextType = {
  accent: AccentColor
  setAccent: (name: string) => void
}

const AccentContext = React.createContext<AccentContextType | undefined>(undefined)

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<AccentColor>(accentColors[0])
  const { theme, resolvedTheme } = useTheme()

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
    const currentTheme = resolvedTheme || theme

    if (accent.name === "default") {
      if (currentTheme === "light") {
        root.style.setProperty("--primary", "oklch(0.14 0.01 240)")
        root.style.setProperty("--primary-foreground", "oklch(0.98 0 0)")
      } else {
        root.style.setProperty("--primary", "oklch(0.98 0 0)")
        root.style.setProperty("--primary-foreground", "oklch(0.04 0 0)")
      }
    } else {
      root.style.setProperty("--primary", accent.value)
      root.style.setProperty("--primary-foreground", accent.foreground)
    }
    
    localStorage.setItem("app-accent-color", accent.name)
  }, [accent, theme, resolvedTheme])

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
