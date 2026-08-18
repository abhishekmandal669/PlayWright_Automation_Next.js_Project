'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('demoUser');
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          setUser(u);
          setName(u.name || '');
          setEmail(u.email || '');
          setDept(u.department || 'Operations');
        } catch (e) {}
      }
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, name, department: dept };
    setUser(updatedUser);
    localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    setSuccessMsg('Profile details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setSuccessMsg('Security Password updated successfully!');
    setCurrPassword('');
    setNewPassword('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="layout-wrapper">
      <Header />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>⚙️ Account & System Settings</h1>
              <p>Manage your profile info, security credentials, and app preferences</p>
            </div>
          </div>

          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
              <span>✓ {successMsg}</span>
            </div>
          )}

          <div className="settings-grid">
            {/* Profile Info Card */}
            <div className="activity-panel">
              <div className="panel-title">
                <span>👤 Personal Profile Details</span>
              </div>
              <form onSubmit={handleSaveProfile} className="modal-form" style={{ padding: '1rem 0' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email (Read Only)</label>
                  <input type="email" className="form-input" value={email} disabled style={{ opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" value={dept} onChange={(e) => setDept(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary">Save Profile Changes</button>
              </form>
            </div>

            {/* Security & Password Card */}
            <div className="activity-panel">
              <div className="panel-title">
                <span>🔒 Security & 2FA Credentials</span>
              </div>
              <form onSubmit={handlePasswordReset} className="modal-form" style={{ padding: '1rem 0' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={currPassword} onChange={(e) => setCurrPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-options" style={{ marginBottom: '1rem' }}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
                    Enforce Two-Factor Authentication (2FA)
                  </label>
                </div>
                <button type="submit" className="btn-primary">Update Security Password</button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
