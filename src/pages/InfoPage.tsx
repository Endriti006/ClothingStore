import { Link } from '../components/Link';
import { type InfoPageSlug } from '../lib/router';
import { useI18n } from '../lib/i18n';
import { usePageSeo } from '../lib/seo';

type InfoContent = {
  title: string;
  lead: string;
  body: string[];
};

export function InfoPage({ slug }: { slug: InfoPageSlug }) {
  const { t } = useI18n();

  const content = resolveInfoContent(slug, t);

  usePageSeo({
    title: `${content.title} | Marca`,
    description: content.lead,
    robots: 'index,follow',
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-8 text-xs text-stone-500">
        <Link route={{ name: 'home' }} className="hover:text-stone-900">{t('common.home')}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-stone-700">{content.title}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-stone-900">{content.title}</h1>
      <p className="mt-3 text-sm text-stone-600">{content.lead}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-stone-700">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

function resolveInfoContent(slug: InfoPageSlug, t: (key: string) => string): InfoContent {
  const bySlug: Record<InfoPageSlug, InfoContent> = {
    shipping: {
      title: t('info.shipping.title'),
      lead: t('info.shipping.lead'),
      body: [t('info.shipping.p1'), t('info.shipping.p2')],
    },
    returns: {
      title: t('info.returns.title'),
      lead: t('info.returns.lead'),
      body: [t('info.returns.p1'), t('info.returns.p2')],
    },
    privacy: {
      title: t('info.privacy.title'),
      lead: t('info.privacy.lead'),
      body: [t('info.privacy.p1'), t('info.privacy.p2')],
    },
    terms: {
      title: t('info.terms.title'),
      lead: t('info.terms.lead'),
      body: [t('info.terms.p1'), t('info.terms.p2')],
    },
    contact: {
      title: t('info.contact.title'),
      lead: t('info.contact.lead'),
      body: [t('info.contact.p1'), t('info.contact.p2')],
    },
    'track-order': {
      title: t('info.trackOrder.title'),
      lead: t('info.trackOrder.lead'),
      body: [t('info.trackOrder.p1'), t('info.trackOrder.p2')],
    },
    faq: {
      title: t('info.faq.title'),
      lead: t('info.faq.lead'),
      body: [t('info.faq.p1'), t('info.faq.p2')],
    },
    'size-guide': {
      title: t('footer.guide'),
      lead: t('sizeGuide.lead'),
      body: [t('sizeGuide.howToMeasureLead')],
    },
  };

  return bySlug[slug];
}
