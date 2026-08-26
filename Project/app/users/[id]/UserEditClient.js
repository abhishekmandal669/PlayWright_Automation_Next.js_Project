'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/useAuth';
import SidebarLayout from '../../../components/SidebarLayout';

export default function UserEditClient({ userId }) {
  const { user: caller, loading: authLoading } = useAuth({ redirectTo: '/' });
  const router = useRouter();

  const [targetUser, setTargetUser]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [activeTab, setActiveTab]         = useState('edit'); // 'edit' | 'audit'
  const [statusMsg, setStatusMsg]         = useState({ type: '', text: '' });
  const [showPassword, setShowPassword]   = useState(false);
  const [auditSearch, setAuditSearch]     = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    department: '',
    title: '',
    phone: '',
    status: 'Active',
    newPassword: '',
    auditRemark: '',
  });

  const loadUserData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setTargetUser(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || 'User',
          department: data.user.department || '',
          title: data.user.title || '',
          phone: data.user.phone || '',
          status: data.user.status || 'Active',
          newPassword: '',
          auditRemark: '',
        });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to fetch user profile.' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error loading user data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caller && (caller.role === 'Admin' || caller.role === 'Manager')) {
      loadUserData();
    }
  }, [caller, userId]);

  const showToast = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setTargetUser(data.user);
        setFormData((prev) => ({
          ...prev,
          newPassword: '',
          auditRemark: '',
        }));
        showToast('success', 'User details and audit log updated successfully!');
      } else {
        showToast('error', data.message || 'Failed to update user.');
      }
    } catch {
      showToast('error', 'Network error saving user updates.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/users');
      } else {
        showToast('error', data.message || 'Failed to delete user.');
        setDeleteModalOpen(false);
      }
    } catch {
      showToast('error', 'Network error deleting user.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!caller) return null;

  // Filtered Audit Logs
  const auditLogs = targetUser?.auditLogs || [];
  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.performedBy?.name?.toLowerCase().includes(q) ||
      log.performedBy?.email?.toLowerCase().includes(q)
    );
  });

  const isSelf = caller.email === targetUser?.email;
  const initial = (targetUser?.name || 'U').charAt(0).toUpperCase();

  return (
    <SidebarLayout user={caller}>
      <div className="w-full max-w-[1360px] mx-auto px-3 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 font-['IBM_Plex_Sans'] text-[var(--ink)] box-border">
        {/* Notification Toast */}
        {statusMsg.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{statusMsg.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{statusMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMsg({ type: '', text: '' })}
              className="text-xs opacity-70 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
              <Link href="/users" className="hover:underline text-[var(--muted)]">
                Directory
              </Link>{' '}
              &rarr; <strong style={{ color: 'var(--blue)' }}>User Management Studio</strong>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--ink)] m-0 flex items-center gap-2">
              <span>👤</span>
              <span>{targetUser ? targetUser.name : 'User Management'}</span>
              {targetUser?.role === 'Admin' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                  👑 SuperAdmin
                </span>
              ) : targetUser?.role === 'Manager' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                  📋 Manager
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200">
                  👤 Standard User
                </span>
              )}
            </h1>
            <p className="text-[11px] font-medium text-[var(--muted)] mt-0.5">
              Account Configuration &middot; Role Permissions &middot; Immutable Audit Trail &amp; Edit History
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/users"
              className="btn-paper text-xs py-2 px-3 flex items-center gap-1.5 font-semibold"
            >
              <span>&larr;</span>
              <span>Back to Directory</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs font-semibold text-[var(--muted)] flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
            <span>Loading user account &amp; audit history...</span>
          </div>
        ) : !targetUser ? (
          <div className="paper-card p-12 text-center space-y-3">
            <div className="text-3xl">⚠️</div>
            <div className="text-sm font-bold text-[var(--ink)]">User Account Not Found</div>
            <p className="text-xs text-[var(--muted)]">The requested user ID could not be located in MongoDB.</p>
            <Link href="/users" className="btn-primary text-xs py-2 px-4 inline-block">
              &larr; Return to Users Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0 max-w-full">
            {/* Left Column: User Identity Card & Metadata */}
            <div className="lg:col-span-4 space-y-4 w-full min-w-0">
              <div className="paper-card p-5 sm:p-6 text-center space-y-4">
                <div className="relative inline-block">
                  {targetUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={targetUser.avatarUrl}
                      alt={targetUser.name}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-[var(--line)] mx-auto shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-[var(--chip-bg)] text-[var(--chip-text)] font-extrabold text-3xl flex items-center justify-center mx-auto shadow-inner border border-[var(--line)]">
                      {initial}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[var(--card)] ${
                      (targetUser.status || 'Active') === 'Active'
                        ? 'bg-emerald-500'
                        : targetUser.status === 'Suspended'
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] m-0">{targetUser.name}</h2>
                  <div className="text-xs text-[var(--muted)] font-mono mt-0.5">{targetUser.email}</div>
                  <div className="text-xs font-semibold text-[var(--blue)] mt-1">
                    {targetUser.title || 'Logistics Associate'} &middot; {targetUser.department || 'Operations'}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] grid grid-cols-2 gap-2 text-left text-xs">
                  <div className="bg-[var(--card-alt)] p-2.5 rounded-lg border border-[var(--line)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Status</div>
                    <div className="font-bold text-[var(--ink)] mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          (targetUser.status || 'Active') === 'Active'
                            ? 'bg-emerald-500'
                            : targetUser.status === 'Suspended'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span>{targetUser.status || 'Active'}</span>
                    </div>
                  </div>

                  <div className="bg-[var(--card-alt)] p-2.5 rounded-lg border border-[var(--line)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">2FA / MFA</div>
                    <div className="font-bold text-[var(--ink)] mt-0.5">
                      {targetUser.mfaEnabled ? '🛡️ Enabled' : '⚪ Disabled'}
                    </div>
                  </div>

                  <div className="bg-[var(--card-alt)] p-2.5 rounded-lg border border-[var(--line)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Joined Date</div>
                    <div className="font-bold font-mono text-[var(--ink)] mt-0.5 text-[11px]">
                      {targetUser.joinedDate || '2026-01-01'}
                    </div>
                  </div>

                  <div className="bg-[var(--card-alt)] p-2.5 rounded-lg border border-[var(--line)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Audit Entries</div>
                    <div className="font-bold font-mono text-[var(--ink)] mt-0.5 text-[11px]">
                      {auditLogs.length} Records
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                {caller.role === 'Admin' && !isSelf && (
                  <div className="pt-3 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 font-bold text-xs rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>🗑️</span>
                      <span>Permanently Delete Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Tabbed Edit Form & Comprehensive Audit Trail */}
            <div className="lg:col-span-8 space-y-4 w-full min-w-0">
              {/* Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'edit'
                      ? 'bg-[var(--blue)] text-white shadow-sm'
                      : 'btn-paper text-[var(--ink-soft)]'
                  }`}
                >
                  <span>⚙️</span>
                  <span>Edit Account Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'audit'
                      ? 'bg-[var(--blue)] text-white shadow-sm'
                      : 'btn-paper text-[var(--ink-soft)]'
                  }`}
                >
                  <span>📜</span>
                  <span>Audit Trail &amp; Edit History</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-[var(--chip-bg)] text-[var(--chip-text)]'
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                </button>
              </div>

              {/* Tab 1: Edit Account Form */}
              {activeTab === 'edit' && (
                <div className="paper-card p-5 sm:p-6 space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] m-0">
                        Account Configuration &amp; Role Permissions
                      </h2>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        Changes will be cryptographically logged with your editor credentials.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          System Access Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs font-semibold"
                        >
                          <option value="User">Standard User (Portal &amp; Orders)</option>
                          <option value="Manager">Manager (Operations &amp; Dispatch)</option>
                          {caller.role === 'Admin' && <option value="Admin">SuperAdmin (Full Console Access)</option>}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Account Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs font-semibold"
                        >
                          <option value="Active">Active (Unrestricted)</option>
                          <option value="Pending">Pending (Awaiting Verification)</option>
                          <option value="Suspended">Suspended (Access Blocked)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Department
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Linehaul Ops, Dispatch"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Job Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Senior Dispatcher"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+1 (555) 019-2834"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs"
                      />
                    </div>

                    <div className="pt-3 border-t border-[var(--line)] space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wide">
                            Direct Password Reset (Optional)
                          </label>
                          <span className="text-[10px] text-[var(--muted)]">Leave blank to keep current password</span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter new password (min 6 characters)..."
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            className="w-full py-2.5 px-3 pr-20 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 text-[11px] font-bold text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                          Administrative Audit Remark
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Promoted to Manager by SuperAdmin after onboarding"
                          value={formData.auditRemark}
                          onChange={(e) => setFormData({ ...formData, auditRemark: e.target.value })}
                          className="w-full py-2.5 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)] text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
                      <Link href="/users" className="btn-paper text-xs py-2 px-4">
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary text-xs py-2.5 px-6 font-bold shadow-sm"
                      >
                        {saving ? 'Saving Updates...' : '💾 Save Changes & Update Audit Trail'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Audit Trail & Edit Activity History Logs */}
              {activeTab === 'audit' && (
                <div className="paper-card p-5 sm:p-6 space-y-5 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] m-0 flex items-center gap-2">
                        <span>📜</span>
                        <span>Complete Account Lifecycle &amp; Edit Audit Logs</span>
                      </h2>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">
                        Immutable historical logs recording all configuration updates, role elevations, and password resets.
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search audit trail..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="text-xs py-1.5 px-3 pl-7 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none w-full sm:w-56"
                      />
                      <span className="absolute left-2 top-2 text-[10px] opacity-50">🔍</span>
                    </div>
                  </div>

                  {filteredLogs.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <div className="text-3xl">📋</div>
                      <div className="text-sm font-bold text-[var(--ink)]">No Audit Entries Found</div>
                      <p className="text-xs text-[var(--muted)]">
                        {auditSearch
                          ? 'No audit log entries match your search query.'
                          : 'No modifications have been recorded on this user account yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-[var(--line)] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-5">
                      {filteredLogs.map((log, idx) => {
                        const logDate = new Date(log.timestamp || Date.now());
                        const formattedDate = logDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });

                        const isRole = log.action === 'ROLE_CHANGED';
                        const isStatus = log.action === 'STATUS_CHANGED';
                        const isPass = log.action === 'PASSWORD_RESET';

                        return (
                          <div key={idx} className="relative group">
                            {/* Dot */}
                            <span
                              className={`absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--card)] ${
                                isRole
                                  ? 'bg-amber-500'
                                  : isStatus
                                  ? 'bg-purple-500'
                                  : isPass
                                  ? 'bg-red-500'
                                  : 'bg-[var(--blue)]'
                              }`}
                            />

                            <div className="bg-[var(--card-alt)] p-3.5 sm:p-4 rounded-xl border border-[var(--line)] space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider ${
                                      isRole
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                        : isStatus
                                        ? 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                        : isPass
                                        ? 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                                        : 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                    }`}
                                  >
                                    {log.action || 'PROFILE_UPDATED'}
                                  </span>

                                  <span className="text-xs font-bold text-[var(--ink)]">
                                    {log.description}
                                  </span>
                                </div>

                                <div className="text-[11px] font-mono text-[var(--muted)] whitespace-nowrap">
                                  🕒 {formattedDate}
                                </div>
                              </div>

                              {/* Changes Diff Tags */}
                              {log.changes && Object.keys(log.changes).length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {Object.entries(log.changes).map(([field, val], cIdx) => {
                                    if (typeof val === 'object' && val?.from !== undefined && val?.to !== undefined) {
                                      return (
                                        <div
                                          key={cIdx}
                                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--paper)] border border-[var(--line)] text-[10.5px]"
                                        >
                                          <strong className="uppercase text-[var(--muted)]">{field}:</strong>
                                          <span className="line-through text-red-500 opacity-80">{String(val.from)}</span>
                                          <span>&rarr;</span>
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {String(val.to)}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              )}

                              {/* Performed by Editor Stamp */}
                              <div className="pt-2 border-t border-[var(--line)]/60 flex items-center justify-between text-[10.5px] text-[var(--muted)]">
                                <div className="flex items-center gap-1.5">
                                  <span>✍️ Edited By:</span>
                                  <strong className="text-[var(--ink)]">{log.performedBy?.name || 'Staff Editor'}</strong>
                                  <span>({log.performedBy?.role || 'Staff'})</span>
                                  {log.performedBy?.email && (
                                    <span className="font-mono opacity-80">· {log.performedBy.email}</span>
                                  )}
                                </div>

                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  ✓ Cryptographically Logged
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && targetUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-xl flex-shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)] m-0">Confirm Permanent Account Deletion</h3>
                  <div className="text-xs text-[var(--muted)]">Destructive action</div>
                </div>
              </div>

              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Are you sure you want to permanently delete the user account for{' '}
                <strong className="text-[var(--ink)]">{targetUser.name}</strong> ({targetUser.email})? All session tokens
                and audit trail history will be removed.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn-paper text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
