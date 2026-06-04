import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, todayYearMonth, GROUPS } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { MonthPicker } from "@/components/MonthPicker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/excecoes")({
  head: () => ({ meta: [{ title: "Exceções" }] }),
  component: Excecoes,
});

function Excecoes() {
  const today = todayYearMonth();
  const [{ year, month }, setYM] = useState(today);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const empty = {
    date: new Date().toISOString().slice(0, 10),
    type: "saida", group: "Variáveis", category: "", subcategory: "",
    description: "", amount: 0, payment_method: "", account_id: null, card_id: null,
    status: "pago", notes: "",
  };
  const [form, setForm] = useState<any>(empty);

  const { data: list = [] } = useQuery({
    queryKey: ["extras", year, month],
    queryFn: async () => (await supabase.from("extra_transactions").select("*").eq("year", year).eq("month", month).order("date", { ascending: false })).data ?? [],
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["accounts"], queryFn: async () => (await supabase.from("accounts").select("*")).data ?? [] });
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: async () => (await supabase.from("cards").select("*")).data ?? [] });

  const save = useMutation({
    mutationFn: async (f: any) => {
      const { data: u } = await supabase.auth.getUser();
      const d = new Date(f.date);
      const { error } = await supabase.from("extra_transactions").insert({
        ...f,
        amount: Number(f.amount),
        month: d.getMonth() + 1, year: d.getFullYear(),
        account_id: f.account_id || null, card_id: f.card_id || null,
        user_id: u.user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["extras"] }); setOpen(false); setForm(empty); toast.success("Exceção registrada"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extra_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extras"] }),
  });

  const u = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <>
      <PageHeader
        title="Exceções do mês"
        description="Gastos ou entradas não previstos no orçamento base"
        actions={
          <>
            <MonthPicker year={year} month={month} onChange={(y, m) => setYM({ year: y, month: m })} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova exceção</Button></DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nova exceção</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => u("date", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => u("type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Grupo</Label>
                    <Select value={form.group} onValueChange={(v) => u("group", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => u("amount", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Categoria</Label><Input value={form.category} onChange={(e) => u("category", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Subcategoria</Label><Input value={form.subcategory} onChange={(e) => u("subcategory", e.target.value)} /></div>
                  <div className="col-span-2 space-y-1.5"><Label>Descrição</Label><Input value={form.description} onChange={(e) => u("description", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Forma de pagamento</Label><Input value={form.payment_method} onChange={(e) => u("payment_method", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => u("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem><SelectItem value="recebido">Recebido</SelectItem><SelectItem value="previsto">Previsto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Conta</Label>
                    <Select value={form.account_id ?? "none"} onValueChange={(v) => u("account_id", v === "none" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">Nenhuma</SelectItem>{(accounts as any[]).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Cartão</Label>
                    <Select value={form.card_id ?? "none"} onValueChange={(v) => u("card_id", v === "none" ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">Nenhum</SelectItem>{(cards as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => u("notes", e.target.value)} /></div>
                </div>
                <DialogFooter>
                  <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.description}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Grupo</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(list as any[]).length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem exceções neste mês</td></tr>
              )}
              {(list as any[]).map(t => (
                <tr key={t.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground tabular-nums">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3 text-muted-foreground">{t.group}</td>
                  <td className={`p-3 text-right tabular-nums ${t.type === "entrada" ? "text-success" : "text-destructive"}`}>{fmt(t.amount)}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover?")) del.mutate(t.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
