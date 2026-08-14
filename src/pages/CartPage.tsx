import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '../components/Link';
import { formatPrice } from '../lib/format';
import { supabase } from '../lib/supabase';
import {
  useCart,
  cartSubtotal,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../lib/cart';

type PaymentMethod = 'card' | 'cod';

type ShippingInfo = {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

function skuKey(productId: string, size: string, color: string) {
  return `${productId}::${size}::${color}`;
}

const defaultShippingInfo: ShippingInfo = {
  name: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  notes: '',
};

async function createCheckoutSession(
  items: Array<{ id: string; quantity: number; size: string; color: string }>,
  shippingInfo: ShippingInfo
) {
  const response = await fetch('http://localhost:3001/api/checkout/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, shippingInfo }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to start checkout');
  }

  return data.url as string;
}

async function createCodOrder(
  items: Array<{ id: string; quantity: number; size: string; color: string }>,
  shippingInfo: ShippingInfo
) {
  const response = await fetch('http://localhost:3001/api/orders/cod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, shippingInfo }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to create order');
  }

  return data.orderId as string;
}

function validateShippingInfo(shippingInfo: ShippingInfo) {
  const errors: string[] = [];

  for (const field of ['name', 'phone', 'address', 'city', 'postalCode'] as Array<keyof ShippingInfo>) {
    if (typeof shippingInfo[field] !== 'string' || shippingInfo[field].trim() === '') {
      errors.push(field);
    }
  }

  const phone = shippingInfo.phone.trim();
  if (phone && !/^\+?[0-9\s()-]{7,15}$/.test(phone)) {
    errors.push('phoneFormat');
  }

  return errors;
}

