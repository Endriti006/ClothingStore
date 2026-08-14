import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { SizeGuidePage } from './pages/SizeGuidePage';
import { InfoPage } from './pages/InfoPage';
import { Link } from './components/Link';
import { useI18n } from './lib/i18n';
import { usePageSeo } from './lib/seo';

function App() {
  const route = useRoute();
  const { language } = useI18n();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  usePageSeo({
    title: language === 'sq' ? 'Marca Albania' : 'Marca Albania',
    description: language === 'sq'
      ? 'Dyqan online me veshje, kepuce dhe aksesore per meshkuj dhe femra.'
      : 'Online fashion store with clothing, shoes, and accessories for men and women.',
    robots: route.name === 'admin' || route.name === 'account' || route.name === 'cart' || route.name === 'checkout'
      ? 'noindex,nofollow'
      : 'index,follow',
  });

  let page: React.ReactNode;
  let isAdmin = false;

  switch (route.name) {
    case 'home':
      page = <HomePage />;
      break;
    case 'catalog':
      page = <CatalogPage category={route.category} query={route.query} audience={route.audience} />;
      break;
    case 'product':
      page = <ProductPage slug={route.slug} />;
      break;
    case 'cart':
      page = <CartPage />;
      break;
    case 'checkout':
      page = <CheckoutPage />;
      break;
    case 'account':
      page = <AccountPage />;
      break;
    case 'admin-login':
      isAdmin = true;
      page = <AdminLoginPage />;
      break;
    case 'admin':
      isAdmin = true;
      page = <AdminPage />;
      break;
    case 'info':
      switch (route.slug) {
        case 'size-guide':
          page = <SizeGuidePage />;
          break;
        case 'shipping':
        case 'returns':
        case 'privacy':
        case 'terms':
        case 'contact':
        case 'track-order':
        case 'faq':
          page = <InfoPage slug={route.slug} />;
          break;
        default:
          page = <NotFound />;
      }
      break;
    default:
      page = <NotFound />;
  }

  if (isAdmin) {
    return <>{page}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

function NotFound() {
  const { t } = useI18n();

  usePageSeo({
    title: 'Page Not Found | Marca',
    description: 'The page you requested could not be found.',
    robots: 'noindex',
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">
      <h1 className="text-3xl font-bold text-stone-900">{t('common.pageNotFound')}</h1>
      <p className="mt-2 text-sm text-stone-500">{t('common.pageNotFoundLead')}</p>
      <Link
        route={{ name: 'home' }}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
      >
        {t('common.backToHome')}
      </Link>
    </div>
  );
}

export default App;
