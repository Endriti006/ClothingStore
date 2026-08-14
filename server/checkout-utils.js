export async function getProductsByIds(productIds) {
  const { createClient } = await import('@supabase/supabase-js');
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: '.env' });

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  );
  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, status')
    .in('id', productIds);

  if (error) throw error;
  return data ?? [];
}

export function normalizeVariantValue(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function skuKey(productId, size, color) {
  return `${productId}::${size}::${color}`;
}

export function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = typeof item?.id === 'string' ? item.id.trim() : '';
      const quantity = Math.max(0, Math.floor(Number(item?.quantity || 0)));
      const size = normalizeVariantValue(item?.size, 'One Size');
      const color = normalizeVariantValue(item?.color, 'Default');

      return {
        id,
        quantity,
        size,
        color,
      };
    })
    .filter((item) => item.id.length > 0 && item.quantity > 0);
}

export function ensureProductsPurchasable(cartItems, products) {
  for (const item of cartItems) {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) {
      throw new Error(`Product not found: ${item.id}`);
    }

    if (product.status !== 'published' && product.status !== 'out_of_stock') {
      throw new Error(`Product is not available for checkout: ${item.id}`);
    }
  }
}

export function validateShippingInfo(shippingInfo) {
  const requiredFields = ['name', 'phone', 'address', 'city', 'postalCode'];
  const errors = [];

  for (const field of requiredFields) {
    const value = shippingInfo?.[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(field);
    }
  }

  const phone = shippingInfo?.phone?.trim() || '';
  if (phone && !/^\+?[0-9\s()-]{7,15}$/.test(phone)) {
    errors.push('phoneFormat');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildStripeLineItems(cartItems, products) {
  return cartItems.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) {
      throw new Error(`Product not found: ${item.id}`);
    }

    const unitAmount = Math.round(Number(product.price) * 100);

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          metadata: {
            slug: product.slug,
          },
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });
}
