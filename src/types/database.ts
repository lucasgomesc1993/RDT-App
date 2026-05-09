export interface Expense {
  id: string
  user_id: string
  local: string
  transporte: string
  valor: number
  motivo: string
  created_at: string
  updated_at: string
  pago: boolean
  receipt_urls: string[] | null
  date: string
  quantidade: number
}

export type InsertExpense = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>