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
            <span className="px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/50 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Preferências</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground flex items-center gap-4">
            Ajustes
            <span className="text-muted-foreground text-lg font-normal font-mono opacity-40">/ Sistema</span>
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
        <Card className="lg:col-span-1 bg-card/25 dark:bg-card/40 border-border/30 dark:border-border/50 rounded-2xl overflow-hidden shadow-sm h-fit transition-all duration-300 group">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Exibição</span>
                <p className="text-[10px] text-muted-foreground opacity-40 font-bold uppercase tracking-tighter">Modo de Interface</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 dark:bg-muted/40 border border-border/30 dark:border-border/50 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <Settings className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'dark', label: 'Escuro', icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl border transition-all duration-300",
                    theme === t.id 
                      ? "border-primary bg-primary/10 shadow-sm" 
                      : "border-border/30 dark:border-border/50 bg-muted/20 dark:bg-muted/40 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg border", theme === t.id ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border/30 dark:border-border/50")}>
                      <t.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{t.label}</span>
                  </div>
                  {theme === t.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seleção de Cores */}
        <Card className="lg:col-span-2 bg-card/25 dark:bg-card/40 border-border/30 dark:border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Cor de Destaque</span>
                <p className="text-[10px] text-muted-foreground opacity-40 font-bold uppercase tracking-tighter">Identidade Visual</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 dark:bg-muted/40 border border-border/30 dark:border-border/50 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <Palette className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccent(color.name)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 group",
                    accent.name === color.name 
                      ? "border-primary bg-primary/10 shadow-sm" 
                      : "border-border/30 dark:border-border/50 bg-muted/20 dark:bg-muted/40 hover:bg-muted/30 dark:hover:bg-muted/60"
                  )}
                >
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center border border-black/5 shadow-inner"
                    style={{ backgroundColor: color.value }}
                  >
                    {accent.name === color.name && <Check className="h-5 w-5" style={{ color: color.foreground }} />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider transition-colors",
                    accent.name === color.name ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {color.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
