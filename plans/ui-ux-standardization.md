# Planejamento de Padronização e Refinamento de UI/UX - RDT App

Este documento detalha a estratégia para unificar e elevar o design de todas as páginas e componentes do projeto RDT App, adotando uma estética coesa, minimalista, elegante e de nível de produção, conforme as diretrizes da skill `frontend-design`.

## 1. Mapeamento do Projeto (Concluído)

Todas as rotas (auth e dashboard), layouts e componentes já foram mapeados e serão alvos desta padronização. O foco é remover a "zona" visual e unificar os componentes base.

---

## 2. Direção de Arte e Estética (Aesthetic Vision)

**Conceito Escolhido: "Minimalismo Obscuro e Elegante" (Dark Minimalist Elegance)**
Um design focado em extrema limpeza, respiro (negative space) e elegância. O aplicativo deve parecer um produto premium, inspirado em interfaces modernas como Apple, Linear ou Vercel.

- **Propósito:** Gestão de despesas sem estresse visual, onde o foco está inteiramente na clareza dos dados e facilidade de uso.
- **Tom:** Sofisticado, sereno, silencioso e preciso. Nada de elementos gritantes ou excesso de informações amontoadas.

### 2.1. Tipografia (Typography)
*Faremos uso das fontes modernas e otimizadas `Geist` (criada pela Vercel) para garantir elegância e precisão técnica.*
- **Geral (Headings e Body):** `Geist Sans` (Limpa, neutra e altamente legível).
- **Dados Financeiros e Tabelas:** `Geist Mono` (Para alinhar perfeitamente os valores numéricos e dar um toque de precisão de software).

### 2.2. Paleta de Cores e Tema (Colors & Theme)
*Um dark mode refinado, focado em tons de cinza sutis e materiais translúcidos (glass).*
- **Fundo (Background):** Preto quase absoluto (`#0a0a0a` - `zinc-950`).
- **Superfícies (Cards/Drawers):** Fundo translúcido com forte desfoque (`bg-white/[0.02] backdrop-blur-xl`) com bordas extremamente sutis (`border-white/[0.08]`).
- **Cor de Acento Principal (Accent):** Branco puro (`#ffffff`) para ações primárias e destaques, ou um azul-ardósia muito discreto (ex: `#8b9cb6` ou `zinc-300` hover `zinc-100`) para não quebrar a elegância monocromática. Valores financeiros podem usar um verde e vermelho muito desaturados e pastéis.
- **Texto:** Branco puro para títulos, cinza prateado suave (`zinc-400` / `zinc-500`) para descrições.

### 2.3. Composição Espacial (Spatial Composition)
- **Espaçamento e Respiro:** Aumentar margens e paddings. Deixar a interface "respirar".
- **Formas:** Cantos arredondados consistentes. Vamos padronizar o raio de borda para `rounded-xl` (ou `rounded-2xl` em modais e painéis maiores) para um visual amigável mas premium.
- **Remoção de "Lixo Visual":** Eliminar linhas desnecessárias, sombras pesadas e fundos conflitantes.

### 2.4. Movimento e Interações (Motion)
- **Fluidez (Fluidity):** Transições suaves (duration-300 ou 500) em opacidade e escala.
- **Micro-interações:** Hovers suaves que acendem o elemento levemente (ex: de `bg-white/[0.02]` para `bg-white/[0.05]`).
- **Abertura de Modais/Drawers:** Animações com `spring` physics leves, parecendo naturais e sofisticadas.

---

## 3. Plano de Ação (Etapas de Implementação)

### Etapa 1: Fundação do Design System
- Atualizar `globals.css` com as novas variáveis CSS monocromáticas e elegantes.
- Garantir a importação limpa de `Geist Sans` e `Geist Mono` no `app/layout.tsx`.
- Padronizar a variável `--radius` no CSS para garantir bordas suaves (`0.75rem` ou `1rem`).

### Etapa 2: Refinamento dos Componentes Base (UI)
- **Botões (`button.tsx`):** Botões primários com fundo branco e texto preto (alto contraste elegante), botões secundários sutis (`ghost` ou `outline` com bordas semi-transparentes).
- **Inputs, Selects, Popovers:** Fundo levemente translúcido, bordas quase invisíveis, anel de foco (ring) suave.
- **Cards e Tabelas:** Remover sombras (`shadow-sm`, etc) e focar em divisórias finas (`border-white/5`).

### Etapa 3: Redesign das Páginas de Autenticação
- Limpar `/login`, `/signup`, etc., criando formulários flutuantes centralizados com aparência de "vidro fumê" sobre o fundo preto profundo.

### Etapa 4: Redesign do Layout e Navegação do Dashboard
- **Sidebar (`sidebar.tsx`):** Discreta, sem linha de divisão forte, separada apenas pelo espaçamento.
- **Navbar (`navbar.tsx`):** Header limpo com blur sutil quando houver rolagem.

### Etapa 5: Refatoração das Páginas de Conteúdo (Home e Despesas)
- **Página de Despesas (`/despesas/page.tsx`):**
  - Refinar filtros e listagens para se alinharem ao novo padrão de "vidro" e contraste.
  - Tipografia de valores usando `Geist Mono`.
  - Formulário de despesa (`expense-form.tsx`) limpo e espaçado.
- **Visão Geral (Home):** Cards de métricas premium, priorizando a informação em vez da decoração de fundo.

## 4. Verificação
- Garantir consistência total de paddings, cores e bordas em todas as telas.