import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExpenseForm } from './expense-form'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock de hooks e dependências
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false // Testa como desktop por padrão
}))

vi.mock('@/hooks/use-expenses', () => ({
  useCreateExpense: () => ({ mutateAsync: vi.fn() }),
  useUpdateExpense: () => ({ mutateAsync: vi.fn() })
}))

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } } }) },
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      })
    }
  })
}))

const queryClient = new QueryClient()

describe('ExpenseForm', () => {
  it('deve renderizar o botão de acionamento', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ExpenseForm />
      </QueryClientProvider>
    )
    expect(screen.getByText('Nova Despesa')).toBeDefined()
  })

  it('deve abrir o modal ao clicar no botão', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ExpenseForm />
      </QueryClientProvider>
    )
    
    fireEvent.click(screen.getByText('Nova Despesa'))
    
    await waitFor(() => {
      expect(screen.getByText('Origem / Destino')).toBeDefined()
    })
  })
})
