import { useState } from 'react';
import { useNavigate } from '../lib/router';
import { useI18n } from '../lib/i18n';
import { Ruler, ChevronDown } from 'lucide-react';

type Tab = 'men' | 'women' | 'shoes';

interface SizeRow {
  size: string;
  chest?: string;
  bust?: string;
  waist?: string;
  hip?: string;
  inseam?: string;
  length?: string;
  uk?: string;
  us?: string;
  eu?: string;
  cm?: string;
}

const MEN_TOPS: SizeRow[] = [
  { size: 'XS', chest: '32–34"', waist: '26–28"' },
  { size: 'S', chest: '34–36"', waist: '28–30"' },
  { size: 'M', chest: '38–40"', waist: '30–32"' },
  { size: 'L', chest: '42–44"', waist: '34–36"' },
  { size: 'XL', chest: '46–48"', waist: '38–40"' },
  { size: '2XL', chest: '50–52"', waist: '42–44"' },
];

const WOMEN_TOPS: SizeRow[] = [
  { size: 'XS', bust: '30–32"', waist: '24–25"', hip: '33–35"' },
  { size: 'S', bust: '32–34"', waist: '26–27"', hip: '35–37"' },
  { size: 'M', bust: '36–38"', waist: '28–29"', hip: '39–41"' },
  { size: 'L', bust: '40–42"', waist: '30–31"', hip: '43–45"' },
  { size: 'XL', bust: '44–46"', waist: '32–33"', hip: '47–49"' },
];

const SHOES: SizeRow[] = [
  { size: '4', uk: '3', us: '4', eu: '36', cm: '22' },
  { size: '5', uk: '3.5', us: '5', eu: '37.5', cm: '22.9' },
  { size: '6', uk: '4', us: '6', eu: '38', cm: '24.1' },
  { size: '7', uk: '5', us: '7', eu: '39', cm: '24.9' },
  { size: '8', uk: '6', us: '8', eu: '41', cm: '25.8' },
  { size: '9', uk: '7', us: '9', eu: '42', cm: '26.7' },
  { size: '10', uk: '7.5', us: '10', eu: '43', cm: '27.6' },
  { size: '11', uk: '8.5', us: '11', eu: '44', cm: '28.4' },
  { size: '12', uk: '9', us: '12', eu: '45', cm: '29.3' },
];

export function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('men');
  const [showMeasuring, setShowMeasuring] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'men', label: t('common.men') },
    { key: 'women', label: t('common.women') },
    { key: 'shoes', label: t('common.shoes') },
  ];

  const howToMeasure = [
    {
      title: t('sizeGuide.measure.chestTitle'),
      description: t('sizeGuide.measure.chestDesc'),
    },
    {
      title: t('sizeGuide.measure.waistTitle'),
      description: t('sizeGuide.measure.waistDesc'),
    },
    {
      title: t('sizeGuide.measure.hipsTitle'),
      description: t('sizeGuide.measure.hipsDesc'),
    },
    {
      title: t('sizeGuide.measure.inseamTitle'),
      description: t('sizeGuide.measure.inseamDesc'),
    },
  ];

  const fitTips = [
    t('sizeGuide.tips.tip1'),
    t('sizeGuide.tips.tip2'),
    t('sizeGuide.tips.tip3'),
    t('sizeGuide.tips.tip4'),
    t('sizeGuide.tips.tip5'),
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'men':
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">{t('sizeGuide.table.chest')}</th>
                <th className="pb-3">{t('sizeGuide.table.waist')}</th>
              </tr>
            </thead>
            <tbody>
              {MEN_TOPS.map((row) => (
                <tr key={row.size} className="border-b border-stone-100 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-stone-900">{row.size}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.chest}</td>
                  <td className="py-3 text-stone-600">{row.waist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'women':
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">{t('sizeGuide.table.bust')}</th>
                <th className="pb-3 pr-4">{t('sizeGuide.table.waist')}</th>
                <th className="pb-3">{t('sizeGuide.table.hip')}</th>
              </tr>
            </thead>
            <tbody>
              {WOMEN_TOPS.map((row) => (
                <tr key={row.size} className="border-b border-stone-100 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-stone-900">{row.size}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.bust}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.waist}</td>
                  <td className="py-3 text-stone-600">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'shoes':
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">UK</th>
                <th className="pb-3 pr-4">US</th>
                <th className="pb-3 pr-4">EU</th>
                <th className="pb-3">{t('sizeGuide.table.footCm')}</th>
              </tr>
            </thead>
            <tbody>
              {SHOES.map((row) => (
                <tr key={row.size} className="border-b border-stone-100 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-stone-900">{row.size}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.uk}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.us}</td>
                  <td className="py-3 pr-4 text-stone-600">{row.eu}</td>
                  <td className="py-3 text-stone-600">{row.cm} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-stone-500">
        <a
          href="#/"
          onClick={(e) => { e.preventDefault(); navigate({ name: 'home' }); }}
          className="hover:text-stone-900"
        >
          {t('common.home')}
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-stone-700">{t('sizeGuide.title')}</span>
      </nav>

      {/* Hero header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
          <Ruler size={14} />
          {t('footer.guide')}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {t('sizeGuide.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-500">
          {t('sizeGuide.lead')}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mb-8 inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {activeTab === 'shoes' ? t('sizeGuide.shoeChart') : t('sizeGuide.clothingChart')}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {activeTab === 'shoes'
              ? t('sizeGuide.shoeChartLead')
              : t('sizeGuide.clothingChartLead')}
          </p>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
        <p className="mt-6 text-xs text-stone-400">
          {t('sizeGuide.measurementNote')}
        </p>
      </div>

      {/* How to measure */}
      <div className="mt-12">
        <button
          onClick={() => setShowMeasuring(!showMeasuring)}
          className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-stone-300 sm:p-8"
        >
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{t('sizeGuide.howToMeasure')}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {t('sizeGuide.howToMeasureLead')}
            </p>
          </div>
          <ChevronDown
            size={20}
            className={`ml-4 flex-shrink-0 text-stone-400 transition-transform duration-200 ${
              showMeasuring ? 'rotate-180' : ''
            }`}
          />
        </button>
        {showMeasuring && (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {howToMeasure.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-stone-100 bg-stone-50 p-5"
              >
                <h3 className="text-sm font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips section */}
      <div className="mt-12 rounded-2xl border border-amber-100 bg-amber-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-amber-900">{t('sizeGuide.tips.title')}</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-amber-800">
          {fitTips.map((tip, index) => (
            <li key={tip} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">{index + 1}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Still unsure CTA */}
      <div className="mt-12 mb-10 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-lg font-semibold text-stone-900">{t('sizeGuide.stillNotSure')}</h2>
        <p className="mt-2 text-sm text-stone-500">
          {t('sizeGuide.stillNotSureLead')}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#/info/contact"
            onClick={(e) => { e.preventDefault(); navigate({ name: 'info', slug: 'contact' }); }}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            {t('sizeGuide.contactUs')}
          </a>
          <a
            href="#/info/returns"
            onClick={(e) => { e.preventDefault(); navigate({ name: 'info', slug: 'returns' }); }}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300"
          >
            {t('sizeGuide.returnPolicy')}
          </a>
        </div>
      </div>
    </div>
  );
}