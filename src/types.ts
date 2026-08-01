export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
};

export type ProductAudience = 'men' | 'women' | 'unisex';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  brand: string | null;
  material: string | null;
  audience: ProductAudience;
  status: 'draft' | 'published' | 'out_of_stock';
  featured: boolean;
  rating: number;
  review_count: number;
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  position: number;
};

export type ProductSku = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

export type Review = {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author_name: string | null;
  approved: boolean;
  created_at: string;
};

export type ProductWithRelations = Product & {
  images: ProductImage[];
  skus: ProductSku[];
  category: Category | null;
  reviews?: Review[];
};
