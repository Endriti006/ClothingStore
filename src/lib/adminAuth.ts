const ADMIN_SESSION_KEY = 'bolt_store_admin_session';

const DEFAULT_ADMIN_EMAIL = 'admin@marca.local';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminSession = {
  email: string;
  loggedAt: string;
};

function getConfig() {
  const email = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || DEFAULT_ADMIN_EMAIL;
  const password =
    (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || DEFAULT_ADMIN_PASSWORD;
  return { email: email.toLowerCase().trim(), password };
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

export function getAdminHintEmail(): string {
  return getConfig().email;
}
