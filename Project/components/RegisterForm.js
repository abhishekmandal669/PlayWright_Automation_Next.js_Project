'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [mounted, setMounted]                 = useState(false);
  const [name, setName]                       = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [agreeTerms, setAgreeTerms]           = useState(true);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState('');
  const [loading, setLoading]                 = useState(false);
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 33, text: 'Weak', color: '#E53E3E' };
    if (score <= 4) return { score: 66, text: 'Good', color: '#D69E2E' };
    return { score: 100, text: 'Strong', color: '#2E6B47' };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      timerRef.current = setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-card" data-hydrated={mounted ? "true" : "false"} className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/80 dark:border-slate-800 transition-all duration-300 mx-auto">
      {/* Header */}
      <div className="text-center mb-5 sm:mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
          Create Account
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Join FreightProxy to start booking and managing shipments
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div id="register-error-banner" className="p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm font-semibold flex items-center gap-2">
          <span className="font-extrabold text-base">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div id="register-success-banner" className="p-3.5 mb-5 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 text-sm font-semibold flex items-center gap-2">
          <span className="font-extrabold text-base">✓</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleRegister} id="register-form" className="space-y-4">
        <div>
          <label htmlFor="register-name" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Full Name
          </label>
          <input
            id="register-name"
            type="text"
            className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Work Email Address
          </label>
          <input
            id="register-email"
            type="email"
            className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all pr-20"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:border-blue-500 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                <span>Password Strength:</span>
                <span style={{ color: strength.color }}>{strength.text}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
            Confirm Password
          </label>
          <input
            id="register-confirm-password"
            type={showPassword ? 'text' : 'password'}
            className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 font-medium">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 accent-blue-600 cursor-pointer"
            />
            <span>I agree to the Terms of Service &amp; Privacy Policy</span>
          </label>
        </div>

        <button
          id="register-submit-btn"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Create Account →'
          )}
        </button>
      </form>

      <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
        Already have an account?{' '}
        <Link href="/" id="goto-login-link" className="text-blue-600 font-extrabold hover:underline">
          Sign In
        </Link>
      </div>

      <div className="trust-badges flex justify-center gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-400">
        <span>🔒 256-Bit SSL</span>
        <span>🛡️ Google 2FA</span>
        <span>⚡ 99.9% SLA</span>
      </div>
    </div>
  );
}
