import { Link } from '../components/Link';
import { useI18n } from '../lib/i18n';
import { usePageSeo } from '../lib/seo';

export function AccountPage() {
  const { language } = useI18n();

  usePageSeo({
    title: language === 'sq' ? 'Llogaria | Marca' : 'Account | Marca',
    description: 'Customer account page for managing the store experience and account information.',
    robots: 'noindex,nofollow',
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-16 text-center sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Customer Account</h1>
      <p className="mt-3 text-sm text-stone-500">
        Customer account features are coming soon. You can still browse products and check out as a guest.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          route={{ name: 'catalog' }}
          className="inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Continue shopping
        </Link>
        <Link
          route={{ name: 'cart' }}
          className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 px-6 text-sm font-semibold text-stone-700 hover:border-stone-400"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
