"use client"

import { useAccent, accentColors } from "@/components/accent-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Palette, Check, RotateCcw, Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export default function ConfiguracoesPage() {
  const { accent, setAccent } = useAccent()
  const { theme, setTheme } = useTheme()

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 pt-4 animate-in fade-in duration-1000">
      {/* Header - Seguindo o padrão Dash/Despesas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">Preferências</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground flex items-center gap-4">
            Ajustes
          </h1>
          <p className="text-muted-foreground text-sm font-medium opacity-60">Personalize sua experiência visual e gerencie suas preferências de interface.</p>
        </div>
        <div className="flex gap-3 px-4 md:px-0">
          <Button 
            variant="outline" 
            className="h-10 rounded-xl font-medium border-border/50"
            onClick={() => {
              setAccent("default")
              setTheme("dark")
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Resetar Tudo
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 px-4 md:px-0">
        {/* Modo de Exibição */}
        <div className="lg:col-span-1 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border border-white/[0.06] dark:border-white/[0.06] border-border/30 rounded-[32px] shadow-sm transition-all duration-500 group hover:border-primary/50 hover:bg-muted/5 dark:hover:bg-white/[0.02]">
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Interface</span>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <Settings className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Exibição</h2>
              <p className="text-sm font-medium text-muted-foreground/40 leading-relaxed mt-2">
                Alterne entre os temas claro e escuro.
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 flex items-center gap-3">
            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50 w-full sm:w-auto">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Escuro', icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-12 px-6 rounded-xl transition-all duration-300 flex-1 sm:flex-none",
                    theme === t.id 
                      ? "bg-background shadow-sm border border-border/50 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seleção de Cores */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border border-white/[0.06] dark:border-white/[0.06] border-border/30 rounded-[32px] shadow-sm transition-all duration-500 group hover:border-primary/50 hover:bg-muted/5 dark:hover:bg-white/[0.02]">
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Identidade Visual</span>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <Palette className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Cor de Destaque</h2>
              <p className="text-sm font-medium text-muted-foreground/40 leading-relaxed mt-2">
                Defina a cor principal para os botões e elementos interativos.
              </p>
            </div>
          </div>
          <div className="px-8 pb-8 flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccent(color.name)}
                  title={color.label}
                  className={cn(
                    "relative h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                    accent.name === color.name ? "ring-2 ring-offset-4 ring-offset-background" : ""
                  )}
                  style={{ 
                    backgroundColor: color.value,
                    boxShadow: accent.name === color.name ? `0 0 20px -5px ${color.value}` : 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {accent.name === color.name && <Check className="h-5 w-5" style={{ color: color.foreground }} />}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
