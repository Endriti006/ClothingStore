import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from '../components/Link';
import {
  createCategory,
  createProductWithRelations,
  deleteCategoryById,
  deleteProductById,
  fetchAdminProducts,
  fetchCategories,
  updateCategoryById,
  updateProductById,
  type AdminProductListItem,
} from '../lib/catalog';
import { getAdminSession, isAdminAuthenticated, logoutAdmin } from '../lib/adminAuth';
import { useI18n } from '../lib/i18n';
import { usePageSeo } from '../lib/seo';
import { useNavigate } from '../lib/router';
import { formatPrice } from '../lib/format';
import type { Category, Product, ProductAudience } from '../types';

type VariantDraft = {
  id: string;
  size: string;
  color: string;
  stock: string;
};

type ProductEditDraft = {
  name: string;
  slug: string;
  price: string;
  parent_category_id: string;
  category_id: string;
  audience: ProductAudience;
  status: Product['status'];
  featured: boolean;
};

function createVariant(size = '', color = '', stock = '0'): VariantDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    size,
    color,
    stock,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function renderSubmitError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (!error || typeof error !== 'object') return 'Failed to submit.';

  const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined;
  const maybeHint = 'hint' in error ? (error as { hint?: unknown }).hint : undefined;
  const maybeDetails = 'details' in error ? (error as { details?: unknown }).details : undefined;

  const message = typeof maybeMessage === 'string' && maybeMessage.trim() ? maybeMessage.trim() : 'Failed to submit.';
  const hint = typeof maybeHint === 'string' && maybeHint.trim() ? maybeHint.trim() : '';
  const details = typeof maybeDetails === 'string' && maybeDetails.trim() ? maybeDetails.trim() : '';

  const combined = [message, hint, details].filter(Boolean).join(' | ');
  if (combined.toLowerCase().includes('row-level security policy')) {
    return 'Supabase RLS blocks this action. Apply write policies in Supabase SQL editor, then retry.';
  }

  return combined;
}

