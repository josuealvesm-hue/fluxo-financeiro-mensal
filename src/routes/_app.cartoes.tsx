import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, todayYearMonth } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cartoes")({
  head: () => ({ meta: [{ title: "Cartões e faturas" }] }),
  component: Cartoes,
});

const STATUS = ["prevista", "aberta", "fechada", "paga"] as const;

function Cartoes() {
  const today = todayYearMonth();
  const [{ year, month }, setYM] = useState(today);
  const qc = useQueryClient();

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => (await supabase.from("cards").select("*").order("name")).data ?? [],
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", year, month],
    queryFn: async () => (await supabase.from("card_invoices").select("*").eq("year", year).eq("month", month)).data ?? [],
  });

  const upsert = useMutation({
    mutationFn: async (inv: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("card_invoices").upsert({
        ...inv,
        user_id: u.user!.id,
        year, month,
        planned_amount: Number(inv.planned_amount) || 0,
        actual_amount: inv.actual_amount === "" || inv.actual_amount == null ? null : Number(inv.actual_amount),
      }, { onConflict: "card_id,year,month" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e: any) => toast.error(e.message),
  });

  function getInv(cardId: string) {
    return (invoices as any[]).find(i => i.card_id === cardId) ?? { card_id: cardId, planned_amount: 0, actual_amount: null, status: "prevista", due_date: null };
  }

  return (
    <>
      <PageHeader
        title="Cartões e faturas"
        description="Controle previsto vs real por cartão"
        actions={<MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />}
      />

      <div className="grid md:grid-cols-2 gap-3">
        {(cards as any[]).map(c => {
          const inv = getInv(c.id);
          const diff = Number(inv.actual_amount ?? 0) - Number(inv.planned_amount);
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{c.bank}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Previsto">
                    <Input type="number" step="0.01" defaultValue={inv.planned_amount}
                      onBlur={(e) => upsert.mutate({ ...inv, planned_amount: e.target.value })} />
                  </Field>
                  <Field label="Real / fechado">
                    <Input type="number" step="0.01" defaultValue={inv.actual_amount ?? ""}
                      onBlur={(e) => upsert.mutate({ ...inv, actual_amount: e.target.value })} />
                  </Field>
                  <Field label="Vencimento">
                    <Input type="date" defaultValue={inv.due_date ?? ""}
                      onBlur={(e) => upsert.mutate({ ...inv, due_date: e.target.value || null })} />
                  </Field>
                  <Field label="Status">
                    <Select value={inv.status} onValueChange={(v) => upsert.mutate({ ...inv, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                {inv.actual_amount != null && (
                  <div className={`text-xs ${diff > 0 ? "text-destructive" : "text-success"}`}>
                    Diferença: {diff > 0 ? "+" : ""}{fmt(diff)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
