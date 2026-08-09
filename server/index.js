import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getProductsByIds, buildStripeLineItems, validateShippingInfo } from './checkout-utils.js';

dotenv.config({ path: '.env' });

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

app.use(
  cors({
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

app.post('/api/checkout/create-session', express.json(), async (req, res) => {
  try {
    const cartItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const shippingInfo = req.body?.shippingInfo || {};
    const validation = validateShippingInfo(shippingInfo);

    if (!cartItems.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!validation.valid) {
      return res.status(400).json({ error: 'Please fill in your shipping details', errors: validation.errors });
    }

    const productIds = cartItems.map((item) => item.id).filter(Boolean);
    const products = await getProductsByIds(productIds);
    const lineItems = buildStripeLineItems(
      cartItems.map((item) => ({ id: item.id, quantity: Number(item.quantity || 1) })),
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
    return res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

app.post('/api/orders/cod', express.json(), async (req, res) => {
  try {
    const cartItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const shippingInfo = req.body?.shippingInfo || {};
    const validation = validateShippingInfo(shippingInfo);

    if (!cartItems.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!validation.valid) {
      return res.status(400).json({ error: 'Please fill in your shipping details', errors: validation.errors });
    }

    const productIds = cartItems.map((item) => item.id).filter(Boolean);
    const products = await getProductsByIds(productIds);
    const lineItems = cartItems.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) {
        throw new Error(`Product not found: ${item.id}`);
      }

      return {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        quantity: Number(item.quantity || 1),
        unit_price: Number(product.price),
        line_total: Number(product.price) * Number(item.quantity || 1),
      };
    });

    const { data, error } = await supabase
      .from('orders')
      .insert({
        status: 'pending_cod',
        payment_method: 'cod',
        payment_type: 'cod',
        total_amount: lineItems.reduce((sum, item) => sum + Number(item.line_total), 0),
        currency: 'usd',
        shipping_info: shippingInfo,
        line_items: lineItems,
        payment_metadata: { source: 'cod' },
      })
      .select('id')
      .single();

    if (error) throw error;

    return res.json({ orderId: data.id });
  } catch (error) {
    console.error('COD order creation failed', error);
    return res.status(500).json({ error: 'Unable to create order' });
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
      const cartItems = JSON.parse(session.metadata?.cart_items || '[]');
      const shippingInfo = JSON.parse(session.metadata?.shipping_info || '{}');
      const sessionId = session.id;

      void (async () => {
        try {
          const { error } = await supabase.from('orders').insert({
            session_id: sessionId,
            status: 'paid',
            payment_method: 'card',
            payment_type: 'card',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'usd',
            shipping_info: shippingInfo,
            line_items: cartItems,
            payment_metadata: session,
          });
          if (error) throw error;
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
