'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength calculation
  const getStrengthClass = () => {
    if (!password) return '';
    if (password.length < 6) return 'strength-weak';
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strength-strong';
    return 'strength-medium';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" id="register-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us to experience fast enterprise testing</p>
        </div>

        {error && (
          <div className="alert alert-error" id="register-error-banner">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" id="register-success-banner">
            <span className="alert-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} id="register-form">
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <div className="strength-meter">
                <div className={`strength-bar ${getStrengthClass()}`}></div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={agreeTerms} 
                onChange={(e) => setAgreeTerms(e.target.checked)} 
              />
              I agree to the Terms of Service & Privacy Policy
            </label>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer-link">
          Already have an account?{' '}
          <Link href="/" id="goto-login-link" className="link-highlight">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
