import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '../lib/router';
import { Link } from '../components/Link';
import { useCartCount as useCartCountCart } from '../lib/cart';
import { useI18n } from '../lib/i18n';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const count = useCartCountCart();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();

  const nav = [
    { label: t('nav.men'), route: { name: 'catalog' as const, category: 'meshkuj' } },
    { label: t('nav.women'), route: { name: 'catalog' as const, category: 'femra' } },
    { label: t('nav.shoes'), route: { name: 'catalog' as const, category: 'kepuce' } },
    { label: t('nav.accessories'), route: { name: 'catalog' as const, category: 'aksesoore' } },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate({ name: 'catalog', query: query.trim() });
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          className="lg:hidden -ml-1 p-1 text-stone-700"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div>
          <Link route={{ name: 'home' }} className="text-xl font-bold tracking-tight text-stone-900">
            MARCA<span className="text-amber-600">.</span>
          </Link>
          <p className="hidden text-[11px] text-stone-400 lg:block">{t('nav.brandTagline')}</p>
        </div>

        <nav className="hidden lg:flex items-center gap-7 ml-6">
          {nav.map((item) => (
            <Link
              key={item.label}
              route={item.route}
              className="text-sm font-medium text-stone-600 hover:text-stone-950 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xs ml-auto">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">{t('nav.language')}</span>
          <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
            {(['sq', 'en', 'de'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLanguage(value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  language === value ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 md:ml-2">
          <Link
            route={{ name: 'account' }}
            className="p-2 text-stone-700 hover:text-stone-950 transition-colors"
            aria-label={t('nav.account')}
          >
            <User size={20} />
          </Link>
          <Link
            route={{ name: 'cart' }}
            className="relative p-2 text-stone-700 hover:text-stone-950 transition-colors"
            aria-label={t('nav.cart')}
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4">
          <form onSubmit={submitSearch} className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-4 text-sm focus:border-stone-400 focus:bg-white focus:outline-none"
              />
            </div>
          </form>
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t('nav.language')}</span>
            <div className="inline-flex rounded-full border border-stone-200 bg-white p-1">
              {(['sq', 'en', 'de'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLanguage(value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    language === value ? 'bg-stone-900 text-white' : 'text-stone-500'
                  }`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.label}
                route={item.route}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-stone-700 hover:bg-stone-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              route={{ name: 'admin' }}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-stone-500 hover:bg-stone-100"
            >
              {t('nav.admin')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
