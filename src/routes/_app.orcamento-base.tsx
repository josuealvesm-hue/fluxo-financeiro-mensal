import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmt, GROUPS, MONTHS_PT } from "@/lib/finance";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orcamento-base")({
  head: () => ({ meta: [{ title: "Orçamento Base" }] }),
  component: OrcamentoBase,
});

const TYPES = ["entrada", "saida", "investimento", "credito"] as const;
const AMOUNT_TYPES = ["fixed", "variable", "percentage"] as const;
const RECURRENCES = ["mensal", "anual", "unica", "personalizada"] as const;

type Template = any;
const empty: Template = {
  name: "", type: "saida", group: "Essencial Casa", category: "", subcategory: "",
  default_amount: 0, amount_type: "fixed", percentage: null, expected_day: null,
  recurrence: "mensal", recurrence_month: null, payment_method: "", account_id: null,
  card_id: null, active: true, notes: "",
  active_from_month: null, active_from_year: null, active_to_month: null, active_to_year: null,
};

function OrcamentoBase() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template>(empty);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await supabase.from("budget_templates").select("*").order("group").order("name")).data ?? [],
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await supabase.from("accounts").select("*").eq("active", true)).data ?? [],
  });
  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => (await supabase.from("cards").select("*").eq("active", true)).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (t: Template) => {
      const { id, ...rest } = t;
      const payload = {
        ...rest,
        default_amount: Number(rest.default_amount) || 0,
        percentage: rest.amount_type === "percentage" ? Number(rest.percentage) || 0 : null,
        expected_day: rest.expected_day ? Number(rest.expected_day) : null,
        account_id: rest.account_id || null,
        card_id: rest.card_id || null,
        active_from_month: rest.active_from_month ? Number(rest.active_from_month) : null,
        active_from_year: rest.active_from_year ? Number(rest.active_from_year) : null,
        active_to_month: rest.active_to_month ? Number(rest.active_to_month) : null,
        active_to_year: rest.active_to_year ? Number(rest.active_to_year) : null,
      };
      if (id) {
        const { error } = await supabase.from("budget_templates").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("budget_templates").insert({ ...payload, user_id: u.user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); setOpen(false); toast.success("Salvo"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast.success("Removido"); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("budget_templates").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const list = (templates as any[]).filter(t => filter === "all" || t.group === filter);

  return (
    <>
      <PageHeader
        title="Orçamento Base"
        description="Itens recorrentes usados para gerar cada mês"
        actions={
          <>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4 mr-1" /> Novo item</Button>
              </DialogTrigger>
              <TemplateDialog
                item={editing}
                onChange={setEditing}
                onSave={() => save.mutate(editing)}
                accounts={accounts as any[]}
                cards={cards as any[]}
                saving={save.isPending}
              />
            </Dialog>
          </>
        }
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Grupo</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-center p-3">Dia</th>
                <th className="text-center p-3">Ativo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum item cadastrado. Clique em "Novo item".</td></tr>
              )}
              {list.map(t => (
                <tr key={t.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{t.name}</div>
                    {t.category && <div className="text-xs text-muted-foreground">{t.category}{t.subcategory ? ` › ${t.subcategory}` : ""}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground">{t.group}</td>
                  <td className="p-3">
                    <span className="capitalize text-xs px-2 py-0.5 rounded bg-accent">{t.type}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {t.amount_type === "percentage" ? `${t.percentage}%` : fmt(t.default_amount)}
                  </td>
                  <td className="p-3 text-center">{t.expected_day || "-"}</td>
                  <td className="p-3 text-center">
                    <Switch checked={t.active} onCheckedChange={(v) => toggleActive.mutate({ id: t.id, active: v })} />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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

function TemplateDialog({ item, onChange, onSave, accounts, cards, saving }: any) {
  const u = (k: string, v: any) => onChange({ ...item, [k]: v });
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{item.id ? "Editar item" : "Novo item do orçamento"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Nome</Label>
          <Input value={item.name} onChange={(e) => u("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={item.type} onValueChange={(v) => u("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Grupo</Label>
          <Select value={item.group} onValueChange={(v) => u("group", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Input value={item.category ?? ""} onChange={(e) => u("category", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Subcategoria</Label>
          <Input value={item.subcategory ?? ""} onChange={(e) => u("subcategory", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de valor</Label>
          <Select value={item.amount_type} onValueChange={(v) => u("amount_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixo</SelectItem>
              <SelectItem value="variable">Variável</SelectItem>
              <SelectItem value="percentage">Percentual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {item.amount_type === "percentage" ? (
          <div className="space-y-1.5">
            <Label>Percentual (%)</Label>
            <Input type="number" step="0.01" value={item.percentage ?? ""} onChange={(e) => u("percentage", e.target.value)} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Valor padrão (R$)</Label>
            <Input type="number" step="0.01" value={item.default_amount} onChange={(e) => u("default_amount", e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Dia previsto</Label>
          <Input type="number" min={1} max={31} value={item.expected_day ?? ""} onChange={(e) => u("expected_day", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Recorrência</Label>
          <Select value={item.recurrence} onValueChange={(v) => u("recurrence", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{RECURRENCES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {item.recurrence === "anual" && (
          <div className="space-y-1.5">
            <Label>Mês (1-12)</Label>
            <Input type="number" min={1} max={12} value={item.recurrence_month ?? ""} onChange={(e) => u("recurrence_month", Number(e.target.value))} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Input value={item.payment_method ?? ""} onChange={(e) => u("payment_method", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Select value={item.account_id ?? "none"} onValueChange={(v) => u("account_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cartão</Label>
          <Select value={item.card_id ?? "none"} onValueChange={(v) => u("card_id", v === "none" ? null : v)}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {cards.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3 p-3 rounded-md border bg-muted/30">
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Vigência</div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ativo a partir de</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={item.active_from_month ? String(item.active_from_month) : "none"} onValueChange={(v) => u("active_from_month", v === "none" ? null : Number(v))}>
                <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sempre</SelectItem>
                  {MONTHS_PT.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Ano" value={item.active_from_year ?? ""} onChange={(e) => u("active_from_year", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ativo até</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={item.active_to_month ? String(item.active_to_month) : "none"} onValueChange={(v) => u("active_to_month", v === "none" ? null : Number(v))}>
                <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem fim</SelectItem>
                  {MONTHS_PT.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Ano" value={item.active_to_year ?? ""} onChange={(e) => u("active_to_year", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={2} value={item.notes ?? ""} onChange={(e) => u("notes", e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Switch checked={item.active} onCheckedChange={(v) => u("active", v)} />
          <Label>Ativo</Label>
        </div>

      </div>
      <DialogFooter>
        <Button onClick={onSave} disabled={saving || !item.name}>{saving ? "Salvando..." : "Salvar"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
