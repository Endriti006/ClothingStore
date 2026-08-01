import { useEffect, useState, type FormEvent } from 'react';
import { loginAdmin, getAdminHintEmail, isAdminAuthenticated } from '../lib/adminAuth';
import { useNavigate } from '../lib/router';

export function AccountPage() {
  const navigate = useNavigate();
  const authenticated = isAdminAuthenticated();
  const [email, setEmail] = useState(getAdminHintEmail());
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Admin Login</h1>
      <p className="mt-2 text-sm text-stone-500">
        Sign in to manage products and variants from the admin panel.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            placeholder="admin@marca.local"
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
  );
}
