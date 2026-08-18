/* Seed a compact, production-shaped starter catalog for local/staging stores. */

INSERT INTO categories (name, slug, parent_id, image_url)
VALUES
  ('T-Shirts', 't-shirts', NULL, 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Shoes', 'kepuce', NULL, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Hats', 'hats', NULL, 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1200'),
  ('Accessories', 'aksesoore', NULL, 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=1200')
ON CONFLICT (slug) DO NOTHING;

WITH seed_products (name, slug, description, price, compare_at_price, category_slug, brand, material, audience, featured, rating, review_count) AS (
  VALUES
    ('Essential Heavyweight Tee', 'essential-heavyweight-tee', 'A structured everyday T-shirt with a relaxed fit and a clean, substantial hand feel.', 34.00, 42.00, 't-shirts', 'Northline', '100% organic cotton', 'unisex', true, 4.8, 24),
    ('Studio Ribbed Tee', 'studio-ribbed-tee', 'A softly ribbed tee with a close fit, finished for easy layering from morning to night.', 29.00, NULL, 't-shirts', 'Forma', '95% cotton, 5% elastane', 'women', false, 4.7, 18),
    ('Transit Boxy Tee', 'transit-boxy-tee', 'A breathable boxy silhouette with dropped shoulders and a precise midweight drape.', 32.00, NULL, 't-shirts', 'Northline', '100% cotton', 'men', false, 4.6, 12),
    ('Low-Profile Court Sneaker', 'low-profile-court-sneaker', 'A versatile leather court sneaker with a cushioned footbed and a clean low profile.', 118.00, 145.00, 'kepuce', 'Aster', 'Leather upper, rubber sole', 'unisex', true, 4.9, 31),
    ('Sculpt Runner', 'sculpt-runner', 'A lightweight everyday runner with a supportive mesh upper and responsive foam sole.', 96.00, NULL, 'kepuce', 'Aster', 'Engineered mesh, EVA sole', 'unisex', false, 4.7, 16),
    ('Everyday Canvas Cap', 'everyday-canvas-cap', 'A six-panel cotton cap with an adjustable back strap and an understated embroidered mark.', 28.00, NULL, 'hats', 'Forma', 'Washed cotton canvas', 'unisex', false, 4.8, 20),
    ('Wool Blend Baker Boy', 'wool-blend-baker-boy', 'A softly tailored wool-blend cap that adds texture without overpowering the outfit.', 46.00, NULL, 'hats', 'Forma', 'Wool blend', 'women', false, 4.6, 9),
    ('Minimal Leather Belt', 'minimal-leather-belt', 'A full-grain leather belt with a quiet brushed buckle for everyday tailoring.', 52.00, NULL, 'aksesoore', 'Northline', 'Full-grain leather', 'men', false, 4.8, 14)
), inserted_products AS (
  INSERT INTO products (name, slug, description, price, compare_at_price, category_id, brand, material, audience, status, featured, rating, review_count)
  SELECT
    seed.name,
    seed.slug,
    seed.description,
    seed.price,
    seed.compare_at_price,
    category.id,
    seed.brand,
    seed.material,
    seed.audience,
    'published',
    seed.featured,
    seed.rating,
    seed.review_count
  FROM seed_products seed
  JOIN categories category ON category.slug = seed.category_slug
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
SELECT count(*) FROM inserted_products;

WITH seed_images (slug, position, url) AS (
  VALUES
    ('essential-heavyweight-tee', 0, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('essential-heavyweight-tee', 1, 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('studio-ribbed-tee', 0, 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('studio-ribbed-tee', 1, 'https://images.pexels.com/photos/769730/pexels-photo-769730.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('transit-boxy-tee', 0, 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('low-profile-court-sneaker', 0, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('low-profile-court-sneaker', 1, 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('sculpt-runner', 0, 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('sculpt-runner', 1, 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('everyday-canvas-cap', 0, 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('wool-blend-baker-boy', 0, 'https://images.pexels.com/photos/984619/pexels-photo-984619.jpeg?auto=compress&cs=tinysrgb&w=1200'),
    ('minimal-leather-belt', 0, 'https://images.pexels.com/photos/45055/pexels-photo-45055.jpeg?auto=compress&cs=tinysrgb&w=1200')
)
INSERT INTO product_images (product_id, url, position)
SELECT product.id, seed.url, seed.position
FROM seed_images seed
JOIN products product ON product.slug = seed.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_images image
  WHERE image.product_id = product.id AND image.position = seed.position
);

WITH seed_skus (slug, size, color, stock) AS (
  VALUES
    ('essential-heavyweight-tee', 'S', 'Black', 12), ('essential-heavyweight-tee', 'M', 'Black', 18), ('essential-heavyweight-tee', 'L', 'Black', 14), ('essential-heavyweight-tee', 'XL', 'Black', 8),
    ('studio-ribbed-tee', 'XS', 'White', 8), ('studio-ribbed-tee', 'S', 'White', 12), ('studio-ribbed-tee', 'M', 'White', 10), ('studio-ribbed-tee', 'L', 'White', 6),
    ('transit-boxy-tee', 'S', 'Olive', 10), ('transit-boxy-tee', 'M', 'Olive', 16), ('transit-boxy-tee', 'L', 'Olive', 12), ('transit-boxy-tee', 'XL', 'Olive', 7),
    ('low-profile-court-sneaker', '40', 'White', 4), ('low-profile-court-sneaker', '41', 'White', 8), ('low-profile-court-sneaker', '42', 'White', 10), ('low-profile-court-sneaker', '43', 'White', 7), ('low-profile-court-sneaker', '44', 'White', 3),
    ('sculpt-runner', '40', 'Stone', 5), ('sculpt-runner', '41', 'Stone', 9), ('sculpt-runner', '42', 'Stone', 11), ('sculpt-runner', '43', 'Stone', 8), ('sculpt-runner', '44', 'Stone', 4),
    ('everyday-canvas-cap', NULL, 'Navy', 18), ('wool-blend-baker-boy', 'M', 'Charcoal', 9), ('minimal-leather-belt', 'M', 'Brown', 8), ('minimal-leather-belt', 'L', 'Brown', 11), ('minimal-leather-belt', 'XL', 'Brown', 6)
)
INSERT INTO product_skus (product_id, size, color, stock)
SELECT product.id, seed.size, seed.color, seed.stock
FROM seed_skus seed
JOIN products product ON product.slug = seed.slug
WHERE NOT EXISTS (
  SELECT 1 FROM product_skus sku
  WHERE sku.product_id = product.id
    AND sku.size IS NOT DISTINCT FROM seed.size
    AND sku.color IS NOT DISTINCT FROM seed.color
);