'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedUserStr = localStorage.getItem('demoUser');
    if (savedUserStr) {
      try {
        setUser(JSON.parse(savedUserStr));
      } catch (e) {}
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('appTheme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('demoUser');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const role = user?.role || 'User';

  return (
    <header className="header-bar">
      <Link href="/" className="brand-logo" id="brand-logo">
        <div className="brand-icon">📦</div>
        <span>FreightProxy Logistics</span>
      </Link>

      {user && (
        <nav className="nav-links">
          {role === 'Admin' && (
            <Link href="/admin" className="nav-link admin-nav">
              👑 Admin Console
            </Link>
          )}
          {(role === 'Admin' || role === 'Manager') && (
            <Link href="/manager" className="nav-link manager-nav">
              📊 Manager Hub
            </Link>
          )}
          <Link href="/dashboard" className="nav-link">
            📈 Shipments
          </Link>
          <Link href="/profile" className="nav-link">
            👤 Profile
          </Link>
          <Link href="/settings" className="nav-link">
            ⚙️ Settings
          </Link>
        </nav>
      )}

      <div className="header-right">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {user ? (
          <div className="user-nav-badge">
            <span className={`role-pill role-${role.toLowerCase()}`}>{role}</span>
            <button onClick={handleLogout} className="logout-sm-btn" id="logout-btn">
              Logout
            </button>
          </div>
        ) : (
          <div className="accent-badge">
            <span>Playwright Target</span>
          </div>
        )}
      </div>
    </header>
  );
}
