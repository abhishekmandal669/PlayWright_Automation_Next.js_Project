'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';

const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ProfilePage() {
  const { user: authUser, loading } = useAuth({ redirectTo: '/' });
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      const localAvatar = typeof window !== 'undefined' ? (localStorage.getItem('fp_avatar') || '') : '';
      const finalAvatar = authUser.avatarUrl || localAvatar || '';
      setCurrentUser({
        ...authUser,
        avatarUrl: finalAvatar,
      });
      if (authUser.avatarUrl && typeof window !== 'undefined') {
        localStorage.setItem('fp_avatar', authUser.avatarUrl);
      }
    }
  }, [authUser]);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WEBP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMsg({ type: '', text: '' });

      const base64Image = await compressImage(file, 400, 400, 0.85);

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: base64Image }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fp_avatar', data.user.avatarUrl || '');
        }
        setStatusMsg({ type: 'success', text: 'Profile picture updated successfully!' });
        window.dispatchEvent(new Event('user-profile-updated'));
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update profile picture.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error uploading image. Please try again.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      setStatusMsg({ type: '', text: '' });

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: '' }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('fp_avatar');
        }
        setStatusMsg({ type: 'success', text: 'Profile picture removed.' });
        window.dispatchEvent(new Event('user-profile-updated'));
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to remove photo.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Error removing photo.' });
    } finally {
      setUploading(false);
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

  if (!currentUser) return null;

  const role = currentUser?.role || 'User';

  const profileContent = (
    <div className="w-full max-w-[1240px] mx-auto p-[28px] font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)] m-0">👤 Customer &amp; User Profile</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Account identity &middot; Role credentials &middot; Security preferences
          </p>
        </div>
        <Link href="/settings" className="btn-paper btn-paper-primary" style={{ textDecoration: 'none' }}>
          ✏️ Edit Profile &amp; Settings
        </Link>
      </div>

      {statusMsg.text && (
        <div className={`p-3 rounded-lg text-xs font-medium ${
          statusMsg.type === 'success'
            ? 'bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]'
            : 'bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]'
        }`}>
          <span>{statusMsg.type === 'success' ? '✓' : '⚠️'} {statusMsg.text}</span>
        </div>
      )}

      {/* Profile Hero Card */}
      <div className="paper-card flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar with Click-to-Upload Overlay */}
          <div className="relative group">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--line)] shadow-md flex items-center justify-center bg-[var(--chip-bg)] text-[var(--chip-text)] font-bold text-2xl font-mono cursor-pointer relative transition-transform group-hover:scale-105"
              title="Click to change profile picture"
            >
              {currentUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold">
                <span className="text-base">📷</span>
                <span>{uploading ? 'Uploading…' : 'Change'}</span>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
            />
          </div>

          <div className="min-w-[240px]">
            <h2 className="text-[18px] font-semibold text-[var(--ink)] m-0">{currentUser?.name || 'User Profile'}</h2>
            <p className="text-[13px] text-[var(--muted)] mt-0.5 mb-3">{currentUser?.email || 'user@example.com'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={role === 'Admin' ? 'pill-blue' : role === 'Manager' ? 'pill-amber' : 'pill-green'}>
                {role}
              </span>
              <span className="pill-green">🟢 Status: {currentUser?.status || 'Active'}</span>
              <span className="pill-blue">📅 Member Since: {currentUser?.joinedDate || '2026-01-01'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons for Image Upload */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-paper btn-paper-primary text-xs py-2 px-3 flex items-center gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span>📷</span>
            <span>{uploading ? 'Uploading…' : currentUser?.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          {currentUser?.avatarUrl && (
            <button
              type="button"
              className="btn-paper btn-paper-rust text-xs py-2 px-3"
              onClick={handleRemovePhoto}
              disabled={uploading}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Profile Details Information Grid */}
      <div className="paper-card">
        <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-4">📋 Personal Information &amp; Account Metadata</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Account ID</div>
            <div className="text-[13px] font-semibold font-mono text-[var(--blue)]">{currentUser?.id || currentUser?._id || 'USR-1001'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Full Name</div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">{currentUser?.name || 'User'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Email Address</div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">{currentUser?.email}</div>
          </div>
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Assigned Department</div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">{currentUser?.department || 'Operations'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Job Title</div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">{currentUser?.title || 'Shipping Associate'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Account Role</div>
            <div className="text-[13px] font-semibold text-[var(--ink)]">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentUser?.role === 'Admin' || currentUser?.role === 'Manager') {
    return <SidebarLayout user={currentUser}>{profileContent}</SidebarLayout>;
  }

  return <div className="w-full bg-[var(--paper)] min-h-[calc(100vh-73px)]">{profileContent}</div>;
}

