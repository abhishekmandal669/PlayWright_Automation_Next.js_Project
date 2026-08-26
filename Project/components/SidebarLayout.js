'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function SidebarLayout({ user, children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dispatcher submenu accordion state
  const isDispatcherActive = pathname.startsWith('/dispatcher') || pathname.startsWith('/drivers');
  const [dispatcherOpen, setDispatcherOpen] = useState(isDispatcherActive);

  useEffect(() => {
    if (isDispatcherActive) {
      setDispatcherOpen(true);
    }
  }, [pathname, isDispatcherActive]);

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
    { label: 'System Settings', href: '/settings', icon: '⚙️', roles: ['Admin', 'Manager', 'User'] },
  ];

  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || 'User'));

  return (
    <div className="sidebar-app-layout flex w-full min-h-[calc(100vh-65px)] relative font-['IBM_Plex_Sans'] bg-[var(--paper)] text-[var(--ink)]">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar md:hidden flex w-full p-3 bg-[var(--card)] border-b border-[var(--line)] items-center justify-between sticky top-0 z-40">
        <button className="mobile-menu-btn text-xl p-1.5 rounded-lg border border-[var(--line)]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle Sidebar">
          ☰
        </button>
        <div className="mobile-brand-title font-bold text-[var(--ink)]">
          <span>📦 FreightProxy.io</span>
        </div>
        <div className="mobile-user-badge text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--blue-bg)] text-[var(--blue)]">
          {user?.role || 'User'}
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar (Pinned full viewport height) */}
      <aside
        className={`app-sidebar ${
          mobileOpen ? 'open translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:sticky top-0 md:top-[65px] h-screen md:h-[calc(100vh-65px)] overflow-y-auto w-[250px] bg-[var(--card)] border-r border-[var(--line)] p-4 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 z-30`}
      >
        {/* User Identity Pill */}
        {user && (() => {
          const avatarSrc = user.avatarUrl || (typeof window !== 'undefined' ? (localStorage.getItem('fp_avatar') || '') : '') || '';
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
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-transform flex-shrink-0 border border-[var(--line)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-semibold text-xs text-[var(--ink)] truncate group-hover:text-[var(--blue)] transition-colors">{user.name || 'User'}</div>
                <div className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider">
                  {user.role}
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
      <main className="sidebar-main-content flex-1 flex flex-col min-w-0 bg-[var(--paper)]">
        <div className="flex-1 w-full min-w-0">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
