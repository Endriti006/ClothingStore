export async function getProductsByIds(productIds) {
  const { createClient } = await import('@supabase/supabase-js');
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: '.env' });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Server is missing SUPABASE_SERVICE_ROLE_KEY. Product checkout validation requires admin database access.');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    serviceRoleKey
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

export function sanitizeText(value, options = {}) {
  const maxLength = Number(options.maxLength ?? 200);
  if (typeof value !== 'string') return '';

  let next = value.replace(/\0/g, '').trim();
  next = next.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  next = next.replace(/<[^>]+>/g, ' ');
  next = next.replace(/\s+/g, ' ');
  next = next.replace(/[\u0000-\u001F\u007F]+/g, ' ');
  next = next.replace(/\s+/g, ' ').trim();

  if (!Number.isFinite(maxLength) || maxLength <= 0) {
    return next;
  }

  return next.slice(0, maxLength).trim();
}

export function validateShippingInfo(shippingInfo) {
  const requiredFields = ['name', 'phone', 'address', 'city', 'postalCode'];
  const errors = [];
  const normalized = {
    name: sanitizeText(shippingInfo?.name, { maxLength: 80 }),
    phone: sanitizeText(shippingInfo?.phone, { maxLength: 30 }),
    address: sanitizeText(shippingInfo?.address, { maxLength: 200 }),
    city: sanitizeText(shippingInfo?.city, { maxLength: 80 }),
    postalCode: sanitizeText(shippingInfo?.postalCode, { maxLength: 20 }),
    notes: sanitizeText(shippingInfo?.notes, { maxLength: 240 }),
  };

  for (const field of requiredFields) {
    if (!normalized[field]) {
      errors.push(field);
    }
  }

  const phone = normalized.phone;
  if (phone && !/^\+?[0-9\s()-]{7,15}$/.test(phone)) {
    errors.push('phoneFormat');
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
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
