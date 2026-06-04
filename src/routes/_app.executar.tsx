import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { fmt, todayYearMonth, GROUPS, isExpense } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, DollarSign, CalendarX, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const searchSchema = z.object({
  year: z.number().optional(),
  month: z.number().optional(),
});

export const Route = createFileRoute("/_app/executar")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Executar mês" }] }),
  component: Executar,
});

function Executar() {
  const today = todayYearMonth();
  const search = Route.useSearch();
  const [{ year, month }, setYM] = useState({
    year: search.year ?? today.year,
    month: search.month ?? today.month,
  });
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", year, month],
    queryFn: async () => (await supabase.from("monthly_budget_items").select("*").eq("year", year).eq("month", month).order("expected_date", { ascending: true, nullsFirst: false })).data ?? [],
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("monthly_budget_items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", year, month] }),
    onError: (e: any) => toast.error(e.message),
  });

  const adiar = useMutation({
    mutationFn: async (item: any) => {
      let nm = month + 1, ny = year;
      if (nm > 12) { nm = 1; ny++; }
      const { data: u } = await supabase.auth.getUser();
      const { error: e1 } = await supabase.from("monthly_budget_items").update({ status: "adiado" }).eq("id", item.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("monthly_budget_items").insert({
        user_id: u.user!.id,
        month: nm, year: ny,
        template_id: item.template_id,
        name: item.name, type: item.type, group: item.group,
        category: item.category, subcategory: item.subcategory,
        planned_amount: item.planned_amount,
        status: "previsto",
        payment_method: item.payment_method,
        account_id: item.account_id, card_id: item.card_id,
      });
      if (e2) throw e2;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); toast.success("Adiado para o próximo mês"); },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = GROUPS.map(g => ({
    group: g,
    items: (items as any[]).filter(i => i.group === g),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <PageHeader
        title="Executar orçamento"
        description="Marque cada item conforme acontecer no mês"
        actions={<MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />}
      />

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Nenhum item para este mês. Vá em "Gerar mês" para criar.
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(g => (
            <GroupBlock key={g.group} group={g.group} items={g.items} update={update} adiar={adiar} />
          ))}
        </div>
      )}
    </>
  );
}

function GroupBlock({ group, items, update, adiar }: any) {
  const totalP = items.reduce((a: number, i: any) => a + Number(i.planned_amount), 0);
  const totalR = items.reduce((a: number, i: any) => a + Number(i.actual_amount ?? 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{group}</CardTitle>
        <div className="text-xs text-muted-foreground tabular-nums">
          {fmt(totalR)} / <span className="text-foreground">{fmt(totalP)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((it: any) => <ItemRow key={it.id} item={it} update={update} adiar={adiar} />)}
        </div>
      </CardContent>
    </Card>
  );
}

function ItemRow({ item, update, adiar }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(item.actual_amount ?? item.planned_amount));
  const diff = Number(item.actual_amount ?? 0) - Number(item.planned_amount);
  const isIncome = item.type === "entrada";

  function saveValue() {
    update.mutate({
      id: item.id,
      patch: {
        actual_amount: Number(val) || 0,
        status: isIncome ? "recebido" : "pago",
        payment_date: new Date().toISOString().slice(0, 10),
      },
    });
    setEditing(false);
  }

  function quickMark() {
    update.mutate({
      id: item.id,
      patch: {
        actual_amount: item.actual_amount ?? item.planned_amount,
        status: isIncome ? "recebido" : "pago",
        payment_date: new Date().toISOString().slice(0, 10),
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground flex gap-2">
          <StatusBadge status={item.status} />
          {item.expected_date && <span>até {new Date(item.expected_date).toLocaleDateString("pt-BR")}</span>}
        </div>
      </div>
      <div className="text-right text-sm tabular-nums min-w-[120px]">
        <div className="text-muted-foreground text-xs">Previsto</div>
        <div>{fmt(item.planned_amount)}</div>
      </div>
      <div className="text-right text-sm tabular-nums min-w-[140px]">
        <div className="text-muted-foreground text-xs">Real</div>
        {editing ? (
          <div className="flex gap-1">
            <Input type="number" step="0.01" value={val} onChange={(e) => setVal(e.target.value)} className="h-8 w-24" />
            <Button size="sm" className="h-8" onClick={saveValue}>OK</Button>
          </div>
        ) : (
          <button className="hover:underline" onClick={() => setEditing(true)}>
            {item.actual_amount != null ? fmt(item.actual_amount) : "—"}
          </button>
        )}
      </div>
      <div className={`text-right text-xs min-w-[80px] tabular-nums ${diff > 0 ? "text-destructive" : diff < 0 ? "text-success" : "text-muted-foreground"}`}>
        {item.actual_amount != null && (diff > 0 ? `+${fmt(diff)}` : fmt(diff))}
      </div>
      <div className="flex gap-1">
        {item.status === "previsto" && (
          <Button size="sm" variant="outline" onClick={quickMark} className="h-8">
            <Check className="h-3.5 w-3.5 mr-1" />
            {isIncome ? "Recebi" : "Paguei"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8">···</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <DollarSign className="h-4 w-4 mr-2" /> Editar valor real
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => update.mutate({ id: item.id, patch: { status: "ajustado", actual_amount: item.actual_amount ?? item.planned_amount } })}>
              <ArrowRight className="h-4 w-4 mr-2" /> Marcar como ajustado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => update.mutate({ id: item.id, patch: { status: "cancelado" } })}>
              <X className="h-4 w-4 mr-2" /> Cancelar neste mês
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => adiar.mutate(item)}>
              <CalendarX className="h-4 w-4 mr-2" /> Adiar para o próximo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => update.mutate({ id: item.id, patch: { status: "previsto", actual_amount: null, payment_date: null } })}>
              Reverter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    previsto: "bg-muted text-muted-foreground",
    pago: "bg-success/15 text-success",
    recebido: "bg-success/15 text-success",
    ajustado: "bg-info/15 text-info",
    cancelado: "bg-destructive/15 text-destructive",
    adiado: "bg-warning/15 text-warning-foreground",
  };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${map[status] ?? ""}`}>{status}</span>;
}
