"use client"

import { useAccent, accentColors } from "@/components/accent-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Palette, Check, RotateCcw, Moon, Sun, Monitor, Info } from "lucide-react"
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Preferências</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
        {/* Card de Tema */}
        <div className="glass-card flex flex-col overflow-hidden group">
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

          <div className="p-8 pt-2 mt-auto">
            <div className="flex p-1.5 bg-muted/20 dark:bg-white/[0.02] rounded-2xl border border-border/40 gap-1.5">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  theme === 'light'
                    ? "bg-background text-foreground shadow-lg shadow-black/5 border border-border/50 scale-[1.02]"
                    : "text-muted-foreground hover:bg-background/50"
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Claro</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  theme === 'dark'
                    ? "bg-background text-foreground shadow-lg shadow-black/5 border border-border/50 scale-[1.02]"
                    : "text-muted-foreground hover:bg-background/50"
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Escuro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card de Informações */}
        <div className="glass-card flex flex-col overflow-hidden group">
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Aplicação</span>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <Info className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Sobre o RDT</h2>
              <p className="text-sm font-medium text-muted-foreground/40 leading-relaxed mt-2">
                Versão 2.4.0 • Build editorial estável.
              </p>
            </div>
          </div>

          <div className="p-8 pt-2 mt-auto">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-muted/20 dark:bg-white/[0.02] rounded-2xl border border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status do Sistema</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Operacional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-0">
        {/* Seleção de Cores */}
        <div className="glass-card flex flex-col overflow-hidden group">
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
