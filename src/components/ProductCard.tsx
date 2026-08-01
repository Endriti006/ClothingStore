import { Link } from '../components/Link';
import { formatPrice, discountPercent } from '../lib/format';
import { RatingStars } from './RatingStars';
import type { ProductWithRelations } from '../types';

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const image = product.images[0]?.url;
  const hoverImage = product.images[1]?.url ?? image;
  const discount = discountPercent(product.price, product.compare_at_price);
  const totalStock = product.skus.reduce((s, k) => s + k.stock, 0);
  const outOfStock = product.status === 'out_of_stock' || totalStock <= 0;

  return (
    <Link
      route={{ name: 'product', slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone-100">
        {image && (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
        )}
        {hoverImage && (
          <img
            src={hoverImage}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount && (
            <span className="bg-stone-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              -{discount}%
            </span>
          )}
          {product.featured && !discount && (
            <span className="bg-amber-500 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="bg-stone-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-stone-900/95 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white transition-transform duration-300 group-hover:translate-y-0">
          View Details
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
          {product.brand}
        </p>
        <h3 className="mt-0.5 text-sm font-medium text-stone-800 group-hover:text-stone-950">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-900">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-xs text-stone-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <RatingStars rating={product.rating} size={12} />
          <span className="text-[11px] text-stone-400">({product.review_count})</span>
        </div>
      </div>
    </Link>
  );
}
