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

const HOW_TO_MEASURE = [
  {
    title: 'Chest / Bust',
    description: 'Measure around the fullest part of your chest, keeping the tape measure horizontal and snug but not tight.',
  },
  {
    title: 'Waist',
    description: 'Measure around your natural waistline — the narrowest part of your torso, just above your belly button.',
  },
  {
    title: 'Hips',
    description: 'Stand with feet together and measure around the fullest part of your hips and seat.',
  },
  {
    title: 'Inseam',
    description: 'Measure from the top of your inner thigh down to where you want the hem to fall (typically just above the ankle).',
  },
];


export function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('men');
  const [showMeasuring, setShowMeasuring] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useI18n();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'men', label: t('common.men') },
    { key: 'women', label: t('common.women') },
    { key: 'shoes', label: t('common.shoes') },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'men':
        return (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-200 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                <th className="pb-3 pr-4">Size</th>
                <th className="pb-3 pr-4">Chest</th>
                <th className="pb-3">Waist</th>
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
                <th className="pb-3 pr-4">Bust</th>
                <th className="pb-3 pr-4">Waist</th>
                <th className="pb-3">Hip</th>
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
                <th className="pb-3">Foot (cm)</th>
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
          Home
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-stone-700">Size Guide</span>
      </nav>

      {/* Hero header */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
          <Ruler size={14} />
          {t('footer.guide')}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Size Guide
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-500">
          Find your perfect fit with our detailed size charts. Measure yourself accurately and compare with our sizing to make sure your order fits just right.
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
            {activeTab === 'shoes' ? 'Shoe Size Conversion' : 'Clothing Size Chart'}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {activeTab === 'shoes'
              ? 'Compare sizes across UK, US, and EU standards.'
              : 'All measurements are in inches. Find your size and compare.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
        <p className="mt-6 text-xs text-stone-400">
          * Measurements are approximate and may vary between styles and fabric compositions.
        </p>
      </div>

      {/* How to measure */}
      <div className="mt-12">
        <button
          onClick={() => setShowMeasuring(!showMeasuring)}
          className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-stone-300 sm:p-8"
        >
          <div>
            <h2 className="text-lg font-semibold text-stone-900">How to measure yourself</h2>
            <p className="mt-1 text-sm text-stone-500">
              Tips for getting accurate measurements at home.
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
            {HOW_TO_MEASURE.map((item) => (
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
        <h2 className="text-lg font-semibold text-amber-900">💡 Pro tips for the best fit</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-amber-800">
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">1</span>
            <span>Take measurements in your underwear or fitted clothing — bulky layers will add inches.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">2</span>
            <span>Use a soft tailor's measuring tape. A string can work too — just measure it against a ruler.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">3</span>
            <span>Keep the tape snug against your body but not tight — you should be able to slide one finger underneath.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">4</span>
            <span>If you're between sizes, we recommend sizing up for a relaxed fit or down for a slim fit.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">5</span>
            <span>For shoes, measure your feet at the end of the day — that's when they're at their largest.</span>
          </li>
        </ul>
      </div>

      {/* Still unsure CTA */}
      <div className="mt-12 mb-10 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="text-lg font-semibold text-stone-900">Still not sure?</h2>
        <p className="mt-2 text-sm text-stone-500">
          Our customer support team is happy to help you find the perfect size. We offer free returns within 30 days if something doesn't work out.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#/info/contact"
            onClick={(e) => { e.preventDefault(); navigate({ name: 'info', slug: 'contact' }); }}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            Contact Us
          </a>
          <a
            href="#/info/returns"
            onClick={(e) => { e.preventDefault(); navigate({ name: 'info', slug: 'returns' }); }}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300"
          >
            Return Policy
          </a>
        </div>
      </div>
    </div>
  );
}