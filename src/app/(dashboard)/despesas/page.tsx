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
} from '@/components/ui/drawer'
import { useState, useMemo, useEffect } from 'react'
import { 
  ImageIcon, ChevronLeft, ChevronRight, X, Edit2, Trash2, Search, 
  FilterX, Loader2, FileX, CheckSquare, 
  CheckCircle2, Clock, Tag, Download, FileSpreadsheet,
  TrendingUp, ArrowUpRight, SlidersHorizontal, MousePointer2,
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
    const urls = filteredExpenses.filter(e => selectedIds.includes(e.id) && e.receipt_urls && e.receipt_urls.length > 0).flatMap(e => e.receipt_urls || [])
    if (urls.length === 0) { alert('Nenhum comprovante encontrado.'); return }
    for (const url of urls) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', url.split('/').pop() || 'comprovante.jpg')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(blobUrl)
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) { console.error('Falha ao baixar:', url, error) }
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
        const a = document.createElement('a'); a.href = url; a.download = `Relatorio_RDT_Parte_${i + 1}.xlsx`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
        if (chunks.length > 1) { await new Promise(resolve => setTimeout(resolve, 800)) }
      }
      setSelectedIds([]); setSelectionMode(false)
    } catch (error: any) { alert(error.message || 'Erro ao exportar Excel.') }
  }

  if (isLoading) return (<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)

  const handleOpenGallery = (urls: string[]) => { setSelectedReceipts(urls); setCurrentIndex(0) }
  const handleCloseGallery = () => { setSelectedReceipts(null) }
  const nextImage = () => { if (selectedReceipts && currentIndex < selectedReceipts.length - 1) { setCurrentIndex(prev => prev + 1) } }
  const prevImage = () => { if (currentIndex > 0) { setCurrentIndex(prev => prev - 1) } }
  const confirmDelete = async () => { if (expenseToDelete) { await deleteExpense.mutateAsync(expenseToDelete); setExpenseToDelete(null); setSelectedIds(prev => prev.filter(id => id !== expenseToDelete)) } }
  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setTransportFilter('all'); setReceiptFilter('all'); setDateRange('all'); setSelectedIds([]) }

  const GalleryContent = (
    <div className="relative flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between p-8"><div className="space-y-1"><span className="text-xl font-bold block">Comprovante</span><span className="text-xs font-bold text-muted-foreground uppercase">{currentIndex + 1} de {selectedReceipts?.length}</span></div>{!isMobile && (<button onClick={handleCloseGallery} className="p-3 rounded-2xl bg-white/5 border border-white/10"><X className="h-6 w-6" /></button>)}</div>
      <div className="flex-1 flex items-center justify-center p-8 pb-12">{selectedReceipts && <img src={selectedReceipts[currentIndex]} alt="D" className="max-w-full max-h-[60vh] object-contain rounded-3xl shadow-2xl border border-white/5" />}</div>
      {selectedReceipts && selectedReceipts.length > 1 && (<div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none"><button onClick={prevImage} disabled={currentIndex === 0} className="pointer-events-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 disabled:opacity-0 flex items-center justify-center"><ChevronLeft className="h-8 w-8" /></button><button onClick={nextImage} disabled={currentIndex === selectedReceipts.length - 1} className="pointer-events-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 disabled:opacity-0 flex items-center justify-center"><ChevronRight className="h-8 w-8" /></button></div>)}
    </div>
  )

  const FiltersContent = (
    <div className="space-y-6">
      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</label><div className="flex flex-wrap gap-2">{['all', 'pago', 'pendente'].map((f) => (<button key={f} onClick={() => setStatusFilter(f as any)} className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all border uppercase", statusFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-white/10 text-muted-foreground")}>{f === 'all' ? 'Todos' : f}</button>))}</div></div>
      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria</label><Select value={transportFilter} onValueChange={(v) => setTransportFilter(v)}><SelectTrigger className="h-12 rounded-2xl bg-white/[0.03] border-white/5"><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent className="rounded-2xl border-white/10"><SelectItem value="all">Todas as Categorias</SelectItem>{transportOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent></Select></div>
      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Comprovantes</label><div className="grid grid-cols-3 gap-2">{[{ id: 'all', label: 'Todos' }, { id: 'with', label: 'Com' }, { id: 'without', label: 'Sem' }].map((r) => (<button key={r.id} onClick={() => setReceiptFilter(r.id as any)} className={cn("px-2 py-3 rounded-xl text-[10px] font-bold transition-all border uppercase", receiptFilter === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 border-white/10 text-muted-foreground")}>{r.label}</button>))}</div></div>
      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Período</label><div className="flex gap-2"><button className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase border", dateRange === 'all' ? "bg-primary text-primary-foreground" : "bg-white/5 border-white/10")} onClick={() => setDateRange('all')}>Total</button><button className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase border", dateRange === 'month' ? "bg-primary text-primary-foreground" : "bg-white/5 border-white/10")} onClick={() => setDateRange('month')}>Mês</button></div></div>
      <Button variant="ghost" className="w-full h-12 rounded-2xl text-red-400 font-bold" onClick={clearFilters}><FilterX className="h-4 w-4 mr-2" /> Limpar</Button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0"><div className="space-y-2"><div className="flex items-center gap-2 mb-1"><span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">Dashboard</span></div><h1 className="text-5xl font-black tracking-tight flex items-baseline gap-2">Despesas<span className="text-primary text-xl font-bold bg-primary/10 w-8 h-8 rounded-full inline-flex items-center justify-center">{stats.count}</span></h1></div><div className="flex gap-3"><Button variant="outline" className={cn("h-12 rounded-2xl font-bold border-white/10 hidden md:flex", selectionMode && "bg-primary/20 border-primary text-primary")} onClick={toggleSelectionMode}><MousePointer2 className="h-4 w-4 mr-2" /> {selectionMode ? 'Sair' : 'Selecionar'}</Button><ExpenseForm onSuccess={() => setSelectedIds([])} /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-0">
        <div className="relative group p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl transition-all hover:bg-white/[0.04]"><div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="h-24 w-24 text-primary" /></div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Total Filtrado</p><div className="flex items-baseline gap-2"><h2 className="text-3xl font-black">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2><div className="flex items-center text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full"><ArrowUpRight className="h-3 w-3 mr-1" /> 12%</div></div></div>
        <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Reembolsado</p><div className="flex items-baseline gap-2"><h2 className="text-3xl font-black text-emerald-500">R$ {stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2><CheckCircle2 className="h-4 w-4 text-emerald-500/50" /></div></div>
        <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Pendente</p><div className="flex items-baseline gap-2"><h2 className="text-3xl font-black text-red-500">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2><Clock className="h-4 w-4 text-red-500/50" /></div></div>
      </div>
      <div className="sticky top-4 z-40 mx-4 md:mx-0"><div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex flex-col md:flex-row items-center gap-3 shadow-3xl"><div className="relative w-full md:flex-1 group"><Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" /><Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-11 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/50" /></div><div className="flex w-full md:w-auto items-center gap-2 shrink-0">{isMobile ? (<Drawer><DrawerTrigger asChild><Button variant="outline" className="h-11 flex-1 rounded-2xl border-white/10 font-bold bg-white/5"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros</Button></DrawerTrigger><DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[3rem] px-8 pb-10"><div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 my-6" /><DrawerHeader className="px-0 py-4"><DrawerTitle className="text-3xl font-black text-left">Filtros</DrawerTitle></DrawerHeader>{FiltersContent}</DrawerContent></Drawer>) : (<Popover><PopoverTrigger asChild><Button variant="outline" className="h-11 rounded-2xl border-white/10 font-bold bg-white/5"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros</Button></PopoverTrigger><PopoverContent className="w-80 p-6 rounded-[2rem] bg-background/95 backdrop-blur-2xl border-white/10 shadow-3xl" align="end">{FiltersContent}</PopoverContent></Popover>)}<Button variant="outline" className={cn("h-11 w-11 md:hidden rounded-2xl border-white/10", selectionMode && "bg-primary/20 border-primary text-primary")} onClick={toggleSelectionMode}>{selectionMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}</Button></div></div></div>
      {selectedIds.length > 0 && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in slide-in-from-bottom-10"><div className="bg-primary text-primary-foreground p-3 rounded-[2rem] flex items-center justify-between shadow-3xl"><div className="flex items-center gap-3 pl-4"><div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">{selectedIds.length}</div><span className="text-[10px] font-black uppercase hidden sm:inline">selecionados</span></div><div className="flex gap-2"><Button size="sm" variant="ghost" className="h-10 rounded-xl text-white font-bold text-[10px]" onClick={handleBatchDownload}><Download className="h-3.5 w-3.5 mr-2" /> DOCS</Button><Button size="sm" variant="ghost" className="h-10 rounded-xl text-white font-bold text-[10px]" onClick={handleExportExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> EXCEL</Button><Button size="sm" variant="secondary" className="h-10 rounded-xl bg-white text-primary font-black text-[10px]" onClick={handleBatchMarkAsPaid}>PAGO</Button></div></div></div>)}
      <div className="grid gap-6 md:hidden px-4">{filteredExpenses.length === 0 && <div className="py-24 text-center opacity-30"><FileX className="h-16 w-16 mx-auto mb-4" /><p className="font-black uppercase tracking-[0.2em] text-xs">Vazio</p></div>}{paginatedExpenses.map((expense) => { const isSelected = selectedIds.includes(expense.id); return (<div key={expense.id} onClick={() => selectionMode && handleSelectRow(expense.id, !isSelected)} className={cn("relative rounded-[2.5rem] bg-white/[0.03] border border-white/5 p-6 space-y-4 shadow-xl transition-all duration-300", isSelected ? "ring-2 ring-primary bg-primary/[0.05] border-transparent" : "hover:bg-white/[0.05]", selectionMode && "active:scale-[0.97]")}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", expense.pago ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>{expense.pago ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}</div><div className="space-y-0.5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{format(parseISO(expense.date), 'dd MMM, yyyy', { locale: ptBR })}</p><h3 className="font-bold text-lg text-foreground leading-none">{expense.local}</h3></div></div>{selectionMode ? <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-white/20")}>{isSelected && <Check className="h-4 w-4 text-white" />}</div> : <div className="flex gap-1"><ExpenseForm expense={expense} trigger={<Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>} /><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400" onClick={() => setExpenseToDelete(expense.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>}</div><div className="flex items-center gap-2"><span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-muted-foreground uppercase">{expense.transporte}</span>{expense.receipt_urls && expense.receipt_urls.length > 0 && <button onClick={(e) => { e.stopPropagation(); handleOpenGallery(expense.receipt_urls!) }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary"><ImageIcon className="h-3 w-3" /> DOCS</button>}</div><div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase text-muted-foreground/40 mb-1">Valor Final</p><p className="text-2xl font-black">R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div><button onClick={(e) => { e.stopPropagation(); togglePayment.mutate({ id: expense.id, pago: expense.pago }) }} className={cn("h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all", expense.pago ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20")}>{expense.pago ? 'Pago' : 'Pendente'}</button></div></div>) })}</div>
      <div className="hidden md:block px-4 lg:px-0"><div className="rounded-[3rem] border border-white/5 bg-white/[0.01] overflow-hidden shadow-3xl"><Table><TableHeader className="bg-white/[0.03] border-none"><TableRow className="hover:bg-transparent border-none"><TableHead className="w-[60px] pl-8"><Checkbox className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0} onCheckedChange={handleSelectAll} /></TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] py-8">Data</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em]">Estabelecimento</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] text-center">Quant.</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] text-right">Total</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] text-center">Doc</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] text-center">Status</TableHead><TableHead className="font-black text-muted-foreground/60 text-[10px] uppercase tracking-[0.2em] text-right pr-8">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredExpenses.length === 0 && <TableRow><TableCell colSpan={8} className="py-32 text-center opacity-20"><FileX className="h-16 w-16 mx-auto mb-4" /><p className="font-black uppercase tracking-[0.3em]">Dataset Vazio</p></TableCell></TableRow>}{paginatedExpenses.map((expense) => { const isSelected = selectedIds.includes(expense.id); return (<TableRow key={expense.id} className={cn("border-b border-white/[0.02] hover:bg-white/[0.03] transition-all group", isSelected && "bg-primary/[0.06] hover:bg-primary/[0.08]")}><TableCell className="pl-8"><Checkbox className="rounded-lg border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" checked={isSelected} onCheckedChange={(checked) => handleSelectRow(expense.id, !!checked)} /></TableCell><TableCell className="font-bold text-muted-foreground/80 py-6">{format(parseISO(expense.date), 'dd MMM, yyyy', { locale: ptBR })}</TableCell><TableCell><div className="flex flex-col"><span className="font-black text-foreground text-lg">{expense.local}</span><span className="text-[10px] uppercase font-bold text-primary/60 flex items-center gap-1.5"><Tag className="h-3 w-3" /> {expense.transporte}</span></div></TableCell><TableCell className="text-center"><span className="px-3 py-1 rounded-lg bg-white/5 font-bold">{expense.quantidade}</span></TableCell><TableCell className="text-right"><span className="text-xl font-black text-foreground">R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></TableCell><TableCell className="text-center">{expense.receipt_urls && expense.receipt_urls.length > 0 ? (<button onClick={() => handleOpenGallery(expense.receipt_urls!)} className="relative h-14 w-14 rounded-2xl border-2 border-white/10 overflow-hidden hover:scale-110 transition-all inline-block"><img src={expense.receipt_urls[0]} alt="T" className="h-full w-full object-cover" />{expense.receipt_urls.length > 1 && (<div className="absolute inset-0 bg-primary/40 flex items-center justify-center text-[10px] font-black text-white">+{expense.receipt_urls.length - 1}</div>)}</button>) : <div className="h-14 w-14 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-20 mx-auto"><FileX className="h-5 w-5" /></div>}</TableCell><TableCell className="text-center"><button onClick={() => togglePayment.mutate({ id: expense.id, pago: expense.pago })} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", expense.pago ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20')}>{expense.pago ? 'Confirmado' : 'Pendente'}</button></TableCell><TableCell className="text-right pr-8"><div className="flex items-center justify-end gap-2"><ExpenseForm expense={expense} trigger={<Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5"><Edit2 className="h-4 w-4" /></Button>} /><Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-500/10 hover:text-red-500" onClick={() => setExpenseToDelete(expense.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>) })}</TableBody></Table></div></div>
      {totalPages > 1 && (<div className="flex items-center justify-center gap-4 mt-8"><Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-2xl h-12 px-6 border-white/10 font-bold">Anterior</Button><div className="h-12 flex items-center px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase">Página {currentPage} de {totalPages}</div><Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-2xl h-12 px-6 border-white/10 font-bold">Próxima</Button></div>)}
      {isMobile ? (<>
          <Drawer open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}><DrawerContent className="max-h-[96vh] bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[3.5rem]"><div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 my-6" />{GalleryContent}</DrawerContent></Drawer>
          <Drawer open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}><DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[3.5rem] p-10 pb-16"><div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 mb-10" /><DrawerHeader className="p-0 text-left"><DrawerTitle className="text-4xl font-black">Remover?</DrawerTitle><p className="mt-4 leading-relaxed">Este registro será permanentemente excluído.</p></DrawerHeader><DrawerFooter className="p-0 mt-10 gap-4 flex-row"><Button onClick={() => setExpenseToDelete(null)} variant="outline" className="flex-1 rounded-[1.5rem] h-16 font-bold border-white/10">Voltar</Button><Button onClick={confirmDelete} className="flex-1 rounded-[1.5rem] h-16 font-black bg-red-600 text-white uppercase">Sim, Excluir</Button></DrawerFooter></DrawerContent>
        </>) : (<>
          <Dialog open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}><DialogContent className="sm:max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-white/10 rounded-[3rem] shadow-3xl" showCloseButton={false}>{GalleryContent}</DialogContent></Dialog>
          <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}><AlertDialogContent className="rounded-[3rem] border-white/10 bg-background/95 backdrop-blur-3xl p-12 max-w-lg"><AlertDialogHeader><AlertDialogTitle className="text-4xl font-black">Confirmar Exclusão?</AlertDialogTitle><AlertDialogDescription className="mt-4 leading-relaxed">Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-10 gap-4"><AlertDialogCancel className="rounded-[1.5rem] h-14 font-bold px-10 border-white/10">Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="rounded-[1.5rem] h-14 font-black px-10 bg-red-600 text-white uppercase">Confirmar e Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>)}
    </div>
  )
}
