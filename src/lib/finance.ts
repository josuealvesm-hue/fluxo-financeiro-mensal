export const GROUPS = [
  "Entradas",
  "Igreja",
  "Essencial Casa",
  "Impostos",
  "Bem-estar e Lazer",
  "Variáveis",
  "Crédito",
  "Investimentos",
] as const;
export type Group = (typeof GROUPS)[number];

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const fmt = (n: number | null | undefined) => BRL.format(Number(n ?? 0));

export type ItemStatus = "previsto" | "pago" | "recebido" | "ajustado" | "cancelado" | "adiado";
export type BudgetType = "entrada" | "saida" | "investimento" | "credito";

export interface MonthlyItem {
  id: string;
  type: BudgetType;
  group: string;
  name: string;
  planned_amount: number;
  actual_amount: number | null;
  status: ItemStatus;
  expected_date: string | null;
  payment_date: string | null;
  category: string | null;
  subcategory: string | null;
}

export interface ExtraTx {
  id: string;
  type: BudgetType;
  amount: number;
  description: string;
  date: string;
  status: ItemStatus;
}

export function isExpense(t: BudgetType) {
  return t === "saida" || t === "investimento" || t === "credito";
}

export function summarize(items: MonthlyItem[], extras: ExtraTx[] = []) {
  let receitaPrev = 0, receitaReceb = 0, saidaPrev = 0, saidaPaga = 0;
  let entradasPendentes = 0, saidasPendentes = 0;
  let totalItens = 0, itensExec = 0;

  for (const it of items) {
    if (it.status === "cancelado" || it.status === "adiado") continue;
    totalItens++;
    const real = Number(it.actual_amount ?? 0);
    const planned = Number(it.planned_amount ?? 0);
    if (it.type === "entrada") {
      receitaPrev += planned;
      if (it.status === "recebido") {
        receitaReceb += real || planned;
        itensExec++;
      } else {
        entradasPendentes += planned;
      }
    } else if (isExpense(it.type)) {
      saidaPrev += planned;
      if (it.status === "pago" || it.status === "ajustado") {
        saidaPaga += real || planned;
        itensExec++;
      } else {
        saidasPendentes += planned;
      }
    }
  }

  const foraDoPrevisto = extras.reduce((a, e) => a + (e.type === "entrada" ? 0 : Number(e.amount)), 0);

  const saldoPrevisto = receitaPrev - saidaPrev;
  const saldoReal = receitaReceb - saidaPaga - foraDoPrevisto;
  const disponivel = receitaReceb + entradasPendentes - saidaPaga - saidasPendentes - foraDoPrevisto;
  const pctExec = totalItens > 0 ? (itensExec / totalItens) * 100 : 0;

  return {
    receitaPrev, receitaReceb, saidaPrev, saidaPaga,
    entradasPendentes, saidasPendentes,
    saldoPrevisto, saldoReal, disponivel,
    pctExec, foraDoPrevisto,
    totalItens, itensExec,
  };
}

export function todayYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
