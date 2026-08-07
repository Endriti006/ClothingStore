import { useMemo } from 'react';
import { Link } from '../components/Link';

function getQueryValue(key: string) {
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get(key);
}

export function CheckoutPage() {
  const status = useMemo(() => {
    const hash = window.location.hash;
    if (hash.includes('/checkout/success')) return 'success';
    if (hash.includes('/checkout/cancel')) return 'cancel';
    return 'checkout';
  }, []);

  if (status === 'success') {
    const sessionId = getQueryValue('session_id');

    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Payment successful</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">Thanks for your order</h1>
          <p className="mt-3 text-sm text-stone-600">
            Your payment is confirmed. We’ll email you a receipt shortly.
          </p>
          {sessionId && (
            <p className="mt-4 text-sm text-stone-500">Session ID: {sessionId}</p>
          )}
          <Link
            route={{ name: 'catalog' }}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'cancel') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Payment canceled</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">Checkout was interrupted</h1>
          <p className="mt-3 text-sm text-stone-600">
            No charge was made. You can try checkout again whenever you’re ready.
          </p>
          <Link
            route={{ name: 'cart' }}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center text-stone-500">
      Checkout — under construction.
    </div>
  );
}
