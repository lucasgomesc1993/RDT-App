'use client'

import { Menu, Home, Receipt, LogOut, X, Settings } from 'lucide-react'
import { Button } from './ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/despesas', label: 'Despesas', icon: Receipt },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="flex items-center justify-between border-b border-border/50 bg-background/50 backdrop-blur-2xl px-6 py-4 md:hidden sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-xl rotate-6" />
          <div className="relative h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-4 w-4"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.2" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-black tracking-tighter text-foreground uppercase italic">RDT</span>
          <span className="text-[8px] font-bold tracking-[0.2em] text-primary uppercase">Financeiro</span>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="p-2 rounded-xl bg-transparent hover:bg-white/[0.04] transition-colors border border-transparent">
            <Menu className="h-5 w-5 text-foreground" />
            <span className="sr-only">Menu</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-background/95 backdrop-blur-3xl border-border/30 rounded-t-[40px] pb-10 outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted/30 my-4" />
          
          <div className="px-8 pt-4 pb-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Menu</span>
              <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-primary">
                <Menu className="h-4 w-4" />
              </div>
            </div>
            <DrawerHeader className="p-0 text-left">
              <DrawerTitle className="text-3xl font-semibold tracking-tight text-foreground">Navegação</DrawerTitle>
              <p className="text-sm font-medium text-muted-foreground/40 mt-1">Acesse as áreas do sistema.</p>
            </DrawerHeader>
          </div>

          <div className="px-6 py-2 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 h-14 text-sm font-semibold rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-muted/30 text-foreground border border-border/30" 
                      : "text-muted-foreground/60 hover:bg-muted/20 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground/40")} />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="pt-4 border-t border-border/50 mt-4">
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="flex w-full items-center gap-4 px-6 h-12 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300">
                    <LogOut className="h-4.5 w-4.5" />
                    Sair do Sistema
                  </button>
                </DrawerTrigger>
                <DrawerContent className="bg-background/95 backdrop-blur-3xl border-border/40 rounded-t-[40px] p-8 pb-12 outline-none">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-10" />
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Sistema</span>
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-primary">
                        <LogOut className="h-4 w-4" />
                      </div>
                    </div>
                    <DrawerHeader className="p-0 text-left">
                      <DrawerTitle className="text-3xl font-semibold tracking-tight text-foreground">Sair da Conta?</DrawerTitle>
                      <p className="text-sm font-medium text-muted-foreground/40 leading-relaxed mt-1">
                        Sua sessão será encerrada com segurança. Você precisará se autenticar novamente.
                      </p>
                    </DrawerHeader>
                    <div className="grid gap-3 pt-4">
                      <form action={signOut} className="w-full m-0">
                        <Button type="submit" variant="default" className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-foreground text-background hover:opacity-90">
                          Confirmar Saída
                        </Button>
                      </form>
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-border/20 bg-muted/10 text-[10px] font-black uppercase tracking-[0.2em]">
                          Cancelar
                        </Button>
                      </DrawerClose>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}