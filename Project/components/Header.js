'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Header — Global Navigation Bar
 * - Validates session via /api/auth/me on mount & route change
 * - Displays active role badge, user name & prominent Logout button
 * - Preserves theme preferences in localStorage
 */
export default function Header() {
  const [theme, setTheme] = useState('light');
  const [user, setUser]   = useState(null);
  const router            = useRouter();
  const pathname          = usePathname();

  // Load theme from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('appTheme') || 'light';
      applyTheme(savedTheme);
      setTheme(savedTheme);
    }
  }, []);

  // Validate session on mount and whenever pathname changes
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch (_) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [pathname, checkSession]);

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('appTheme', next);
    applyTheme(next);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (_) {}
    setUser(null);
    router.push('/');
  };

  const isAuthPage = pathname === '/' || pathname === '/register';

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
      {/* Brand Logo */}
      <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 font-extrabold text-xl text-slate-900 dark:text-white no-underline hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 flex items-center justify-center font-black text-lg shadow-md">
          📦
        </div>
        <span>FreightProxy<span className="text-blue-600">.io</span></span>
      </Link>

      <nav className="flex items-center gap-6">
        {/* Navigation links (only when logged in or not on auth pages) */}
        {user && (
          <div className="flex gap-1.5 items-center">
            <Link
              href="/dashboard"
              className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
              }`}
            >
              Shipments
            </Link>

            {(user.role === 'Admin' || user.role === 'Manager') && (
              <Link
                href="/manager"
                className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/manager'
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
                }`}
              >
                Manager Hub
              </Link>
            )}

            {user.role === 'Admin' && (
              <Link
                href="/admin"
                className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/admin'
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
                }`}
              >
                Admin Console
              </Link>
            )}

            <Link
              href="/profile"
              className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/profile'
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
              }`}
            >
              Profile
            </Link>

            <Link
              href="/settings"
              className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/settings'
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600'
              }`}
            >
              Settings
            </Link>
          </div>
        )}

        {/* Right Section: Theme Toggle + User Info + Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:border-blue-500 shadow-sm transition-all"
          >
            <span>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                user.role === 'Admin'   ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700' :
                user.role === 'Manager' ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700' :
                                          'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
              }`}>
                {user.role}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:block">
                {user.name?.split(' ')[0]}
              </span>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 border border-red-200 dark:border-red-800/60 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          ) : !isAuthPage ? (
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-800/60 px-3 py-1.5 rounded-lg transition-all"
            >
              Logout
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
