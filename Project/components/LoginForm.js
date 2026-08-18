'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setSuccess(`Authenticated as ${data.user.role}! Redirecting...`);
      if (typeof window !== 'undefined') {
        localStorage.setItem('demoUser', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
      }

      setTimeout(() => {
        if (data.user.role === 'Admin') {
          router.push('/admin');
        } else if (data.user.role === 'Manager') {
          router.push('/manager');
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin@system.com');
    setPassword('AdminPass123!');
  };

  const handleFillManager = () => {
    setUsername('manager@system.com');
    setPassword('ManagerPass123!');
  };

  const handleFillUser = () => {
    setUsername('user@example.com');
    setPassword('password123');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" id="login-card">
        <div className="auth-header">
          <h1 className="auth-title" id="welcome-heading">FreightProxy Logistics</h1>
          <p className="auth-subtitle">Sign in to manage freight orders, dispatches & shipments</p>
        </div>

        {error && (
          <div className="alert alert-error" id="error-banner">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" id="success-banner">
            <span className="alert-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Social SSO Quick Buttons */}
        <div className="sso-group">
          <button type="button" className="sso-btn" onClick={handleFillUser}>
            <span>🌐</span> Google SSO
          </button>
          <button type="button" className="sso-btn" onClick={handleFillUser}>
            <span>💻</span> GitHub
          </button>
        </div>

        <div className="divider-line">Or sign in with role credentials</div>

        <form onSubmit={handleLogin} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Email Address</label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="name@system.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              Remember me
            </label>
            <a href="#" className="link-highlight" onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : 'Sign In'}
          </button>
        </form>

        <div className="demo-box">
          <div className="demo-title">
            <span>⚡ Quick Demo Logins (Click to Autofill)</span>
          </div>
          <div className="role-demo-buttons">
            <button
              type="button"
              id="autofill-btn"
              className="btn-fill role-btn-admin"
              onClick={handleFillAdmin}
            >
              👑 Admin Demo
            </button>
            <button
              type="button"
              className="btn-fill role-btn-manager"
              onClick={handleFillManager}
            >
              📊 Manager Demo
            </button>
            <button
              type="button"
              className="btn-fill role-btn-user"
              onClick={handleFillUser}
            >
              👤 User Demo
            </button>
          </div>
        </div>

        {/* Security Badges */}
        <div className="trust-badges">
          <span className="trust-badge-item">🔒 256-bit SSL</span>
          <span className="trust-badge-item">🛡️ OAuth 2.0</span>
          <span className="trust-badge-item">✓ SOC2 Ready</span>
        </div>

        <div className="auth-footer-link">
          Don't have an account?{' '}
          <Link href="/register" id="goto-register-link" className="link-highlight">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
