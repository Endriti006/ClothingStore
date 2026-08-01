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

-- Public read/write for demo storefront/admin tooling.
-- Tighten these in production with auth-based policies.
DROP POLICY IF EXISTS "public_read_carts" ON carts;
CREATE POLICY "public_read_carts" ON carts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_carts" ON carts;
CREATE POLICY "public_write_carts" ON carts FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_cart_items" ON cart_items;
CREATE POLICY "public_read_cart_items" ON cart_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_write_cart_items" ON cart_items;
CREATE POLICY "public_write_cart_items" ON cart_items FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_write_products" ON products;
CREATE POLICY "public_write_products" ON products FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_write_product_images" ON product_images;
CREATE POLICY "public_write_product_images" ON product_images FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_write_product_skus" ON product_skus;
CREATE POLICY "public_write_product_skus" ON product_skus FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_write_categories" ON categories;
CREATE POLICY "public_write_categories" ON categories FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
