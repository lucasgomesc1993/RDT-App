"use client"

import Link from 'next/link'
import { Home, Receipt, LogOut } from 'lucide-react'
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
    <div className="hidden md:flex h-full w-64 flex-col bg-background/50 backdrop-blur-xl border-r border-white/5 p-4 gap-6">
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <div className="h-4 w-4 bg-background rounded-sm rotate-45" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
          RDT APP
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {[
          { href: '/', label: 'Dashboard', icon: Home },
          { href: '/despesas', label: 'Despesas', icon: Receipt },
        ].map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", isActive ? "" : "text-muted-foreground/60 group-hover:text-primary transition-colors")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <AlertDialog>
          <AlertDialogTrigger>
            <div 
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all group cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 group-hover:rotate-12 transition-transform" />
              Sair do Sistema
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[2rem] border-white/10 bg-background/95 backdrop-blur-3xl p-10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-3xl font-bold tracking-tight">Sair da Conta?</AlertDialogTitle>
              <AlertDialogDescription className="text-lg font-medium text-muted-foreground">
                Sua sessão atual será encerrada. Você precisará fazer login novamente para acessar seus dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="rounded-2xl h-12 font-bold px-8 border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
              <form action={signOut}>
                <Button type="submit" variant="destructive" className="rounded-2xl h-12 font-bold px-8">Confirmar Saída</Button>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}