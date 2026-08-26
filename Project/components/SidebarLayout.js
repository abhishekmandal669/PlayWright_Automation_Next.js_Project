'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';
import Footer from './Footer';

export default function SidebarLayout({ user, children }) {
  const pathname = usePathname();
  const { user: ctxUser } = useAuthContext();
  const activeUser = user || ctxUser;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dispatcher submenu accordion state
  const isDispatcherActive = pathname.startsWith('/dispatcher') || pathname.startsWith('/drivers');
  const [dispatcherOpen, setDispatcherOpen] = useState(isDispatcherActive);

  useEffect(() => {
    const handleToggle = () => {
      setMobileOpen((prev) => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
    };
  }, []);

  useEffect(() => {
    // Close mobile drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'All Orders & Hub', href: '/dashboard', icon: '📦', roles: ['Admin', 'Manager', 'User'] },
    { label: 'Create Shipment Order', href: '/create-order', icon: '➕', roles: ['Admin', 'Manager', 'User'] },
    {
      label: 'Dispatcher Operations',
      icon: '📡',
      roles: ['Admin', 'Manager'],
      isDropdown: true,
      subItems: [
        { label: 'Dispatcher Dashboard', href: '/dispatcher', icon: '📊' },
        { label: 'Fleet & Drivers', href: '/drivers', icon: '🚚' },
      ],
    },
    { label: 'Manager Operations', href: '/manager', icon: '📋', roles: ['Admin', 'Manager'] },
    { label: 'Admin Console', href: '/admin', icon: '👑', roles: ['Admin'] },
    { label: 'User Directory', href: '/users', icon: '👥', roles: ['Admin', 'Manager'] },
    { label: 'System Settings', href: '/settings', icon: '⚙️', roles: ['Admin', 'Manager', 'User'] },
  ];

  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(activeUser?.role || 'User'));

  return (
    <div className="sidebar-app-layout flex w-full max-w-full overflow-x-clip min-h-[calc(100vh-55px)] sm:min-h-[calc(100vh-65px)] relative font-['IBM_Plex_Sans'] bg-[var(--paper)] text-[var(--ink)]">
      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar (Pinned full viewport height on desktop, sliding drawer on mobile) */}
      <aside
        className={`app-sidebar fixed top-[53px] sm:top-[61px] bottom-0 left-0 h-[calc(100vh-53px)] sm:h-[calc(100vh-61px)] overflow-y-auto w-[260px] max-w-[85vw] bg-[var(--card)] border-r border-[var(--line)] p-4 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 z-40 md:z-30 shadow-2xl md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="md:hidden flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
            <span>📦 FreightProxy.io</span>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-lg border border-[var(--line)] flex items-center justify-center text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        {/* User Identity Pill */}
        {activeUser && (() => {
          const userKey = `fp_avatar_${activeUser.email?.toLowerCase()}`;
          const avatarSrc = activeUser.avatarUrl || (typeof window !== 'undefined' ? (localStorage.getItem(userKey) || '') : '') || '';
          return (
            <Link
              href="/profile"
              className="flex items-center gap-3 p-3 bg-[var(--card-alt)] border border-[var(--line)] rounded-lg mb-5 hover:border-[var(--blue)] transition-all no-underline group"
              title="View Account Profile"
            >
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={activeUser.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform flex-shrink-0 border border-[var(--line)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-semibold text-xs text-[var(--ink)] truncate group-hover:text-[var(--blue)] transition-colors">{activeUser.name || 'User'}</div>
                <div className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">
                  {activeUser.role}
                </div>
              </div>
            </Link>
          );
        })()}

        {/* Navigation List */}
        <nav className="sidebar-nav flex flex-col gap-1 flex-1">
          <div className="text-[11px] font-bold text-[var(--muted)] tracking-wider px-2.5 py-1 uppercase">
            Workspace &amp; Hubs
          </div>
          {visibleNav.map((item) => {
            if (item.isDropdown) {
              return (
                <div key={item.label} className="flex flex-col">
                  {/* Parent Dropdown Button */}
                  <button
                    type="button"
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                      isDispatcherActive
                        ? 'bg-[var(--card-alt)] text-[var(--ink)] font-semibold border border-[var(--line)]'
                        : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)] hover:text-[var(--ink)]'
                    }`}
                    onClick={() => setDispatcherOpen(!dispatcherOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] transition-transform duration-200" style={{ transform: dispatcherOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>

                  {/* Expandable Submenu */}
                  {dispatcherOpen && (
                    <div className="flex flex-col gap-0.5 mt-1 ml-4 pl-2.5 border-l-2 border-[var(--line)]">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-medium text-[11.5px] transition-all ${
                              isSubActive
                                ? 'bg-[var(--blue-bg)] text-[var(--blue)] font-semibold'
                                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-alt)]'
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span>{sub.icon}</span>
                            <span>{sub.label}</span>
                            {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] ml-auto"></span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/orders/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-[var(--blue-bg)] text-[var(--blue)] font-semibold'
                    : 'text-[var(--ink-soft)] hover:bg-[var(--card-alt)] hover:text-[var(--ink)]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] ml-auto"></span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="pt-4 border-t border-[var(--line)] text-[11px] text-[var(--muted)] flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--green)]"></span>
            <span>99.9% Uptime SLA</span>
          </div>
          <div className="text-[10px] text-[var(--muted)]">© 2026 FreightProxy Inc.</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="sidebar-main-content flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-clip md:pl-[260px] bg-[var(--paper)]">
        <div className="flex-1 w-full min-w-0 max-w-full">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
