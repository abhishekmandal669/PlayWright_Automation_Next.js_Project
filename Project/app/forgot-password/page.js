'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message);
        if (data.demoOtp) {
          setDemoOtpHint(data.demoOtp);
          setOtp(data.demoOtp); // Auto-fill for seamless user convenience
        }
        setStep(2);
      } else {
        setErrorMessage(data.message || 'Failed to send reset code.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, text: '', color: '' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score: 33, text: 'Weak', color: '#E53E3E' };
    if (score <= 4) return { score: 66, text: 'Good', color: '#D69E2E' };
    return { score: 100, text: 'Strong', color: '#2E6B47' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-3.5 sm:p-6 font-['IBM_Plex_Sans'] bg-[#F6F4EE]">
      <div id="forgot-password-card" data-hydrated={mounted ? "true" : "false"} className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/80 dark:border-slate-800 mx-auto">
        
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
            {step === 1 ? '🔐' : '🔑'}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
            {step === 1
              ? 'Enter your registered work email to receive a 6-digit verification code.'
              : `We sent a 6-digit verification code to ${email}.`}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 mb-5 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Demo OTP Helper Badge */}
        {demoOtpHint && step === 2 && (
          <div className="p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Demo OTP Code:</span>
            </div>
            <strong className="font-mono text-sm tracking-widest bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-300">
              {demoOtpHint}
            </strong>
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Work Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Send Verification Code →'
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP & New Password Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                className="w-full px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all pr-16"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
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
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Set New Password & Sign In ✓'
              )}
            </button>

            <button
              type="button"
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-center"
              onClick={() => setStep(1)}
            >
              ← Change Email
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="text-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          Remember your password?{' '}
          <Link href="/" className="text-blue-600 font-bold hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
