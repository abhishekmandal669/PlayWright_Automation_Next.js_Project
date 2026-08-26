'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const [user, setUser]   = useState(null);
  const router            = useRouter();
  const pathname          = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme('light');
      localStorage.setItem('appTheme', 'light');
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const localAvatar = typeof window !== 'undefined' ? (localStorage.getItem('fp_avatar') || '') : '';
          const finalUser = {
            ...data.user,
            avatarUrl: data.user.avatarUrl || localAvatar || '',
          };
          setUser(finalUser);
          if (data.user.avatarUrl && typeof window !== 'undefined') {
            localStorage.setItem('fp_avatar', data.user.avatarUrl);
          }
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

    const handleProfileUpdate = () => {
      checkSession();
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
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
    <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--line)] px-6 py-3.5 flex items-center justify-between shadow-[0_2px_8px_rgba(22,35,63,0.03)] font-['IBM_Plex_Sans'] text-[var(--ink)] transition-colors duration-200">
      {/* Brand Logo */}
      <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 font-semibold text-lg text-[var(--ink)] no-underline">
        <div className="w-8 h-8 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-sm">
          📦
        </div>
        <span className="tracking-tight font-bold">FreightProxy<span className="text-[var(--blue)]">.io</span></span>
      </Link>

      <nav className="flex items-center gap-5">
        {/* Navigation links for User */}
        {user && user.role === 'User' && (
          <div className="flex gap-1.5 items-center">
            <Link
              href="/dashboard"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/dashboard' || pathname.startsWith('/orders')
                  ? 'bg-[var(--blue-bg)] text-[var(--blue)]'
                  : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)]'
              }`}
            >
              All Orders
            </Link>

            <Link
              href="/create-order"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/create-order'
                  ? 'bg-[var(--blue-bg)] text-[var(--blue)]'
                  : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)]'
              }`}
            >
              + Create Order
            </Link>

            <Link
              href="/profile"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/profile'
                  ? 'bg-[var(--blue-bg)] text-[var(--blue)]'
                  : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)]'
              }`}
            >
              Profile
            </Link>

            <Link
              href="/settings"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                pathname === '/settings'
                  ? 'bg-[var(--blue-bg)] text-[var(--blue)]'
                  : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)]'
              }`}
            >
              Settings
            </Link>
          </div>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Theme Toggle Option Commented Out as requested */}
          {/*
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="btn-paper text-xs py-1.5 px-3"
          >
            <span>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
          </button>
          */}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[var(--line)]">
              {/* User Profile Avatar & Name (Links to Profile) */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-[var(--card-alt)] hover:bg-[var(--paper)] border border-[var(--line)] transition-all text-[var(--ink)] no-underline group shadow-sm"
                title="View Profile"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'User'}
                    className="w-7 h-7 rounded-full object-cover shadow-inner group-hover:scale-105 transition-transform flex-shrink-0 border border-[var(--line)]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors leading-tight">
                    {user.name || 'User'}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider leading-tight">
                    {user.role}
                  </span>
                </div>
              </Link>

              <button
                id="logout-btn"
                onClick={handleLogout}
                className="btn-paper text-xs py-1.5 px-3 text-[var(--rust)] hover:bg-[var(--rust-bg)]"
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          ) : !isAuthPage ? (
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-paper text-xs py-1.5 px-3"
            >
              Logout
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
