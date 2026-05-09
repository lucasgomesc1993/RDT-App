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
      
      // Opções de compressão: Máximo 1MB, largura máxima 1280px
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1280,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(imageFile, options)
      
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, compressedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      const currentUrls = receiptUrls || []
      setValue('receipt_urls', [...currentUrls, publicUrl], { shouldDirty: true })
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const numberValue = Number(rawValue) / 100
    setValue('valor', numberValue, { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      if (isEditing) {
        await updateExpense.mutateAsync({ id: expense!.id, ...data })
      } else {
        await createExpense.mutateAsync(data)
      }
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const FormContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-6 custom-scrollbar">
        {/* Seção: Onde */}
        <div className="space-y-4 pt-1">
          <div className="grid gap-2">
            <Label htmlFor="local" className="ml-1 text-xs font-bold text-muted-foreground uppercase">Local / Estabelecimento</Label>
            <Input 
              id="local" 
              {...register('local')} 
              placeholder="Ex: Shopping Centro, Estacionamento X..." 
              className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 transition-all px-4"
            />
            {errors.local && <span className="text-[10px] font-bold text-red-500 ml-1">{errors.local.message}</span>}
          </div>

          <div className="grid gap-3">
            <Label className="ml-1 text-xs font-bold text-muted-foreground uppercase">Categoria</Label>
            <div className="grid grid-cols-2 gap-3">
              {transportOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = !showCustomTransport && transporteValue === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 h-14 px-4 rounded-2xl border text-sm font-bold transition-all relative overflow-hidden group",
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" 
                        : "bg-white/[0.03] border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      setShowCustomTransport(false)
                      setValue('transporte', opt.value, { shouldDirty: true, shouldValidate: true })
                    }}
                  >
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-colors", isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10")}>
                      <Icon className={cn("h-4 w-4", isActive ? "text-white" : opt.color)} />
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center h-14 px-4 rounded-2xl border text-xs font-bold transition-all col-span-2",
                  showCustomTransport 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" 
                    : "bg-white/[0.03] border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground border-dashed"
                )}
                onClick={() => {
                  setShowCustomTransport(true)
                  setValue('transporte', '', { shouldDirty: true })
                }}
              >
                Outro Gasto / Diversos
              </button>
            </div>
            
            {showCustomTransport && (
              <Input 
                className="h-11 rounded-xl bg-white/[0.03] border-primary/20 focus:border-primary/50 animate-in fade-in slide-in-from-top-2"
                placeholder="Especifique o tipo do gasto..."
                {...register('transporte')}
              />
            )}
          </div>
        </div>

        {/* Seção: Valores e Comprovante (Lado a Lado) */}
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="valor" className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Valor Unitário</Label>
            <Input 
              id="valor" 
              type="text"
              value={formatCurrency(valorValue || 0)}
              onChange={handleCurrencyChange}
              className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 pl-4 font-bold"
            />
          </div>
          <div className="col-span-1 grid gap-2">
            <Label htmlFor="quantidade" className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Qtd</Label>
            <Input 
              id="quantidade" 
              type="number" 
              min="1" 
              max="10" 
              {...register('quantidade')} 
              className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 text-center font-bold"
            />
          </div>
          <div className="col-span-1 grid gap-2">
            <Label className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Doc</Label>
            <label
              htmlFor="receipt"
              className={cn(
                "flex items-center justify-center h-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all active:scale-95 bg-white/[0.03]",
                uploading ? "opacity-50 cursor-not-allowed border-primary" : "border-white/10 hover:border-primary/40 hover:bg-primary/[0.02]"
              )}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <FileImage className="h-5 w-5 text-primary" />}
              <input id="receipt" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
        
        {/* Preview de Comprovantes */}
        {receiptUrls && receiptUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-in fade-in slide-in-from-top-2">
            {receiptUrls.map((url, idx) => (
              <div key={idx} className="relative group/img h-14 w-14">
                <img src={url} className="h-full w-full object-cover rounded-xl border border-white/10" alt="p" />
                <button type="button" onClick={() => {
                    const urls = receiptUrls?.filter((_, i) => i !== idx)
                    setValue('receipt_urls', urls?.length ? urls : null, { shouldDirty: true })
                  }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-lg"
                >
                  <X className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Data do Gasto</Label>
            <Popover>
              <PopoverTrigger>
                <div className="flex h-12 w-full items-center rounded-2xl border border-white/5 bg-white/[0.03] px-4 text-sm font-bold transition-all hover:bg-white/[0.06] text-left cursor-pointer">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {dateValue ? format(new Date(dateValue + 'T12:00:00'), "dd MMM, yy", { locale: ptBR }) : 'Data'}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue ? new Date(dateValue + 'T12:00:00') : undefined}
                  onSelect={(date) => date && setValue('date', format(date, 'yyyy-MM-dd'), { shouldDirty: true, shouldValidate: true })}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pago-status" className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reembolsado?</Label>
            <div className="flex items-center justify-between h-12 px-4 rounded-2xl bg-white/[0.03] border border-white/5">
               <span className="text-[10px] font-black uppercase text-muted-foreground/60">{watch('pago') ? 'SIM' : 'NÃO'}</span>
               <Switch 
                id="pago-status" 
                checked={watch('pago')}
                onCheckedChange={(checked) => setValue('pago', checked, { shouldDirty: true })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="motivo" className="ml-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Motivo / Descrição</Label>
          <Input 
            id="motivo" 
            {...register('motivo')} 
            placeholder="Ex: Visita ao cliente Loggi, Reunião técnica..." 
            className="h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50 px-4"
          />
        </div>
      </div>

      {/* Rodapé Fixo com Botão */}
      <div className="p-8 pt-4 border-t border-white/5 bg-background/50 backdrop-blur-xl">
        <button 
          type="submit" 
          disabled={isSubmitting || uploading}
          className="w-full h-14 rounded-[1.5rem] bg-primary text-primary-foreground font-black uppercase italic tracking-widest text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {(createExpense.isPending || updateExpense.isPending) ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>{isEditing ? 'Atualizar Dados' : 'Finalizar Registro'}</>
          )}
        </button>
      </div>
    </form>
  )

  const commonTrigger = trigger || (
    <button className="h-12 px-6 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 w-full md:w-auto justify-center">
      <Plus className="h-5 w-5" />
      Nova Despesa
    </button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>
          {commonTrigger}
        </DrawerTrigger>        <DrawerContent className="max-h-[96vh] bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[2.5rem]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
          <DrawerHeader className="px-8 pt-2">
            <DrawerTitle className="text-2xl font-bold tracking-tight">
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
      <DialogTrigger>
        {commonTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-3xl">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-8 pb-4">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
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
