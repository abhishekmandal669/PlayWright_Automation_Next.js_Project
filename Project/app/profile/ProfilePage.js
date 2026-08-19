'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';

export default function ProfilePage() {
  const { user, loading } = useAuth({ redirectTo: '/' });

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

  const role = user?.role || 'User';

  return (
    <div className="dashboard-container w-full">
      {/* Profile Header Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-avatar-large">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-hero-info">
          <h1>{user?.name || 'User Profile'}</h1>
          <p className="profile-email">{user?.email || 'user@example.com'}</p>
          <div className="profile-badges">
            <span className={`role-pill role-${role.toLowerCase()}`}>{role}</span>
            <span className="status-pill">🟢 Status: {user?.status || 'Active'}</span>
            <span className="joined-pill">📅 Member Since: {user?.joinedDate || '2026-01-01'}</span>
          </div>
        </div>
        <div className="profile-hero-action">
          <Link href="/settings" className="btn-primary">
            ✏️ Edit Profile & Settings
          </Link>
        </div>
      </div>

      {/* Profile Details Information Grid */}
      <div className="activity-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-title">
          <span>📋 Personal Information & Account Metadata</span>
          <span className="status-pill">Verified Account</span>
        </div>

        <div className="profile-info-grid">
          <div className="info-item">
            <label>Account ID</label>
            <div className="info-val" style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{user?.id || 'USR-1001'}</div>
          </div>
          <div className="info-item">
            <label>Full Name</label>
            <div className="info-val">{user?.name || 'User'}</div>
          </div>
          <div className="info-item">
            <label>Email Address</label>
            <div className="info-val">{user?.email}</div>
          </div>
          <div className="info-item">
            <label>Assigned Department</label>
            <div className="info-val">{user?.department || 'Operations'}</div>
          </div>
          <div className="info-item">
            <label>Job Title</label>
            <div className="info-val">{user?.title || 'Shipping Associate'}</div>
          </div>
          <div className="info-item">
            <label>Account Role</label>
            <div className="info-val" style={{ fontWeight: 'bold' }}>{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
