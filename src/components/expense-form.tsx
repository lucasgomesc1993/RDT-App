'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-expenses'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, X, Car, Ticket, Bus, Utensils, CalendarIcon, Upload, Plus, Info, CreditCard, Clock, TramFront, BusFront, Navigation } from 'lucide-react'
import { Expense } from '@/types/database'
import { format, parseISO } from 'date-fns'
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
  
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const supabase = createClient()

  const isEditing = !!expense

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
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

  useEffect(() => {
    if (open) {
      if (expense) {
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
      } else {
        reset({
          local: '',
          transporte: 'Estacionamento',
          valor: 0,
          motivo: '',
          date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
          quantidade: 1,
          pago: false,
          receipt_urls: null
        })
        setShowCustomTransport(false)
      }
    }
  }, [open, expense, reset])

  const dateValue = watch('date')
  const valorValue = watch('valor')
  const transporteValue = watch('transporte')
  const receiptUrls = watch('receipt_urls')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sessão expirada. Por favor, faça login novamente.')
        return
      }

      const newUrls: string[] = []
      
      for (const file of Array.from(files)) {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true }
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
      if (e.target) e.target.value = '' // Reset input
    }
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
    try {
      if (isEditing) { await updateExpense.mutateAsync({ id: expense!.id, ...data }) } 
      else { await createExpense.mutateAsync(data) }
      setOpen(false)
      onSuccess?.()
    } catch (error) { console.error('Save error:', error) }
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 space-y-5 pb-12 custom-scrollbar">
        {isMobile && (
          <div className="pt-8 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Financeiro</span>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-semibold tracking-tight">
                {isEditing ? 'Editar Registro' : 'Nova Despesa'}
              </h2>
              <p className="text-sm font-medium text-muted-foreground/40 mt-1">
                Insira as informações do seu gasto abaixo.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4 pt-1">
          <div className="grid gap-2">
            <Label htmlFor="local" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origem / Destino</Label>
            <Input id="local" {...register('local')} placeholder="Agência 0123-45" className="h-10 rounded-xl bg-muted/50 border-border focus-visible:bg-muted/80 transition-colors" />
            {errors.local && <span className="text-[10px] font-medium text-destructive ml-1">{errors.local.message}</span>}
          </div>

          <div className="grid gap-3">
            <Label className="ml-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Meio de Transporte</Label>
            <div className="grid grid-cols-2 gap-2">
              {transportOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = !showCustomTransport && transporteValue === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 h-14 px-4 rounded-2xl border text-[11px] font-semibold transition-all duration-300",
                      isActive 
                        ? "bg-primary/5 border-primary text-foreground shadow-sm" 
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    onClick={() => {
                      setShowCustomTransport(false)
                      setValue('transporte', opt.value, { shouldDirty: true, shouldValidate: true })
                    }}
                  >
                    <div className={cn("p-1.5 rounded-lg border transition-colors", isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-background/50 border-border text-primary")}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center h-14 px-4 rounded-2xl border border-dashed text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
                  showCustomTransport 
                    ? "bg-primary/5 border-primary text-primary shadow-sm" 
                    : "bg-transparent border-border/30 text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-border/60"
                )}
                onClick={() => {
                  setShowCustomTransport(true)
                  setValue('transporte', '', { shouldDirty: true })
                }}
              >
                Outros / Diversos
              </button>
            </div>
            {showCustomTransport && (<Input className="h-12 rounded-2xl bg-muted/50 border-border focus-visible:bg-muted/80 animate-in fade-in slide-in-from-top-2 text-sm" placeholder="Especifique o tipo..." {...register('transporte')} />)}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-3 grid gap-2">
              <Label htmlFor="valor" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Valor</Label>
              <Input 
                id="valor" 
                type="text" 
                inputMode="decimal" 
                value={formatCurrency(valorValue || 0)} 
                onChange={handleCurrencyChange} 
                className={cn(
                  "h-12 rounded-2xl bg-muted/50 border-border font-mono font-bold text-lg",
                  (valorValue === 0 || !valorValue) ? "text-muted-foreground/40" : "text-foreground"
                )} 
              />
            </div>
            <div className="col-span-1 grid gap-2">
              <Label htmlFor="quantidade" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Qtd</Label>
              <Input id="quantidade" type="number" inputMode="numeric" min="1" max="10" {...register('quantidade')} className="h-12 rounded-2xl bg-muted/50 border-border text-center font-mono font-bold text-lg" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Comprovante</Label>
            <label htmlFor="receipt" className={cn(
              "flex items-center justify-between h-14 px-5 rounded-2xl border border-dashed transition-all active:scale-[0.98] bg-muted/30", 
              uploading ? "opacity-50 cursor-not-allowed border-primary" : "border-border/60 hover:border-primary/40 cursor-pointer"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/50 border border-border">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
                </span>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground/40" />
              <input 
                id="receipt" 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading} 
              />
            </label>
          </div>
        </div>
        
        {receiptUrls && receiptUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-muted/30 border border-border animate-in fade-in slide-in-from-top-2">
            {receiptUrls.map((url, idx) => (
              <div key={idx} className="relative group/img h-12 w-12">
                <img src={url} className="h-full w-full object-cover rounded-lg border border-white/10" alt="p" />
                <button type="button" onClick={() => { const urls = receiptUrls?.filter((_, i) => i !== idx); setValue('receipt_urls', urls?.length ? urls : null, { shouldDirty: true }) }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-sm"><X className="h-3 w-3 stroke-[3]" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Data do Gasto</Label>
              <div className="flex gap-1.5 p-1 bg-muted/30 rounded-full border border-border/50">
                <button 
                  type="button" 
                  onClick={() => {
                    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                    setValue('date', today, { shouldDirty: true, shouldValidate: true })
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                    dateValue === new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  Hoje
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const yesterday = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000) - 86400000).toISOString().split('T')[0];
                    setValue('date', yesterday, { shouldDirty: true, shouldValidate: true })
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all",
                    dateValue === new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000) - 86400000).toISOString().split('T')[0]
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  Ontem
                </button>
              </div>
            </div>

            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full h-14 flex items-center justify-between text-left font-semibold rounded-2xl bg-muted/30 border border-border/60 active:scale-[0.98] transition-all px-0 overflow-hidden outline-none",
                      !dateValue && "text-muted-foreground"
                    )}
                  >
                    <span className="px-5 text-sm tracking-tight truncate">
                      {dateValue ? format(parseISO(dateValue), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecionar data..."}
                    </span>
                    <div className="h-full px-4 flex items-center justify-center border-l border-border/60 bg-background/30 text-primary transition-colors">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                  </button>
                </DrawerTrigger>
                <DrawerContent className="bg-background/95 backdrop-blur-3xl border-white/10 rounded-t-[32px]">
                  <DrawerHeader className="border-b border-border/50 pb-4">
                    <DrawerTitle className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Selecionar Data</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 flex justify-center pb-12">
                    <Calendar
                      mode="single"
                      selected={dateValue ? parseISO(dateValue) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setValue('date', date.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true })
                        }
                      }}
                      className="rounded-2xl border border-border/50 bg-muted/20 p-4"
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full h-14 flex items-center justify-between text-left font-semibold rounded-2xl bg-muted/30 border border-border/60 hover:bg-muted/50 hover:border-primary/30 transition-all px-0 overflow-hidden group outline-none focus-visible:border-primary/50",
                    !dateValue && "text-muted-foreground"
                  )}
                >
                  <span className="px-5 text-sm tracking-tight truncate">
                    {dateValue ? format(parseISO(dateValue), "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecionar data..."}
                  </span>
                  <div className="h-full px-4 flex items-center justify-center border-l border-border/60 bg-background/30 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[24px] border-white/10 bg-background/95 backdrop-blur-3xl shadow-2xl overflow-hidden" align="start">
                  <Calendar
                    mode="single"
                    selected={dateValue ? parseISO(dateValue) : undefined}
                    onSelect={(date) => date && setValue('date', date.toISOString().split('T')[0], { shouldDirty: true, shouldValidate: true })}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Campo: Status de Reembolso (Apenas na Edição) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="pago-status" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reembolsado?</Label>
              <div className="flex items-center justify-between h-12 px-5 rounded-2xl bg-muted/30 border border-border group-hover:border-primary/20 transition-all">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{watch('pago') ? 'SIM' : 'NÃO'}</span>
                 <Switch id="pago-status" checked={watch('pago')} onCheckedChange={(checked) => setValue('pago', checked, { shouldDirty: true })} className="data-[state=checked]:bg-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="motivo" className="ml-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Motivo</Label>
          <Input id="motivo" {...register('motivo')} placeholder="Ex: Visita ao cliente, Reunião técnica..." className="h-10 rounded-xl bg-muted/50 border-border focus-visible:bg-muted/80 transition-colors" />
        </div>
      </div>

      <div className="p-8 border-t border-border/50 bg-background/50 backdrop-blur-xl">
        <button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-primary/20"
        >
          {(createExpense.isPending || updateExpense.isPending) ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Processando...</span></>
          ) : (
            <span>{isEditing ? 'Salvar Alterações' : 'Salvar'}</span>
          )}
        </button>
      </div>
    </form>
  )

  const commonTrigger = trigger || (
    <button className="h-10 px-5 rounded-xl font-medium bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 w-auto justify-center whitespace-nowrap">
      <Plus className="h-4 w-4" />
      Nova Despesa
    </button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>{commonTrigger}</DrawerTrigger>
        <DrawerContent className="h-full bg-background/95 backdrop-blur-3xl border-white/[0.06] rounded-t-[40px] p-0 outline-none flex flex-col overflow-hidden">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          {FormContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{commonTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-3xl border-white/[0.06] rounded-[32px] shadow-2xl" showCloseButton={false}>
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
    </Dialog>
  )
}
