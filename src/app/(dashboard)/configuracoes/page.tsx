"use client"

import { useAccent, accentColors } from "@/components/accent-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Palette, Check, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ConfiguracoesPage() {
  const { accent, setAccent } = useAccent()

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 pt-4 animate-in fade-in duration-1000">
      {/* Header - Seguindo o padrão Dash/Despesas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground text-[10px] font-medium uppercase tracking-wider border border-white/[0.08]">Preferências</span>
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
            onClick={() => setAccent("default")}
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Resetar Tema
          </Button>
        </div>
      </div>

      {/* Seleção de Cores */}
      <div className="px-4 md:px-0">
        <Card className="bg-white/[0.01] border-border/50 rounded-2xl overflow-hidden backdrop-blur-md">
          <CardHeader className="p-8 border-b border-white/[0.04]">
            <CardTitle className="text-xl font-semibold">Customização Visual</CardTitle>
            <CardDescription>Escolha a cor de destaque que será aplicada em botões, gráficos e indicadores de saldo.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccent(color.name)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 group",
                    accent.name === color.name 
                      ? "border-primary bg-primary/10 shadow-sm shadow-primary/5" 
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center border border-white/10 shadow-inner"
                    style={{ backgroundColor: color.value.includes('oklch') ? color.value : color.value }}
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

            <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.1] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Visualização em Tempo Real</h4>
                <p className="text-xs text-muted-foreground">A cor selecionada é aplicada instantaneamente em toda a aplicação.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="rounded-xl px-6 h-9">Botão Primário</Button>
                <Button variant="outline" size="sm" className="rounded-xl px-6 h-9 border-border/50">Outline</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
