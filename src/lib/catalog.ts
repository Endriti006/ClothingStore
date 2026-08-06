import { supabase } from './supabase';
import type { Category, Product, ProductAudience, ProductWithRelations } from '../types';

const MISSING_AUDIENCE_COLUMN = "Could not find the 'audience' column";
let audienceColumnSupport: boolean | null = null;

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchTopCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeaturedProducts(limit = 8): Promise<ProductWithRelations[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      skus:product_skus(*),
      category:categories(*)
    `)
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

export async function fetchNewArrivals(limit = 8): Promise<ProductWithRelations[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      skus:product_skus(*),
      category:categories(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

export type CatalogFilters = {
  category?: string; // slug
  search?: string;
  audiences?: ProductAudience[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  page?: number;
  pageSize?: number;
};

export type CatalogResult = {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminProductSkuInput = {
  size?: string | null;
  color?: string | null;
  stock: number;
};

export type AdminCreateProductInput = {
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  category_id?: string | null;
  audience?: ProductAudience;
  brand?: string | null;
  material?: string | null;
  status?: Product['status'];
  featured?: boolean;
  images?: string[];
  skus?: AdminProductSkuInput[];
};

export type AdminCreateCategoryInput = {
  name: string;
  slug?: string;
  parent_id?: string | null;
  image_url?: string | null;
};

export type AdminUpdateCategoryInput = {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  image_url?: string | null;
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category_id: string | null;
  audience: ProductAudience;
  status: Product['status'];
  featured: boolean;
  created_at: string;
  category: { name: string } | null;
  images: Array<{ url: string; position: number }>;
};

export type AdminUpdateProductInput = {
  name?: string;
  slug?: string;
  price?: number;
  category_id?: string | null;
  audience?: ProductAudience;
  status?: Product['status'];
  featured?: boolean;
};

function asErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined;
  const maybeHint = 'hint' in error ? (error as { hint?: unknown }).hint : undefined;
  const maybeDetails = 'details' in error ? (error as { details?: unknown }).details : undefined;

  const message = typeof maybeMessage === 'string' && maybeMessage.trim() ? maybeMessage.trim() : fallback;
  const hint = typeof maybeHint === 'string' && maybeHint.trim() ? maybeHint.trim() : '';
  const details = typeof maybeDetails === 'string' && maybeDetails.trim() ? maybeDetails.trim() : '';

  return [message, hint, details].filter(Boolean).join(' | ');
}

function isMissingAudienceColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined;
  return typeof maybeMessage === 'string' && maybeMessage.includes(MISSING_AUDIENCE_COLUMN);
}

export async function supportsAudienceColumn(): Promise<boolean> {
  if (audienceColumnSupport != null) return audienceColumnSupport;

  const { error } = await supabase
    .from('products')
    .select('audience')
    .limit(1);

  if (error) {
    if (isMissingAudienceColumnError(error)) {
      audienceColumnSupport = false;
      return false;
    }

    throw error;
  }

  audienceColumnSupport = true;
  return true;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeCategorySlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const aliases: Record<string, string> = {
    kepuc: 'kepuce',
    kepuce: 'kepuce',
    kpuce: 'kepuce',
    aksesor: 'aksesoore',
    aksesore: 'aksesoore',
    accessories: 'aksesoore',
    men: 'meshkuj',
    women: 'femra',
    shoes: 'kepuce',
    hat: 'hats',
    hats: 'hats',
  };

  return aliases[normalized] ?? normalized;
}

function collectCategoryTreeIds(
  categories: Array<{ id: string; parent_id: string | null }>,
  rootIds: string[]
): string[] {
  const ids = new Set<string>(rootIds);
  const queue = [...rootIds];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    for (const category of categories) {
      if (category.parent_id !== current || ids.has(category.id)) continue;
      ids.add(category.id);
      queue.push(category.id);
    }
  }

  return Array.from(ids);
}

export async function fetchCatalog(filters: CatalogFilters = {}): Promise<CatalogResult> {
  const pageSize = filters.pageSize ?? 12;
  const page = filters.page ?? 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const canUseAudience = await supportsAudienceColumn();

  let query = supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      skus:product_skus(*),
      category:categories(*)
    `, { count: 'exact' })
    .eq('status', 'published');

    if (filters.category) {
    // Fetch the selected category and all its descendants so shared categories
    // like hats can show a unified listing.
    const { data: cats } = await supabase
      .from('categories')
      .select('id, parent_id, slug');
    if (cats && cats.length) {
      const requested = normalizeCategorySlug(filters.category);
      const matched = cats
        .filter((c) => normalizeCategorySlug(c.slug) === requested)
        .map((c) => c.id);

      if (matched.length === 0) {
        return { products: [], total: 0, page, pageSize };
      }

      if (matched.length) {
        const allCategoryIds = collectCategoryTreeIds(cats, matched);
        query = query.in('category_id', allCategoryIds);
      }
    } else {
      return { products: [], total: 0, page, pageSize };
    }
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (canUseAudience && filters.audiences && filters.audiences.length) {
    query = query.in('audience', filters.audiences);
  }

  if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters.brands && filters.brands.length) query = query.in('brand', filters.brands);

  switch (filters.sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  let products = (data ?? []) as ProductWithRelations[];

  // Client-side filters for size/color (stored on skus)
  if (filters.sizes && filters.sizes.length) {
    products = products.filter((p) =>
      p.skus.some((s) => s.size && filters.sizes!.includes(s.size))
    );
  }
  if (filters.colors && filters.colors.length) {
    products = products.filter((p) =>
      p.skus.some((s) => s.color && filters.colors!.includes(s.color))
    );
  }

  return { products, total: count ?? 0, page, pageSize };
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      skus:product_skus(*),
      category:categories(*),
      reviews:reviews(*)
    `)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as ProductWithRelations) ?? null;
}

export async function fetchRelatedProducts(product: Product, limit = 4): Promise<ProductWithRelations[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(*),
      skus:product_skus(*),
      category:categories(*)
    `)
    .eq('status', 'published')
    .neq('id', product.id)
    .eq('category_id', product.category_id ?? '')
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductWithRelations[];
}

