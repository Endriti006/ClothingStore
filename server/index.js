import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  getProductsByIds,
  buildStripeLineItems,
  validateShippingInfo,
  normalizeCartItems,
  ensureProductsPurchasable,
  skuKey,
  normalizeVariantValue,
} from './checkout-utils.js';

dotenv.config({ path: '.env' });

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});
const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || ''
);

function assertAdminDbAccess() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Server is missing SUPABASE_SERVICE_ROLE_KEY. COD and inventory updates require admin database access.');
  }
}

async function reserveStockForItems(cartItems) {
  assertAdminDbAccess();

  const productIds = Array.from(new Set(cartItems.map((item) => item.id)));
  if (!productIds.length) return new Set();

  const { data: skuRows, error: skuError } = await supabase
    .from('product_skus')
    .select('id, product_id, size, color, stock')
    .in('product_id', productIds);

  if (skuError) throw skuError;

  const skuByKey = new Map();
  for (const row of skuRows ?? []) {
    const productId = String(row.product_id);
    const size = normalizeVariantValue(row.size, 'One Size');
    const color = normalizeVariantValue(row.color, 'Default');
    skuByKey.set(skuKey(productId, size, color), row);
  }

  const requestedBySku = new Map();
  for (const item of cartItems) {
    const key = skuKey(item.id, normalizeVariantValue(item.size, 'One Size'), normalizeVariantValue(item.color, 'Default'));
    requestedBySku.set(key, (requestedBySku.get(key) || 0) + Number(item.quantity || 0));
  }

  const touchedProductIds = new Set();

  for (const [key, requestedQty] of requestedBySku.entries()) {
    const sku = skuByKey.get(key);
    if (!sku) {
      throw new Error('One or more selected product variants are no longer available.');
    }

    const available = Math.max(0, Math.floor(Number(sku.stock || 0)));
    if (available < requestedQty) {
      throw new Error('Some items are out of stock or have limited quantity. Please refresh your cart.');
    }
  }

  for (const [key, requestedQty] of requestedBySku.entries()) {
    const sku = skuByKey.get(key);
    if (!sku) {
      throw new Error('One or more selected product variants are no longer available.');
    }

    const { data: updatedSku, error: updateError } = await supabase
      .from('product_skus')
      .update({ stock: Math.max(0, Number(sku.stock || 0) - requestedQty) })
      .eq('id', sku.id)
      .gte('stock', requestedQty)
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedSku) {
      throw new Error('Stock changed during checkout. Please refresh your cart and try again.');
    }

    touchedProductIds.add(String(sku.product_id));
  }

  return touchedProductIds;
}

async function syncProductStatuses(productIds) {
  assertAdminDbAccess();

  if (!productIds.size) return;

  const ids = Array.from(productIds);
  const { data: skuRows, error: skuError } = await supabase
    .from('product_skus')
    .select('product_id, stock')
    .in('product_id', ids);

  if (skuError) throw skuError;

  const stockByProduct = new Map(ids.map((id) => [id, 0]));
  for (const row of skuRows ?? []) {
    const productId = String(row.product_id);
    const stock = Math.max(0, Math.floor(Number(row.stock || 0)));
    stockByProduct.set(productId, (stockByProduct.get(productId) || 0) + stock);
  }

  for (const productId of ids) {
    const totalStock = stockByProduct.get(productId) || 0;
    const nextStatus = totalStock <= 0 ? 'out_of_stock' : 'published';
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: nextStatus })
      .eq('id', productId);
    if (updateError) throw updateError;
  }
}

async function persistOrderAndUpdateInventory(orderPayload, cartItems) {
  assertAdminDbAccess();

  const touchedProductIds = await reserveStockForItems(cartItems);

  const { data, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single();

  if (error) throw error;

  await syncProductStatuses(touchedProductIds);

  return data;
}

app.use(
  cors({
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

app.post('/api/checkout/create-session', express.json(), async (req, res) => {
  try {
    const cartItems = normalizeCartItems(req.body?.items);
    const shippingInfo = req.body?.shippingInfo || {};
    const validation = validateShippingInfo(shippingInfo);

    if (!cartItems.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!validation.valid) {
      return res.status(400).json({ error: 'Please fill in your shipping details', errors: validation.errors });
    }

    const productIds = cartItems.map((item) => item.id);
    const products = await getProductsByIds(productIds);
    ensureProductsPurchasable(cartItems, products);
    const lineItems = buildStripeLineItems(
      cartItems,
      products
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${frontendUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}&payment_type=card`,
      cancel_url: `${frontendUrl}/#/checkout/cancel`,
      metadata: {
        cart_items: JSON.stringify(cartItems),
        shipping_info: JSON.stringify(shippingInfo),
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed', error);
    const message = error instanceof Error ? error.message : 'Unable to create checkout session';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/orders/cod', express.json(), async (req, res) => {
  try {
    const cartItems = normalizeCartItems(req.body?.items);
    const shippingInfo = req.body?.shippingInfo || {};
    const validation = validateShippingInfo(shippingInfo);

    if (!cartItems.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!validation.valid) {
      return res.status(400).json({ error: 'Please fill in your shipping details', errors: validation.errors });
    }

    const productIds = cartItems.map((item) => item.id);
    const products = await getProductsByIds(productIds);
    ensureProductsPurchasable(cartItems, products);
    const lineItems = cartItems.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }

      return {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        size: item.size,
        color: item.color,
        quantity: Number(item.quantity || 1),
        unit_price: Number(product.price),
        line_total: Number(product.price) * Number(item.quantity || 1),
      };
    });

    const data = await persistOrderAndUpdateInventory(
      {
        status: 'pending_cod',
        payment_method: 'cod',
        payment_type: 'cod',
        total_amount: lineItems.reduce((sum, item) => sum + Number(item.line_total), 0),
        currency: 'usd',
        shipping_info: shippingInfo,
        line_items: lineItems,
        payment_metadata: { source: 'cod' },
      },
      cartItems
    );

    return res.json({ orderId: data.id });
  } catch (error) {
    console.error('COD order creation failed', error);
    const message = error instanceof Error ? error.message : 'Unable to create order';
    return res.status(500).json({ error: message });
  }
});

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (error) {
      console.error('Webhook signature verification failed', error);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const cartItems = normalizeCartItems(JSON.parse(session.metadata?.cart_items || '[]'));
      const shippingInfo = JSON.parse(session.metadata?.shipping_info || '{}');
      const sessionId = session.id;

      void (async () => {
        try {
          if (!cartItems.length) return;

          const { data: existingOrder, error: lookupError } = await supabase
            .from('orders')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (existingOrder) return;

          const productIds = cartItems.map((item) => item.id);
          const products = await getProductsByIds(productIds);
          ensureProductsPurchasable(cartItems, products);

          const lineItems = cartItems.map((item) => {
            const product = products.find((entry) => entry.id === item.id);
            if (!product) {
              throw new Error(`Product not found: ${item.id}`);
            }

            return {
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              unit_price: Number(product.price),
              line_total: Number(product.price) * Number(item.quantity || 1),
            };
          });

          await persistOrderAndUpdateInventory(
            {
              session_id: sessionId,
              status: 'paid',
              payment_method: 'card',
              payment_type: 'card',
              total_amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency || 'usd',
              shipping_info: shippingInfo,
              line_items: lineItems,
              payment_metadata: session,
            },
            cartItems
          );
        } catch (hookError) {
          console.error('Webhook order persistence failed', hookError);
        }
      })();
    }

    return res.status(200).send('ok');
  }
);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Checkout server listening on port ${port}`);
});
