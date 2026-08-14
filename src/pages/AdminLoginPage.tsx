import { useEffect, useState, type FormEvent } from 'react';
import { isAdminAuthenticated, loginAdmin } from '../lib/adminAuth';
import { useNavigate } from '../lib/router';
import { usePageSeo } from '../lib/seo';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const authenticated = isAdminAuthenticated();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  usePageSeo({
    title: 'Admin Login | Marca',
    description: 'Admin sign-in page for the product dashboard and catalog management tools.',
    robots: 'noindex,nofollow',
  });

  useEffect(() => {
    if (authenticated) navigate({ name: 'admin' });
  }, [authenticated, navigate]);

  if (authenticated) return null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = loginAdmin({ email, password });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate({ name: 'admin' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Admin Login</h1>
        <p className="mt-2 text-sm text-stone-500">
          Sign in to manage products and variants from the admin panel.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
              placeholder="Password"
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
}