export function CartPage() {
  const items = useCart();
  const [payOpen, setPayOpen] = useState(false);
  const [step, setStep] = useState<'method' | 'shipping'>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(defaultShippingInfo);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingErrors, setShippingErrors] = useState<string[]>([]);
  const [stockBySku, setStockBySku] = useState<Record<string, number>>({});
  const subtotal = cartSubtotal();
  const shipping = subtotal === 0 || subtotal >= 75 ? 0 : 6.99;
  const total = subtotal + shipping;

  const summaryText = useMemo(() => {
    if (paymentMethod === 'cod') {
      return 'Pay in cash when your order arrives.';
    }
    return 'Secure checkout with your card.';
  }, [paymentMethod]);

  const openCheckout = () => {
    setStep('method');
    setPaymentMethod('card');
    setShippingInfo(defaultShippingInfo);
    setShippingErrors([]);
    setError(null);
    setPayOpen(true);
  };

  useEffect(() => {
    let active = true;

    if (items.length === 0) {
      setStockBySku({});
      return () => {
        active = false;
      };
    }

    const loadStock = async () => {
      const productIds = Array.from(new Set(items.map((item) => item.productId)));
      const { data, error: stockError } = await supabase
        .from('product_skus')
        .select('product_id, size, color, stock')
        .in('product_id', productIds);

      if (stockError) {
        console.error('Unable to load SKU stock for cart', stockError);
        return;
      }

      if (!active) return;

      const nextStockBySku: Record<string, number> = {};
      for (const row of data ?? []) {
        const rowProductId = String((row as { product_id: unknown }).product_id);
        const rowSize = String((row as { size: unknown }).size ?? 'One Size');
        const rowColor = String((row as { color: unknown }).color ?? 'Default');
        const rowStock = Number((row as { stock: unknown }).stock ?? 0);
        nextStockBySku[skuKey(rowProductId, rowSize, rowColor)] = Number.isFinite(rowStock)
          ? Math.max(0, Math.floor(rowStock))
          : 0;
      }

      setStockBySku(nextStockBySku);
    };

    void loadStock();

    return () => {
      active = false;
    };
  }, [items]);

  useEffect(() => {
    for (const item of items) {
      const maxStock = stockBySku[skuKey(item.productId, item.size, item.color)];
      if (typeof maxStock !== 'number') continue;

      if (maxStock <= 0) {
        removeFromCart(item.productId, item.size, item.color);
        continue;
      }

      if (item.quantity > maxStock) {
        updateQuantity(item.productId, item.size, item.color, maxStock);
      }
    }
  }, [items, stockBySku]);

  const handleShippingChange = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    const errors = validateShippingInfo(shippingInfo);
    setShippingErrors(errors);
    if (errors.length > 0) {
      setError('Please complete the required shipping fields.');
      return;
    }

    try {
      setCheckingOut(true);
      setError(null);
      const payloadItems = items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      if (paymentMethod === 'card') {
        const url = await createCheckoutSession(payloadItems, shippingInfo);
        window.location.href = url;
        return;
      }

      const orderId = await createCodOrder(payloadItems, shippingInfo);
      clearCart();
      window.location.hash = `#/checkout/success?payment_type=cod&order_id=${orderId}`;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to continue checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
        <div className="rounded-full bg-stone-100 p-4">
          <ShoppingBag size={28} className="text-stone-500" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-stone-500">Add products from the catalog to get started.</p>
        <Link
          route={{ name: 'catalog' }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.map((item) => {
            const maxStock = stockBySku[skuKey(item.productId, item.size, item.color)];
            const hasStockLimit = typeof maxStock === 'number';
            const atMax = hasStockLimit && item.quantity >= maxStock;

            return (
              <article
                key={`${item.productId}-${item.size}-${item.color}`}
                className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-[112px_1fr_auto]"
              >
                <Link route={{ name: 'product', slug: item.slug }} className="block overflow-hidden rounded-md bg-stone-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-24 w-full object-cover sm:h-28" />
                  ) : (
                    <div className="h-24 w-full sm:h-28" />
                  )}
                </Link>

                <div>
                  <Link route={{ name: 'product', slug: item.slug }} className="text-sm font-semibold text-stone-900 hover:text-stone-700">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">Size: {item.size} | Color: {item.color}</p>
                  <p className="mt-2 text-sm font-medium text-stone-700">{formatPrice(item.price)}</p>

                  <div className="mt-3 inline-flex items-center rounded-md border border-stone-200">
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-stone-600 hover:text-stone-900"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-stone-900">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.size,
                          item.color,
                          hasStockLimit ? Math.min(item.quantity + 1, maxStock) : item.quantity + 1
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center text-stone-600 hover:text-stone-900"
                      disabled={atMax}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {atMax && maxStock > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-600">Maximum stock reached ({maxStock})</p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between sm:pl-4">
                  <button
                    onClick={() => removeFromCart(item.productId, item.size, item.color)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-red-600"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                  <p className="text-sm font-semibold text-stone-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit rounded-xl border border-stone-200 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold text-stone-900">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Shipping</span>
              <span className="font-medium text-stone-900">
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </span>
            </div>
            <div className="border-t border-stone-200 pt-2" />
            <div className="flex items-center justify-between text-stone-900">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={openCheckout}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Proceed to Checkout
          </button>
          <Link
            route={{ name: 'catalog' }}
            className="mt-3 inline-flex w-full items-center justify-center text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Continue shopping
          </Link>
        </aside>
      </div>

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-stone-900/60"
            aria-label="Close payment popup"
            onClick={() => setPayOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Checkout</h2>
                <p className="mt-2 text-sm text-stone-600">Choose how you want to pay and add your shipping details.</p>
              </div>
              <button
                onClick={() => setPayOpen(false)}
                className="text-sm font-medium text-stone-500 hover:text-stone-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full ${step === 'method' ? 'bg-stone-900' : 'bg-stone-200'}`} />
              <div className={`h-2 flex-1 rounded-full ${step === 'shipping' ? 'bg-stone-900' : 'bg-stone-200'}`} />
            </div>

            <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-stone-600">Shipping</span>
                <span className="font-medium text-stone-900">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="text-base font-bold text-stone-900">{formatPrice(total)}</span>
              </div>
            </div>

            {step === 'method' ? (
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                  }`}
                >
                  <div className="font-semibold">Pay with Credit Card</div>
                  <p className={`mt-1 text-sm ${paymentMethod === 'card' ? 'text-stone-200' : 'text-stone-500'}`}>
                    Secure checkout with Stripe.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                  }`}
                >
                  <div className="font-semibold">Cash on Delivery</div>
                  <p className={`mt-1 text-sm ${paymentMethod === 'cod' ? 'text-stone-200' : 'text-stone-500'}`}>
                    Pay when the order arrives.
                  </p>
                </button>
                <p className="text-sm text-stone-500">{summaryText}</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-stone-700">
                    <span className="mb-1 block">Full name</span>
                    <input
                      value={shippingInfo.name}
                      onChange={(event) => handleShippingChange('name', event.target.value)}
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-stone-700">
                    <span className="mb-1 block">Phone number</span>
                    <input
                      value={shippingInfo.phone}
                      onChange={(event) => handleShippingChange('phone', event.target.value)}
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-stone-700">
                  <span className="mb-1 block">Address line</span>
                  <input
                    value={shippingInfo.address}
                    onChange={(event) => handleShippingChange('address', event.target.value)}
                    className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-stone-700">
                    <span className="mb-1 block">City</span>
                    <input
                      value={shippingInfo.city}
                      onChange={(event) => handleShippingChange('city', event.target.value)}
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm font-medium text-stone-700">
                    <span className="mb-1 block">Postal code</span>
                    <input
                      value={shippingInfo.postalCode}
                      onChange={(event) => handleShippingChange('postalCode', event.target.value)}
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="text-sm font-medium text-stone-700">
                  <span className="mb-1 block">Delivery notes (optional)</span>
                  <textarea
                    value={shippingInfo.notes}
                    onChange={(event) => handleShippingChange('notes', event.target.value)}
                    className="min-h-24 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
                  />
                </label>
                {shippingErrors.length > 0 && (
                  <p className="text-sm text-red-600">
                    Please fill in the required fields and use a valid phone number.
                  </p>
                )}
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex gap-3">
              {step === 'shipping' ? (
                <button
                  onClick={() => setStep('method')}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-stone-300 text-sm font-medium text-stone-700"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={() => setPayOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-stone-300 text-sm font-medium text-stone-700"
                >
                  Cancel
                </button>
              )}

              {step === 'method' ? (
                <button
                  onClick={() => setStep('shipping')}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={checkingOut}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingOut ? 'Processing…' : paymentMethod === 'card' ? 'Pay now' : 'Place order'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
