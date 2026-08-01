ALTER TABLE products
ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'unisex';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_audience_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_audience_check CHECK (audience IN ('men', 'women', 'unisex'));
  END IF;
END $$;

WITH RECURSIVE category_tree AS (
  SELECT id, parent_id, slug, slug AS root_slug
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  SELECT child.id, child.parent_id, child.slug, tree.root_slug
  FROM categories child
  JOIN category_tree tree ON tree.id = child.parent_id
), product_audience AS (
  SELECT
    products.id,
    CASE
      WHEN category_tree.root_slug = 'meshkuj' THEN 'men'
      WHEN category_tree.root_slug = 'femra' THEN 'women'
      ELSE 'unisex'
    END AS audience
  FROM products
  LEFT JOIN category_tree ON category_tree.id = products.category_id
)
UPDATE products
SET audience = product_audience.audience
FROM product_audience
WHERE product_audience.id = products.id;

CREATE INDEX IF NOT EXISTS idx_products_audience ON products(audience);