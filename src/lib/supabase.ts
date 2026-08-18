import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  // Missing env vars at build time would otherwise crash createClient() and blank the whole app.
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in your Netlify site environment variables and redeploy.'
  );
}

function getSessionHeaderValue() {
  try {
    return window.localStorage.getItem('bolt_store_cart_session') ?? '';
  } catch {
    return '';
  }
}

export const supabase = createClient(url, anonKey, {
  global: {
    headers: {
      'x-session-id': getSessionHeaderValue(),
    },
  },
  auth: { persistSession: true, autoRefreshToken: true },
});
