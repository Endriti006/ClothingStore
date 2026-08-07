import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getProductsByIds, buildStripeLineItems } from './checkout-utils.js';

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
    if (!cartItems.length) {
      return res.status(400).json({ error: 'Cart is empty' });
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
      success_url: `${frontendUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/#/checkout/cancel`,
      metadata: {
        cart_items: JSON.stringify(cartItems),
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation failed', error);
    return res.status(500).json({ error: 'Unable to create checkout session' });
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
      const sessionId = session.id;

      void (async () => {
        try {
          const { error } = await supabase.from('orders').insert({
            session_id: sessionId,
            status: 'paid',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency || 'usd',
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
