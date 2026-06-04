import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, summarize, todayYearMonth } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fundos")({
  head: () => ({ meta: [{ title: "Fundos e investimentos" }] }),
  component: Fundos,
});

function Fundos() {
  const today = todayYearMonth();
  const [{ year, month }, setYM] = useState(today);
  const qc = useQueryClient();

  const { data: funds = [] } = useQuery({
    queryKey: ["funds"],
    queryFn: async () => (await supabase.from("funds").select("*").order("name")).data ?? [],
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items", year, month],
    queryFn: async () => (await supabase.from("monthly_budget_items").select("*").eq("year", year).eq("month", month)).data ?? [],
  });
  const { data: extras = [] } = useQuery({
    queryKey: ["extras", year, month],
    queryFn: async () => (await supabase.from("extra_transactions").select("*").eq("year", year).eq("month", month)).data ?? [],
  });

  const s = summarize(items as any, extras as any);
  const saldoPositivo = Math.max(0, s.saldoReal);

  const save = useMutation({
    mutationFn: async (f: any) => {
      const { id, ...rest } = f;
      if (id) {
        const { error } = await supabase.from("funds").update({ ...rest, percentage: Number(rest.percentage) || 0 }).eq("id", id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("funds").insert({ ...rest, percentage: Number(rest.percentage) || 0, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("funds").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds"] }),
  });

  const [newName, setNewName] = useState("");
  const [newPct, setNewPct] = useState("");

  const totalPct = (funds as any[]).filter(f => f.active).reduce((a, f) => a + Number(f.percentage), 0);

  return (
    <>
      <PageHeader
        title="Fundos e investimentos"
        description="Percentual aplicado ao saldo positivo do mês"
        actions={<MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Distribuição do mês</CardTitle>
          <CardDescription>Saldo positivo do mês: <strong className="text-success">{fmt(saldoPositivo)}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">Total alocado: {totalPct.toFixed(2)}%</div>
          <div className="space-y-1.5">
            {(funds as any[]).filter(f => f.active).map(f => (
              <div key={f.id} className="flex justify-between text-sm">
                <span>{f.name} <span className="text-muted-foreground">({f.percentage}%)</span></span>
                <span className="tabular-nums font-medium">{fmt(saldoPositivo * Number(f.percentage) / 100)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configurar fundos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(funds as any[]).map(f => (
            <div key={f.id} className="flex items-center gap-2">
              <Input className="flex-1" defaultValue={f.name} onBlur={(e) => e.target.value !== f.name && save.mutate({ ...f, name: e.target.value })} />
              <Input type="number" step="0.01" className="w-24" defaultValue={f.percentage}
                onBlur={(e) => Number(e.target.value) !== Number(f.percentage) && save.mutate({ ...f, percentage: e.target.value })} />
              <span className="text-sm text-muted-foreground">%</span>
              <Switch checked={f.active} onCheckedChange={(v) => save.mutate({ ...f, active: v })} />
              <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover?")) del.mutate(f.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input className="flex-1" placeholder="Nome do novo fundo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input type="number" step="0.01" className="w-24" placeholder="%" value={newPct} onChange={(e) => setNewPct(e.target.value)} />
            <Button onClick={() => { if (newName) { save.mutate({ name: newName, percentage: newPct, active: true }); setNewName(""); setNewPct(""); } }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
