const ADMIN_SESSION_KEY = 'bolt_store_admin_session';
const FALLBACK_ADMIN_EMAIL = 'admin@marca.local';
const FALLBACK_ADMIN_PASSWORD = 'admin123';

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminSession = {
  email: string;
  loggedAt: string;
};

function getConfig() {
  const email = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim();
  const password = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim();

  if (email && password) {
    return { email: email.toLowerCase(), password };
  }

  if (import.meta.env.DEV) {
    return {
      email: FALLBACK_ADMIN_EMAIL,
      password: FALLBACK_ADMIN_PASSWORD,
    };
  }

  return null;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminSession();
}

export function loginAdmin(input: AdminLoginInput): { ok: true } | { ok: false; message: string } {
  const config = getConfig();
  if (!config) {
    return { ok: false, message: 'Admin login is not configured.' };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (email !== config.email || password !== config.password) {
    return { ok: false, message: 'Invalid admin email or password.' };
  }

  const session: AdminSession = {
    email,
    loggedAt: new Date().toISOString(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
