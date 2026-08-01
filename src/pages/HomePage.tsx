import { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { Link } from '../components/Link';
import { ProductCard } from '../components/ProductCard';
import { fetchCategories, fetchFeaturedProducts, fetchNewArrivals } from '../lib/catalog';
import { useI18n } from '../lib/i18n';
import { usePageSeo } from '../lib/seo';
import type { Category, ProductWithRelations } from '../types';

export function HomePage() {
  const [featured, setFeatured] = useState<ProductWithRelations[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useI18n();

  usePageSeo({
    title: language === 'sq' ? 'Marca Albania | Ballina' : 'Marca Albania | Home',
    description: language === 'sq'
      ? 'Zbuloni kategori me imazhe, produkte te reja dhe produktet me te shitura ne Marca Albania.'
      : 'Discover featured categories, new arrivals, and best sellers at Marca Albania.',
    image: 'https://images.pexels.com/photos/20059536/pexels-photo-20059536.jpeg?auto=compress&cs=tinysrgb&w=1200',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ClothingStore',
      name: 'Marca Albania',
      url: window.location.href,
      description: language === 'sq'
        ? 'Dyqan online me veshje, kepuce dhe aksesore.'
        : 'Online store for clothing, shoes, and accessories.',
    },
  });

  const showcaseCategories = categories
    .filter((category) => category.image_url)
    .sort((left, right) => Number(Boolean(right.parent_id)) - Number(Boolean(left.parent_id)))
    .slice(0, 6);

  const categoryLabel = (category: Category) => {
    const key = category.slug.replace(/-/g, '');
    const translated = t(`common.${key}`);
    return translated === `common.${key}` ? category.name : translated;
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchFeaturedProducts(8), fetchNewArrivals(4), fetchCategories()])
      .then(([f, n, c]) => {
        if (!active) return;
        setFeatured(f);
        setNewArrivals(n);
        setCategories(c);
      })
      .catch((e) => console.error('Home load error', e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-stone-100">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
              {t('home.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              {t('home.heroTitle').split(',')[0]}, <span className="text-amber-600">{t('home.heroTitle').split(',')[1]?.trim() ?? 'elevated.'}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone-600">
              {t('home.heroDescription')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                route={{ name: 'catalog' }}
                className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
              >
                {t('home.shopCollection')} <ArrowRight size={16} />
              </Link>
              <Link
                route={{ name: 'catalog', category: 'femra' }}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-900 hover:text-stone-900"
              >
                {t('home.womensNewIn')}
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="https://images.pexels.com/photos/20059536/pexels-photo-20059536.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Summer collection"
                className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[560px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {[
            { icon: Truck, title: t('home.badges.shipping'), desc: t('home.badges.shippingLead') },
            { icon: RefreshCw, title: t('home.badges.returns'), desc: t('home.badges.returnsLead') },
            { icon: ShieldCheck, title: t('home.badges.payment'), desc: t('home.badges.paymentLead') },
            { icon: Headphones, title: t('home.badges.support'), desc: t('home.badges.supportLead') },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3 px-4 py-6 sm:px-6">
              <b.icon size={22} className="text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-stone-900">{b.title}</p>
                <p className="text-xs text-stone-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category shortcuts */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">Shop by category</h2>
            <p className="mt-1 text-sm text-stone-500">{t('home.categoryLead')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {showcaseCategories.map((cat) => (
            <Link
              key={cat.id}
              route={{ name: 'catalog', category: cat.slug }}
              className="group relative overflow-hidden rounded-xl bg-stone-100"
            >
              <div className="aspect-[4/5] sm:aspect-[3/4]">
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-semibold text-white">{categoryLabel(cat)}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/90">
                  {t('home.shopCollection')} <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">{t('home.bestSellers')}</h2>
            <p className="mt-1 text-sm text-stone-500">{t('home.bestSellersLead')}</p>
          </div>
          <Link
            route={{ name: 'catalog' }}
            className="hidden items-center gap-1 text-sm font-semibold text-stone-700 hover:text-stone-950 sm:inline-flex"
          >
            {t('home.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Editorial banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-stone-900">
          <img
            src="https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Men's collection"
            className="h-[280px] w-full object-cover opacity-70 sm:h-[360px]"
          />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-md px-6 sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('home.mensEdit')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                {t('home.mensEditLead')}
              </p>
              <Link
                route={{ name: 'catalog', category: 'meshkuj' }}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-100"
              >
                {t('home.shopMens')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">{t('home.newArrivals')}</h2>
          <p className="mt-1 text-sm text-stone-500">{t('home.newArrivalsLead')}</p>
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-stone-200" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}