function buildProductEdits(rows: AdminProductListItem[], categories: Category[]): Record<string, ProductEditDraft> {
  const entries = rows.map((row) => [
    row.id,
    (() => {
      const currentCategory = categories.find((category) => category.id === row.category_id);
      const parentCategoryId = currentCategory?.parent_id ?? (currentCategory?.id ?? '');

      return {
        name: row.name,
        slug: row.slug,
        price: String(row.price),
        parent_category_id: parentCategoryId,
        category_id: currentCategory?.parent_id ? currentCategory.id : '',
        audience: row.audience,
        status: row.status,
        featured: row.featured,
      };
    })(),
  ] as const);

  return Object.fromEntries(entries);
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function audienceFromCategorySlug(value: string): ProductAudience | null {
  const normalized = normalizeSlug(value);
  if (normalized === 'meshkuj') return 'men';
  if (normalized === 'femra') return 'women';
  return null;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProductListItem[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [audience, setAudience] = useState<ProductAudience>('unisex');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [status, setStatus] = useState<Product['status']>('published');
  const [featured, setFeatured] = useState(false);
  const [imagesText, setImagesText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([createVariant('M', 'Black', '10')]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [productEdits, setProductEdits] = useState<Record<string, ProductEditDraft>>({});

  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryParentId, setCategoryParentId] = useState('');
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  const isAuthenticated = isAdminAuthenticated();
  const adminSession = getAdminSession();

  usePageSeo({
    title: language === 'sq' ? 'Paneli Admin | Marca' : 'Admin Dashboard | Marca',
    description: language === 'sq'
      ? 'Panel administrimi per menaxhimin e produkteve, kategorive dhe publikimit.'
      : 'Admin management panel for products, categories, and publishing.',
    robots: 'noindex,nofollow',
  });

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const rootCategories = useMemo(() => {
    const roots = sortedCategories.filter((category) => !category.parent_id);
    return roots.sort((left, right) => {
      const leftSlug = normalizeSlug(left.slug);
      const rightSlug = normalizeSlug(right.slug);
      const leftPriority = leftSlug === 'meshkuj' ? 0 : leftSlug === 'femra' ? 1 : 2;
      const rightPriority = rightSlug === 'meshkuj' ? 0 : rightSlug === 'femra' ? 1 : 2;
      return leftPriority - rightPriority || left.name.localeCompare(right.name);
    });
  }, [sortedCategories]);

  const childCategories = useMemo(
    () => sortedCategories.filter((category) => category.parent_id === parentCategoryId),
    [sortedCategories, parentCategoryId]
  );

  const hasPrimaryRoots = rootCategories.some((category) => normalizeSlug(category.slug) === 'meshkuj')
    && rootCategories.some((category) => normalizeSlug(category.slug) === 'femra');

  const rootCategoryCount = rootCategories.length;

  const stats = [
    { label: t('admin.products'), value: String(products.length) },
    { label: t('admin.categories'), value: String(categories.length) },
    { label: t('admin.roots'), value: String(rootCategoryCount) },
  ];

  const loadAdminData = async () => {
    setRefreshing(true);
    try {
      const [categoryRows, productRows] = await Promise.all([
        fetchCategories(),
        fetchAdminProducts(),
      ]);
      setCategories(categoryRows);
      setProducts(productRows);
      setProductEdits(buildProductEdits(productRows, categoryRows));
    } finally {
      setRefreshing(false);
      setLoadingCategories(false);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const addVariant = (size = '', color = '', stock = '0') => {
    setVariants((prev) => [...prev, createVariant(size, color, stock)]);
  };

  const addApparelTemplate = () => {
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'].forEach((size) => addVariant(size, 'Black', '10'));
  };

  const addShoeTemplate = () => {
    ['39', '40', '41', '42', '43', '44'].forEach((size) => addVariant(size, 'Black', '8'));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const resetProductForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setPrice('');
    setCompareAtPrice('');
    setParentCategoryId('');
    setCategoryId('');
    setAudience('unisex');
    setBrand('');
    setMaterial('');
    setStatus('published');
    setFeatured(false);
    setImagesText('');
    setImageFiles([]);
    setVariants([createVariant('M', 'Black', '10')]);
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setCategorySlug('');
    setCategoryParentId('');
    setCategoryImageFile(null);
  };

  const onCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (parentCategoryId && !categoryId && childCategories.length > 0) {
      setError('Please choose a subcategory under the selected big category.');
      return;
    }

    const selectedCategoryId = categoryId || parentCategoryId;

    const parsedPrice = Number(price);
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    const parsedCompareAt = compareAtPrice.trim() ? Number(compareAtPrice) : null;
    if (parsedCompareAt != null && (!Number.isFinite(parsedCompareAt) || parsedCompareAt <= 0)) {
      setError('Compare at price must be a valid positive number.');
      return;
    }

    const cleanedVariants = variants
      .map((variant) => ({
        size: variant.size.trim() || null,
        color: variant.color.trim() || null,
        stock: Math.max(0, Number.parseInt(variant.stock || '0', 10) || 0),
      }))
      .filter((variant) => variant.size || variant.color);

    if (cleanedVariants.length === 0) {
      setError('Add at least one variant (size or color).');
      return;
    }

    const manualImageUrls = imagesText
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    try {
      setSubmitting(true);
      const uploadedImageUrls = await Promise.all(imageFiles.map((file) => fileToDataUrl(file)));
      const created = await createProductWithRelations({
        name,
        slug,
        description,
        price: parsedPrice,
        compare_at_price: parsedCompareAt,
        category_id: selectedCategoryId || null,
        audience,
        brand,
        material,
        status,
        featured,
        images: [...manualImageUrls, ...uploadedImageUrls],
        skus: cleanedVariants,
      });

      setSuccess(`Product created: ${created.name} (#${created.slug})`);
      resetProductForm();
      const latestProducts = await fetchAdminProducts();
      setProducts(latestProducts);
      setProductEdits(buildProductEdits(latestProducts, categories));
    } catch (submitError) {
      setError(renderSubmitError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    setCategoryError(null);
    setCategorySuccess(null);

    if (!categoryName.trim()) {
      setCategoryError('Category name is required.');
      return;
    }

    try {
      setCategorySubmitting(true);
      const imageUrl = categoryImageFile ? await fileToDataUrl(categoryImageFile) : null;
      const created = await createCategory({
        name: categoryName,
        slug: categorySlug,
        parent_id: categoryParentId || null,
        image_url: imageUrl,
      });

      setCategorySuccess(`Category created: ${created.name} (#${created.slug})`);
      resetCategoryForm();
      const latestCategories = await fetchCategories();
      setCategories(latestCategories);
      setProductEdits(buildProductEdits(products, latestCategories));
    } catch (submitError) {
      setCategoryError(renderSubmitError(submitError));
    } finally {
      setCategorySubmitting(false);
    }
  };

  const onDeleteProduct = async (product: AdminProductListItem) => {
    const confirmed = window.confirm(`Delete product "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingProductId(product.id);
      await deleteProductById(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSuccess(`Deleted product: ${product.name}`);
    } catch (deleteError) {
      setError(renderSubmitError(deleteError));
    } finally {
      setDeletingProductId(null);
    }
  };

  const onDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`Delete category "${category.name}"? Products in it will become uncategorized.`);
    if (!confirmed) return;

    try {
      setDeletingCategoryId(category.id);
      await deleteCategoryById(category.id);
      const [latestCategories, latestProducts] = await Promise.all([
        fetchCategories(),
        fetchAdminProducts(),
      ]);
      setCategories(latestCategories);
      setProducts(latestProducts);
      setProductEdits(buildProductEdits(latestProducts, latestCategories));
      setCategorySuccess(`Deleted category: ${category.name}`);
      setCategoryError(null);
    } catch (deleteError) {
      setCategoryError(renderSubmitError(deleteError));
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const onEditProductField = (productId: string, patch: Partial<ProductEditDraft>) => {
    setProductEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        ...patch,
      },
    }));
  };

  const onSaveProduct = async (productId: string) => {
    const draft = productEdits[productId];
    if (!draft) return;

    const parsedPrice = Number(draft.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Price must be greater than 0 when saving a product.');
      return;
    }

    const availableChildren = sortedCategories.filter(
      (category) => category.parent_id === draft.parent_category_id
    );
    if (draft.parent_category_id && !draft.category_id && availableChildren.length > 0) {
      setError('Please choose a subcategory before saving this product.');
      return;
    }

    const selectedCategoryId = draft.category_id || draft.parent_category_id;

    try {
      setSavingProductId(productId);
      await updateProductById(productId, {
        name: draft.name,
        slug: draft.slug,
        price: parsedPrice,
        category_id: selectedCategoryId || null,
        audience: draft.audience,
        status: draft.status,
        featured: draft.featured,
      });

      const latestProducts = await fetchAdminProducts();
      setProducts(latestProducts);
      setProductEdits(buildProductEdits(latestProducts, categories));
      setSuccess('Product updated successfully.');
      setError(null);
    } catch (updateError) {
      setError(renderSubmitError(updateError));
    } finally {
      setSavingProductId(null);
    }
  };

  const onCreateDefaultCategories = async () => {
    const defaults = [
      {
        name: 'Meshkuj',
        slug: 'meshkuj',
        image_url: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1200',
        children: [
          { name: 'T-Shirts', slug: 'meshkuj-t-shirts', image_url: 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200' },
          { name: 'Shoes', slug: 'meshkuj-shoes', image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200' },
        ],
      },
      {
        name: 'Femra',
        slug: 'femra',
        image_url: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200',
        children: [
          { name: 'T-Shirts', slug: 'femra-t-shirts', image_url: 'https://images.pexels.com/photos/6940966/pexels-photo-6940966.jpeg?auto=compress&cs=tinysrgb&w=1200' },
          { name: 'Shoes', slug: 'femra-shoes', image_url: 'https://images.pexels.com/photos/6046235/pexels-photo-6046235.jpeg?auto=compress&cs=tinysrgb&w=1200' },
        ],
      },
      {
        name: 'Hats',
        slug: 'hats',
        image_url: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1200',
        children: [],
      },
      {
        name: 'Kepuce',
        slug: 'kepuce',
        image_url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200',
        children: [],
      },
      {
        name: 'Aksesoore',
        slug: 'aksesoore',
        image_url: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=1200',
        children: [],
      },
    ];

    try {
      setRefreshing(true);
      const existing = await fetchCategories();
      const bySlug = new Map(existing.map((c) => [c.slug, c] as const));
      let createdCount = 0;

      for (const root of defaults) {
        let rootCategory = bySlug.get(root.slug);
        if (!rootCategory) {
          rootCategory = await createCategory({
            name: root.name,
            slug: root.slug,
            parent_id: null,
            image_url: root.image_url,
          });
          bySlug.set(rootCategory.slug, rootCategory);
          createdCount += 1;
        } else if (!rootCategory.image_url && root.image_url) {
          rootCategory = await updateCategoryById(rootCategory.id, { image_url: root.image_url });
          bySlug.set(rootCategory.slug, rootCategory);
        }

        for (const child of root.children) {
          const existingChild = bySlug.get(child.slug);
          if (!existingChild) {
            const createdChild = await createCategory({
              name: child.name,
              slug: child.slug,
              parent_id: rootCategory.id,
              image_url: child.image_url,
            });
            bySlug.set(createdChild.slug, createdChild);
            createdCount += 1;
            continue;
          }

          if (!existingChild.image_url && child.image_url) {
            const updatedChild = await updateCategoryById(existingChild.id, {
              image_url: child.image_url,
              parent_id: existingChild.parent_id ?? rootCategory.id,
            });
            bySlug.set(updatedChild.slug, updatedChild);
          }
        }
      }

      const latestCategories = await fetchCategories();
      setCategories(latestCategories);
      setProductEdits(buildProductEdits(products, latestCategories));
      setCategorySuccess(
        createdCount === 0
          ? 'Default category tree already exists.'
          : `Created ${createdCount} default categories.`
      );
      setCategoryError(null);
    } catch (createError) {
      setCategoryError(renderSubmitError(createError));
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
        <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-stone-900">Admin Access Required</h1>
          <p className="mt-2 text-sm text-stone-500">
            Please login from your account page to manage products.
          </p>
          <Link
            route={{ name: 'account' }}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_32%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
          <div className="rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-35px_rgba(28,25,23,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Marca CMS</p>
                <h1 className="mt-2 text-2xl font-bold text-stone-900 sm:text-3xl">{t('admin.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-stone-500">{t('admin.lead')}</p>
                <p className="mt-3 text-xs text-stone-400">{t('admin.signedIn')} {adminSession?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    logoutAdmin();
                    navigate({ name: 'account' });
                  }}
                  className="text-sm font-medium text-stone-500 hover:text-stone-900"
                >
                  {t('admin.logout')}
                </button>
                <Link route={{ name: 'home' }} className="text-sm font-medium text-stone-600 hover:text-stone-900">
                  {t('admin.backToStore')}
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-stone-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200/80 bg-stone-900 p-6 text-white shadow-[0_20px_60px_-35px_rgba(28,25,23,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">{t('admin.quickGuide')}</p>
            <p className="mt-3 text-sm leading-6 text-stone-200">{t('admin.quickGuideLead')}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void loadAdminData()}
                disabled={refreshing}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100 disabled:opacity-50"
              >
                {refreshing ? t('admin.refreshing') : t('admin.refresh')}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            disabled={refreshing}
            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {refreshing ? t('admin.refreshing') : t('admin.refresh')}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <form onSubmit={onCreateProduct} className="space-y-6 rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-35px_rgba(28,25,23,0.25)]">
            <h2 className="text-lg font-semibold text-stone-900">{t('admin.createProduct')}</h2>

            <section className="grid gap-4 sm:grid-cols-2">
              {!hasPrimaryRoots && (
                <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p>{t('admin.missingRootCategories')}</p>
                  <button
                    type="button"
                    onClick={() => void onCreateDefaultCategories()}
                    className="mt-2 inline-flex rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    {t('admin.setupCategories')}
                  </button>
                </div>
              )}
              <Field label={t('admin.bigCategory')}>
                <select
                  value={parentCategoryId}
                  onChange={(e) => {
                    const nextParentId = e.target.value;
                    setParentCategoryId(nextParentId);
                    setCategoryId('');
                    const selectedRoot = rootCategories.find((category) => category.id === nextParentId);
                    const inferredAudience = selectedRoot ? audienceFromCategorySlug(selectedRoot.slug) : null;
                    if (inferredAudience) setAudience(inferredAudience);
                  }}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('admin.noBigCategory')}</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.subcategory')}>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={!parentCategoryId || childCategories.length === 0}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  <option value="">
                    {!parentCategoryId
                      ? t('admin.selectBigFirst')
                      : childCategories.length === 0
                        ? t('admin.noSubcategories')
                        : t('admin.selectSubcategory')}
                  </option>
                  {childCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('admin.audience')}>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as ProductAudience)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                >
                  <option value="men">{t('common.men')}</option>
                  <option value="women">{t('common.women')}</option>
                  <option value="unisex">{t('common.unisex')}</option>
                </select>
                <p className="mt-1 text-xs text-stone-500">{t('admin.audienceHint')}</p>
              </Field>
              <Field label="Product name" required>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Classic T-Shirt"
                />
              </Field>
              <Field label="Slug (optional)">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="classic-t-shirt"
                />
              </Field>
              <Field label="Price" required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="29.99"
                />
              </Field>
              <Field label="Compare at price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="39.99"
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Product['status'])}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </Field>
              <Field label="Brand">
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="MARCA"
                />
              </Field>
              <Field label="Material">
                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="100% Cotton"
                />
              </Field>
              <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-stone-900"
                />
                Mark as featured product
              </label>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="Short product description"
                />
              </Field>
              <Field label="Image URLs (comma or new line separated)" className="sm:col-span-2">
                <textarea
                  value={imagesText}
                  onChange={(e) => setImagesText(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  placeholder="https://.../image-1.jpg"
                />
              </Field>
              <Field label="Upload product images (no URL needed)" className="sm:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                {imageFiles.length > 0 && (
                  <p className="mt-1 text-xs text-stone-500">{imageFiles.length} file(s) selected</p>
                )}
              </Field>
            </section>

            <section className="space-y-3 rounded-lg border border-stone-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-stone-900">Variants (size / color / stock)</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addVariant('', '', '0')}
                    className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                  <button
                    type="button"
                    onClick={addApparelTemplate}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    T-shirt sizes (XS-XXL)
                  </button>
                  <button
                    type="button"
                    onClick={addShoeTemplate}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700"
                  >
                    Shoe sizes (39-44)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
                    <input
                      value={variant.size}
                      onChange={(e) => updateVariant(variant.id, { size: e.target.value })}
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                      placeholder="Size (XL, 40...)"
                    />
                    <input
                      value={variant.color}
                      onChange={(e) => updateVariant(variant.id, { color: e.target.value })}
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                      placeholder="Color"
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                      className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                      placeholder="Stock"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-2 text-stone-600 hover:text-red-600"
                      aria-label="Delete variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {submitting ? 'Creating product...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={resetProductForm}
                className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700"
              >
                Reset
              </button>
            </div>
          </form>

          <form onSubmit={onCreateCategory} className="h-fit space-y-4 rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-35px_rgba(28,25,23,0.25)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-stone-900">{t('admin.createCategory')}</h2>
              <button
                type="button"
                onClick={() => void onCreateDefaultCategories()}
                className="rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700"
              >
                {t('admin.addDefaultTree')}
              </button>
            </div>
            <Field label="Category name" required>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                placeholder="T-Shirts"
              />
            </Field>
            <Field label="Slug (optional)">
              <input
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                placeholder="t-shirts"
              />
            </Field>
            <Field label="Parent category (optional)">
              <select
                value={categoryParentId}
                onChange={(e) => setCategoryParentId(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              >
                <option value="">No parent category</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Tip: set parent to Meshkuj or Femra so these products appear when those top categories are opened.
              </p>
            </Field>
            <Field label="Category image upload (no URL needed)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCategoryImageFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {categoryImageFile && (
                <p className="mt-1 text-xs text-stone-500">Selected: {categoryImageFile.name}</p>
              )}
            </Field>

            {categoryError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{categoryError}</p>}
            {categorySuccess && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{categorySuccess}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={categorySubmitting}
                className="inline-flex h-10 items-center justify-center rounded-md bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                {categorySubmitting ? 'Creating...' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={resetCategoryForm}
                className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700"
              >
                Reset
              </button>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-stone-900">{t('admin.categoryManager')}</h3>
                <span className="text-xs text-stone-500">{sortedCategories.length}</span>
              </div>
              <p className="mb-3 text-xs text-stone-500">{t('admin.categoryDeleteHint')}</p>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {sortedCategories.map((category) => {
                  const parent = categories.find((candidate) => candidate.id === category.parent_id);
                  return (
                    <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">{category.name}</p>
                        <p className="text-[11px] text-stone-500">
                          {parent ? `${parent.name} / ` : ''}{category.slug}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingCategoryId === category.id}
                        onClick={() => void onDeleteCategory(category)}
                        className="shrink-0 text-xs font-medium text-red-600 disabled:opacity-50"
                      >
                        {deletingCategoryId === category.id ? t('admin.deleting') : t('admin.deleteCategory')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        <section className="mt-8 rounded-3xl border border-stone-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-35px_rgba(28,25,23,0.25)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">{t('admin.products')}</h2>
            <p className="text-sm text-stone-500">{products.length} items</p>
          </div>

          {loadingProducts || loadingCategories ? (
            <p className="text-sm text-stone-500">{t('admin.loadingAdminData')}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-stone-500">{t('admin.noProductsYet')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                    <th className="px-2 py-2 font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Price</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Featured</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const firstImage = product.images?.[0]?.url;
                    const edit = productEdits[product.id];
                    const tableChildCategories = sortedCategories.filter(
                      (category) => category.parent_id === (edit?.parent_category_id ?? '')
                    );
                    return (
                      <tr key={product.id} className="border-b border-stone-100">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-md bg-stone-100">
                              {firstImage ? (
                                <img src={firstImage} alt={product.name} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div>
                              <input
                                value={edit?.name ?? product.name}
                                onChange={(e) => onEditProductField(product.id, { name: e.target.value })}
                                className="w-44 rounded border border-stone-300 px-2 py-1 text-sm font-medium text-stone-900"
                              />
                              <input
                                value={edit?.slug ?? product.slug}
                                onChange={(e) => onEditProductField(product.id, { slug: e.target.value })}
                                className="mt-1 w-44 rounded border border-stone-200 px-2 py-1 text-xs text-stone-500"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-stone-600">
                          <div className="grid gap-2">
                            <select
                              value={edit?.parent_category_id ?? ''}
                              onChange={(e) => {
                                const nextParentCategoryId = e.target.value;
                                const selectedRoot = rootCategories.find((category) => category.id === nextParentCategoryId);
                                const inferredAudience = selectedRoot ? audienceFromCategorySlug(selectedRoot.slug) : null;
                                onEditProductField(product.id, {
                                  parent_category_id: nextParentCategoryId,
                                  category_id: '',
                                  ...(inferredAudience ? { audience: inferredAudience } : {}),
                                });
                              }}
                              className="w-40 rounded border border-stone-300 px-2 py-1 text-xs"
                            >
                              <option value="">{t('admin.noBigCategory')}</option>
                              {rootCategories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                            <select
                              value={edit?.category_id ?? ''}
                              onChange={(e) => onEditProductField(product.id, { category_id: e.target.value })}
                              disabled={!(edit?.parent_category_id) || tableChildCategories.length === 0}
                              className="w-40 rounded border border-stone-300 px-2 py-1 text-xs disabled:bg-stone-100"
                            >
                              <option value="">
                                {!(edit?.parent_category_id)
                                  ? t('admin.selectBigFirst')
                                  : tableChildCategories.length === 0
                                    ? t('admin.noSubcategories')
                                    : t('admin.selectSubcategory')}
                              </option>
                              {tableChildCategories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                            <select
                              value={edit?.audience ?? 'unisex'}
                              onChange={(e) => onEditProductField(product.id, { audience: e.target.value as ProductAudience })}
                              className="w-40 rounded border border-stone-300 px-2 py-1 text-xs"
                            >
                              <option value="men">{t('common.men')}</option>
                              <option value="women">{t('common.women')}</option>
                              <option value="unisex">{t('common.unisex')}</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-stone-700">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={edit?.price ?? String(product.price)}
                            onChange={(e) => onEditProductField(product.id, { price: e.target.value })}
                            className="w-24 rounded border border-stone-300 px-2 py-1 text-xs"
                          />
                          <p className="mt-1 text-[11px] text-stone-400">{formatPrice(Number(edit?.price ?? product.price))}</p>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            value={edit?.status ?? product.status}
                            onChange={(e) => onEditProductField(product.id, { status: e.target.value as Product['status'] })}
                            className="rounded border border-stone-300 px-2 py-1 text-xs"
                          >
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="out_of_stock">out_of_stock</option>
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            checked={edit?.featured ?? product.featured}
                            onChange={(e) => onEditProductField(product.id, { featured: e.target.checked })}
                            className="h-4 w-4 accent-stone-900"
                          />
                        </td>
                        <td className="px-2 py-3 text-stone-500">{new Date(product.created_at).toLocaleDateString()}</td>
                        <td className="px-2 py-3 text-right">
                          <div className="inline-flex items-center gap-3">
                            <Link
                              route={{ name: 'product', slug: product.slug }}
                              className="text-xs font-medium text-stone-600 hover:text-stone-900"
                            >
                              {t('admin.view')}
                            </Link>
                            <button
                              type="button"
                              disabled={savingProductId === product.id}
                              onClick={() => void onSaveProduct(product.id)}
                              className="text-xs font-medium text-amber-700 disabled:opacity-50"
                            >
                              {savingProductId === product.id ? t('admin.saving') : t('admin.save')}
                            </button>
                            <button
                              type="button"
                              disabled={deletingProductId === product.id}
                              onClick={() => void onDeleteProduct(product)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              {deletingProductId === product.id ? t('admin.deleting') : t('admin.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label} {required ? '*' : ''}
      </span>
      {children}
    </label>
  );
}
