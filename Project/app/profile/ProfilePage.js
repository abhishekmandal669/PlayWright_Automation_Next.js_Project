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
      const userKey = `fp_avatar_${authUser.email?.toLowerCase()}`;
      const localAvatar = typeof window !== 'undefined' ? (localStorage.getItem(userKey) || '') : '';
      const finalAvatar = authUser.avatarUrl || localAvatar || '';
      setCurrentUser({
        ...authUser,
        avatarUrl: finalAvatar,
      });
      if (authUser.avatarUrl && typeof window !== 'undefined') {
        localStorage.setItem(userKey, authUser.avatarUrl);
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
          const userKey = `fp_avatar_${data.user.email?.toLowerCase()}`;
          localStorage.setItem(userKey, data.user.avatarUrl || '');
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
          const userKey = `fp_avatar_${data.user.email?.toLowerCase()}`;
          localStorage.removeItem(userKey);
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

  if (!authUser) return null;

  const role = currentUser?.role || 'User';

  const profileContent = (
    <div className="w-full max-w-[1240px] mx-auto p-3.5 sm:p-7 font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-base sm:text-[18px] font-semibold text-[var(--ink)] m-0">👤 Customer &amp; User Profile</h1>
          <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Account identity &middot; Role credentials &middot; Security preferences
          </p>
        </div>
        <Link href="/settings" className="btn-paper btn-paper-primary self-start sm:self-auto text-xs py-1.5 px-3" style={{ textDecoration: 'none' }}>
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
      <div className="paper-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Avatar with Click-to-Upload Overlay */}
          <div className="relative group flex-shrink-0">
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[var(--line)] shadow-md flex items-center justify-center bg-[var(--chip-bg)] text-[var(--chip-text)] font-bold text-xl sm:text-2xl font-mono cursor-pointer relative transition-transform group-hover:scale-105"
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
                <span className="text-sm sm:text-base">📷</span>
                <span>{uploading ? '…' : 'Change'}</span>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              id="profile-avatar-input"
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-[18px] font-semibold text-[var(--ink)] m-0 truncate">{currentUser?.name || 'User Profile'}</h2>
            <p className="text-xs sm:text-[13px] text-[var(--muted)] mt-0.5 mb-2 sm:mb-3 truncate">{currentUser?.email || 'user@example.com'}</p>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={role === 'Admin' ? 'pill-blue' : role === 'Manager' ? 'pill-amber' : 'pill-green'}>
                {role}
              </span>
              <span className="pill-green">🟢 {currentUser?.status || 'Active'}</span>
              <span className="pill-blue hidden sm:inline-block">📅 Joined {currentUser?.joinedDate || '2026-01-01'}</span>
            </div>
          </div>
        </div>

        {/* Action buttons for Image Upload */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]">
          <button
            id="upload-photo-btn"
            type="button"
            className="btn-paper btn-paper-primary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span>📷</span>
            <span>{uploading ? 'Uploading…' : currentUser?.avatarUrl ? 'Change' : 'Upload'}</span>
          </button>

          {currentUser?.avatarUrl && (
            <button
              id="remove-photo-btn"
              type="button"
              className="btn-paper btn-paper-rust text-xs py-1.5 px-2.5 sm:px-3"
              onClick={handleRemovePhoto}
              disabled={uploading}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Profile Details Information Grid */}
      <div className="paper-card p-4 sm:p-6">
        <h2 className="text-xs sm:text-[14px] font-semibold text-[var(--ink)] mb-3 sm:mb-4">📋 Personal Information &amp; Account Metadata</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Account ID</div>
            <div className="text-xs sm:text-[13px] font-semibold font-mono text-[var(--blue)] truncate">{currentUser?.id || currentUser?._id || 'USR-1001'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Full Name</div>
            <div className="text-xs sm:text-[13px] font-semibold text-[var(--ink)] truncate">{currentUser?.name || 'User'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Email Address</div>
            <div className="text-xs sm:text-[13px] font-semibold text-[var(--ink)] truncate">{currentUser?.email}</div>
          </div>
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Assigned Department</div>
            <div className="text-xs sm:text-[13px] font-semibold text-[var(--ink)] truncate">{currentUser?.department || 'Operations'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Job Title</div>
            <div className="text-xs sm:text-[13px] font-semibold text-[var(--ink)] truncate">{currentUser?.title || 'Shipping Associate'}</div>
          </div>
          <div className="paper-field">
            <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Account Role</div>
            <div className="text-xs sm:text-[13px] font-semibold text-[var(--ink)]">{role}</div>
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

