import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStripeLineItems } from './checkout-utils.js';

test('buildStripeLineItems uses server-side product prices', () => {
  const items = [
    { id: 'product-1', quantity: 2 },
    { id: 'product-2', quantity: 1 },
  ];

  const products = [
    { id: 'product-1', name: 'Classic Shirt', price: 19.99, slug: 'classic-shirt' },
    { id: 'product-2', name: 'Studio Tote', price: 45, slug: 'studio-tote' },
  ];

  const lineItems = buildStripeLineItems(items, products);

  assert.deepEqual(lineItems, [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Classic Shirt',
          metadata: { slug: 'classic-shirt' },
        },
        unit_amount: 1999,
      },
      quantity: 2,
    },
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Studio Tote',
          metadata: { slug: 'studio-tote' },
        },
        unit_amount: 4500,
      },
      quantity: 1,
    },
  ]);
});
