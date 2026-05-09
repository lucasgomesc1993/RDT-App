# Plano de Redesign: Vibrant Neo-SaaS (Moderno) 🎨✨

## Objetivo
Transformar o RDT App em uma interface moderna, vibrante e extremamente polida. O foco sai da rigidez industrial e entra na sofisticação de produtos digitais de alta performance (como Linear, Stripe ou Vercel), mantendo o tema escuro como base.

## Diretrizes Estéticas
- **Profundidade e Camadas**: Uso de sombras suaves e sobreposições de cores para criar hierarquia visual.
- **Geometria Suave**: Cantos arredondados generosos (`border-radius: 0.75rem`).
- **Paleta "Deep Indigo"**: Fundo em tons de azul escuro profundo (`#0a0a0f`), com acentos em ciano vibrante e violeta.
- **Tipografia Refinada**: Retorno ao uso da `Geist Sans` para leitura fluida, mantendo a `Mono` apenas para dados técnicos específicos.
- **Animações Fluidas**: Transições de cor e estado com curvas "ease-in-out".

## Ações Técnicas

### 1. Configuração Global (`globals.css`)
- Redefinir as variáveis de cor para tons de cinza azulado e acentos vibrantes.
- Restaurar `--radius: 0.75rem`.
- Adicionar um efeito de "Mesh Gradient" sutil no fundo para dar vida à interface.
- Criar classes para painéis com transparência leve (Glassmorphism sutil).

### 2. Layout Estrutural (`sidebar.tsx` & `navbar.tsx`)
- Sidebar com fundo levemente translúcido e ícones com cores de acento.
- Links de navegação com estados de hover "suaves" (pill-shaped).
- Navbar mobile com desfoque de fundo (backdrop-filter).

### 3. Dashboard Principal (`page.tsx`)
- Cards de resumo com bordas coloridas sutis ou gradientes de progresso.
- Grandes números com peso de fonte equilibrado e clareza.

### 4. Tabela de Despesas (`despesas/page.tsx`)
- Tabela "limpa": remoção de bordas internas agressivas.
- Uso de badges coloridas e suaves para os tipos de transporte e status.
- Ações (Editar/Excluir) integradas de forma discreta mas acessível.

## Validação
- Verificar se a legibilidade do texto branco sobre o novo fundo azulado está impecável.
- Garantir que a transição entre as páginas pareça rápida e fluida.
