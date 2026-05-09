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
        <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
          <div className="h-2.5 w-2.5 bg-background rounded-[1px] rotate-45" />
        </div>
        <span className="font-medium tracking-tight text-foreground">RDT APP</span>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="p-2 rounded-xl bg-transparent hover:bg-white/[0.04] transition-colors border border-transparent">
            <Menu className="h-5 w-5 text-foreground" />
            <span className="sr-only">Menu</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-background/90 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl pb-8">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          
          <DrawerHeader className="px-8 pt-2 pb-4">
            <DrawerTitle className="text-lg font-medium tracking-tight text-center text-foreground">Navegação</DrawerTitle>
          </DrawerHeader>

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
                    "flex items-center gap-4 px-6 h-12 text-sm font-medium rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-white/[0.06] text-foreground" 
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5", isActive ? "text-foreground" : "text-muted-foreground")} />
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
                <DrawerContent className="bg-background/90 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl p-6 pb-10">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-6" />
                  <DrawerHeader className="p-0 text-left">
                    <DrawerTitle className="text-xl font-medium tracking-tight text-foreground">Sair da Conta?</DrawerTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sua sessão atual será encerrada.
                    </p>
                  </DrawerHeader>
                  <div className="mt-8 flex flex-col gap-3">
                    <form action={signOut} className="w-full">
                      <Button type="submit" variant="destructive" className="w-full h-11 text-base">Confirmar Saída</Button>
                    </form>
                    <DrawerClose asChild>
                      <Button variant="outline" className="w-full h-11 text-base">Cancelar</Button>
                    </DrawerClose>
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