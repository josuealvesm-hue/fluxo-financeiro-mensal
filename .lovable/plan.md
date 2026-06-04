# Plano: App de Controle Financeiro Pessoal (Orçamento Planejado)

## Visão geral
Web app responsivo que substitui uma planilha de fluxo de caixa. O usuário configura um **Orçamento Base** uma vez; o app gera o orçamento de cada mês automaticamente e o usuário apenas **executa** (marca pago/recebido/ajustado) ao longo do mês. Foco em planejamento e acompanhamento, não em lançamento diário.

## Stack e infraestrutura
- TanStack Start + React + Tailwind (já no template)
- **Lovable Cloud** (Supabase gerenciado) para persistência, autenticação e RLS
- shadcn/ui para componentes; visual limpo, denso e familiar (estilo planilha moderna)
- Recharts para mini-gráficos do dashboard

## Autenticação
- Login por email/senha via Lovable Cloud
- Todos os dados isolados por `user_id` com RLS

## Modelo de dados (Postgres / Lovable Cloud)
Tabelas (todas com `user_id uuid` + RLS por dono):
- `accounts` — id, name, type, bank, active
- `cards` — id, name, bank, closing_day, due_day, active
- `funds` — id, name, percentage, active
- `budget_templates` — id, name, type (entrada/saida/investimento/credito), group, category, subcategory, default_amount, amount_type (fixed/variable/percentage), percentage, expected_day, recurrence (mensal/anual/unica/personalizada), payment_method, account_id, card_id, active, notes
- `monthly_budget_items` — id, month, year, template_id (nullable), name, type, group, category, subcategory, planned_amount, actual_amount, expected_date, payment_date, status (previsto/pago/recebido/ajustado/cancelado/adiado), notes; `difference` calculada
- `extra_transactions` — id, date, month, year, type, group, category, subcategory, description, amount, payment_method, account_id, card_id, status, notes
- `card_invoices` — id, card_id, month, year, planned_amount, actual_amount, due_date, status (prevista/aberta/fechada/paga)
- `swile_months` — id, month, year, mobility_planned, food_planned, used_amount, status

Seeds iniciais: 6 cartões (Santander Unique/Elite, Nubank Josué/Yasmin, Bradesco, C6) e 5 fundos (Rafael 8%, Davi 8%, Roupas 9%, Viagens 10%, Reserva 15%).

## Telas / Rotas
Layout com sidebar fixa (desktop) / bottom nav (mobile):

1. **`/`** — Login/redirect
2. **`/dashboard`** — Dashboard mensal com seletor de mês:
   - Cards: Receita prevista/recebida, Saídas previstas/pagas, Saldo previsto/real, Disponível até fim do mês, % executado
   - Listas: Contas pendentes, Entradas pendentes, Gastos fora do previsto
   - Alertas: categorias e cartões acima do planejado
3. **`/orcamento-base`** — CRUD de `budget_templates` em tabela editável, filtros por grupo/tipo, toggle ativo
4. **`/gerar-mes`** — Wizard: escolher mês/ano e origem (Orçamento Base / Copiar mês anterior / Manual). Mostra preview antes de confirmar; idempotente (avisa se já existe)
5. **`/executar/:year/:month`** — Checklist agrupado pelos 8 grupos. Cada item: nome, previsto, real, data, status, diferença. Ações: pago/recebido/ajustado/cancelado/adiar (próximo mês), editar valor real inline
6. **`/excecoes/:year/:month`** — CRUD de `extra_transactions` do mês
7. **`/cartoes`** — Lista de cartões + faturas por mês, com previsto vs real, vencimento e status
8. **`/swile/:year/:month`** — Controle do benefício: mobilidade prevista, alimentação prevista, total, utilizado, saldo
9. **`/fundos`** — Configurar % dos fundos. Mostra cálculo do mês: `saldo_mensal_positivo × %`

## Lógica de geração mensal
Server function `generateMonth({year, month, source})`:
- **base**: itera `budget_templates` ativos respeitando `recurrence` (mensal sempre; anual só no mês configurado; única se ainda não usada; personalizada conforme regra) → cria `monthly_budget_items` com `planned_amount = default_amount`
- **previous**: copia itens do mês anterior resetando `actual_amount`, `payment_date`, `status='previsto'`
- **manual**: cria mês vazio
- Para itens com `amount_type='percentage'`: calcula sobre total de entradas previstas do mês
- Cria também `card_invoices` para cada cartão ativo e `swile_months` placeholder

## Cálculos (utilitários puros em `src/lib/budget-math.ts`)
- Entradas previstas/recebidas, Saídas previstas/pagas (Saída+Crédito+Investimento, status pago/ajustado)
- Saldo previsto = entradas previstas − saídas previstas
- Saldo real = recebidas − pagas
- Disponível = recebidas + entradas pendentes − pagas − saídas pendentes
- % execução = (itens pago/recebido) / total previstos
- Fora do previsto = soma das exceções
- Por item: `dentro` se real ≤ previsto, `acima` se real > previsto
- Por fundo: `max(0, saldo_real) × percentage`

## Detalhes técnicos
- Server functions (`createServerFn` + `requireSupabaseAuth`) para todas as mutações e leituras agregadas
- TanStack Query para cache; loaders nas rotas `_authenticated/*`
- Formatação BRL (`Intl.NumberFormat('pt-BR')`); datas em pt-BR
- Validação com Zod tanto cliente quanto servidor
- Tokens de cor semânticos em `styles.css`: paleta neutra com verde (positivo), vermelho (acima), âmbar (pendente), azul (info)

## Entrega em fases
1. Cloud + auth + schema + seeds
2. CRUDs base: Contas, Cartões, Fundos, Orçamento Base
3. Geração de mês + tela Executar (núcleo do produto)
4. Dashboard com agregações e alertas
5. Exceções, Cartões/Faturas, Swile, Fundos com cálculo

## Fora do escopo (confirmar se quiser depois)
- Importação de extrato bancário / OFX
- Notificações por email/push de contas a vencer
- Relatórios anuais e exportação CSV/PDF
- Multi-usuário compartilhando o mesmo orçamento (casal)
