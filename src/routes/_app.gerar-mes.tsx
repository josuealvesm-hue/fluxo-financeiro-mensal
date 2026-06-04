import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayYearMonth, MONTHS_PT } from "@/lib/finance";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/gerar-mes")({
  head: () => ({ meta: [{ title: "Gerar mês" }] }),
  component: GerarMes,
});

type Source = "base" | "previous" | "manual";

function GerarMes() {
  const today = todayYearMonth();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [source, setSource] = useState<Source>("base");
  const navigate = useNavigate();

  const generate = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user!.id;

      // check if already exists
      const { count } = await supabase.from("monthly_budget_items")
        .select("*", { count: "exact", head: true })
        .eq("year", year).eq("month", month);
      if ((count ?? 0) > 0) {
        const ok = confirm(`Já existem ${count} itens em ${MONTHS_PT[month - 1]}/${year}. Deseja apagar e gerar novamente?`);
        if (!ok) return { skipped: true };
        await supabase.from("monthly_budget_items").delete().eq("year", year).eq("month", month);
      }

      let inserted = 0;
      if (source === "base") {
        const { data: templates } = await supabase.from("budget_templates").select("*").eq("active", true);
        const ym = year * 12 + month;
        const tps = (templates ?? []).filter((t: any) => {
          const from = t.active_from_year ? t.active_from_year * 12 + (t.active_from_month || 1) : null;
          const to = t.active_to_year ? t.active_to_year * 12 + (t.active_to_month || 12) : null;
          if (from !== null && ym < from) return false;
          if (to !== null && ym > to) return false;
          if (t.recurrence === "mensal") return true;
          if (t.recurrence === "anual") return t.recurrence_month === month;
          if (t.recurrence === "unica") return true;
          return true;
        });
        // baseline planned amount; percentages calculated against entradas
        const entradasTotal = tps
          .filter((t: any) => t.type === "entrada" && t.amount_type !== "percentage")
          .reduce((a: number, t: any) => a + Number(t.default_amount || 0), 0);

        const rows = tps.map((t: any) => ({
          user_id: userId,
          month, year,
          template_id: t.id,
          name: t.name,
          type: t.type,
          group: t.group,
          category: t.category,
          subcategory: t.subcategory,
          planned_amount: t.amount_type === "percentage"
            ? +(entradasTotal * Number(t.percentage || 0) / 100).toFixed(2)
            : Number(t.default_amount || 0),
          expected_date: t.expected_day ? `${year}-${String(month).padStart(2, "0")}-${String(Math.min(28, t.expected_day)).padStart(2, "0")}` : null,
          status: "previsto" as const,
          payment_method: t.payment_method,
          account_id: t.account_id,
          card_id: t.card_id,
        }));
        if (rows.length > 0) {
          const { error } = await supabase.from("monthly_budget_items").insert(rows as any);
          if (error) throw error;
          inserted = rows.length;
        }
      } else if (source === "previous") {
        let pm = month - 1, py = year;
        if (pm < 1) { pm = 12; py--; }
        const { data: prev } = await supabase.from("monthly_budget_items")
          .select("*").eq("year", py).eq("month", pm);
        const rows = (prev ?? []).map((p: any) => ({
          user_id: userId,
          month, year,
          template_id: p.template_id,
          name: p.name, type: p.type, group: p.group,
          category: p.category, subcategory: p.subcategory,
          planned_amount: p.planned_amount,
          expected_date: p.expected_date ? p.expected_date.replace(/^\d{4}-\d{2}/, `${year}-${String(month).padStart(2, "0")}`) : null,
          status: "previsto" as const,
          payment_method: p.payment_method,
          account_id: p.account_id, card_id: p.card_id,
        }));
        if (rows.length > 0) {
          const { error } = await supabase.from("monthly_budget_items").insert(rows as any);
          if (error) throw error;
          inserted = rows.length;
        }
      }

      // create card invoices placeholders
      const { data: cards } = await supabase.from("cards").select("*").eq("active", true);
      for (const c of cards ?? []) {
        const due = c.due_day ? `${year}-${String(month).padStart(2, "0")}-${String(Math.min(28, c.due_day)).padStart(2, "0")}` : null;
        await supabase.from("card_invoices").upsert({
          user_id: userId, card_id: c.id, month, year, due_date: due,
        }, { onConflict: "card_id,year,month" });
      }

      // ensure swile row
      await supabase.from("swile_months").upsert({
        user_id: userId, month, year,
      }, { onConflict: "user_id,year,month" });

      return { inserted };
    },
    onSuccess: (r: any) => {
      if (r?.skipped) return;
      toast.success(`${r.inserted ?? 0} itens criados`);
      navigate({ to: "/executar", search: { year, month } as any });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="Gerar orçamento mensal" description="Crie automaticamente os itens previstos do mês" />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Mês alvo</CardTitle>
          <CardDescription>Escolha a origem dos itens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS_PT.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Gerar com base no Orçamento Base</SelectItem>
                <SelectItem value="previous">Copiar do mês anterior</SelectItem>
                <SelectItem value="manual">Manual (mês vazio)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="w-full">
            {generate.isPending ? "Gerando..." : "Gerar mês"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
