import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  return <Navigate to={session ? "/dashboard" : "/login"} replace />;
}
