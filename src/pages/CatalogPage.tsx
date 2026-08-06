import { useEffect, useState } from 'react';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { fetchCatalog, fetchAllBrands, fetchAllColors, fetchAllSizes } from '../lib/catalog';
import { useI18n } from '../lib/i18n';
import { usePageSeo } from '../lib/seo';
import type { CatalogFilters } from '../lib/catalog';
import type { ProductAudience, ProductWithRelations } from '../types';

function prettyCategoryLabel(category?: string): string {
  if (!category) return 'All Products';

  const labels: Record<string, string> = {
        meshkuj: 'Meshkuj',
        femra: 'Femra',
      };

  return labels[category] ?? category.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function CatalogPage({ category, query, audience }: { category?: string; query?: string; audience?: string }) {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CatalogFilters['sort']>('newest');
  const [audiences, setAudiences] = useState<ProductAudience[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [allColors, setAllColors] = useState<string[]>([]);
  const [allSizes, setAllSizes] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { t, language } = useI18n();

  const pageSize = 12;

  usePageSeo({
    title: query
      ? `${t('catalog.resultsFor')} "${query}" | Marca`
      : audience === 'men'
        ? `${t('common.men')} | Marca`
        : audience === 'women'
          ? `${t('common.women')} | Marca`
          : `${prettyCategoryLabel(category)} | Marca`,
    description: query
      ? `${t('catalog.resultsFor')} ${query} in Marca Albania.`
      : `${prettyCategoryLabel(category)} ${language === 'sq' ? 'produkte dhe nenkategori ne Marca Albania.' : 'products and subcategories at Marca Albania.'}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: query ? `${t('catalog.resultsFor')} ${query}` : prettyCategoryLabel(category),
      url: window.location.href,
    },
  });

  const localizedPrettyCategoryLabel = (value?: string) => {
    if (!value) return t('catalog.allProducts');

    const labels: Record<string, string> = {
      meshkuj: t('common.men'),
      femra: t('common.women'),
    };

    return labels[value] ?? prettyCategoryLabel(value);
  };

  useEffect(() => {
    fetchAllBrands().then(setAllBrands).catch(() => {});
    fetchAllColors().then(setAllColors).catch(() => {});
    fetchAllSizes().then(setAllSizes).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category, query, audience]);

  // Sync audience filter from nav link; include unisex in both Men and Women views
  useEffect(() => {
    if (audience === 'men') {
      setAudiences(['men', 'unisex']);
    } else if (audience === 'women') {
      setAudiences(['women', 'unisex']);
    } else {
      setAudiences([]);
    }
    setPage(1);
  }, [audience]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const filters: CatalogFilters = {
      category,
      search: query || undefined,
      sort,
      page,
      pageSize,
      audiences: audiences.length ? audiences : undefined,
      sizes: sizes.length ? sizes : undefined,
      colors: colors.length ? colors : undefined,
      brands: brands.length ? brands : undefined,
      maxPrice: maxPrice < 300 ? maxPrice : undefined,
    };
    fetchCatalog(filters)
      .then((res) => {
        if (!active) return;
        setProducts(res.products);
        setTotal(res.total);
      })
      .catch((e) => console.error('Catalog error', e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, query, audience, sort, page, audiences, sizes, colors, brands, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggle = <T extends string>(list: T[], value: T, setter: (v: T[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
    setPage(1);
  };

  const clearAll = () => {
    setAudiences([]);
    setSizes([]);
    setColors([]);
    setBrands([]);
    setMaxPrice(300);
    setPage(1);
  };

  const activeFilterCount =
    audiences.length + sizes.length + colors.length + brands.length + (maxPrice < 300 ? 1 : 0);

  const audienceOptions: Array<{ value: ProductAudience; label: string }> = [
    { value: 'men', label: t('common.men') },
    { value: 'women', label: t('common.women') },
    { value: 'unisex', label: t('common.unisex') },
  ];

  const showAudienceFilter = true; // Always show audience filter so users can filter Men/Women/Unisex within any category

  const FilterPanel = (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900">Filters</h3>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-amber-600 hover:text-amber-700">
              {t('catalog.clearAll')} ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {showAudienceFilter && (
        <FilterGroup title={t('catalog.audience')}>
          <div className="space-y-2">
            {audienceOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={audiences.includes(option.value)}
                  onChange={() => toggle(audiences, option.value, setAudiences)}
                  className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                />
                {option.label}
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={t('catalog.price')}>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={300}
            step={10}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(Number(e.target.value));
              setPage(1);
            }}
            className="w-full accent-stone-900"
          />
          <div className="flex justify-between text-xs text-stone-500">
            <span>$0</span>
            <span className="font-medium text-stone-700">Up to ${maxPrice}</span>
          </div>
        </div>
      </FilterGroup>

      {allSizes.length > 0 && (
        <FilterGroup title={t('catalog.size')}>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((s) => (
              <button
                key={s}
                onClick={() => toggle(sizes, s, setSizes)}
                className={`min-w-10 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sizes.includes(s)
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {allColors.length > 0 && (
        <FilterGroup title={t('catalog.color')}>
          <div className="space-y-2">
            {allColors.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={colors.includes(c)}
                  onChange={() => toggle(colors, c, setColors)}
                  className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                />
                {c}
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {allBrands.length > 0 && (
        <FilterGroup title={t('catalog.brand')}>
          <div className="space-y-2">
            {allBrands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={brands.includes(b)}
                  onChange={() => toggle(brands, b, setBrands)}
                  className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                />
                {b}
              </label>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {query
            ? `${t('catalog.resultsFor')} "${query}"`
            : audience === 'men'
              ? t('common.men')
              : audience === 'women'
                ? t('common.women')
                : localizedPrettyCategoryLabel(category)}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{total} {total === 1 ? t('catalog.item') : t('catalog.items')}</p>
      </div>

      <div className="flex gap-8 lg:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">{FilterPanel}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 lg:hidden"
            >
              <SlidersHorizontal size={16} /> {t('catalog.filters')}
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-stone-900 px-1.5 text-xs text-white">{activeFilterCount}</span>
              )}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-medium text-stone-500">{t('catalog.sort')}</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as CatalogFilters['sort'])}
                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-400 focus:outline-none"
              >
                <option value="newest">{t('catalog.sorts.newest')}</option>
                <option value="popular">{t('catalog.sorts.popular')}</option>
                <option value="price-asc">{t('catalog.sorts.priceAsc')}</option>
                <option value="price-desc">{t('catalog.sorts.priceDesc')}</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200" />
                  <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-stone-200" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 py-20 text-center">
              <p className="text-sm font-medium text-stone-600">{t('catalog.noProducts')}</p>
              <button onClick={clearAll} className="mt-3 text-sm font-semibold text-amber-600 hover:text-amber-700">
                {t('catalog.clearFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 disabled:opacity-40 hover:border-stone-400 hover:text-stone-900"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 disabled:opacity-40 hover:border-stone-400 hover:text-stone-900"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-900">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-stone-500">
                <X size={20} />
              </button>
            </div>
            {FilterPanel}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-8 w-full rounded-md bg-stone-900 py-3 text-sm font-semibold text-white"
            >
              {t('catalog.showResults')} {total} {total === 1 ? t('catalog.item') : t('catalog.items')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-stone-100 pt-5 first:border-0 first:pt-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-900">{title}</h4>
      {children}
    </div>
  );
}
