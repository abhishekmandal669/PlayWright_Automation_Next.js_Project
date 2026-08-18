'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('demoUser');
      if (savedUserStr) {
        try {
          setUser(JSON.parse(savedUserStr));
        } catch (e) {}
      } else {
        setUser({
          id: 'USR-1003',
          name: 'Demo User',
          email: 'user@example.com',
          role: 'User',
          department: 'Quality Assurance',
          title: 'Senior QA Specialist',
          status: 'Active',
          joinedDate: '2024-05-20'
        });
      }
    }
  }, []);

  const role = user?.role || 'User';

  return (
    <div className="layout-wrapper">
      <Header />
      <main className="main-content">
        <div className="dashboard-container">
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
                <span className="joined-pill">📅 Member Since: {user?.joinedDate || '2024-01-01'}</span>
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
                <div className="info-val" style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{user?.id || 'USR-1003'}</div>
              </div>
              <div className="info-item">
                <label>Full Name</label>
                <div className="info-val">{user?.name || 'Demo User'}</div>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <div className="info-val">{user?.email || 'user@example.com'}</div>
              </div>
              <div className="info-item">
                <label>Assigned Department</label>
                <div className="info-val">{user?.department || 'Operations'}</div>
              </div>
              <div className="info-item">
                <label>Job Title</label>
                <div className="info-val">{user?.title || 'Shipping Specialist'}</div>
              </div>
              <div className="info-item">
                <label>Last Security Audit IP</label>
                <div className="info-val" style={{ fontFamily: 'monospace' }}>192.168.31.80 (200 OK)</div>
              </div>
            </div>
          </div>

          {/* Personal Activity Timeline */}
          <div className="activity-panel" style={{ marginTop: '2rem' }}>
            <div className="panel-title">
              <span>📜 Recent Personal Activity Timeline</span>
            </div>
            <div className="timeline-container">
              <div className="timeline-event">
                <div className="timeline-badge">📦</div>
                <div className="timeline-content">
                  <strong>Created Proxy Shipment TRK-9003</strong>
                  <p>Route: Bengaluru $\rightarrow$ Singapore (Volumetric Wt: 0.6kg)</p>
                  <span className="timeline-time">Today at 14:20</span>
                </div>
              </div>
              <div className="timeline-event">
                <div className="timeline-badge">🔑</div>
                <div className="timeline-content">
                  <strong>User Session Authentication</strong>
                  <p>Logged in successfully as {role} role</p>
                  <span className="timeline-time">Today at 09:15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
