import { useEffect, useState, useCallback } from 'react';

export type InfoPageSlug =
  | 'shipping'
  | 'returns'
  | 'size-guide'
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'contact'
  | 'track-order';

export type Route =
  | { name: 'home' }
  | { name: 'catalog'; category?: string; query?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'account' }
  | { name: 'admin' }
  | { name: 'info'; slug: InfoPageSlug }
  | { name: 'not-found' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, search = ''] = hash.split('?');
  const params = new URLSearchParams(search);
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'catalog') {
    return { name: 'catalog', category: parts[1], query: params.get('q') || undefined };
  }
  if (parts[0] === 'product' && parts[1]) return { name: 'product', slug: parts[1] };
  if (parts[0] === 'cart') return { name: 'cart' };
  if (parts[0] === 'checkout') return { name: 'checkout' };
  if (parts[0] === 'account') return { name: 'account' };
  if (parts[0] === 'admin') return { name: 'admin' };
  if (parts[0] === 'info' && parts[1]) {
    const slug = parts[1] as InfoPageSlug;
    if (['shipping', 'returns', 'size-guide', 'privacy', 'terms', 'faq', 'contact', 'track-order'].includes(slug)) {
      return { name: 'info', slug };
    }
  }
  return { name: 'not-found' };
}

export function buildHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'catalog':
      return route.category
        ? `#/catalog/${route.category}`
        : '#/catalog';
    case 'product':
      return `#/product/${route.slug}`;
    case 'cart':
      return '#/cart';
    case 'checkout':
      return '#/checkout';
    case 'account':
      return '#/account';
    case 'admin':
      return '#/admin';
    case 'info':
      return `#/info/${route.slug}`;
    default:
      return '#/';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function navigate(route: Route) {
  window.location.hash = buildHash(route);
  // Hash routing can preserve previous scroll position; enforce top after navigation.
  requestAnimationFrame(() => {
    scrollToTop();
    requestAnimationFrame(() => scrollToTop());
  });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      scrollToTop();
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function useNavigate() {
  return useCallback((route: Route) => navigate(route), []);
}
