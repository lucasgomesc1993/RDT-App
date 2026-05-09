# Plano de Redesign: Brutalismo Corporativo 🔳

## Objetivo
Transformar o RDT App em uma interface crua, direta e de altíssimo impacto visual, seguindo a estética "Corporate Brutalism". Foco em eficiência, clareza e um design inesquecível que se afasta do padrão genérico de dashboards.

## Diretrizes Estéticas
- **Contraste Extremo**: Fundo preto total (`#000000`) com elementos branco puro (`#ffffff`).
- **Geometria Rígida**: Remoção total de cantos arredondados. Tudo será angular e afiado.
- **Tipografia Brutalista**: Uso intenso da `Geist Mono` para todos os dados numéricos e tabelas. Cabeçalhos grandes e com tracking (espaçamento entre letras) reduzido.
- **Bordas em Destaque**: Substituição de sombras suaves por bordas sólidas de 2px ou 4px.
- **Micro-interações de Inversão**: No hover, as cores se invertem instantaneamente (Branco vira Preto e vice-versa).

## Ações Técnicas

### 1. Configuração Global (`globals.css`)
- Redefinir as variáveis de cor para Preto (#000) e Branco (#FFF).
- Forçar `--radius: 0px`.
- Definir classes utilitárias `.brutalist-card` e `.brutalist-button`.
- Adicionar uma "Grid" sutil de fundo para reforçar o visual industrial.

### 2. Layout Estrutural (`sidebar.tsx` & `layout.tsx`)
- Transformar a Sidebar em um bloco sólido com borda direita grossa.
- Remover transições de cor lentas; usar mudanças de estado binárias.
- Logo do app em caixa alta (`UPPERCASE`) com peso extra bold.

### 3. Dashboard Principal (`page.tsx`)
- Cards de resumo serão transformados em blocos de dados gigantes.
- Os números (Total, Pendente, Reembolsado) serão exibidos em `Geist Mono` com tamanho massivo.
- Adicionar um acento de cor "Highlighter Yellow" (`#fbbf24`) apenas para itens críticos.

### 4. Tabela de Despesas (`despesas/page.tsx`)
- Tabela com bordas internas visíveis (estilo planilha técnica).
- Cabeçalhos da tabela em preto com texto branco.
- Miniaturas dos comprovantes com molduras pretas grossas.
- Checkboxes e Botões de status transformados em blocos retangulares sólidos.

## Validação
- O build deve ser verificado para garantir que a remoção de bordas e alteração de variáveis não quebrou componentes do shadcn/ui (que serão adaptados via CSS global).
