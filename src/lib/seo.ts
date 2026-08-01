import { useEffect } from 'react';

type SeoInput = {
  title: string;
  description: string;
  image?: string;
  robots?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function ensureMeta(attribute: 'name' | 'property', value: string) {
  const selector = `meta[${attribute}="${value}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

function ensureCanonical() {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  return element;
}

export function usePageSeo({ title, description, image, robots = 'index,follow', type = 'website', jsonLd }: SeoInput) {
  useEffect(() => {
    document.title = title;
    ensureMeta('name', 'description').content = description;
    ensureMeta('name', 'robots').content = robots;
    ensureMeta('property', 'og:title').content = title;
    ensureMeta('property', 'og:description').content = description;
    ensureMeta('property', 'og:type').content = type;
    ensureMeta('name', 'twitter:title').content = title;
    ensureMeta('name', 'twitter:description').content = description;
    if (image) {
      ensureMeta('property', 'og:image').content = image;
      ensureMeta('name', 'twitter:image').content = image;
    }

    const canonical = ensureCanonical();
    canonical.href = window.location.href;

    const schemaId = 'marca-jsonld';
    let script = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = schemaId;
      document.head.appendChild(script);
    }
    script.textContent = jsonLd ? JSON.stringify(jsonLd) : '';
  }, [description, image, jsonLd, robots, title, type]);
}
