'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('appTheme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="header-bar">
      <a href="/" className="brand-logo" id="brand-logo">
        <div className="brand-icon">P</div>
        <span>Playwright App</span>
      </a>

      <div className="header-right">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title="Toggle Dark / Light Theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <div className="accent-badge">
          <span>Playwright Target</span>
        </div>
      </div>
    </header>
  );
}
