'use client'

import { useExpenses } from '@/hooks/use-expenses'
import { ExpenseForm } from '@/components/expense-form'
import { Receipt, AlertCircle, CheckCircle2, Loader2, BarChart3, PieChart as PieChartIcon, TrendingUp, Plus } from 'lucide-react'
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
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/90 backdrop-blur-2xl border border-white/[0.06] p-4 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
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
      <div className="bg-background/90 backdrop-blur-2xl border border-white/[0.06] p-4 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
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

  const stats = useMemo(() => {
    if (!expenses) return { total: 0, pending: 0, paid: 0 }
    const total = expenses.reduce((acc, curr) => acc + (curr.valor * curr.quantidade), 0)
    const pending = expenses.filter(e => !e.pago).reduce((acc, curr) => acc + (curr.valor * curr.quantidade), 0)
    return { total, pending, paid: total - pending }
  }, [expenses])

  const chartData = useMemo(() => {
    if (!expenses) return []
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i)
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
  }, [expenses])

  const categoryData = useMemo(() => {
    if (!expenses) return []
    const categories: Record<string, number> = {}
    expenses.forEach(e => {
      categories[e.transporte] = (categories[e.transporte] || 0) + (e.valor * e.quantidade)
    })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Processando dados...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <header className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground text-[10px] font-medium uppercase tracking-wider border border-white/[0.08]">Visão Geral</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium opacity-60">Sua performance financeira em tempo real.</p>
        </header>
        <ExpenseForm />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 px-4 md:px-0">
        {[
          { label: 'Total Registrado', value: stats.total, icon: Receipt },
          { label: 'Pendente Reembolso', value: stats.pending, icon: AlertCircle },
          { label: 'Total Pago', value: stats.paid, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/[0.04]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-muted-foreground transition-colors group-hover:text-foreground">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-semibold tracking-tight font-mono text-foreground">
              R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 px-4 md:px-0">
        <div className="rounded-2xl border border-border/50 bg-white/[0.01] p-8 space-y-8 transition-all duration-300">
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
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 500 }} 
                  dy={15}
                  tickFormatter={(val) => val.substring(0, 3).toUpperCase()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 500 }}
                  tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
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

        <div className="rounded-2xl border border-border/50 bg-white/[0.01] p-8 space-y-8 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <PieChartIcon className="h-4 w-4 opacity-50" /> Distribuição
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Gastos por categoria</p>
            </div>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`rgba(255,255,255, ${0.8 - (index * 0.12)})`} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
                        {payload?.map((entry: any, index) => (
                          <div key={index} className="flex items-center gap-2 group/legend cursor-default">
                            <div className="h-1 w-3 rounded-full opacity-40 transition-all group-hover/legend:opacity-100" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] font-medium uppercase text-muted-foreground group-hover:text-foreground transition-colors tracking-tight">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center opacity-20 py-20">
                <BarChart3 className="h-10 w-10 mb-3" />
                <p className="text-[10px] font-medium uppercase tracking-widest">Sem registros</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
