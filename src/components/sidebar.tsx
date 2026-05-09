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
      <div className="px-2 flex items-center gap-3">
        <div className="h-7 w-7 rounded bg-foreground flex items-center justify-center">
          <div className="h-3 w-3 bg-background rounded-[1px] rotate-45" />
        </div>
        <span className="text-lg font-medium tracking-tight text-foreground">
          RDT APP
        </span>
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
                  ? "bg-white/[0.06] text-foreground" 
                  : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground transition-colors")} />
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
          <AlertDialogContent className="rounded-2xl border-white/[0.06] bg-background/90 backdrop-blur-3xl p-8 max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-medium tracking-tight">Sair da Conta?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Sua sessão atual será encerrada. Você precisará fazer login novamente para acessar seus dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-2">
              <AlertDialogCancel className="rounded-xl h-10 px-6 border-white/[0.06] hover:bg-white/[0.04] m-0">Cancelar</AlertDialogCancel>
              <form action={signOut} className="m-0">
                <Button type="submit" variant="destructive" className="w-full rounded-xl h-10 px-6">Confirmar Saída</Button>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}