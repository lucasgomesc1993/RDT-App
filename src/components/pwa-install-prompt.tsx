'use client'

import { useState, useEffect } from 'react'
import { Plus, Download, X, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'other'>('other')
  const isMobile = useIsMobile()

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://')

    if (isStandalone) return

    // Lógica para iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS) {
      setPlatform('ios')
      // Mostrar apenas se não foi fechado nesta sessão
      const closed = sessionStorage.getItem('pwa-prompt-closed')
      if (!closed) {
        const timer = setTimeout(() => setShow(true), 3000)
        return () => clearTimeout(timer)
      }
    }

    // Lógica para Android/Chrome (BeforeInstallPromptEvent)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      // Armazenar o evento se quiser disparar via botão futuramente
      window.deferredPrompt = e
      
      const closed = sessionStorage.getItem('pwa-prompt-closed')
      if (!closed) {
        setShow(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    const promptEvent = window.deferredPrompt
    if (!promptEvent) return

    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    window.deferredPrompt = null
  }

  const closePrompt = () => {
    setShow(false)
    sessionStorage.setItem('pwa-prompt-closed', 'true')
  }

  if (!show || !isMobile) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-background/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        
        <button 
          onClick={closePrompt}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Download className="h-7 w-7 text-primary-foreground" />
          </div>
          
          <div className="flex-1 space-y-1 pr-6">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Instalar RDT App</h3>
            <p className="text-xs text-muted-foreground font-medium leading-tight">
              {platform === 'ios' 
                ? 'Toque em compartilhar e "Adicionar à Tela de Início"' 
                : 'Acesse rápido e use offline como um aplicativo nativo.'}
            </p>
          </div>
        </div>

        {platform === 'other' ? (
          <Button 
            onClick={handleInstall}
            className="w-full mt-4 h-11 rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-[0.2em]"
          >
            Instalar Agora
          </Button>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
            <Share className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Toque em Compartilhar</span>
          </div>
        )}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    deferredPrompt: any
  }
}
