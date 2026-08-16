CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  status text NOT NULL,
  payment_method text,
  payment_type text,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  shipping_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_read_orders" ON public.orders;
CREATE POLICY "session_read_orders" ON public.orders FOR SELECT
  TO anon, authenticated
  USING (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_insert_orders" ON public.orders;
CREATE POLICY "session_insert_orders" ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_update_orders" ON public.orders;
CREATE POLICY "session_update_orders" ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (session_id = public.current_session_header())
  WITH CHECK (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_delete_orders" ON public.orders;
CREATE POLICY "session_delete_orders" ON public.orders FOR DELETE
  TO anon, authenticated
  USING (session_id = public.current_session_header());
