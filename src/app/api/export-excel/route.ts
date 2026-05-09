import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

export async function POST(request: Request) {
  try {
    const { expenseIds } = await request.json()

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma despesa selecionada' }, { status: 400 })
    }

    const supabase = await createClient()

    // Busca as despesas selecionadas
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .in('id', expenseIds)
      .order('date', { ascending: true })

    if (error) throw error

    // Caminho do template
    const templatePath = path.join(process.cwd(), 'RDT.xlsx')
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template RDT.xlsx não encontrado na raiz' }, { status: 404 })
    }

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) throw new Error('Planilha não encontrada no template')

    // Preenche os itens no arquivo único (máximo 10 conforme o template)
    expenses.forEach((expense, index) => {
      if (index >= 10) return 

      const startRow = 11 + (index * 2)
      
      // Data (A)
      const [year, month, day] = expense.date.split('-')
      const formattedDate = `${day}/${month}`
      const cellDate = worksheet.getCell(`A${startRow}`)
      cellDate.value = formattedDate
      cellDate.alignment = { horizontal: 'center' }
      
      // Local (B)
      worksheet.getCell(`B${startRow}`).value = expense.local
      
      // Categoria (D)
      worksheet.getCell(`D${startRow}`).value = expense.transporte
      
      // Quantidade (E)
      const cellQty = worksheet.getCell(`E${startRow}`)
      cellQty.value = expense.quantidade.toString()
      cellQty.numFmt = '@'
      cellQty.alignment = { horizontal: 'center' }
      
      // Valor Unitário (F)
      const cellValue = worksheet.getCell(`F${startRow}`)
      cellValue.value = Number(expense.valor)
      cellValue.numFmt = '#,##0.00'

      // Valor Seção H
      worksheet.getCell(`H${startRow}`).value = ''
      
      // Valor Total Seção (G)
      const cellTotalG = worksheet.getCell(`G${startRow}`)
      cellTotalG.value = Number(expense.valor) * Number(expense.quantidade)
      cellTotalG.numFmt = '#,##0.00'

      // Valor Total Final (I)
      const cellTotalI = worksheet.getCell(`I${startRow}`)
      cellTotalI.value = Number(expense.valor) * Number(expense.quantidade)
      cellTotalI.numFmt = '#,##0.00'
      
      // Motivo (B, linha abaixo)
      worksheet.getCell(`B${startRow + 1}`).value = expense.motivo
    })

    // Gera o buffer do Excel (que agora é apenas uma etapa intermediária se quiséssemos converter no server)
    // Como a conversão de Excel para PDF no Linux/Vercel é extremamente complexa (exige LibreOffice instalado),
    // vamos manter o Excel como opção de backup ou gerar um PDF via HTML no frontend.
    
    const buffer = await workbook.xlsx.writeBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Relatorio_RDT.xlsx"',
      },
    })

  } catch (error: any) {
    console.error('Erro na exportação:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
