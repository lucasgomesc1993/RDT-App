'use client'

import { useExpenses } from '@/hooks/use-expenses'
import { ExpenseForm } from '@/components/expense-form'
import { Receipt, AlertCircle, CheckCircle2, Loader2, BarChart3, PieChart as PieChartIcon, TrendingUp, Plus, MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { format, parseISO, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval, eachMonthOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-2xl border border-border p-4 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
          <p className="text-sm font-semibold font-mono text-foreground">
            {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    )
  }
  return null
}

const CategoryTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-2xl border border-border p-4 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{payload[0].name}</p>
        <p className="text-sm font-semibold font-mono text-foreground">
          {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { data: expenses, isLoading } = useExpenses()
  const [selectedDate, setSelectedDate] = useState<string>(startOfMonth(new Date()).toISOString())

  const availableMonths = useMemo(() => {
    if (!expenses || expenses.length === 0) return []
    
    const dates = expenses.map(e => startOfMonth(parseISO(e.date)).toISOString())
    // Sempre inclui o mês atual como opção
    dates.push(startOfMonth(new Date()).toISOString())
    
    return Array.from(new Set(dates))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [expenses])

  const stats = useMemo(() => {
    if (!expenses) return { pending: 0, monthCount: 0, monthTotal: 0 }
    
    const isTotal = selectedDate === 'TOTAL'
    const monthStart = isTotal ? null : startOfMonth(new Date(selectedDate))
    const monthEnd = isTotal ? null : endOfMonth(new Date(selectedDate))
    
    const filteredExpenses = isTotal 
      ? expenses 
      : expenses.filter(e => {
          const d = parseISO(e.date)
          return isWithinInterval(d, { start: monthStart!, end: monthEnd! })
        })
    
    const pending = filteredExpenses.filter(e => !e.pago).reduce((acc, curr) => acc + (curr.valor * curr.quantidade), 0)
    const monthCount = filteredExpenses.length
    const monthTotal = filteredExpenses.reduce((acc, curr) => acc + (curr.valor * curr.quantidade), 0)
    
    return { pending, monthCount, monthTotal }
  }, [expenses, selectedDate])

  const chartData = useMemo(() => {
    if (!expenses) return []
    const refDate = selectedDate === 'TOTAL' ? new Date() : new Date(selectedDate)
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(refDate, i)
      return {
        month: format(date, 'MMMM', { locale: ptBR }),
        timestamp: date,
        total: 0
      }
    }).reverse()

    expenses.forEach(expense => {
      const expenseDate = parseISO(expense.date)
      last6Months.forEach(month => {
        if (isWithinInterval(expenseDate, {
          start: startOfMonth(month.timestamp),
          end: endOfMonth(month.timestamp)
        })) {
          month.total += (expense.valor * expense.quantidade)
        }
      })
    })
    return last6Months
  }, [expenses, selectedDate])

  const categoryData = useMemo(() => {
    if (!expenses) return []
    const isTotal = selectedDate === 'TOTAL'
    const monthStart = isTotal ? null : startOfMonth(new Date(selectedDate))
    const monthEnd = isTotal ? null : endOfMonth(new Date(selectedDate))

    const categories: Record<string, number> = {}
    expenses
      .filter(e => {
        if (isTotal) return true
        const d = parseISO(e.date)
        return isWithinInterval(d, { start: monthStart!, end: monthEnd! })
      })
      .forEach(e => {
        categories[e.transporte] = (categories[e.transporte] || 0) + (e.valor * e.quantidade)
      })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses, selectedDate])

  const handlePrev = () => {
    if (selectedDate === 'TOTAL') return
    const currentIndex = availableMonths.indexOf(selectedDate)
    if (currentIndex < availableMonths.length - 1) {
      setSelectedDate(availableMonths[currentIndex + 1])
    }
  }

  const handleNext = () => {
    if (selectedDate === 'TOTAL') return
    const currentIndex = availableMonths.indexOf(selectedDate)
    if (currentIndex > 0) {
      setSelectedDate(availableMonths[currentIndex - 1])
    }
  }

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Processando dados...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20 pt-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4 md:px-0">
        <header className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-muted/20 dark:bg-muted/40 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider border border-border/30 dark:border-border/50">Visão Geral</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium opacity-60">Sua performance financeira em tempo real.</p>
        </header>

        <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-3">
          <div className="order-2 sm:order-1 flex items-center gap-1 p-1 bg-muted/20 rounded-2xl border border-border/40 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-background/50 text-muted-foreground disabled:opacity-20"
              disabled={selectedDate === 'TOTAL' || availableMonths.indexOf(selectedDate) === availableMonths.length - 1}
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={selectedDate}
              onValueChange={(value) => {
                if (value) setSelectedDate(value)
              }}
            >
              <SelectTrigger className="flex-1 sm:w-[180px] h-10 bg-transparent border-none focus:ring-0 font-bold uppercase tracking-widest text-[10px]">
                <SelectValue>
                  {selectedDate === 'TOTAL' 
                    ? 'Período Total' 
                    : format(new Date(selectedDate), "MMMM 'de' yyyy", { locale: ptBR })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-2xl border-white/10 rounded-2xl">
                <SelectItem 
                  value="TOTAL"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary"
                >
                  Período Total
                </SelectItem>
                <div className="h-px bg-border/40 my-1" />
                {availableMonths.map((monthIso, i) => (
                  <SelectItem 
                    key={i} 
                    value={monthIso}
                    className="text-[10px] font-bold uppercase tracking-widest"
                  >
                    {format(new Date(monthIso), "MMMM 'de' yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl hover:bg-background/50 text-muted-foreground disabled:opacity-20"
              disabled={selectedDate === 'TOTAL' || availableMonths.indexOf(selectedDate) === 0}
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="order-1 sm:order-2 w-full sm:w-auto">
            <ExpenseForm />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 px-4 md:px-0">
        {[
          { 
            label: selectedDate === 'TOTAL' ? 'Pendente Total' : `Pendente / ${format(new Date(selectedDate), 'MMM', { locale: ptBR })}`, 
            value: stats.pending, 
            icon: AlertCircle, 
            isCurrency: true 
          },
          { 
            label: selectedDate === 'TOTAL' ? 'Transações Totais' : `Transações / ${format(new Date(selectedDate), 'MMM', { locale: ptBR })}`, 
            value: stats.monthCount, 
            icon: MousePointer2, 
            isCurrency: false 
          },
          { 
            label: selectedDate === 'TOTAL' ? 'Gasto Total' : `Gasto em ${format(new Date(selectedDate), 'MMMM', { locale: ptBR })}`, 
            value: stats.monthTotal, 
            icon: TrendingUp, 
            isCurrency: true 
          },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-border/30 dark:border-border/50 bg-card/20 dark:bg-card/40 p-8 transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:bg-muted/5 dark:hover:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:scale-110 group-hover:rotate-3">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight font-mono text-foreground transition-transform duration-500 group-hover:translate-x-1">
              {stat.isCurrency ? 'R$ ' : ''}{stat.value.toLocaleString('pt-BR', { minimumFractionDigits: stat.isCurrency ? 2 : 0 })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 px-4 md:px-0">
        <div className="rounded-2xl border border-border/40 bg-card/30 p-8 space-y-8 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <TrendingUp className="h-4 w-4 opacity-50" /> Evolução Mensal
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Histórico de atividade</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.1} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 10, fontWeight: 500 }}
                  dy={15}
                  tickFormatter={(val) => val.substring(0, 3).toUpperCase()}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 9, fontWeight: 500 }}
                  tickFormatter={(value) => `R$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.1, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 dark:border-border/50 bg-card/20 dark:bg-card/40 p-5 pb-10 sm:p-8 space-y-6 sm:space-y-8 transition-all duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <PieChartIcon className="h-4 w-4 opacity-50" /> 
                {selectedDate === 'TOTAL' ? 'Distribuição Total' : `Distribuição / ${format(new Date(selectedDate), 'MMM', { locale: ptBR })}`}
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Gastos por categoria</p>
            </div>
          </div>

          <div className="h-full w-full flex flex-col">
            <div className="h-[240px] sm:h-[220px] w-full">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="95%"
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={1200}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`oklch(from var(--primary) l c h / ${0.9 - (index * 0.15)})`} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center opacity-20 py-20">
                  <BarChart3 className="h-10 w-10 mb-3" />
                  <p className="text-[10px] font-medium uppercase tracking-widest">Sem registros</p>
                </div>
              )}
            </div>

            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-6 px-2">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 group/legend cursor-default">
                    <div
                      className="h-1 w-3 rounded-full opacity-60 transition-all group-hover/legend:opacity-100"
                      style={{ backgroundColor: `oklch(from var(--primary) l c h / ${0.9 - (index * 0.15)})` }}
                    />
                    <span className="text-[8px] font-bold uppercase text-muted-foreground group-hover/legend:text-foreground transition-colors tracking-tight truncate">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
