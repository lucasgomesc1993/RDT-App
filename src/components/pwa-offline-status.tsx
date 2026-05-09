'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false)
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowBackOnline(true)
      const timer = setTimeout(() => setShowBackOnline(false), 3000)
      return () => clearTimeout(timer)
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Estado inicial
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && !showBackOnline) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xs animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={cn(
        "flex items-center justify-center gap-3 py-3 px-6 rounded-full border backdrop-blur-xl shadow-2xl transition-all",
        isOffline 
          ? "bg-red-500/10 border-red-500/20 text-red-500" 
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
      )}>
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sem Conexão</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conexão Restaurada</span>
          </>
        )}
      </div>
    </div>
  )
}
