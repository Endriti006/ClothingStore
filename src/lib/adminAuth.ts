const ADMIN_SESSION_KEY = 'bolt_store_admin_session';

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminSession = {
  email: string;
  loggedAt: string;
};

function getConfig() {
  const email = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  const password = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

  if (email && password) {
    return { email: email.toLowerCase().trim(), password };
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
