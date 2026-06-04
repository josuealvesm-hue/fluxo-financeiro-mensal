
-- ENUMS
CREATE TYPE public.budget_type AS ENUM ('entrada','saida','investimento','credito');
CREATE TYPE public.amount_type AS ENUM ('fixed','variable','percentage');
CREATE TYPE public.recurrence_type AS ENUM ('mensal','anual','unica','personalizada');
CREATE TYPE public.item_status AS ENUM ('previsto','pago','recebido','ajustado','cancelado','adiado');
CREATE TYPE public.invoice_status AS ENUM ('prevista','aberta','fechada','paga');

-- ACCOUNTS
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  bank text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- CARDS
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank text,
  closing_day int,
  due_day int,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.cards FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- FUNDS
CREATE TABLE public.funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  percentage numeric(6,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funds TO authenticated;
GRANT ALL ON public.funds TO service_role;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own funds" ON public.funds FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- BUDGET TEMPLATES
CREATE TABLE public.budget_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.budget_type NOT NULL,
  "group" text NOT NULL,
  category text,
  subcategory text,
  default_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount_type public.amount_type NOT NULL DEFAULT 'fixed',
  percentage numeric(6,2),
  expected_day int,
  recurrence public.recurrence_type NOT NULL DEFAULT 'mensal',
  recurrence_month int, -- for anual
  payment_method text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_templates TO authenticated;
GRANT ALL ON public.budget_templates TO service_role;
ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.budget_templates FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- MONTHLY BUDGET ITEMS
CREATE TABLE public.monthly_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month int NOT NULL,
  year int NOT NULL,
  template_id uuid REFERENCES public.budget_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  type public.budget_type NOT NULL,
  "group" text NOT NULL,
  category text,
  subcategory text,
  planned_amount numeric(12,2) NOT NULL DEFAULT 0,
  actual_amount numeric(12,2),
  expected_date date,
  payment_date date,
  status public.item_status NOT NULL DEFAULT 'previsto',
  payment_method text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.monthly_budget_items (user_id, year, month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_budget_items TO authenticated;
GRANT ALL ON public.monthly_budget_items TO service_role;
ALTER TABLE public.monthly_budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items" ON public.monthly_budget_items FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- EXTRA TRANSACTIONS
CREATE TABLE public.extra_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  month int NOT NULL,
  year int NOT NULL,
  type public.budget_type NOT NULL,
  "group" text,
  category text,
  subcategory text,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  status public.item_status NOT NULL DEFAULT 'pago',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.extra_transactions (user_id, year, month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extra_transactions TO authenticated;
GRANT ALL ON public.extra_transactions TO service_role;
ALTER TABLE public.extra_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own extras" ON public.extra_transactions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- CARD INVOICES
CREATE TABLE public.card_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  month int NOT NULL,
  year int NOT NULL,
  planned_amount numeric(12,2) NOT NULL DEFAULT 0,
  actual_amount numeric(12,2),
  due_date date,
  status public.invoice_status NOT NULL DEFAULT 'prevista',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (card_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_invoices TO authenticated;
GRANT ALL ON public.card_invoices TO service_role;
ALTER TABLE public.card_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices" ON public.card_invoices FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- SWILE MONTHS
CREATE TABLE public.swile_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month int NOT NULL,
  year int NOT NULL,
  mobility_planned numeric(12,2) NOT NULL DEFAULT 0,
  food_planned numeric(12,2) NOT NULL DEFAULT 0,
  used_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberto',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swile_months TO authenticated;
GRANT ALL ON public.swile_months TO service_role;
ALTER TABLE public.swile_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own swile" ON public.swile_months FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Function to seed defaults on new user signup
CREATE OR REPLACE FUNCTION public.seed_user_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cards (user_id, name, bank) VALUES
    (NEW.id, 'Santander Unique', 'Santander'),
    (NEW.id, 'Santander Elite', 'Santander'),
    (NEW.id, 'Nubank Josué', 'Nubank'),
    (NEW.id, 'Nubank Yasmin', 'Nubank'),
    (NEW.id, 'Bradesco', 'Bradesco'),
    (NEW.id, 'C6', 'C6');
  INSERT INTO public.funds (user_id, name, percentage) VALUES
    (NEW.id, 'Poupança Rafael', 8),
    (NEW.id, 'Poupança Davi', 8),
    (NEW.id, 'Roupas/Calçados', 9),
    (NEW.id, 'Viagens', 10),
    (NEW.id, 'Reserva de Emergência', 15);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seed_user_defaults();
