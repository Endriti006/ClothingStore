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
    .select('id, name, slug, price')
    .in('id', productIds)
    .eq('status', 'published');

  if (error) throw error;
  return data ?? [];
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
