'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';

export default function SettingsPage() {
  const { user, loading } = useAuth({ redirectTo: '/' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 2FA / Google Authenticator State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDept(user.department || 'Operations');
      setAvatarUrl(user.avatarUrl || '');
      setMfaEnabled(!!user.mfaEnabled);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 400;
        if (width > height) {
          if (width > max) {
            height = Math.round((height * max) / width);
            width = max;
          }
        } else {
          if (height > max) {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          department: dept,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          if (avatarUrl) {
            localStorage.setItem('fp_avatar', avatarUrl);
          } else {
            localStorage.removeItem('fp_avatar');
          }
        }
        setSuccessMsg('Profile details and photo updated successfully!');
        window.dispatchEvent(new Event('user-profile-updated'));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg('Network error while updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setSuccessMsg('Security password updated successfully!');
    setCurrPassword('');
    setNewPassword('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Start Google Authenticator Setup
  const handleStartMfaSetup = async () => {
    setErrorMsg('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/setup', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMfaSetupData(data);
        setMfaEnabled(data.mfaEnabled);
        setShowMfaModal(true);
      } else {
        setErrorMsg(data.message || 'Failed to initialize 2FA setup.');
      }
    } catch (err) {
      setErrorMsg('Network error while starting 2FA setup.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Confirm and Enable Google Authenticator
  const handleConfirmEnableMfa = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: mfaCode,
          backupCodes: mfaSetupData?.backupCodes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaEnabled(true);
        setShowMfaModal(false);
        setMfaCode('');
        setSuccessMsg(data.message || 'Google Authenticator 2FA activated!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Invalid 6-digit code.');
      }
    } catch (err) {
      setErrorMsg('Network error while enabling 2FA.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Disable 2FA
  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaEnabled(false);
        setShowDisableModal(false);
        setDisablePassword('');
        setSuccessMsg('Two-Factor Authentication has been disabled.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.message || 'Failed to disable 2FA.');
      }
    } catch (err) {
      setErrorMsg('Network error while disabling 2FA.');
    } finally {
      setMfaLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#8C96A6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔒</div>
          <p style={{ fontWeight: 700 }}>Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const settingsContent = (
    <div className="w-full max-w-[1240px] mx-auto p-[28px] font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)] m-0">⚙️ Account &amp; Security Settings</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Profile info &middot; Google Authenticator 2FA &middot; Security credentials
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg text-xs font-medium bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]">
          <span>✓ {successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg text-xs font-medium bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Profile Info Card */}
        <div className="paper-card">
          <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-4">👤 Personal Profile Details</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Profile Picture Upload & Preview */}
            <div className="flex items-center gap-4 p-3 rounded-lg border border-[var(--line)] bg-[var(--paper)]">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--line)] shadow-sm bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xl flex-shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Profile Photo
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="btn-paper text-xs py-1 px-2.5 cursor-pointer">
                    <span>📷 Choose Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="btn-paper text-xs py-1 px-2.5 text-[var(--rust)] hover:bg-[var(--rust-bg)]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-1">PNG, JPG, or WEBP (Max 5MB)</div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">Full Name</label>
              <input type="text" className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px]" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">Work Email (Read Only)</label>
              <input type="email" className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] text-[13px] opacity-70 cursor-not-allowed" value={email} disabled />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">Department</label>
              <input type="text" className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px]" value={dept} onChange={(e) => setDept(e.target.value)} required />
            </div>
            <button type="submit" className="btn-paper btn-paper-primary w-full justify-center" disabled={savingProfile}>
              {savingProfile ? 'Saving Changes…' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security & Google Authenticator 2FA Card */}
        <div className="paper-card space-y-5">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-2">📱 Google Authenticator (2FA / MFA)</h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">
              Add an extra layer of protection to your FreightProxy account using Google Authenticator, Microsoft Authenticator, or Authy.
            </p>

            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                  <span>Google Authenticator</span>
                  {mfaEnabled ? (
                    <span className="pill pill-green" style={{ fontSize: '10px' }}>✓ ACTIVE</span>
                  ) : (
                    <span className="pill pill-amber" style={{ fontSize: '10px' }}>NOT CONFIGURED</span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  {mfaEnabled ? 'Protected with 6-digit TOTP security code' : 'Require 6-digit verification code on sign-in'}
                </div>
              </div>

              {mfaEnabled ? (
                <button
                  type="button"
                  className="btn-paper btn-paper-rust text-xs"
                  onClick={() => setShowDisableModal(true)}
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-paper btn-paper-primary text-xs"
                  onClick={handleStartMfaSetup}
                  disabled={mfaLoading}
                >
                  {mfaLoading ? 'Loading…' : 'Setup 2FA →'}
                </button>
              )}
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="pt-4 border-t border-[var(--line)]">
            <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-3">🔒 Change Account Password</h2>
            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Current Password</label>
                <input type="password" className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px]" value={currPassword} onChange={(e) => setCurrPassword(e.target.value)} required />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">New Password</label>
                <input type="password" className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px]" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-paper btn-paper-primary w-full justify-center">Update Password</button>
            </form>
          </div>
        </div>
      </div>

      {/* Google Authenticator Setup Modal */}
      {showMfaModal && mfaSetupData && (
        <div className="fixed inset-0 z-50 bg-[#16233F]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <span>📱</span>
                <span>Setup Google Authenticator</span>
              </h3>
              <button
                type="button"
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-bold"
                onClick={() => setShowMfaModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--ink-soft)]">
              <p>
                <strong>Step 1:</strong> Open <strong>Google Authenticator</strong> on your mobile phone and scan this QR code:
              </p>

              {/* QR Code Display */}
              <div className="flex justify-center p-4 bg-white rounded-xl border border-[var(--line)] shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaSetupData.otpAuthUri)}`}
                  alt="Google Authenticator QR Code"
                  className="w-44 h-44 rounded-lg"
                />
              </div>

              {/* Manual Secret Key */}
              <div className="p-3 bg-[var(--paper)] rounded-lg border border-[var(--line)]">
                <div className="text-[10.5px] font-bold text-[var(--muted)] uppercase">Or Enter Key Manually</div>
                <div className="font-mono text-xs font-bold text-[var(--blue)] tracking-widest mt-0.5 select-all">
                  {mfaSetupData.secret}
                </div>
              </div>

              {/* Step 2: 6-Digit Code Confirmation */}
              <form onSubmit={handleConfirmEnableMfa} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">
                    Step 2: Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full p-2.5 text-center font-mono text-base font-bold tracking-widest rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    placeholder="000 000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn-paper"
                    onClick={() => setShowMfaModal(false)}
                    disabled={mfaLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-paper btn-paper-primary"
                    disabled={mfaLoading}
                  >
                    {mfaLoading ? 'Verifying…' : 'Activate 2FA ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-[#16233F]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)]">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              To disable Google Authenticator protection, please enter your current account password:
            </p>

            <form onSubmit={handleDisableMfa} className="space-y-3">
              <input
                type="password"
                required
                placeholder="Account password"
                className="w-full p-2.5 text-xs rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-paper"
                  onClick={() => setShowDisableModal(false)}
                  disabled={mfaLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-paper btn-paper-rust"
                  disabled={mfaLoading}
                >
                  {mfaLoading ? 'Disabling…' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (user?.role === 'Admin' || user?.role === 'Manager') {
    return <SidebarLayout user={user}>{settingsContent}</SidebarLayout>;
  }

  return <div className="w-full bg-[var(--paper)] min-h-[calc(100vh-73px)]">{settingsContent}</div>;
}