export async function fetchAllBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)
    .order('brand');
  if (error) throw error;
  const brands = (data ?? []).map((d) => d.brand).filter(Boolean) as string[];
  return Array.from(new Set(brands));
}

export async function fetchAllColors(): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_skus')
    .select('color')
    .not('color', 'is', null);
  if (error) throw error;
  const colors = (data ?? []).map((d) => d.color).filter(Boolean) as string[];
  return Array.from(new Set(colors));
}

export async function fetchAllSizes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('product_skus')
    .select('size')
    .not('size', 'is', null);
  if (error) throw error;
  const sizes = (data ?? []).map((d) => d.size).filter(Boolean) as string[];
  return Array.from(new Set(sizes));
}

export async function createProductWithRelations(input: AdminCreateProductInput): Promise<Product> {
  const computedSlug = slugify(input.slug?.trim() || input.name);
  const canUseAudience = await supportsAudienceColumn();
  if (!computedSlug) {
    throw new Error('Please provide a valid product name or slug.');
  }

  const productInsert: Record<string, unknown> = {
    name: input.name.trim(),
    slug: computedSlug,
    description: input.description?.trim() || null,
    price: input.price,
    compare_at_price: input.compare_at_price ?? null,
    category_id: input.category_id ?? null,
    brand: input.brand?.trim() || null,
    material: input.material?.trim() || null,
    status: input.status ?? 'published',
    featured: input.featured ?? false,
  };

  if (canUseAudience) {
    productInsert.audience = input.audience ?? 'unisex';
  }

  const { data: created, error: productError } = await supabase
    .from('products')
    .insert(productInsert)
    .select('*')
    .single();

  if (productError) {
    throw new Error(asErrorMessage(productError, 'Failed to create product record.'));
  }

  const imageRows = (input.images ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, position) => ({
      product_id: created.id,
      url,
      position,
    }));

  if (imageRows.length > 0) {
    const { error: imageError } = await supabase.from('product_images').insert(imageRows);
    if (imageError) {
      throw new Error(asErrorMessage(imageError, 'Product was created but images could not be saved.'));
    }
  }

  const skuRows = (input.skus ?? [])
    .map((sku) => ({
      product_id: created.id,
      size: sku.size?.trim() || null,
      color: sku.color?.trim() || null,
      stock: Math.max(0, Math.trunc(sku.stock)),
    }))
    .filter((sku) => sku.size || sku.color);

  if (skuRows.length > 0) {
    const { error: skuError } = await supabase.from('product_skus').insert(skuRows);
    if (skuError) {
      throw new Error(asErrorMessage(skuError, 'Product was created but variants could not be saved.'));
    }
  }

  return created as Product;
}

