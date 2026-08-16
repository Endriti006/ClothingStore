/*
# Create storefront schema (categories, products, variants, images, reviews)

1. Overview
This migration sets up the public catalog schema for the e-commerce storefront.
It is the foundation for Phase 1 (homepage + product listing/detail) and is
designed to be extended in later phases with auth, cart, orders, and admin.

2. New Tables
- `categories`: top-level and nested categories (Men, Women, Shoes, Accessories).
  - `id` uuid pk
  - `name` text not null
  - `slug` text unique not null
  - `parent_id` uuid self-reference (null = top-level)
  - `image_url` text
  - `created_at` timestamptz
- `products`: sellable items.
  - `id` uuid pk
  - `name` text not null
  - `slug` text unique not null
  - `description` text
  - `price` numeric(10,2) not null
  - `compare_at_price` numeric(10,2) null (original price for discount badge)
  - `category_id` uuid fk -> categories
  - `brand` text
  - `material` text
  - `status` text default 'published' (draft|published|out_of_stock)
  - `featured` boolean default false
  - `rating` numeric(2,1) default 0
  - `review_count` integer default 0
  - `created_at` timestamptz
- `product_images`: multiple images per product, ordered.
  - `id` uuid pk
  - `product_id` uuid fk -> products
  - `url` text not null
  - `position` integer default 0
- `product_skus`: size/color variants with per-variant stock.
  - `id` uuid pk
  - `product_id` uuid fk -> products
  - `size` text
  - `color` text
  - `stock` integer default 0
- `reviews`: customer reviews tied to products.
  - `id` uuid pk
  - `product_id` uuid fk -> products
  - `rating` integer (1-5)
  - `title` text
  - `body` text
  - `author_name` text
  - `approved` boolean default false
  - `created_at` timestamptz

3. Indexes
- products.slug (unique), products.category_id, products.status, products.featured
- product_images.product_id, product_skus.product_id, reviews.product_id
- categories.slug (unique), categories.parent_id

4. Security
- RLS enabled on every table.
- The storefront is a public catalog (no sign-in required to browse), so SELECT
  policies are scoped TO anon, authenticated with USING (true) for catalog reads.
  This is the documented single-tenant/public-data exception.
- Write policies (insert/update/delete) are scoped TO authenticated and will be
  wired up in the auth + admin phase. For now only SELECT is open to anon so the
  storefront renders without a session.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand text,
  material text,
  status text NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Product SKUs (size/color variants with stock)
CREATE TABLE IF NOT EXISTS product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  size text,
  color text,
  stock integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON product_skus(product_id);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  author_name text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Enable RLS everywhere
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public catalog read policies remain intentionally open for storefront browsing.
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_product_images" ON product_images;
CREATE POLICY "anon_read_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_product_skus" ON product_skus;
CREATE POLICY "anon_read_product_skus" ON product_skus FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_approved_reviews" ON reviews;
CREATE POLICY "anon_read_approved_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (approved = true);

-- Restrict mutating catalog/admin data to authenticated users only.
DROP POLICY IF EXISTS "authenticated_write_categories" ON categories;
CREATE POLICY "authenticated_write_categories" ON categories FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_products" ON products;
CREATE POLICY "authenticated_write_products" ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_product_images" ON product_images;
CREATE POLICY "authenticated_write_product_images" ON product_images FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_product_skus" ON product_skus;
CREATE POLICY "authenticated_write_product_skus" ON product_skus FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_write_reviews" ON reviews;
CREATE POLICY "authenticated_write_reviews" ON reviews FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
