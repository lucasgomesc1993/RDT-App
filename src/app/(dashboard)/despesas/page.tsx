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
import { ImageIcon, ChevronLeft, ChevronRight, X, Edit2, Trash2, Search, FilterX, Loader2, FileX, CalendarIcon, Wallet, Filter, CheckSquare, CheckCircle2, Clock, MapPin, Tag, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/hooks/use-mobile'

export default function DespesasPage() {
  const { data: expenses, isLoading } = useExpenses()
  const togglePayment = useTogglePayment()
  const deleteExpense = useDeleteExpense()
  const updateExpense = useUpdateExpense()
  const isMobile = useIsMobile()
  
  // Estados da Galeria
  const [selectedReceipts, setSelectedReceipts] = useState<string[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Estados de Filtro
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all')
  const [transportFilter, setTransportFilter] = useState('all')
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'with' | 'without'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'month'>('all')

  // Estado de Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Estado de Seleção em Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Estado de Exclusão
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // Opções de transporte únicas
  const transportOptions = useMemo(() => {
    if (!expenses) return []
    const options = new Set(expenses.map(e => e.transporte))
    return Array.from(options).sort()
  }, [expenses])

  // Lógica de Filtro
  const filteredExpenses = useMemo(() => {
    if (!expenses) return []
    const result = expenses.filter(expense => {
      const matchesSearch = 
        expense.local.toLowerCase().includes(search.toLowerCase()) ||
        expense.motivo.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'pago' ? expense.pago : !expense.pago)
      
      const matchesTransport = 
        transportFilter === 'all' || 
        expense.transporte === transportFilter

      const hasReceipts = expense.receipt_urls && expense.receipt_urls.length > 0
      const matchesReceipt = 
        receiptFilter === 'all' || 
        (receiptFilter === 'with' ? hasReceipts : !hasReceipts)

      let matchesDate = true
      if (dateRange === 'month') {
        const expenseDate = parseISO(expense.date)
        const now = new Date()
        matchesDate = isWithinInterval(expenseDate, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        })
      }

      return matchesSearch && matchesStatus && matchesTransport && matchesReceipt && matchesDate
    })
    
    // Reseta para a primeira página quando os filtros mudam
    return result
  }, [expenses, search, statusFilter, transportFilter, receiptFilter, dateRange])

  // Lógica de Paginação
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredExpenses, currentPage])

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, transportFilter, receiptFilter, dateRange])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredExpenses.map(e => e.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleBatchMarkAsPaid = async () => {
    if (selectedIds.length === 0) return
    const toUpdate = filteredExpenses.filter(e => selectedIds.includes(e.id) && !e.pago)
    try {
      await Promise.all(toUpdate.map(e => updateExpense.mutateAsync({ id: e.id, pago: true })))
      setSelectedIds([])
    } catch (error) {
      console.error('Batch update failed:', error)
    }
  }

  const handleBatchDownload = async () => {
    const urls = filteredExpenses
      .filter(e => selectedIds.includes(e.id) && e.receipt_urls && e.receipt_urls.length > 0)
      .flatMap(e => e.receipt_urls || []);

    if (urls.length === 0) {
      alert('Nenhum comprovante encontrado nas despesas selecionadas.');
      return;
    }

    for (const url of urls) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const filename = url.split('/').pop() || 'comprovante.jpg';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
        // Pequeno atraso para não bloquear o navegador
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Falha ao baixar:', url, error);
      }
    }
  }

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  const handleOpenGallery = (urls: string[]) => {
    setSelectedReceipts(urls)
    setCurrentIndex(0)
  }

  const handleCloseGallery = () => {
    setSelectedReceipts(null)
  }

  const nextImage = () => {
    if (selectedReceipts && currentIndex < selectedReceipts.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const confirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense.mutateAsync(expenseToDelete)
      setExpenseToDelete(null)
      setSelectedIds(prev => prev.filter(id => id !== expenseToDelete))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTransportFilter('all')
    setReceiptFilter('all')
    setDateRange('all')
    setSelectedIds([])
  }

  // Conteúdo da Galeria
  const GalleryContent = (
    <div className="relative flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between p-8">
        <div className="space-y-1">
          <span className="text-xl font-bold tracking-tight block text-foreground">Visualizar Comprovante</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{currentIndex + 1} de {selectedReceipts?.length} arquivos</span>
        </div>
        {!isMobile && (
          <button onClick={handleCloseGallery} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-foreground transition-all border border-white/10">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center p-8 pb-12">
        {selectedReceipts && <img src={selectedReceipts[currentIndex]} alt="D" className="max-w-full max-h-[60vh] object-contain rounded-3xl shadow-2xl border border-white/5" />}
      </div>
      {selectedReceipts && selectedReceipts.length > 1 && (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
          <button onClick={prevImage} disabled={currentIndex === 0} className="pointer-events-auto w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl flex items-center justify-center transition-all border border-white/10 disabled:opacity-0"><ChevronLeft className="h-8 w-8" /></button>
          <button onClick={nextImage} disabled={currentIndex === selectedReceipts.length - 1} className="pointer-events-auto w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl flex items-center justify-center transition-all border border-white/10 disabled:opacity-0"><ChevronRight className="h-8 w-8" /></button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <header className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
            Despesas
          </h1>
          <p className="text-muted-foreground font-medium">Gerencie e acompanhe seus registros</p>
        </header>
        <ExpenseForm 
          onSuccess={() => setSelectedIds([])}
        />
      </div>

      {/* Barra de Filtros Moderna */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <Filter className="h-4 w-4 text-primary" /> Filtros Rápidos
          </div>
          {(search || statusFilter !== 'all' || transportFilter !== 'all' || receiptFilter !== 'all' || dateRange !== 'all') && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10">
              <FilterX className="h-3 w-3 mr-1.5" /> Limpar Tudo
            </Button>
          )}
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pesquisar</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Local, motivo..."
                className="pl-10 h-10 rounded-xl bg-white/[0.03] border-white/5 focus:border-primary/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Status</label>
            <Select value={statusFilter} onValueChange={(v: string | null) => v && setStatusFilter(v as any)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/[0.03] border-white/5">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pago">Somente Pagos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Transporte</label>
            <Select value={transportFilter} onValueChange={(v: string | null) => v && setTransportFilter(v)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/[0.03] border-white/5">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {transportOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Comprovantes</label>
            <Select value={receiptFilter} onValueChange={(v: string | null) => v && setReceiptFilter(v as any)}>
              <SelectTrigger className="h-10 rounded-xl bg-white/[0.03] border-white/5">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with">Com Anexo</SelectItem>
                <SelectItem value="without">Sem Anexo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="space-y-2 lg:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Período</label>
            <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/5 h-10">
              <button 
                className={cn("flex-1 text-[10px] font-bold uppercase rounded-lg transition-all", dateRange === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5")}
                onClick={() => setDateRange('all')}
              >Todos</button>
              <button 
                className={cn("flex-1 text-[10px] font-bold uppercase rounded-lg transition-all", dateRange === 'month' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5")}
                onClick={() => setDateRange('month')}
              >Mês Atual</button>
            </div>
          </div>
          <div className="lg:col-span-3 h-10 flex items-end">
             {/* Espaço reservado ou outros filtros futuros */}
          </div>
        </div>
      </div>

      {/* Ações em Lote Flutuante */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-primary text-primary-foreground p-4 rounded-2xl flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4 duration-300 mx-2 md:mx-0">
          <div className="flex items-center gap-3 font-bold px-2">
            <CheckSquare className="h-5 w-5" />
            <span className="text-sm md:text-base">{selectedIds.length} {selectedIds.length === 1 ? 'item' : 'itens'} selecionados</span>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              className="rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 gap-2 h-9 border border-white/10"
              onClick={handleBatchDownload}
            >
              <Download className="h-3.5 w-3.5" />
              BAIXAR DOCS
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              className="rounded-xl font-bold bg-white text-primary hover:bg-white/90 gap-2 h-9"
              onClick={handleBatchMarkAsPaid}
            >
              MARCAR COMO PAGO
            </Button>
          </div>
        </div>
      )}

      {/* Visualização Mobile (Cards) */}
      <div className="grid gap-4 md:hidden">
        {filteredExpenses.length === 0 && (
           <div className="py-24 text-center">
            <div className="flex flex-col items-center gap-2 opacity-20">
              <FileX className="h-12 w-12" />
              <p className="font-bold uppercase tracking-widest text-xs">Dataset_Vazio</p>
            </div>
          </div>
        )}
        {filteredExpenses.map((expense) => (
          <div 
            key={expense.id} 
            className={cn(
              "rounded-[2.5rem] border border-white/5 bg-white/[0.02] overflow-hidden shadow-2xl transition-all active:scale-[0.98]",
              selectedIds.includes(expense.id) && "ring-2 ring-primary/40 bg-primary/[0.04]"
            )}
          >
            <div className="px-6 pt-6 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {format(parseISO(expense.date), 'dd MMM, yyyy', { locale: ptBR })}
              </span>
              <Checkbox 
                className="rounded-lg border-white/20 h-6 w-6 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                checked={selectedIds.includes(expense.id)}
                onCheckedChange={(checked) => handleSelectRow(expense.id, !!checked)}
              />
            </div>

            <div className="px-6 py-4 space-y-1">
              <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                {expense.local}
              </h3>
              {expense.motivo && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic">
                  "{expense.motivo}"
                </p>
              )}
            </div>

            <div className="px-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-white/5 text-primary border border-primary/20 uppercase tracking-tighter">
                <Tag className="h-3 w-3 mr-1" />
                {expense.transporte}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-white/5 text-muted-foreground border border-white/5 uppercase tracking-tighter">
                Qtd: {expense.quantidade}
              </span>
            </div>

            <div className="m-4 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-widest ml-0.5">Total</p>
                <p className="text-2xl font-black text-foreground">
                  R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => togglePayment.mutate({ id: expense.id, pago: expense.pago })}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                  expense.pago 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-red-500/5'
                )}
              >
                {expense.pago ? 'PAGO' : 'PENDENTE'}
              </button>
            </div>

            <div className="px-6 pb-6 flex items-center justify-between">
              <div className="flex gap-2">
                {expense.receipt_urls && expense.receipt_urls.length > 0 ? (
                  <button 
                    onClick={() => handleOpenGallery(expense.receipt_urls!)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] transition-all"
                  >
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{expense.receipt_urls.length} DOCS</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 h-10 px-4 opacity-20">
                    <FileX className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sem anexo</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <ExpenseForm 
                  expense={expense} 
                  trigger={
                    <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-foreground active:bg-white/10 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  } 
                />
                <button 
                  onClick={() => setExpenseToDelete(expense.id)}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-destructive active:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visualização Desktop (Tabela) */}
      <div className="hidden md:block rounded-[2rem] border border-white/5 bg-white/[0.02] overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.03]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[60px] px-6">
                <Checkbox 
                  className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  checked={selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest py-6">Data</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest">Local</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-center">Unit</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-right">Total</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-center">Doc</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="font-bold text-muted-foreground text-xs uppercase tracking-widest text-right px-6">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <FileX className="h-12 w-12" />
                    <p className="font-bold uppercase tracking-widest">Dataset_Vazio</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id} className={cn(
                "border-b border-white/[0.03] hover:bg-white/[0.04] transition-all group",
                selectedIds.includes(expense.id) && "bg-primary/[0.08] hover:bg-primary/[0.1]"
              )}>
                <TableCell className="px-6">
                  <Checkbox 
                    className="rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    checked={selectedIds.includes(expense.id)}
                    onCheckedChange={(checked) => handleSelectRow(expense.id, !!checked)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium text-muted-foreground/80">
                  {format(parseISO(expense.date), 'dd MMM', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{expense.local}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60">{expense.transporte}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">{expense.quantidade}</TableCell>
                <TableCell className="text-right font-black text-foreground">
                  R$ {(expense.valor * expense.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center">
                  {expense.receipt_urls && expense.receipt_urls.length > 0 ? (
                    <button 
                      onClick={() => handleOpenGallery(expense.receipt_urls!)}
                      className="relative h-11 w-11 rounded-xl border border-white/10 overflow-hidden hover:scale-110 active:scale-95 transition-all shadow-xl inline-block"
                    >
                      <img src={expense.receipt_urls[0]} alt="T" className="h-full w-full object-cover" />
                      {expense.receipt_urls.length > 1 && (
                        <div className="absolute inset-0 bg-primary/40 flex items-center justify-center text-[10px] font-black text-white backdrop-blur-[2px]">
                          +{expense.receipt_urls.length - 1}
                        </div>
                      )}
                    </button>
                  ) : <div className="h-11 w-11 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-20 mx-auto"><FileX className="h-4 w-4" /></div>}
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => togglePayment.mutate({ id: expense.id, pago: expense.pago })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      expense.pago 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
                    )}
                  >
                    {expense.pago ? 'Pago' : 'Pendente'}
                  </button>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex items-center justify-end gap-1 transition-all">
                    <ExpenseForm 
                      expense={expense} 
                      trigger={
                        <button className="p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      } 
                    />
                    <button 
                      onClick={() => setExpenseToDelete(expense.id)}
                      className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Galeria e Alerta Modernos (Drawer no Mobile, Dialog no Desktop) */}
      {isMobile ? (
        <>
          <Drawer open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}>
            <DrawerContent className="max-h-[96vh] bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[2.5rem]">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 my-4" />
              {GalleryContent}
            </DrawerContent>
          </Drawer>

          <Drawer open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
            <DrawerContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-t-[2.5rem] p-8 pb-12">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
              <DrawerHeader className="p-0 text-left">
                <DrawerTitle className="text-3xl font-bold tracking-tight">Excluir Registro?</DrawerTitle>
                <p className="text-lg font-medium text-muted-foreground mt-2">
                  Esta ação removerá permanentemente a despesa do seu histórico.
                </p>
              </DrawerHeader>
              <DrawerFooter className="p-0 mt-8 gap-3 flex-row">
                <Button onClick={() => setExpenseToDelete(null)} variant="outline" className="flex-1 rounded-2xl h-14 font-bold border-white/10 hover:bg-white/5">Voltar</Button>
                <Button onClick={confirmDelete} className="flex-1 rounded-2xl h-14 font-bold bg-destructive text-white hover:bg-destructive/90">Sim, Excluir</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <>
          <Dialog open={!!selectedReceipts} onOpenChange={(open) => !open && handleCloseGallery()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-white/10 rounded-[2.5rem] shadow-2xl" showCloseButton={false}>
              {GalleryContent}
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
            <AlertDialogContent className="rounded-[2.5rem] border-white/10 bg-background/95 backdrop-blur-3xl p-10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-3xl font-bold tracking-tight">Excluir Registro?</AlertDialogTitle>
                <AlertDialogDescription className="text-lg font-medium text-muted-foreground">
                  Esta ação removerá permanentemente a despesa do seu histórico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-8 gap-3">
                <AlertDialogCancel className="rounded-2xl h-12 font-bold px-8 border-white/10 hover:bg-white/5">Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="rounded-2xl h-12 font-bold px-8 bg-destructive text-white hover:bg-destructive/90">Sim, Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}