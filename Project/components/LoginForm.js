'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [adminHint, setAdminHint]       = useState(null);
  const router = useRouter();

  // Fetch admin email hint from server (no password exposed)
  useEffect(() => {
    async function loadAdminInfo() {
      try {
        const res  = await fetch('/api/auth/demo-info');
        const data = await res.json();
        if (data.success) setAdminHint(data.admin);
      } catch (_) {}
    }
    loadAdminInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies are sent/received
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(`Welcome back, ${data.user?.name}! Redirecting…`);

        // Small delay for UX feedback, then redirect by role
        setTimeout(() => {
          const role = data.user?.role;
          if (role === 'Admin')        router.push('/admin');
          else if (role === 'Manager') router.push('/manager');
          else                         router.push('/dashboard');
        }, 600);
      } else {
        setErrorMessage(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-card" className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/80 dark:border-slate-800 transition-all duration-300">
      <div className="text-center mb-8">
        <h1 id="welcome-heading" className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          FreightProxy Sign In
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Access your Role-Based Logistics Console
        </p>
      </div>

      {/* Error / Success Banners */}
      {errorMessage && (
        <div id="error-banner" className="p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm font-semibold flex items-center gap-2">
          <span className="font-extrabold text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div id="success-banner" className="p-3.5 mb-5 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm font-semibold flex items-center gap-2">
          <span className="font-extrabold text-base">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="login-form">
        <div className="mb-4">
          <label htmlFor="username" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Work Email Address
          </label>
          <input
            id="username"
            type="email"
            className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all pr-20"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password absolute right-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:border-blue-500 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Sign In to Console'
          )}
        </button>
      </form>

      <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        Don&apos;t have an account?{' '}
        <Link href="/register" id="goto-register-link" className="text-blue-600 font-extrabold hover:underline">
          Create Account
        </Link>
      </div>

      {/* Dynamic Admin Hint — email from ENV via API, no password ever shown */}
      {adminHint && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50">
            <span className="text-blue-500 text-sm mt-0.5">🔑</span>
            <div>
              <p className="text-[11px] font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-0.5">
                Admin Access
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                <span className="font-bold">{adminHint.name}</span>
                {' · '}
                <span id="admin-email-hint" className="font-mono">{adminHint.email}</span>
              </p>
              <p className="text-[10px] text-blue-500 dark:text-blue-500 mt-0.5">{adminHint.hint}</p>
            </div>
          </div>
        </div>
      )}

      <div className="trust-badges flex justify-center gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-400">
        <span>🔒 256-Bit SSL</span>
        <span>🛡️ JWT Sessions</span>
        <span>⚡ 99.9% SLA</span>
      </div>
    </div>
  );
}
