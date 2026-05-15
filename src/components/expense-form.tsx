'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-expenses'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, Car, Ticket, Bus, Utensils, CalendarIcon, Upload, Plus, Minus, Info, CreditCard, Clock, TramFront, BusFront, Navigation, Camera } from 'lucide-react'
import { Expense } from '@/types/database'
import { format, parseISO, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useIsMobile } from '@/hooks/use-mobile'
import imageCompression from 'browser-image-compression'

const expenseSchema = z.object({
  local: z.string().min(2, 'Onde foi o gasto?'),
  transporte: z.string().min(1, 'Selecione o tipo'),
  valor: z.coerce.number().positive('Informe o valor'),
  motivo: z.string().min(2, 'Diga o motivo'),
  date: z.string(),
  quantidade: z.coerce.number().min(1).max(10),
  pago: z.boolean().default(false),
  receipt_urls: z.array(z.string()).nullable().default(null)
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  expense?: Expense
  onSuccess?: () => void
  trigger?: React.ReactNode
}

const transportOptions = [
  { label: 'Estacionamento', value: 'Estacionamento', icon: Car, color: 'text-blue-500' },
  { label: 'Pedágio', value: 'Pedágio', icon: Ticket, color: 'text-amber-500' },
  { label: 'CPTM/Metrô', value: 'CPTM/Metrô', icon: TramFront, color: 'text-indigo-500' },
  { label: 'Ônibus', value: 'Ônibus', icon: BusFront, color: 'text-orange-500' },
  { label: 'Almoço', value: 'Almoço Reduzido', icon: Utensils, color: 'text-emerald-500' },
]

export function ExpenseForm({ expense, onSuccess, trigger }: ExpenseFormProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showCustomTransport, setShowCustomTransport] = useState(false)
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const supabase = createClient()

  const isEditing = !!expense
  const [step, setStep] = useState(1)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, trigger: formTrigger, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      local: '',
      transporte: 'Estacionamento',
      valor: 0,
      motivo: '',
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      quantidade: 1,
      pago: false,
      receipt_urls: null
    }
  })

  const [prevOpen, setPrevOpen] = useState(false)

  useEffect(() => {
    if (step === 3) {
      setCanSubmit(false)
      const timer = setTimeout(() => setCanSubmit(true), 500)
      return () => clearTimeout(timer)
    }
  }, [step])

  useEffect(() => {
    if (open && !prevOpen) {
      // Tenta recuperar rascunho apenas se não estiver editando uma despesa existente
      if (!expense) {
        const draft = localStorage.getItem('EXPENSE_FORM_DRAFT')
        if (draft) {
          try {
            const savedData = JSON.parse(draft)
            reset(savedData.values)
            setStep(savedData.step || 1)
            setShowCustomTransport(savedData.showCustomTransport || false)
            console.log('[ExpenseForm] Rascunho restaurado com sucesso.')
          } catch (e) {
            console.error('Erro ao restaurar rascunho:', e)
          }
        } else {
          setStep(1)
        }
      } else {
        setStep(1)
      }
    }
    setPrevOpen(open)

    if (open && expense) {
      reset({
        local: expense.local,
        transporte: expense.transporte,
        valor: expense.valor,
        motivo: expense.motivo,
        date: expense.date,
        quantidade: expense.quantidade,
        pago: expense.pago,
        receipt_urls: expense.receipt_urls
      })
      const isPredefined = transportOptions.some(opt => opt.value === expense.transporte)
      setShowCustomTransport(!isPredefined && expense.transporte !== '')
    }
  }, [open, expense, reset, prevOpen])

  // Efeito para salvar rascunho automaticamente
  const formValues = watch()
  useEffect(() => {
    if (open && !expense) {
      const draft = {
        values: formValues,
        step,
        showCustomTransport,
        timestamp: Date.now()
      }
      localStorage.setItem('EXPENSE_FORM_DRAFT', JSON.stringify(draft))
      localStorage.setItem('EXPENSE_FORM_OPEN', 'true')
    }
  }, [formValues, step, open, expense, showCustomTransport])

  // Efeito para reabrir o modal se houve um reload durante o uso
  useEffect(() => {
    const wasOpen = localStorage.getItem('EXPENSE_FORM_OPEN') === 'true'
    if (wasOpen && !open && !expense) {
      // Pequeno delay para garantir que tudo carregou
      const timer = setTimeout(() => setOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dateValue = watch('date')
  const valorValue = watch('valor')
  const transporteValue = watch('transporte')
  const receiptUrls = watch('receipt_urls')

  const startCamera = async () => {
    setIsCameraActive(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: false 
      })
      setCameraStream(stream)
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      alert('Não foi possível acessar a câmera. Verifique as permissões.')
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsCameraActive(false)
  }

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [isCameraActive, cameraStream])

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
          await processFiles([file])
          stopCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const processFiles = async (files: File[]) => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sessão expirada. Por favor, faça login novamente.')
        return
      }

      const newUrls: string[] = []
      
      for (const file of Array.from(files)) {
        const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1280, useWebWorker: true }
        const compressedFile = await imageCompression(file, options)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, compressedFile)
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)
        newUrls.push(publicUrl)
      }

      const currentUrls = watch('receipt_urls') || []
      setValue('receipt_urls', [...currentUrls, ...newUrls], { 
        shouldDirty: true, 
        shouldValidate: true,
        shouldTouch: true 
      })
    } catch (error) { 
      console.error('Upload error:', error)
      alert('Erro de permissão no upload. Verifique sua conexão ou tente novamente.')
    } finally { 
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await processFiles(Array.from(files))
    if (e.target) e.target.value = '' // Reset input
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const numberValue = Number(rawValue) / 100
    setValue('valor', numberValue, { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = async (data: ExpenseFormValues) => {
    console.log('[ExpenseForm] onSubmit chamado!', data, 'Step atual:', step);
    try {
      if (isEditing) { await updateExpense.mutateAsync({ id: expense!.id, ...data }) } 
      else { await createExpense.mutateAsync(data) }
      console.log('[ExpenseForm] Despesa salva com sucesso, fechando modal...');
      localStorage.removeItem('EXPENSE_FORM_DRAFT')
      localStorage.removeItem('EXPENSE_FORM_OPEN')
      setOpen(false)
      onSuccess?.()
    } catch (error) { console.error('Save error:', error) }
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ['local', 'transporte', 'date']
    if (step === 2) fieldsToValidate = ['valor', 'motivo', 'quantidade']
    
    const isValid = await formTrigger(fieldsToValidate)
    if (isValid) setStep(prev => prev + 1)
  }

  const prevStep = () => setStep(prev => prev - 1)

  const handleSafeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (step < 3) {
      console.log('[ExpenseForm] Enter pressionado ou Submit precoce. Avançando passo em vez de salvar.');
      nextStep();
    } else {
      if (!canSubmit) {
        console.log('[ExpenseForm] Submit bloqueado pelo anti-double-tap.');
        return;
      }
      handleSubmit(onSubmit)(e);
    }
  }

  const FormContent = (
    <form onSubmit={handleSafeSubmit} className="flex flex-col h-full overflow-hidden">
      {/* Barra de Progresso */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Etapa {step} de 3</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
            {step === 1 ? 'Localização' : step === 2 ? 'Valores' : 'Anexos'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-white/[0.04]">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_var(--primary)]/30" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-12 custom-scrollbar animate-in fade-in duration-500">
        {/* STEP 1: Onde e Quando */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {isMobile && (
              <div className="pt-4 pb-2 text-left">
                <h2 className="text-3xl font-semibold tracking-tight">{isEditing ? 'Editar Registro' : 'Nova Despesa'}</h2>
                <p className="text-sm font-medium text-muted-foreground/40 mt-1">Primeiro, nos conte onde e quando foi o gasto.</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="local" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origem / Destino</Label>
                  <Input id="local" {...register('local')} placeholder="Agência 0123-45" className="h-12 rounded-2xl bg-muted/50 border-border focus-visible:bg-muted/80 transition-colors" />
                  {errors.local && <span className="text-[10px] font-medium text-destructive ml-1">{errors.local.message}</span>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Data do Gasto</Label>
                    <div className="flex gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => setValue('date', new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true })}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-all border",
                          dateValue === new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] 
                            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" 
                            : "bg-muted/30 border-border/50 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        Hoje
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const yesterday = subDays(new Date(), 1);
                          setValue('date', new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true });
                        }}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-all border",
                          dateValue === new Date(subDays(new Date(), 1).getTime() - subDays(new Date(), 1).getTimezoneOffset() * 60000).toISOString().split('T')[0]
                            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" 
                            : "bg-muted/30 border-border/50 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        Ontem
                      </button>
                    </div>
                  </div>
                  {isMobile ? (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <button type="button" className="w-full h-14 flex items-center justify-between text-left font-semibold rounded-2xl bg-muted/30 border border-border/60 px-5 outline-none">
                          <span className="text-sm tracking-tight">{dateValue ? format(parseISO(dateValue), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecionar data..."}</span>
                          <CalendarIcon className="h-4 w-4 text-primary" />
                        </button>
                      </DrawerTrigger>
                      <DrawerContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-t-[32px]">
                        <div className="p-6 flex justify-center pb-12"><Calendar mode="single" selected={dateValue ? parseISO(dateValue) : undefined} onSelect={(date) => date && setValue('date', date.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true })} className="rounded-2xl border border-border/50 bg-muted/20 p-4" /></div>
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <Popover>
                      <PopoverTrigger className="w-full h-14 flex items-center justify-between text-left font-semibold rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/30 px-5 outline-none group"><span className="text-sm tracking-tight">{dateValue ? format(parseISO(dateValue), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecionar data..."}</span><CalendarIcon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" /></PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-[24px] border-white/10 bg-background/95 backdrop-blur-3xl" align="start"><Calendar mode="single" selected={dateValue ? parseISO(dateValue) : undefined} onSelect={(date) => date && setValue('date', date.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true })} className="p-4" /></PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label className="ml-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Meio de Transporte</Label>
                <div className="grid grid-cols-2 gap-2">
                  {transportOptions.map((opt) => {
                    const Icon = opt.icon
                    const isActive = !showCustomTransport && transporteValue === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => { setShowCustomTransport(false); setValue('transporte', opt.value, { shouldDirty: true, shouldValidate: true }) }} className={cn("flex items-center gap-3 h-14 px-4 rounded-2xl border text-[11px] font-semibold transition-all duration-300", isActive ? "bg-primary/5 border-primary text-foreground shadow-sm" : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60")}>
                        <div className={cn("p-1.5 rounded-lg border transition-colors", isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-background/50 border-border text-primary")}><Icon className="h-3.5 w-3.5" /></div>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                  <button type="button" onClick={() => { setShowCustomTransport(true); setValue('transporte', '', { shouldDirty: true }) }} className={cn("flex items-center justify-center h-14 px-4 rounded-2xl border border-dashed text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300", showCustomTransport ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-transparent border-border/30 text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-border/60")}>Outros</button>
                </div>
                {showCustomTransport && (<Input className="h-12 rounded-2xl bg-muted/50 border-border focus-visible:bg-muted/80 animate-in fade-in slide-in-from-top-2 text-sm" placeholder="Especifique o tipo..." {...register('transporte')} />)}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Detalhes Financeiros */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {isMobile && (
              <div className="pt-4 pb-2 text-left">
                <h2 className="text-3xl font-semibold tracking-tight">Quanto foi?</h2>
                <p className="text-sm font-medium text-muted-foreground/40 mt-1">Informe o valor e ajuste a quantidade com os botões.</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="valor" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor Unitário</Label>
                    <Input 
                      id="valor" 
                      type="text" 
                      inputMode="decimal" 
                      value={formatCurrency(valorValue || 0)} 
                      onChange={handleCurrencyChange} 
                      onFocus={(e) => setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0)}
                      onClick={(e) => (e.target as HTMLInputElement).setSelectionRange((e.target as HTMLInputElement).value.length, (e.target as HTMLInputElement).value.length)}
                      className={cn("h-14 rounded-2xl bg-muted/50 border-border font-mono font-bold text-lg", (valorValue > 0) ? "text-primary shadow-[0_0_15px_var(--primary)]/5" : "text-muted-foreground/40")} 
                    />
                    {errors.valor && <span className="text-[10px] font-medium text-destructive ml-1">{errors.valor.message}</span>}
                  </div>

                  <div className="grid gap-3">
                    <Label className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Quantidade</Label>
                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl border border-border/60 p-1 h-14">
                      <button 
                        type="button" 
                        onClick={() => {
                          const current = Number(watch('quantidade')) || 1
                          if (current > 1) setValue('quantidade', current - 1, { shouldDirty: true })
                        }}
                        className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary active:scale-90 transition-all text-muted-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="text-xl font-black font-mono text-primary select-none">{watch('quantidade')}</span>

                      <button 
                        type="button" 
                        onClick={() => {
                          const current = Number(watch('quantidade')) || 1
                          if (current < 10) setValue('quantidade', current + 1, { shouldDirty: true })
                        }}
                        className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary active:scale-90 transition-all text-muted-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <input type="hidden" {...register('quantidade')} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="motivo" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Motivo do Gasto</Label>
                  <Input id="motivo" {...register('motivo')} placeholder="Chamado 1234567, Reunião" className="h-12 rounded-2xl bg-muted/50 border-border focus-visible:bg-muted/80 transition-colors" />
                  {errors.motivo && <span className="text-[10px] font-medium text-destructive ml-1">{errors.motivo.message}</span>}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mb-0.5">Total Calculado</p>
                    <p className="text-2xl font-black font-mono text-primary">{formatCurrency((valorValue || 0) * (watch('quantidade') || 1))}</p>
                  </div>
                  <Info className="h-5 w-5 text-primary/40" />
                </div>
                
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="pago-status" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reembolsado?</Label>
                    <div className="flex items-center justify-between h-14 px-5 rounded-2xl bg-muted/30 border border-border">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{watch('pago') ? 'SIM' : 'NÃO'}</span>
                      <Switch id="pago-status" checked={watch('pago')} onCheckedChange={(checked) => setValue('pago', checked, { shouldDirty: true })} className="data-[state=checked]:bg-primary" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Comprovação */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {isMobile && (
              <div className="pt-4 pb-2 text-left">
                <h2 className="text-3xl font-semibold tracking-tight">Anexar Recibos</h2>
                <p className="text-sm font-medium text-muted-foreground/40 mt-1">
                  Para finalizar, anexe fotos dos seus comprovantes.
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Comprovante
                  </Label>
                  <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-1")}>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        console.log('[ExpenseForm] Botão de galeria clicado.');
                        e.preventDefault();
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }} 
                      disabled={uploading} 
                      className={cn(
                        "flex items-center justify-between h-20 px-6 rounded-2xl border border-dashed transition-all bg-muted/30 w-full outline-none", 
                        uploading ? "opacity-50 cursor-not-allowed border-primary" : "border-border/60 hover:border-primary/40 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="p-3 rounded-xl bg-background/50 border border-border">
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-foreground uppercase tracking-widest">
                            {uploading ? 'Enviando...' : (isMobile ? 'Galeria' : 'Selecionar Fotos')}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                            Mídia
                          </span>
                        </div>
                      </div>
                      {!isMobile && <Plus className="h-5 w-5 text-muted-foreground/40" />}
                    </button>

                    {isMobile && (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          console.log('[ExpenseForm] Abrindo câmera interna.');
                          e.preventDefault();
                          e.stopPropagation();
                          startCamera();
                        }} 
                        disabled={uploading} 
                        className={cn(
                          "flex items-center justify-between h-20 px-6 rounded-2xl border border-dashed transition-all bg-primary/5 w-full outline-none border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            {uploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Camera className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                              Câmera
                            </span>
                            <span className="text-[9px] font-medium text-primary/50 uppercase tracking-wider">
                              Tirar Foto
                            </span>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  disabled={uploading} 
                />
              </div>

              <div className="space-y-6">
                {receiptUrls && receiptUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-muted/30 border border-border animate-in fade-in zoom-in duration-500">
                    {receiptUrls.map((url, idx) => (
                      <div key={idx} className="relative group/img aspect-square overflow-hidden rounded-xl border border-white/10 shadow-sm">
                        <img src={url} className="h-full w-full object-cover" alt="recibo" />
                        <button 
                          type="button" 
                          onClick={() => { 
                            const urls = receiptUrls?.filter((_, i) => i !== idx); 
                            setValue('receipt_urls', urls?.length ? urls : null, { shouldDirty: true });
                          }} 
                          className="absolute inset-0 bg-destructive/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all"
                        >
                          <X className="h-5 w-5 text-white stroke-[3]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/40">Resumo</span>
                    <span className="text-primary">{transporteValue}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-black">
                    <span className="text-foreground/40">Total</span>
                    <span className="text-foreground font-mono">
                      {formatCurrency((valorValue || 0) * (watch('quantidade') || 1))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="p-8 border-t border-border/50 bg-background/50 backdrop-blur-xl flex gap-3">
        {step > 1 && (
          <button type="button" onClick={prevStep} className="flex-1 h-14 rounded-2xl bg-muted/30 border border-border text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] hover:bg-muted/50 active:scale-[0.98] transition-all">
            Voltar
          </button>
        )}
        
        {step < 3 ? (
          <button type="button" onClick={nextStep} className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">
            Continuar
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting || uploading} className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {(createExpense.isPending || updateExpense.isPending) ? (
              <><Loader2 className="h-4 w-4 animate-spin" /><span>Salvando...</span></>
            ) : (
              <span>{isEditing ? 'Confirmar Edição' : 'Finalizar Lançamento'}</span>
            )}
          </button>
        )}
      </div>
    </form>
  )

  const commonTrigger = trigger || (
    <button className="h-10 px-5 rounded-xl font-medium bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 w-auto justify-center whitespace-nowrap">
      <Plus className="h-4 w-4" />
      Nova Despesa
    </button>
  )

  const handleInteractOutside = (e: any) => {
    console.log('[ExpenseForm] handleInteractOutside disparado no Drawer.', e.type);
    const hasFocus = typeof document !== "undefined" && document.hasFocus();
    console.log('[ExpenseForm] document.hasFocus():', hasFocus);
    if (!hasFocus) {
      console.log('[ExpenseForm] Prevenindo fechamento porque a janela perdeu o foco (provável file picker).');
      e.preventDefault();
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    console.log('[ExpenseForm] onOpenChange chamado. Novo valor:', newOpen, '| Step atual:', step);
    setOpen(newOpen);
    if (!newOpen) {
      localStorage.setItem('EXPENSE_FORM_OPEN', 'false');
    }
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} dismissible={step !== 3}>
        <DrawerTrigger asChild>{commonTrigger}</DrawerTrigger>
        <DrawerContent 
          onInteractOutside={handleInteractOutside}
          className="h-full bg-background/95 backdrop-blur-3xl border-white/[0.06] rounded-t-[40px] p-0 outline-none flex flex-col overflow-hidden"
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          {FormContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>{commonTrigger}</DialogTrigger>
      <DialogContent 
        className="sm:max-w-[480px] md:max-w-[720px] lg:max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border-white/[0.06] rounded-[32px] shadow-2xl" 
        showCloseButton={false}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Financeiro</span>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold tracking-tight">
                {isEditing ? 'Editar Registro' : 'Nova Despesa'}
              </DialogTitle>
              <p className="text-sm font-medium text-muted-foreground/40 leading-relaxed mt-2">
                Preencha os detalhes do gasto para manter seu controle financeiro atualizado.
              </p>
            </DialogHeader>
          </div>
          {FormContent}
        </div>
      </DialogContent>

      {/* Câmera Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute top-8 left-0 right-0 px-8 flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Câmera</span>
              <span className="text-white font-semibold tracking-tight">Capturar Recibo</span>
            </div>
            <button 
              onClick={stopCamera}
              className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative w-full aspect-[3/4] max-h-[70vh] overflow-hidden bg-muted/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            {/* Overlay de Guia */}
            <div className="absolute inset-8 border-2 border-dashed border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
               <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Alinhe o recibo aqui</div>
            </div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center p-8">
            <button 
              onClick={capturePhoto}
              className="h-20 w-20 rounded-full border-4 border-white/20 p-1 group active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-primary transition-colors flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                <div className="h-6 w-6 rounded-full border-2 border-black/10" />
              </div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </Dialog>
  )
}
