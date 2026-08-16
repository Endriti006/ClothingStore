/*
Adds cart persistence tables and write policies required by the in-app admin panel.
This keeps the storefront editable from the UI and allows guest cart sync by session id.
*/

-- Guest cart container by browser session id
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cart line items snapshot product data at the time of add-to-cart
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  slug text NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  image text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_carts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION public.set_carts_updated_at();

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Restrict cart data to the requesting browser session.
CREATE OR REPLACE FUNCTION public.current_session_header()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('request.headers', true)::json->>'x-session-id', '');
$$;

DROP POLICY IF EXISTS "session_read_carts" ON carts;
CREATE POLICY "session_read_carts" ON carts FOR SELECT
  TO anon, authenticated
  USING (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_write_carts" ON carts;
CREATE POLICY "session_write_carts" ON carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_update_carts" ON carts;
CREATE POLICY "session_update_carts" ON carts FOR UPDATE
  TO anon, authenticated
  USING (session_id = public.current_session_header())
  WITH CHECK (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_delete_carts" ON carts;
CREATE POLICY "session_delete_carts" ON carts FOR DELETE
  TO anon, authenticated
  USING (session_id = public.current_session_header());

DROP POLICY IF EXISTS "session_read_cart_items" ON cart_items;
CREATE POLICY "session_read_cart_items" ON cart_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.session_id = public.current_session_header()
    )
  );

DROP POLICY IF EXISTS "session_write_cart_items" ON cart_items;
CREATE POLICY "session_write_cart_items" ON cart_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.session_id = public.current_session_header()
    )
  );

DROP POLICY IF EXISTS "session_update_cart_items" ON cart_items;
CREATE POLICY "session_update_cart_items" ON cart_items FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.session_id = public.current_session_header()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.session_id = public.current_session_header()
    )
  );

DROP POLICY IF EXISTS "session_delete_cart_items" ON cart_items;
CREATE POLICY "session_delete_cart_items" ON cart_items FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.session_id = public.current_session_header()
    )
  );

-- Admin-side catalog writes are now authenticated-only; this requires a real Supabase auth session.
DROP POLICY IF EXISTS "authenticated_write_products_admin" ON products;
CREATE POLICY "authenticated_write_products_admin" ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_product_images_admin" ON product_images;
CREATE POLICY "authenticated_write_product_images_admin" ON product_images FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_product_skus_admin" ON product_skus;
CREATE POLICY "authenticated_write_product_skus_admin" ON product_skus FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_categories_admin" ON categories;
CREATE POLICY "authenticated_write_categories_admin" ON categories FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
