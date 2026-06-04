import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, summarize, todayYearMonth, GROUPS, isExpense } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Orçamento" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = todayYearMonth();
  const [{ year, month }, setYM] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", year, month],
    queryFn: async () => {
      const [items, extras, invoices] = await Promise.all([
        supabase.from("monthly_budget_items").select("*").eq("year", year).eq("month", month),
        supabase.from("extra_transactions").select("*").eq("year", year).eq("month", month),
        supabase.from("card_invoices").select("*, cards(name)").eq("year", year).eq("month", month),
      ]);
      return {
        items: items.data ?? [],
        extras: extras.data ?? [],
        invoices: invoices.data ?? [],
      };
    },
  });

  const items = (data?.items ?? []) as any[];
  const extras = (data?.extras ?? []) as any[];
  const invoices = (data?.invoices ?? []) as any[];
  const s = summarize(items, extras);

  const pendentesContas = items.filter(i => isExpense(i.type) && i.status === "previsto");
  const pendentesEntradas = items.filter(i => i.type === "entrada" && i.status === "previsto");

  // alerts: groups over budget
  const byGroup = new Map<string, { planned: number; actual: number }>();
  for (const it of items) {
    if (it.status === "cancelado" || it.status === "adiado") continue;
    if (!isExpense(it.type)) continue;
    const g = byGroup.get(it.group) ?? { planned: 0, actual: 0 };
    g.planned += Number(it.planned_amount ?? 0);
    g.actual += Number(it.actual_amount ?? 0);
    byGroup.set(it.group, g);
  }
  const groupsOver = [...byGroup.entries()].filter(([, v]) => v.actual > v.planned && v.planned > 0);
  const invoicesOver = invoices.filter(inv => Number(inv.actual_amount ?? 0) > Number(inv.planned_amount ?? 0) && Number(inv.planned_amount) > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral do orçamento do mês"
        actions={<MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />}
      />

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <KPI label="Receita prevista" value={fmt(s.receitaPrev)} tone="info" />
            <KPI label="Receita recebida" value={fmt(s.receitaReceb)} tone="success" />
            <KPI label="Saídas previstas" value={fmt(s.saidaPrev)} tone="muted" />
            <KPI label="Saídas pagas" value={fmt(s.saidaPaga)} tone="destructive" />
            <KPI label="Saldo previsto" value={fmt(s.saldoPrevisto)} tone={s.saldoPrevisto >= 0 ? "success" : "destructive"} />
            <KPI label="Saldo real" value={fmt(s.saldoReal)} tone={s.saldoReal >= 0 ? "success" : "destructive"} />
            <KPI label="Disponível até fim do mês" value={fmt(s.disponivel)} tone="info" />
            <KPI label="Fora do previsto" value={fmt(s.foraDoPrevisto)} tone="warning" />
          </div>

          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Execução do mês</span>
                <span className="text-muted-foreground text-xs">{s.itensExec} de {s.totalItens} itens</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={s.pctExec} />
              <div className="text-xs text-muted-foreground mt-2">{s.pctExec.toFixed(0)}% executado</div>
            </CardContent>
          </Card>

          {(groupsOver.length > 0 || invoicesOver.length > 0) && (
            <Card className="mb-4 border-warning/30 bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {groupsOver.map(([g, v]) => (
                  <div key={g} className="flex justify-between">
                    <span>Grupo <strong>{g}</strong> acima do planejado</span>
                    <span className="text-destructive">{fmt(v.actual - v.planned)}</span>
                  </div>
                ))}
                {invoicesOver.map(inv => (
                  <div key={inv.id} className="flex justify-between">
                    <span>Fatura <strong>{inv.cards?.name}</strong> acima do previsto</span>
                    <span className="text-destructive">{fmt(Number(inv.actual_amount) - Number(inv.planned_amount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <PendingList
              title="Contas pendentes"
              icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              items={pendentesContas}
            />
            <PendingList
              title="Entradas pendentes"
              icon={<TrendingUp className="h-4 w-4 text-success" />}
              items={pendentesEntradas}
            />
          </div>

          {extras.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gastos fora do previsto</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {extras.map(e => (
                  <div key={e.id} className="flex justify-between">
                    <span>{e.description}</span>
                    <span className={e.type === "entrada" ? "text-success" : "text-destructive"}>{fmt(e.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneCls: Record<string, string> = {
    info: "text-info",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
    muted: "text-foreground",
  };
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg md:text-xl font-semibold mt-1 ${toneCls[tone] ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function PendingList({ title, icon, items }: { title: string; icon: React.ReactNode; items: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {title} <Badge variant="secondary" className="ml-auto">{items.length}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm max-h-72 overflow-auto">
        {items.length === 0 && <div className="text-muted-foreground text-xs">Nenhum pendente</div>}
        {items.map(i => (
          <div key={i.id} className="flex justify-between gap-2">
            <span className="truncate">{i.name}</span>
            <span className="tabular-nums">{fmt(i.planned_amount)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
