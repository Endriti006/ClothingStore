const ADMIN_SESSION_KEY = 'bolt_store_admin_session';
const FALLBACK_ADMIN_EMAIL = 'admin@marca.local';
const FALLBACK_ADMIN_PASSWORD = 'admin123';
const LOGIN_FAILURE_KEY = 'bolt_store_admin_login_failures';
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

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

  return null;
}

function readStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures rather than crashing the UI.
  }
}

function removeStorage(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures rather than crashing the UI.
  }
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = readStorage(ADMIN_SESSION_KEY);
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

function checkLoginLockout(email: string): { ok: true } | { ok: false; message: string } {
  const raw = readStorage(LOGIN_FAILURE_KEY);
  if (!raw) return { ok: true };

  try {
    const entries = JSON.parse(raw) as Record<string, number[]>;
    const timestamps = entries[email] ?? [];
    const recent = timestamps.filter((value) => Date.now() - value < LOCKOUT_WINDOW_MS);

    if (recent.length >= MAX_LOGIN_ATTEMPTS) {
      return { ok: false, message: 'Too many failed admin login attempts. Please wait 15 minutes and try again.' };
    }
  } catch {
    removeStorage(LOGIN_FAILURE_KEY);
  }

  return { ok: true };
}

export function loginAdmin(input: AdminLoginInput): { ok: true } | { ok: false; message: string } {
  const config = getConfig();
  if (!config) {
    return { ok: false, message: 'Admin login is not configured.' };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;

  const lockoutCheck = checkLoginLockout(email);
  if (!lockoutCheck.ok) {
    return lockoutCheck;
  }

  if (email !== config.email || password !== config.password) {
    const raw = readStorage(LOGIN_FAILURE_KEY);
    const existing = raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
    const timestamps = existing[email] ?? [];
    const next = [...timestamps, Date.now()].filter((value) => Date.now() - value < LOCKOUT_WINDOW_MS);
    writeStorage(LOGIN_FAILURE_KEY, JSON.stringify({ ...existing, [email]: next }));
    return { ok: false, message: 'Invalid admin email or password.' };
  }

  removeStorage(LOGIN_FAILURE_KEY);

  const session: AdminSession = {
    email,
    loggedAt: new Date().toISOString(),
  };
  writeStorage(ADMIN_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

export function logoutAdmin() {
  removeStorage(ADMIN_SESSION_KEY);
}
