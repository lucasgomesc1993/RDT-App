"use client"

import Link from 'next/link'
import { Home, Receipt, LogOut, Settings } from 'lucide-react'
import { Button } from './ui/button'
import { signOut } from '@/app/login/actions'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-background/50 backdrop-blur-2xl border-r border-border/50 p-6 gap-8">
      <div className="px-2 flex items-center gap-4">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6 transition-transform group-hover:rotate-12" />
          <div className="relative h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-5 w-5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.2" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col -space-y-1.5">
          <span className="text-2xl font-black tracking-tighter text-foreground uppercase italic">
            RDT
          </span>
          <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase ml-0.5">
            Financeiro
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {[
          { href: '/', label: 'Dashboard', icon: Home },
          { href: '/despesas', label: 'Despesas', icon: Receipt },
          { href: '/configuracoes', label: 'Configurações', icon: Settings },
        ].map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-muted/30 text-foreground border border-border/30" 
                  : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors duration-300", 
                isActive ? "text-primary shadow-[0_0_10px_var(--primary)]/20" : "text-muted-foreground group-hover:text-primary/70"
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/50">
        <AlertDialog>
          <AlertDialogTrigger 
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-300 group cursor-pointer border-none bg-transparent"
          >
            <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            Sair do Sistema
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl border border-border/30 bg-background/95 backdrop-blur-3xl p-8 max-w-[380px] shadow-2xl outline-none">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">Sistema</span>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-primary">
                  <LogOut className="h-4 w-4" />
                </div>
              </div>
              
              <div className="space-y-2">
                <AlertDialogTitle className="text-3xl font-semibold tracking-tight text-foreground">Sair da Conta?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm font-medium text-muted-foreground/40 leading-relaxed">
                  Sua sessão será encerrada. Você precisará se autenticar novamente para acessar o painel.
                </AlertDialogDescription>
              </div>

              <div className="grid gap-3 pt-4">
                <form action={signOut} className="m-0">
                  <Button type="submit" variant="default" className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-foreground text-background hover:bg-foreground/90 transition-all">
                    Confirmar Saída
                  </Button>
                </form>
                <AlertDialogCancel className="h-12 rounded-xl border-border/20 bg-muted/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all m-0">
                  Voltar ao App
                </AlertDialogCancel>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}