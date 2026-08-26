'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const { user, logout }  = useAuthContext();
  const router            = useRouter();
  const pathname          = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme('light');
      localStorage.setItem('appTheme', 'light');
      if (localStorage.getItem('fp_avatar')) {
        localStorage.removeItem('fp_avatar');
      }
    }
  }, []);

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

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <header className="sticky top-0 z-50 bg-[var(--card)] border-b border-[var(--line)] px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-[0_2px_8px_rgba(22,35,63,0.03)] font-['IBM_Plex_Sans'] text-[var(--ink)] transition-colors duration-200">
      {/* Left side: Mobile Hamburger Button + Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {user && (
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--card-alt)] text-[var(--ink)] hover:bg-[var(--paper)] text-sm transition-colors flex-shrink-0"
            onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
            aria-label="Toggle Sidebar Menu"
          >
            ☰
          </button>
        )}

        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 sm:gap-2.5 font-semibold text-base sm:text-lg text-[var(--ink)] no-underline min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-sm">
            📦
          </div>
          <span className="tracking-tight font-bold text-sm sm:text-base truncate">
            FreightProxy<span className="text-[var(--blue)]">.io</span>
          </span>
        </Link>
      </div>

      <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Navigation links for User (hidden on mobile, in drawer) */}
        {user && user.role === 'User' && (
          <div className="hidden lg:flex gap-1.5 items-center">
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
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2.5 border-l border-[var(--line)]">
              {/* User Profile Avatar & Name (Links to Profile) */}
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-[var(--card-alt)] hover:bg-[var(--paper)] border border-[var(--line)] transition-all text-[var(--ink)] no-underline group shadow-sm flex-shrink-0"
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
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors leading-tight truncate max-w-[120px]">
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
                disabled={loggingOut}
                className="btn-paper text-xs py-1.5 px-2 sm:px-3 text-[var(--rust)] hover:bg-[var(--rust-bg)] flex items-center gap-1 flex-shrink-0"
                title="Logout"
              >
                {loggingOut ? (
                  <span className="spinner-sm" />
                ) : (
                  <span>🚪</span>
                )}
                <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          ) : !isAuthPage ? (
            <button
              id="logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-paper text-xs py-1.5 px-3 flex items-center gap-1"
            >
              {loggingOut && <span className="spinner-sm" />}
              <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
