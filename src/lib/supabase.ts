import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
