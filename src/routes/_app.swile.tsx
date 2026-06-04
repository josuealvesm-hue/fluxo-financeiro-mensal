import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, todayYearMonth } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/swile")({
  head: () => ({ meta: [{ title: "Swile" }] }),
  component: SwilePage,
});

function SwilePage() {
  const today = todayYearMonth();
  const [{ year, month }, setYM] = useState(today);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["swile", year, month],
    queryFn: async () => {
      const { data } = await supabase.from("swile_months").select("*").eq("year", year).eq("month", month).maybeSingle();
      return data ?? { mobility_planned: 0, food_planned: 0, used_amount: 0, status: "aberto" };
    },
  });

  const save = useMutation({
    mutationFn: async (patch: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("swile_months").upsert({
        user_id: u.user!.id, year, month,
        ...data, ...patch,
        mobility_planned: Number((patch.mobility_planned ?? (data as any).mobility_planned) || 0),
        food_planned: Number((patch.food_planned ?? (data as any).food_planned) || 0),
        used_amount: Number((patch.used_amount ?? (data as any).used_amount) || 0),
      }, { onConflict: "user_id,year,month" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swile", year, month] }),
    onError: (e: any) => toast.error(e.message),
  });

  const d = data as any;
  const total = Number(d?.mobility_planned ?? 0) + Number(d?.food_planned ?? 0);
  const saldo = total - Number(d?.used_amount ?? 0);

  return (
    <>
      <PageHeader
        title="Swile"
        description="Controle do benefício do mês"
        actions={<MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />}
      />
      {isLoading ? null : (
        <Card className="max-w-2xl">
          <CardHeader><CardTitle>Mês</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mobilidade previsto (R$)</Label>
              <Input type="number" step="0.01" defaultValue={d.mobility_planned}
                onBlur={(e) => save.mutate({ mobility_planned: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Alimentação previsto (R$)</Label>
              <Input type="number" step="0.01" defaultValue={d.food_planned}
                onBlur={(e) => save.mutate({ food_planned: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Utilizado (R$)</Label>
              <Input type="number" step="0.01" defaultValue={d.used_amount}
                onBlur={(e) => save.mutate({ used_amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={d.status} onValueChange={(v) => save.mutate({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <div className="text-xs text-muted-foreground">Total previsto</div>
                <div className="text-xl font-semibold tabular-nums">{fmt(total)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Saldo</div>
                <div className={`text-xl font-semibold tabular-nums ${saldo < 0 ? "text-destructive" : "text-success"}`}>{fmt(saldo)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
