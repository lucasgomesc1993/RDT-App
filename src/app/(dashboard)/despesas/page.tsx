'use client'

import { useExpenses, useTogglePayment, useDeleteExpense, useUpdateExpense } from '@/hooks/use-expenses'
import { ExpenseForm } from '@/components/expense-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useState, useMemo, useEffect } from 'react'
import { 
  ImageIcon, ChevronLeft, ChevronRight, X, Edit2, Trash2, Search, 
  FilterX, Loader2, FileX, CheckSquare, 
  CheckCircle2, Clock, Tag, Download, FileSpreadsheet,
  TrendingUp, SlidersHorizontal, MousePointer2,
  Check
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/hooks/use-mobile'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function DespesasPage() {
  const { data: expenses, isLoading } = useExpenses()
  const togglePayment = useTogglePayment()
  const deleteExpense = useDeleteExpense()
  const updateExpense = useUpdateExpense()
  const isMobile = useIsMobile()
  
  const [selectedReceipts, setSelectedReceipts] = useState<string[] | null>(null)
  const [activeGalleryExpense, setActiveGalleryExpense] = useState<any | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all')
  const [transportFilter, setTransportFilter] = useState('all')
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'with' | 'without'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  const transportOptions = useMemo(() => {
    if (!expenses) return []
    const options = new Set(expenses.map(e => e.transporte))
    return Array.from(options).sort()
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    return expenses.filter(expense => {
      const matchesSearch = expense.local.toLowerCase().includes(search.toLowerCase()) || expense.motivo.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'pago' ? expense.pago : !expense.pago)
      const matchesTransport = transportFilter === 'all' || expense.transporte === transportFilter
      const hasReceipts = expense.receipt_urls && expense.receipt_urls.length > 0
      const matchesReceipt = receiptFilter === 'all' || (receiptFilter === 'with' ? hasReceipts : !hasReceipts)
      let matchesDate = true
      if (dateRange === 'month') {
        const expenseDate = parseISO(expense.date)
        const now = new Date()
        matchesDate = isWithinInterval(expenseDate, { start: startOfMonth(now), end: endOfMonth(now) })
      }
      return matchesSearch && matchesStatus && matchesTransport && matchesReceipt && matchesDate
    })
  }, [expenses, search, statusFilter, transportFilter, receiptFilter, dateRange])

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((acc, e) => acc + (e.valor * e.quantidade), 0)
    const paid = filteredExpenses.filter(e => e.pago).reduce((acc, e) => acc + (e.valor * e.quantidade), 0)
    const pending = total - paid
    return { total, paid, pending, count: filteredExpenses.length }
  }, [filteredExpenses])

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredExpenses, currentPage])

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [search, statusFilter, transportFilter, receiptFilter, dateRange])

  const handleSelectAll = (checked: boolean) => {
    if (checked) { setSelectedIds(filteredExpenses.map(e => e.id)) } else { setSelectedIds([]) }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) { setSelectedIds(prev => [...prev, id]) } else { setSelectedIds(prev => prev.filter(i => i !== id)) }
  }

  const toggleSelectionMode = () => {
    if (selectionMode) { setSelectedIds([]) }
    setSelectionMode(!selectionMode)
  }

  const handleBatchMarkAsPaid = async () => {
    if (selectedIds.length === 0) return
    const toUpdate = filteredExpenses.filter(e => selectedIds.includes(e.id) && !e.pago)
    try {
      await Promise.all(toUpdate.map(e => updateExpense.mutateAsync({ id: e.id, pago: true })))
      setSelectedIds([])
      setSelectionMode(false)
    } catch (error) { console.error('Batch update failed:', error) }
  }

  const handleBatchDownload = async () => {
    const selectedExpenses = filteredExpenses.filter(e => selectedIds.includes(e.id) && e.receipt_urls && e.receipt_urls.length > 0)
    
    if (selectedExpenses.length === 0) {
      alert('Nenhum comprovante encontrado nos itens selecionados.')
      return
    }

    for (const expense of selectedExpenses) {
      if (!expense.receipt_urls) continue

      for (let i = 0; i < expense.receipt_urls.length; i++) {
        const url = expense.receipt_urls[i]
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          
          // Gerar nome inteligente: DATA-LOCAL-VALOR-INDEX.ext
          const dateStr = format(parseISO(expense.date), 'yyyy-MM-dd')
          const safeLocal = expense.local.replace(/[^a-z0-9]/gi, '_').substring(0, 20)
          const valorStr = (expense.valor * expense.quantidade).toFixed(2).replace('.', ',')
          const extension = url.split('.').pop()?.split('?')[0] || 'jpg'
          const fileName = `${dateStr}_${safeLocal}_R$${valorStr}${expense.receipt_urls.length > 1 ? `_part${i+1}` : ''}.${extension}`

          const link = document.createElement('a')
          link.href = blobUrl
          link.setAttribute('download', fileName)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(blobUrl)
          
          // Pequeno delay para não sobrecarregar o browser
          await new Promise(resolve => setTimeout(resolve, 400))
        } catch (error) {
          console.error('Falha ao baixar:', url, error)
        }
      }
    }
  }

  const handleExportExcel = async () => {
    if (selectedIds.length === 0) return
    const chunkSize = 10
    const chunks = []
    for (let i = 0; i < selectedIds.length; i += chunkSize) { chunks.push(selectedIds.slice(i, i + chunkSize)) }
    try {
      for (let i = 0; i < chunks.length; i++) {
        const response = await fetch('/api/export-excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expenseIds: chunks[i] }) })
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro na exportação') }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Relatorio_RDT_Parte_${i + 1}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        if (chunks.length > 1) { await new Promise(resolve => setTimeout(resolve, 800)) }
      }
      setSelectedIds([])
      setSelectionMode(false)
    } catch (error: any) { alert(error.message || 'Erro ao exportar Excel.') }
  }

  if (isLoading) return (<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" /></div>)

  const handleOpenGallery = (expense: any) => { 
    setActiveGalleryExpense(expense)
    setSelectedReceipts(expense.receipt_urls)
    setCurrentIndex(0) 
  }
  const handleCloseGallery = () => { setSelectedReceipts(null); setActiveGalleryExpense(null) }
  const nextImage = () => { if (selectedReceipts && currentIndex < selectedReceipts.length - 1) { setCurrentIndex(prev => prev + 1) } }
  const prevImage = () => { if (currentIndex > 0) { setCurrentIndex(prev => prev - 1) } }

  const handleIndividualDownload = async () => {
    if (!selectedReceipts || !activeGalleryExpense) return
    const url = selectedReceipts[currentIndex]
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const dateStr = format(parseISO(activeGalleryExpense.date), 'yyyy-MM-dd')
      const safeLocal = activeGalleryExpense.local.replace(/[^a-z0-9]/gi, '_').substring(0, 20)
      const valorStr = (activeGalleryExpense.valor * activeGalleryExpense.quantidade).toFixed(2).replace('.', ',')
      const extension = url.split('.').pop()?.split('?')[0] || 'jpg'
      const fileName = `${dateStr}_${safeLocal}_R$${valorStr}${selectedReceipts.length > 1 ? `_part${currentIndex+1}` : ''}.${extension}`

      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Falha ao baixar imagem:', error)
    }
  }
  const confirmDelete = async () => { if (expenseToDelete) { await deleteExpense.mutateAsync(expenseToDelete); setExpenseToDelete(null); setSelectedIds(prev => prev.filter(id => id !== expenseToDelete)) } }
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setTransportFilter('all'); setReceiptFilter('all'); setDateRange('all'); setSelectedIds([]) }

  const GalleryContent = (
    <div className="relative flex flex-col h-full min-h-[500px] bg-[#050505] overflow-hidden group/gallery">
      {/* Imagem Principal com Efeito de Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-primary/20 blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/[0.03] bg-black/20 backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
            <span className="text-sm font-semibold text-white tracking-tight uppercase">{activeGalleryExpense?.local || 'Documento'}</span>
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] block pl-5">
            Vista {currentIndex + 1} de {selectedReceipts?.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleIndividualDownload} 
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-primary/20 hover:text-primary transition-all duration-300 border border-white/[0.06] text-white/80 group/dl"
            title="Download Original"
          >
            <Download className="h-5 w-5 group-hover/dl:scale-110 transition-transform" />
          </button>
          <button 
            onClick={handleCloseGallery} 
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.1] transition-all duration-300 border border-white/[0.06] text-white/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 md:p-12 overflow-hidden">
        {selectedReceipts && (
          <div className="relative group/img-container max-w-full max-h-full">
            <img 
              src={selectedReceipts[currentIndex]} 
              alt="Comprovante" 
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/[0.08] animate-in fade-in zoom-in-95 duration-500" 
            />
            {/* Overlay de Zoom sutil */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>
        )}

        {/* Controles de Navegação Flutuantes */}
        {selectedReceipts && selectedReceipts.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center pointer-events-none opacity-0 group-gallery:opacity-100 transition-opacity duration-500">
              <button 
                onClick={prevImage} 
                disabled={currentIndex === 0} 
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/5 disabled:opacity-0 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 -translate-x-4 group-hover/gallery:translate-x-0"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center pointer-events-none opacity-0 group-gallery:opacity-100 transition-opacity duration-500">
              <button 
                onClick={nextImage} 
                disabled={currentIndex === selectedReceipts.length - 1} 
                className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/5 disabled:opacity-0 flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 translate-x-4 group-hover/gallery:translate-x-0"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer com Miniaturas/Bullets */}
      {selectedReceipts && selectedReceipts.length > 1 && (
        <div className="p-6 bg-black/20 backdrop-blur-md border-t border-white/[0.03] flex justify-center gap-2">
          {selectedReceipts.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                currentIndex === i ? "w-8 bg-primary shadow-[0_0_10px_var(--primary)]" : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )

  const FiltersContent = (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Status de Pagamento</label>
        <div className="flex flex-wrap gap-2">
          {['all', 'pago', 'pendente'].map((f) => (
            <button 
              key={f} 
              onClick={() => setStatusFilter(f as any)} 
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all border uppercase tracking-wider", 
                statusFilter === f ? "bg-foreground text-background border-foreground" : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:text-foreground"
              )}
            >
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
        <Select value={transportFilter} onValueChange={(v) => v && setTransportFilter(v)}>
          <SelectTrigger className="h-10 rounded-xl bg-white/[0.02] border-white/[0.06] w-full">
            <SelectValue placeholder="Todas as Categorias" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/[0.08] bg-background/95 backdrop-blur-xl">
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {transportOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Comprovantes</label>
        <div className="grid grid-cols-3 gap-2">
          {[{ id: 'all', label: 'Todos' }, { id: 'with', label: 'Com' }, { id: 'without', label: 'Sem' }].map((r) => (
            <button 
              key={r.id} 
              onClick={() => setReceiptFilter(r.id as any)} 
              className={cn(
                "px-2 py-2 rounded-lg text-[10px] font-medium transition-all border uppercase tracking-wider", 
                receiptFilter === r.id ? "bg-foreground text-background border-foreground" : "bg-white/[0.02] border-white/[0.06] text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Período Temporal</label>
        <div className="flex gap-2">
          <button 
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-medium uppercase tracking-wider border transition-all", 
              dateRange === 'all' ? "bg-foreground text-background border-foreground" : "bg-white/[0.02] border-white/[0.06] text-muted-foreground"
            )} 
            onClick={() => setDateRange('all')}
          >
            Histórico Total
          </button>
          <button 
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-medium uppercase tracking-wider border transition-all", 
              dateRange === 'month' ? "bg-foreground text-background border-foreground" : "bg-white/[0.02] border-white/[0.06] text-muted-foreground"
            )} 
            onClick={() => setDateRange('month')}
          >
            Mês Atual
          </button>
        </div>
      </div>
      <Button variant="ghost" className="w-full h-10 rounded-xl text-destructive font-medium text-[10px] uppercase tracking-wider hover:bg-destructive/5" onClick={clearFilters}>
        <FilterX className="h-3.5 w-3.5 mr-2" /> Redefinir Filtros
      </Button>
    </div>
  )

  const activeFiltersCount = [
    statusFilter !== 'all',
    transportFilter !== 'all',
    receiptFilter !== 'all',
    dateRange !== 'all',
  ].filter(Boolean).length

  const hasActiveFilters = activeFiltersCount > 0 || search !== ''

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 pt-4 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground text-[10px] font-medium uppercase tracking-wider border border-white/[0.08]">Gestão</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground flex items-center gap-4">
            Despesas
            <span className="text-muted-foreground text-lg font-normal font-mono opacity-40">/ {stats.count}</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className={cn("h-10 rounded-xl font-medium hidden md:flex border-border/50", selectionMode && "bg-white/[0.06] border-foreground text-foreground")} onClick={toggleSelectionMode}>
            <MousePointer2 className="h-4 w-4 mr-2" /> {selectionMode ? 'Cancelar' : 'Selecionar'}
          </Button>
          <ExpenseForm onSuccess={() => setSelectedIds([])} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 px-4 md:px-0">
        {[
          { label: 'Total Filtrado', value: stats.total, icon: TrendingUp },
          { label: 'Reembolsado', value: stats.paid, icon: CheckCircle2 },
          { label: 'Pendente', value: stats.pending, icon: Clock },
        ].map((item, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.label}</span>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-primary transition-colors group-hover:bg-primary/10 group-hover:border-primary/20">
                <item.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight font-mono text-foreground">
              R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky top-4 z-40 mx-4 md:mx-0">
        <div className="bg-background/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2">
          <div className="relative w-full md:flex-1 group">
            <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-11 rounded-xl bg-transparent border-none focus-visible:bg-white/[0.02] transition-all" />
          </div>
          
          <div className="h-6 w-px bg-border/30 hidden md:block" />

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0 px-2 md:px-0">
            {['all', 'pago', 'pendente'].map((f) => (
              <button 
                key={f} 
                onClick={() => setStatusFilter(f as any)} 
                className={cn(
                  "px-3 h-8 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all whitespace-nowrap", 
                  statusFilter === f 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                {f === 'all' ? 'Tudo' : f}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border/30 hidden md:block" />

          <div className="flex w-full md:w-auto items-center gap-2 shrink-0">
            {isMobile ? (
              selectionMode ? (
                <Button 
                  variant="outline" 
                  className="h-10 flex-1 rounded-xl border-white/[0.08] bg-white/[0.04] text-[10px] uppercase font-bold tracking-widest"
                  onClick={() => handleSelectAll(selectedIds.length !== filteredExpenses.length)}
                >
                  {selectedIds.length === filteredExpenses.length ? (
                    <><X className="h-4 w-4 mr-2" /> Desmarcar</>
                  ) : (
                    <><CheckSquare className="h-4 w-4 mr-2" /> Tudo</>
                  )}
                </Button>
              ) : (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="h-10 flex-1 rounded-xl border-white/[0.08] bg-white/[0.02] relative text-[10px] uppercase font-bold tracking-widest">
                      <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
                      {activeFiltersCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background text-[8px] font-black">{activeFiltersCount}</span>}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl px-6 pb-8">
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 my-4" />
                    <DrawerHeader className="px-0 py-4"><DrawerTitle className="text-xl font-semibold text-left">Filtros Avançados</DrawerTitle></DrawerHeader>
                    {FiltersContent}
                  </DrawerContent>
                </Drawer>
              )
            ) : (
              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 outline-none select-none h-10 rounded-xl px-4 border border-border/50 bg-white/[0.02] hover:bg-white/[0.04] text-foreground relative">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-2 opacity-60" /> Filtros
                  {activeFiltersCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-foreground text-background text-[8px] font-black">{activeFiltersCount}</span>}
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 rounded-2xl bg-background/95 backdrop-blur-2xl border-white/[0.06] shadow-sm" align="end">{FiltersContent}</PopoverContent>
              </Popover>
            )}
            
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.04]" title="Limpar tudo">
                <FilterX className="h-4 w-4" />
              </Button>
            )}

            <Button variant="outline" className={cn("h-10 w-10 md:hidden rounded-xl border-border/50", selectionMode && "bg-white/[0.06] text-foreground border-foreground")} onClick={toggleSelectionMode}>
              {selectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-foreground text-background p-2 rounded-2xl flex items-center justify-between shadow-2xl border border-white/10">
            <div className="flex items-center gap-3 pl-4">
              <div className="h-7 w-7 rounded-lg bg-background text-foreground flex items-center justify-center font-bold text-xs font-mono">{selectedIds.length}</div>
              <span className="text-[10px] font-semibold uppercase tracking-widest hidden sm:inline opacity-70">selecionados</span>
            </div>
            <div className="flex gap-1.5">
              <Button size="xs" variant="ghost" className="h-9 px-3 text-background hover:bg-background/10 text-[10px] font-semibold uppercase tracking-wider" onClick={handleBatchDownload} title="Baixar Docs"><Download className="h-3.5 w-3.5 mr-2" /> Docs</Button>
              <Button size="xs" variant="ghost" className="h-9 px-3 text-background hover:bg-background/10 text-[10px] font-semibold uppercase tracking-wider" onClick={handleExportExcel} title="Exportar Excel"><FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> Excel</Button>
              <Button size="xs" variant="default" className="h-9 px-4 bg-primary text-primary-foreground hover:opacity-90 text-[10px] font-bold uppercase tracking-widest rounded-xl" onClick={handleBatchMarkAsPaid}>Pagar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:hidden px-4">
        {filteredExpenses.length === 0 && <div className="py-24 text-center opacity-40"><FileX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="font-medium text-[10px] tracking-widest uppercase text-muted-foreground">Dataset Vazio</p></div>}
        {paginatedExpenses.map((expense) => { 
          const isSelected = selectedIds.includes(expense.id); 
          return (
            <div key={expense.id} onClick={() => selectionMode && handleSelectRow(expense.id, !isSelected)} className={cn("relative rounded-2xl bg-white/[0.02] border border-border/50 p-5 space-y-4 transition-all duration-300", isSelected ? "ring-2 ring-foreground bg-white/[0.04] border-transparent" : "hover:bg-white/[0.04]", selectionMode && "active:scale-[0.98]")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", expense.pago ? "bg-white/[0.04] text-foreground" : "bg-transparent text-muted-foreground border border-white/[0.04]")}>{expense.pago ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}</div>
                  <div className="space-y-0.5"><p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground opacity-50">{format(parseISO(expense.date), 'dd MMM, yyyy', { locale: ptBR })}</p><h3 className="font-semibold text-base text-foreground leading-none">{expense.local}</h3></div>
                </div>
                {selectionMode ? <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-all", isSelected ? "bg-foreground border-foreground" : "border-white/20")}>{isSelected && <Check className="h-3 w-3 text-background" />}</div> : <div className="flex gap-1"><ExpenseForm expense={expense} trigger={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg"><Edit2 className="h-4 w-4 text-muted-foreground/60 hover:text-foreground" /></Button>} /><Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/60 hover:text-destructive" onClick={() => setExpenseToDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button></div>}
              </div>
              <div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/[0.04] text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{expense.transporte}</span>{expense.receipt_urls && expense.receipt_urls.length > 0 && <button onClick={(e) => { e.stopPropagation(); handleOpenGallery(expense) }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-foreground tracking-wider"><ImageIcon className="h-3 w-3" /> DOCS</button>}</div>
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] flex items-center justify-between"><div><p className="text-[10px] font-medium uppercase text-muted-foreground/40 mb-1 tracking-widest">Valor Final</p><p className="text-xl font-semibold font-mono">R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div><button onClick={(e) => { e.stopPropagation(); togglePayment.mutate({ id: expense.id, pago: expense.pago }) }} className={cn("h-9 px-3 rounded-lg text-[10px] font-medium uppercase tracking-widest transition-all border", expense.pago ? "bg-white/[0.04] text-foreground border-white/[0.06]" : "bg-transparent text-muted-foreground border-white/[0.04]")}>{expense.pago ? 'Pago' : 'Pendente'}</button></div>
            </div>
          ) 
        })}
      </div>

      <div className="hidden md:block px-4 lg:px-0">
        <div className="rounded-2xl border border-border/50 bg-white/[0.01] overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-border/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[60px] pl-6"><Checkbox className="rounded-md" checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0} onCheckedChange={handleSelectAll} /></TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] py-6">Data</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em]">Estabelecimento</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] text-center">Quant.</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] text-right">Total</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] text-center">Doc</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] text-center">Status</TableHead>
                <TableHead className="font-medium text-muted-foreground text-[10px] uppercase tracking-[0.2em] text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 && <TableRow><TableCell colSpan={8} className="py-24 text-center opacity-40"><FileX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><p className="font-medium text-xs text-muted-foreground uppercase tracking-widest">Nenhum registro encontrado</p></TableCell></TableRow>}
              {paginatedExpenses.map((expense) => { 
                const isSelected = selectedIds.includes(expense.id); 
                return (
                  <TableRow key={expense.id} className={cn("border-b border-white/[0.04] hover:bg-white/[0.02] transition-all duration-300", isSelected && "bg-white/[0.04]")}>
                    <TableCell className="pl-6"><Checkbox className="rounded-md" checked={isSelected} onCheckedChange={(checked) => handleSelectRow(expense.id, !!checked)} /></TableCell>
                    <TableCell className="font-medium text-muted-foreground text-sm py-5">{format(parseISO(expense.date), 'dd MMM, yyyy', { locale: ptBR })}</TableCell>
                    <TableCell><div className="flex flex-col"><span className="font-semibold text-foreground text-base">{expense.local}</span><span className="text-[10px] font-medium uppercase text-muted-foreground/60 flex items-center gap-1.5 mt-0.5 tracking-wider"><Tag className="h-3 w-3" /> {expense.transporte}</span></div></TableCell>
                    <TableCell className="text-center"><span className="px-2.5 py-1 rounded-md bg-white/[0.04] text-[10px] font-medium font-mono">{expense.quantidade}</span></TableCell>
                    <TableCell className="text-right"><span className="text-base font-semibold font-mono text-foreground">R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></TableCell>
                    <TableCell className="text-center">{expense.receipt_urls && expense.receipt_urls.length > 0 ? (<button onClick={() => handleOpenGallery(expense)} className="relative h-10 w-10 rounded-lg border border-white/[0.08] overflow-hidden hover:opacity-80 transition-all inline-block shadow-sm"><img src={expense.receipt_urls[0]} alt="Doc" className="h-full w-full object-cover" />{expense.receipt_urls.length > 1 && (<div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold text-foreground">+{expense.receipt_urls.length - 1}</div>)}</button>) : <div className="h-10 w-10 rounded-lg border border-transparent bg-white/[0.02] flex items-center justify-center text-muted-foreground/30 mx-auto"><FileX className="h-4 w-4" /></div>}</TableCell>
                    <TableCell className="text-center"><button onClick={() => togglePayment.mutate({ id: expense.id, pago: expense.pago })} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium uppercase tracking-widest transition-all", expense.pago ? 'bg-white/[0.04] text-foreground border border-white/[0.06]' : 'bg-transparent text-muted-foreground border border-white/[0.04] hover:bg-white/[0.02]')}>{expense.pago ? 'Confirmado' : 'Pendente'}</button></TableCell>
                    <TableCell className="text-right pr-6"><div className="flex items-center justify-end gap-1"><ExpenseForm expense={expense} trigger={<Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground/60 hover:text-foreground"><Edit2 className="h-4 w-4" /></Button>} /><Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 text-muted-foreground/60 hover:text-destructive" onClick={() => setExpenseToDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ) 
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-10 px-4 rounded-xl border-border/50 text-xs uppercase tracking-widest font-medium">Anterior</Button>
          <div className="h-10 flex items-center px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Página {currentPage} / {totalPages}</div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="h-10 px-4 rounded-xl border-border/50 text-xs uppercase tracking-widest font-medium">Próxima</Button>
        </div>
      )}

      {isMobile ? (
        <>
          <Drawer open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}>
            <DrawerContent className="max-h-[96vh] bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 my-4" />
              {GalleryContent}
            </DrawerContent>
          </Drawer>
          <Drawer open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
            <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-t-3xl p-6 pb-12">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 mb-8" />
              <DrawerHeader className="p-0 text-left">
                <DrawerTitle className="text-2xl font-semibold tracking-tight">Remover Registro?</DrawerTitle>
                <p className="mt-2 text-muted-foreground text-sm font-medium opacity-60">Esta ação excluirá permanentemente o item selecionado.</p>
              </DrawerHeader>
              <DrawerFooter className="p-0 mt-8 gap-3 flex-col sm:flex-row">
                <Button onClick={() => setExpenseToDelete(null)} variant="outline" className="w-full sm:flex-1 h-12 rounded-xl border-border/50 uppercase tracking-widest text-[10px] font-semibold">Manter</Button>
                <Button onClick={confirmDelete} variant="destructive" className="w-full sm:flex-1 h-12 rounded-xl uppercase tracking-widest text-[10px] font-semibold">Excluir Agora</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <>
          <Dialog open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-white/[0.06] rounded-2xl shadow-sm" showCloseButton={false}>
              {GalleryContent}
            </DialogContent>
          </Dialog>
          <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
            <AlertDialogContent className="rounded-2xl border-white/[0.06] bg-background/95 backdrop-blur-3xl p-8 max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold tracking-tight">Confirmar Exclusão?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm mt-2 opacity-60">Deseja realmente remover este registro? Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 gap-2">
                <AlertDialogCancel className="rounded-xl h-10 px-6 border-white/[0.06] hover:bg-white/[0.04] m-0 text-[10px] uppercase tracking-widest font-semibold">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="rounded-xl h-10 px-6 bg-destructive text-destructive-foreground m-0 text-[10px] uppercase tracking-widest font-semibold">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
