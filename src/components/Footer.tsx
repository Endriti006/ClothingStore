import { useState } from 'react';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { Link } from '../components/Link';
import { useI18n } from '../lib/i18n';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { t } = useI18n();

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="mt-20 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold tracking-tight text-stone-900">
              MARCA<span className="text-amber-600">.</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              {t('footer.description')}
            </p>
            <div className="mt-5 flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900"
                  aria-label="Social"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">{t('footer.shop')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-500">
              <li><Link route={{ name: 'catalog', category: 'meshkuj' }} className="hover:text-stone-900">{t('common.men')}</Link></li>
              <li><Link route={{ name: 'catalog', category: 'femra' }} className="hover:text-stone-900">{t('common.women')}</Link></li>
              <li><Link route={{ name: 'catalog', category: 'kepuce' }} className="hover:text-stone-900">{t('common.shoes')}</Link></li>
              <li><Link route={{ name: 'catalog', category: 'aksesoore' }} className="hover:text-stone-900">{t('common.accessories')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">{t('footer.help')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-500">
              <li><a href="#" className="hover:text-stone-900">{t('footer.shipping')}</a></li>
              <li><a href="#" className="hover:text-stone-900">{t('footer.guide')}</a></li>
              <li><a href="#" className="hover:text-stone-900">{t('footer.track')}</a></li>
              <li><a href="#" className="hover:text-stone-900">{t('footer.contact')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-900">{t('footer.newsletter')}</h4>
            <p className="mt-4 text-sm text-stone-500">
              {t('footer.newsletterLead')}
            </p>
            <form onSubmit={subscribe} className="mt-4">
              <div className="flex">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer.emailPlaceholder')}
                    className="w-full rounded-l-md border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-r-md bg-stone-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
                >
                  {t('footer.join')}
                </button>
              </div>
              {subscribed && (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  {t('footer.subscribed')}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-200 py-6 sm:flex-row">
          <p className="text-xs text-stone-400">© 2026 Marca. {t('footer.rights')}</p>
          <div className="flex gap-5 text-xs text-stone-400">
            <a href="#" className="hover:text-stone-700">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-stone-700">{t('footer.terms')}</a>
            <Link route={{ name: 'admin' }} className="hover:text-stone-700">{t('footer.admin')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
