'use client'

import { Menu, Home, Receipt, LogOut, X } from 'lucide-react'
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
  ]

  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-xl px-6 py-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
          <div className="h-3 w-3 bg-background rounded-sm rotate-45" />
        </div>
        <span className="font-bold tracking-tight">RDT APP</span>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <Menu className="h-5 w-5 text-primary" />
            <span className="sr-only">Menu</span>
          </button>
        </DrawerTrigger>
        <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[2.5rem] pb-8">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          
          <DrawerHeader className="px-8 pt-2">
            <DrawerTitle className="text-xl font-bold tracking-tight text-center">Navegação</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 h-14 text-base font-bold rounded-2xl transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent hover:border-white/5"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "" : "text-primary/60")} />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="pt-4 border-t border-white/5 mt-4">
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="flex w-full items-center gap-4 px-6 h-14 text-base font-bold text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                    <LogOut className="h-5 w-5" />
                    Sair do Sistema
                  </button>
                </DrawerTrigger>
                <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[2.5rem] p-8 pb-12">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
                  <DrawerHeader className="p-0 text-left">
                    <DrawerTitle className="text-3xl font-bold tracking-tight">Sair da Conta?</DrawerTitle>
                    <p className="text-lg font-medium text-muted-foreground mt-2">
                      Sua sessão atual será encerrada.
                    </p>
                  </DrawerHeader>
                  <div className="mt-8 flex flex-col gap-3">
                    <form action={signOut} className="w-full">
                      <Button type="submit" variant="destructive" className="w-full rounded-2xl h-14 font-bold text-lg">Confirmar Saída</Button>
                    </form>
                    <DrawerClose asChild>
                      <Button variant="outline" className="w-full rounded-2xl h-14 font-bold border-white/10 hover:bg-white/5">Cancelar</Button>
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