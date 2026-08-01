import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Truck, RefreshCw, ShieldCheck, Ruler, Check, ChevronDown } from 'lucide-react';
import { Link } from '../components/Link';
import { ProductCard } from '../components/ProductCard';
import { RatingStars } from '../components/RatingStars';
import { fetchProductBySlug, fetchRelatedProducts } from '../lib/catalog';
import { useAddToCart, useCartCount } from '../lib/cart';
import { usePageSeo } from '../lib/seo';
import { useNavigate } from '../lib/router';
import { formatPrice, discountPercent } from '../lib/format';
import type { ProductWithRelations } from '../types';

export function ProductPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [related, setRelated] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [error, setError] = useState(false);

  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const cartCount = useCartCount();

  usePageSeo({
    title: product ? `${product.name} | Marca` : 'Product | Marca',
    description: product?.description ?? 'Browse product details, images, sizes, and availability at Marca.',
    image: product?.images[0]?.url,
    type: 'product',
    robots: error ? 'noindex,follow' : 'index,follow',
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.images.map((image) => image.url),
          description: product.description,
          brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: product.price,
            availability:
              product.status === 'out_of_stock' || product.skus.reduce((sum, sku) => sum + sku.stock, 0) <= 0
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
            url: window.location.href,
          },
        }
      : undefined,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setActiveImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setAdded(false);
    fetchProductBySlug(slug)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        if (!p) {
          setError(true);
          return;
        }
        // default-select the first available color/size
        const colors = Array.from(new Set((p.skus.map((s) => s.color).filter(Boolean) as string[])));
        if (colors.length) setSelectedColor(colors[0]);
        const sizes = Array.from(new Set(p.skus.map((s) => s.size).filter(Boolean) as string[]));
        if (sizes.length) setSelectedSize(sizes[0]);
        if (p) fetchRelatedProducts(p, 4).then(setRelated).catch(() => {});
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  const sizes = useMemo(
    () => (product ? Array.from(new Set(product.skus.map((s) => s.size).filter(Boolean) as string[])) : []),
    [product]
  );
  const colors = useMemo(
    () => (product ? Array.from(new Set(product.skus.map((s) => s.color).filter(Boolean) as string[])) : []),
    [product]
  );

  const selectedSku = useMemo(() => {
    if (!product) return null;
    return (
      product.skus.find(
        (s) =>
          (sizes.length === 0 || s.size === selectedSize) &&
          (colors.length === 0 || s.color === selectedColor)
      ) ?? null
    );
  }, [product, selectedSize, selectedColor, sizes, colors]);

  const stockForVariant = selectedSku?.stock ?? 0;
  const totalStock = product?.skus.reduce((sum, s) => sum + s.stock, 0) ?? 0;
  const outOfStock = product?.status === 'out_of_stock' || totalStock <= 0;
  const variantOutOfStock = selectedSku ? selectedSku.stock <= 0 : false;

  const canAdd = !outOfStock && !variantOutOfStock && (sizes.length === 0 || !!selectedSize) && (colors.length === 0 || !!selectedColor);

  const handleAdd = () => {
    if (!product || !canAdd) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url ?? '',
        size: selectedSize ?? 'One Size',
        color: selectedColor ?? 'Default',
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-stone-200" />
            <div className="h-24 w-full animate-pulse rounded bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Product not found</h1>
        <p className="mt-2 text-sm text-stone-500">This product may have been removed.</p>
        <Link route={{ name: 'catalog' }} className="mt-6 text-sm font-semibold text-amber-600 hover:text-amber-700">
          Back to catalog
        </Link>
      </div>
    );
  }

  const discount = discountPercent(product.price, product.compare_at_price);
  const images = product.images;
  const approvedReviews = (product.reviews ?? []).filter((r) => r.approved);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-stone-500">
        <Link route={{ name: 'home' }} className="hover:text-stone-900">Home</Link>
        <ChevronRight size={12} />
        {product.category && (
          <>
            <Link route={{ name: 'catalog', category: topCategorySlug(product.category.slug) }} className="hover:text-stone-900">
              {topCategoryLabel(product.category.slug)}
            </Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-stone-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
            {images[activeImage] && (
              <img
                src={images[activeImage].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            {discount && (
              <span className="absolute left-4 top-4 bg-stone-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                -{discount}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-16 overflow-hidden rounded-md border-2 transition-colors ${
                    i === activeImage ? 'border-stone-900' : 'border-transparent hover:border-stone-300'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={product.rating} size={16} />
            <span className="text-sm text-stone-500">{product.rating.toFixed(1)} · {product.review_count} reviews</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-stone-900">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
            )}
            {discount && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Save {discount}%
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-stone-600">{product.description}</p>

          {/* Color selector */}
          {colors.length > 0 && (
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">
                  Color: <span className="font-normal text-stone-600">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedColor === c
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">
                  Size: <span className="font-normal text-stone-600">{selectedSize}</span>
                </span>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900"
                >
                  <Ruler size={13} /> Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const sku = product.skus.find((k) => k.size === s && (colors.length === 0 || k.color === selectedColor));
                  const unavailable = !sku || sku.stock <= 0;
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      disabled={unavailable}
                      className={`min-w-11 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        selectedSize === s
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : unavailable
                          ? 'border-stone-200 bg-stone-50 text-stone-300 line-through cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock status */}
          <div className="mt-5">
            {outOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Out of Stock
              </span>
            ) : variantOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Variant out of stock
              </span>
            ) : stockForVariant <= 5 && stockForVariant > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Low Stock — only {stockForVariant} left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> In Stock
              </span>
            )}
          </div>

          {/* Quantity + add to cart */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center rounded-md border border-stone-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stockForVariant || 99, q + 1))}
                className="flex h-11 w-11 items-center justify-center text-stone-600 hover:text-stone-900"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${
                !canAdd
                  ? 'cursor-not-allowed bg-stone-200 text-stone-400'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              {added ? (
                <>
                  <Check size={16} /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> Add to Cart
                </>
              )}
            </button>
          </div>

          {added && (
            <button
              onClick={() => navigate({ name: 'cart' })}
              className="mt-3 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              View cart ({cartCount}) →
            </button>
          )}

          {/* Perks */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-stone-100 pt-6">
            {[
              { icon: Truck, label: 'Free shipping over $75' },
              { icon: RefreshCw, label: '30-day returns' },
              { icon: ShieldCheck, label: 'Secure checkout' },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-1.5 text-center">
                <p.icon size={20} className="text-stone-500" />
                <span className="text-[11px] leading-tight text-stone-500">{p.label}</span>
              </div>
            ))}
          </div>

          {/* Material / details accordion */}
          <div className="mt-8 border-t border-stone-100 pt-6">
            <DetailRow title="Material & Fabric" content={product.material ?? 'Not specified'} />
            <DetailRow title="Brand" content={product.brand ?? '—'} />
            <DetailRow title="Description" content={product.description ?? ''} />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-stone-100 pt-12">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Customer Reviews</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-stone-900">{product.rating.toFixed(1)}</span>
            <div>
              <RatingStars rating={product.rating} size={16} />
              <p className="text-xs text-stone-500">{product.review_count} reviews</p>
            </div>
          </div>
        </div>

        {approvedReviews.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {approvedReviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-stone-100 p-5">
                <div className="flex items-center justify-between">
                  <RatingStars rating={r.rating} size={14} />
                  <span className="text-xs text-stone-400">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {r.title && <h4 className="mt-3 text-sm font-semibold text-stone-900">{r.title}</h4>}
                {r.body && <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{r.body}</p>}
                <p className="mt-3 text-xs font-medium text-stone-500">— {r.author_name ?? 'Anonymous'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-stone-100 pt-12">
          <h2 className="text-xl font-bold tracking-tight text-stone-900">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setSizeGuideOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Size Guide</h3>
              <button onClick={() => setSizeGuideOpen(false)} className="text-stone-400 hover:text-stone-700" aria-label="Close">
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-stone-500">
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest (in)</th>
                  <th className="py-2">Waist (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['XS', 32, 26],
                  ['S', 34, 28],
                  ['M', 38, 30],
                  ['L', 42, 34],
                  ['XL', 46, 38],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-stone-100">
                    <td className="py-2 font-medium text-stone-900">{row[0]}</td>
                    <td className="py-2 text-stone-600">{row[1]}</td>
                    <td className="py-2 text-stone-600">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-stone-400">Measurements are approximate. For shoes, EU sizes are standard.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-stone-900">{title}</span>
        <ChevronDown size={16} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-stone-600">{content}</p>}
    </div>
  );
}

function topCategorySlug(slug: string): string {
  const top = slug.split('-')[0];
  const topLevel = new Set(['meshkuj', 'femra', 'kepuce', 'aksesoore']);
  return topLevel.has(top) ? top : slug;
}

function topCategoryLabel(slug: string): string {
  const normalizedSlug = topCategorySlug(slug);
  const labels: Record<string, string> = {
    meshkuj: 'Meshkuj',
    femra: 'Femra',
    kepuce: 'Këpucë',
    aksesoore: 'Aksesorë',
  };
  return labels[normalizedSlug] ?? slug;
}