export async function createCategory(input: AdminCreateCategoryInput): Promise<Category> {
  const computedSlug = slugify(input.slug?.trim() || input.name);
  if (!computedSlug) {
    throw new Error('Please provide a valid category name or slug.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name.trim(),
      slug: computedSlug,
      parent_id: input.parent_id ?? null,
      image_url: input.image_url ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to create category.'));
  }

  return data as Category;
}

export async function updateCategoryById(categoryId: string, input: AdminUpdateCategoryInput): Promise<Category> {
  const payload: Record<string, unknown> = {};
  if (input.name != null) payload.name = input.name.trim();
  if (input.slug != null) payload.slug = slugify(input.slug);
  if (input.parent_id !== undefined) payload.parent_id = input.parent_id;
  if (input.image_url !== undefined) payload.image_url = input.image_url;

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .select('*')
    .single();

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to update category.'));
  }

  return data as Category;
}

export async function fetchAdminProducts(limit = 200): Promise<AdminProductListItem[]> {
  const canUseAudience = await supportsAudienceColumn();
  const selectWithAudience = `
      id,
      name,
      slug,
      price,
      category_id,
      audience,
      status,
      featured,
      created_at,
      category:categories(name),
      images:product_images(url, position)
    `;
  const selectWithoutAudience = `
      id,
      name,
      slug,
      price,
      category_id,
      status,
      featured,
      created_at,
      category:categories(name),
      images:product_images(url, position)
    `;

  const { data, error } = await supabase
    .from('products')
    .select(canUseAudience ? selectWithAudience : selectWithoutAudience)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to load products.'));
  }

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    category_id: string | null;
    audience?: ProductAudience;
    status: Product['status'];
    featured: boolean;
    created_at: string;
    category: { name: string } | { name: string }[] | null;
    images: Array<{ url: string; position: number }>;
  }>;

  return rows.map((row) => {
    const category = Array.isArray(row.category)
      ? (row.category[0] ?? null)
      : (row.category ?? null);

    return {
      ...row,
      audience: row.audience ?? 'unisex',
      category,
    };
  });
}

export async function deleteProductById(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to delete product.'));
  }
}

export async function deleteCategoryById(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to delete category.'));
  }
}

export async function updateProductById(productId: string, input: AdminUpdateProductInput): Promise<void> {
  const canUseAudience = await supportsAudienceColumn();
  const payload: Record<string, unknown> = {};
  if (input.name != null) payload.name = input.name.trim();
  if (input.slug != null) payload.slug = slugify(input.slug);
  if (input.price != null) payload.price = input.price;
  if (input.category_id !== undefined) payload.category_id = input.category_id;
  if (canUseAudience && input.audience != null) payload.audience = input.audience;
  if (input.status != null) payload.status = input.status;
  if (input.featured != null) payload.featured = input.featured;

  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId);

  if (error) {
    throw new Error(asErrorMessage(error, 'Failed to update product.'));
  }
}
