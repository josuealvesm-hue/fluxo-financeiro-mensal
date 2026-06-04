import { createFileRoute, Outlet, Link, Navigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ListChecks, FileSpreadsheet, CalendarPlus,
  AlertCircle, CreditCard, Wallet, PiggyBank, LogOut,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/executar", label: "Executar mês", icon: ListChecks },
  { to: "/orcamento-base", label: "Orçamento base", icon: FileSpreadsheet },
  { to: "/gerar-mes", label: "Gerar mês", icon: CalendarPlus },
  { to: "/excecoes", label: "Exceções", icon: AlertCircle },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/swile", label: "Swile", icon: Wallet },
  { to: "/fundos", label: "Fundos", icon: PiggyBank },
] as const;

function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;

  async function logout() {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:border-r md:bg-sidebar md:text-sidebar-foreground">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="font-semibold text-lg">Orçamento</div>
          <div className="text-xs text-muted-foreground truncate">{session.user.email}</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-2 flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-sidebar">
        <div className="font-semibold">Orçamento</div>
        <button onClick={logout} aria-label="Sair">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-sidebar-border grid grid-cols-4 z-50">
        {NAV.slice(0, 4).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center justify-center py-2 text-[10px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5 mb-0.5" />
            {n.label}
          </Link>
        ))}
      </nav>

      <Toaster />
    </div>
  );
}
