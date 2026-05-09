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
      <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-3xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <p className="text-sm font-bold text-foreground">
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
      <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-3xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
        <p className="text-sm font-bold text-foreground">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-widest uppercase">Sincronizando análises...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <header className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
            Dashboard
          </h1>
          <p className="text-muted-foreground font-medium">Análise de gastos e performance financeira</p>
        </header>
        <ExpenseForm 
          trigger={
            <Button className="h-12 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform w-full md:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Nova Despesa
            </Button>
          }
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Total Registrado', value: stats.total, icon: Receipt, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pendente Reembolso', value: stats.pending, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Total Pago', value: stats.paid, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-8 shadow-2xl">
            <div className={cn("absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20", stat.bg)} />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/80">{stat.label}</span>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
            <div className="text-4xl font-bold tracking-tight relative z-10">
              R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6 shadow-2xl relative overflow-hidden group hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Evolução Mensal
              </h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.2em]">Últimos 6 meses de atividade</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} 
                  dy={15}
                  tickFormatter={(val) => val.substring(0, 3).toUpperCase()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}
                  tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 space-y-6 shadow-2xl relative overflow-hidden group hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" /> Distribuição
              </h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.2em]">Gastos filtrados por categoria</p>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={10}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
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
                            <div className="h-1.5 w-4 rounded-full transition-all group-hover/legend:w-6" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-tighter group-hover/legend:text-foreground transition-colors">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center opacity-20 py-20">
                <BarChart3 className="h-12 w-12 mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Sem registros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/5 bg-white/[0.01] p-8 overflow-hidden relative shadow-inner">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Status da Rede</h2>
            <p className="text-muted-foreground text-sm font-medium">Os gráficos refletem o estado atual do banco de dados em tempo real</p>
          </div>
          <div className="flex gap-12">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Tickets</p>
              <p className="text-3xl font-black tracking-tighter">{expenses?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Data Layer</p>
              <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Synchronized</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
