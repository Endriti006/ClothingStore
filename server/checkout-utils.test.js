import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStripeLineItems, validateShippingInfo } from './checkout-utils.js';

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

test('validateShippingInfo requires the core shipping fields', () => {
  const result = validateShippingInfo({
    name: 'Ada Lovelace',
    phone: '5551234',
    address: '123 Main St',
    city: 'New York',
    postalCode: '',
    notes: '',
  });

  assert.deepEqual(result, {
    valid: false,
    errors: ['postalCode'],
    normalized: {
      name: 'Ada Lovelace',
      phone: '5551234',
      address: '123 Main St',
      city: 'New York',
      postalCode: '',
      notes: '',
    },
  });
});

test('validateShippingInfo strips unsafe HTML and normalizes sanitized values', () => {
  const result = validateShippingInfo({
    name: '<script>alert(1)</script> Ada',
    phone: '555-1234',
    address: '123 <b>Main</b> St',
    city: 'New York',
    postalCode: '10001',
    notes: '<img src=x onerror=alert(1)>',
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalized.name, 'Ada');
  assert.equal(result.normalized.address, '123 Main St');
  assert.equal(result.normalized.notes, '');
});
