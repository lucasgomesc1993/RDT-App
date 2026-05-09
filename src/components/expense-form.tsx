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
import { Loader2, X, Car, Ticket, Bus, Utensils, CalendarIcon, FileImage, Plus, Info, CreditCard } from 'lucide-react'
import { Expense } from '@/types/database'
import { format } from 'date-fns'
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
  { label: 'Condução', value: 'Condução', icon: Bus, color: 'text-indigo-500' },
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
      transporte: '',
      valor: 0,
      motivo: '',
      date: new Date().toISOString().split('T')[0],
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
          transporte: '',
          valor: 0,
          motivo: '',
          date: new Date().toISOString().split('T')[0],
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
      const imageFile = files[0]
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true }
      const compressedFile = await imageCompression(imageFile, options)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, compressedFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)
      const currentUrls = receiptUrls || []
      setValue('receipt_urls', [...currentUrls, publicUrl], { shouldDirty: true })
    } catch (error) { console.error('Upload error:', error) } finally { setUploading(false) }
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-6 custom-scrollbar">
        <div className="space-y-4 pt-1">
          <div className="grid gap-2">
            <Label htmlFor="local" className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Local / Estabelecimento</Label>
            <Input id="local" {...register('local')} placeholder="Ex: Shopping Centro, Estacionamento X..." className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] focus-visible:bg-white/[0.04]" />
            {errors.local && <span className="text-[10px] font-medium text-destructive ml-1">{errors.local.message}</span>}
          </div>

          <div className="grid gap-3">
            <Label className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {transportOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = !showCustomTransport && transporteValue === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 h-12 px-3 rounded-xl border text-xs font-medium transition-all duration-300",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    )}
                    onClick={() => {
                      setShowCustomTransport(false)
                      setValue('transporte', opt.value, { shouldDirty: true, shouldValidate: true })
                    }}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-background" : "text-muted-foreground")} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center h-12 px-3 rounded-xl border text-[10px] font-medium uppercase tracking-wider transition-all duration-300 col-span-2",
                  showCustomTransport 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-dashed"
                )}
                onClick={() => {
                  setShowCustomTransport(true)
                  setValue('transporte', '', { shouldDirty: true })
                }}
              >
                Outro Gasto / Diversos
              </button>
            </div>
            {showCustomTransport && (<Input className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] focus-visible:bg-white/[0.04] animate-in fade-in slide-in-from-top-2" placeholder="Especifique o tipo..." {...register('transporte')} />)}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="valor" className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Valor Unitário</Label>
            <Input id="valor" type="text" inputMode="decimal" value={formatCurrency(valorValue || 0)} onChange={handleCurrencyChange} className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] font-mono font-semibold" />
          </div>
          <div className="col-span-1 grid gap-2">
            <Label htmlFor="quantidade" className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Qtd</Label>
            <Input id="quantidade" type="number" inputMode="numeric" min="1" max="10" {...register('quantidade')} className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] text-center font-mono font-semibold" />
          </div>
          <div className="col-span-1 grid gap-2">
            <Label className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center">Doc</Label>
            <label htmlFor="receipt" className={cn("flex items-center justify-center h-10 rounded-xl border border-dashed transition-all active:scale-95 bg-white/[0.02]", uploading ? "opacity-50 cursor-not-allowed border-foreground" : "border-white/[0.1] hover:border-white/[0.3] cursor-pointer")}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <FileImage className="h-4 w-4 text-muted-foreground" />}
              <input id="receipt" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
        
        {receiptUrls && receiptUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-in fade-in slide-in-from-top-2">
            {receiptUrls.map((url, idx) => (
              <div key={idx} className="relative group/img h-12 w-12">
                <img src={url} className="h-full w-full object-cover rounded-lg border border-white/10" alt="p" />
                <button type="button" onClick={() => { const urls = receiptUrls?.filter((_, i) => i !== idx); setValue('receipt_urls', urls?.length ? urls : null, { shouldDirty: true }) }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-sm"><X className="h-3 w-3 stroke-[3]" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Data do Gasto</Label>
            <Popover>
              <PopoverTrigger className="flex h-10 w-full items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 text-sm font-medium transition-all hover:bg-white/[0.04] text-left cursor-pointer">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {dateValue ? format(new Date(dateValue + 'T12:00:00'), "dd MMM, yy", { locale: ptBR }) : 'Data'}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-white/[0.08] bg-background/95 backdrop-blur-2xl" align="start">
                <Calendar mode="single" selected={dateValue ? new Date(dateValue + 'T12:00:00') : undefined} onSelect={(date) => date && setValue('date', format(date, 'yyyy-MM-dd'), { shouldDirty: true, shouldValidate: true })} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pago-status" className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reembolsado?</Label>
            <div className="flex items-center justify-between h-10 px-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
               <span className="text-[10px] font-medium uppercase text-muted-foreground">{watch('pago') ? 'SIM' : 'NÃO'}</span>
               <Switch id="pago-status" checked={watch('pago')} onCheckedChange={(checked) => setValue('pago', checked, { shouldDirty: true })} className="data-[state=checked]:bg-foreground" />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="motivo" className="ml-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Motivo / Descrição</Label>
          <Input id="motivo" {...register('motivo')} placeholder="Ex: Visita ao cliente, Reunião técnica..." className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] focus-visible:bg-white/[0.04]" />
        </div>
      </div>

      <div className="p-8 pt-4 border-t border-white/[0.06] bg-background/50 backdrop-blur-xl">
        <button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {(createExpense.isPending || updateExpense.isPending) ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>Salvando...</span></>
          ) : (
            <span>{isEditing ? 'Salvar Alterações' : 'Registrar Despesa'}</span>
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
        <DrawerContent className="max-h-[96vh] bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          <DrawerHeader className="px-8 pt-2 pb-4">
            <DrawerTitle className="text-xl font-semibold tracking-tight text-center">
              {isEditing ? 'Editar Registro' : 'Nova Despesa'}
            </DrawerTitle>
          </DrawerHeader>
          {FormContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{commonTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-2xl shadow-sm">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-8 pb-4">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
                  <CreditCard className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    {isEditing ? 'Editar Registro' : 'Nova Despesa'}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
          </div>
          {FormContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}
