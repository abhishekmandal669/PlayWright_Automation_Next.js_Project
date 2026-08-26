'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';

export default function UsersDirectoryPage() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/' });
  const router = useRouter();

  const [usersList, setUsersList]             = useState([]);
  const [fetching, setFetching]               = useState(true);
  const [searchQuery, setSearchQuery]         = useState('');
  const [roleFilter, setRoleFilter]           = useState('All');
  const [statusFilter, setStatusFilter]       = useState('All');
  const [notification, setNotification]       = useState({ type: '', text: '' });

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen]     = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser]       = useState(null);
  const [actionLoading, setActionLoading]     = useState(false);

  // Form States for Create
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
    department: 'Operations',
    title: 'Shipping Associate',
    phone: '',
    status: 'Active',
  });

  // Form States for Edit
  const [editForm, setEditForm] = useState({
    userId: '',
    name: '',
    email: '',
    role: 'User',
    department: '',
    title: '',
    phone: '',
    status: 'Active',
    newPassword: '',
  });

  // Fetch Users
  const loadUsers = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.users || []);
      } else {
        showNotice('error', data.message || 'Failed to fetch users directory.');
      }
    } catch {
      showNotice('error', 'Network error loading users.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Manager')) {
      loadUsers();
    }
  }, [user]);

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification({ type: '', text: '' }), 4500);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || (u.status || 'Active') === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => (u.status || 'Active') === 'Active').length;
    const admins = usersList.filter((u) => u.role === 'Admin').length;
    const managers = usersList.filter((u) => u.role === 'Manager').length;
    const standard = usersList.filter((u) => u.role === 'User').length;
    return { total, active, admins, managers, standard };
  }, [usersList]);

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      showNotice('error', 'Please fill in full name, email and password.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', data.message || 'User created successfully!');
        setCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'User',
          department: 'Operations',
          title: 'Shipping Associate',
          phone: '',
          status: 'Active',
        });
        loadUsers();
      } else {
        showNotice('error', data.message || 'Failed to create user.');
      }
    } catch {
      showNotice('error', 'Network error creating user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEdit = (u) => {
    setSelectedUser(u);
    setEditForm({
      userId: u._id,
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'User',
      department: u.department || '',
      title: u.title || '',
      phone: u.phone || '',
      status: u.status || 'Active',
      newPassword: '',
    });
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', data.message || 'User updated successfully!');
        setEditModalOpen(false);
        loadUsers();
      } else {
        showNotice('error', data.message || 'Failed to update user.');
      }
    } catch {
      showNotice('error', 'Network error updating user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const openDelete = (u) => {
    setSelectedUser(u);
    setDeleteModalOpen(true);
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users?id=${selectedUser._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotice('success', data.message || 'User deleted successfully.');
        setDeleteModalOpen(false);
        loadUsers();
      } else {
        showNotice('error', data.message || 'Failed to delete user.');
      }
    } catch {
      showNotice('error', 'Network error deleting user.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;

  // Non-Staff Access Guard
  if (user.role !== 'Admin' && user.role !== 'Manager') {
    return (
      <SidebarLayout user={user}>
        <div className="p-8 text-center max-w-md mx-auto space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-bold text-[var(--ink)]">Staff Access Required</h2>
          <p className="text-xs text-[var(--muted)]">
            You need Manager or Admin privileges to access the enterprise user directory.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary text-xs py-2 px-4">
            ← Return to Dashboard
          </button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout user={user}>
      <div className="w-full max-w-[1360px] mx-auto px-3 py-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 font-['IBM_Plex_Sans'] text-[var(--ink)] box-border">
        {/* Notification Toast */}
        {notification.text && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ type: '', text: '' })}
              className="text-xs opacity-70 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
              <span>Console</span> &rarr; <span>Directory</span> &rarr; <strong style={{ color: 'var(--blue)' }}>User Management</strong>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-[var(--ink)] m-0 flex items-center gap-2">
              <span>👥</span>
              <span>Users &amp; Staff Directory</span>
            </h1>
            <p className="text-[11px] font-medium text-[var(--muted)] mt-0.5">
              Provision user accounts &middot; Manage system roles &middot; Update departmental metadata &middot; Reset credentials
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadUsers}
              className="btn-paper text-xs py-2 px-3 flex items-center gap-1.5"
              title="Refresh users list"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-sm"
              id="btn-create-new-user"
            >
              <span>➕</span>
              <span>Provision New User</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
          <div className="paper-card p-3 sm:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Total Accounts</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-[var(--ink)] mt-0.5">{metrics.total}</div>
          </div>
          <div className="paper-card p-3 sm:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Status</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-600 mt-0.5">{metrics.active}</div>
          </div>
          <div className="paper-card p-3 sm:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">SuperAdmins</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-amber-600 mt-0.5">{metrics.admins}</div>
          </div>
          <div className="paper-card p-3 sm:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--blue)]">Managers</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-[var(--blue)] mt-0.5">{metrics.managers}</div>
          </div>
          <div className="paper-card p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Standard Users</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-[var(--ink-soft)] mt-0.5">{metrics.standard}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="paper-card p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, email, department, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs py-2 px-3 pl-8 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20"
            />
            <span className="absolute left-2.5 top-2.5 text-xs opacity-50">🔍</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[var(--muted)] font-semibold text-[11px]">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[var(--muted)] font-semibold text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table / Cards Container */}
        <div className="paper-card overflow-hidden p-0">
          {fetching ? (
            <div className="p-12 text-center text-xs font-semibold text-[var(--muted)] flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
              <span>Loading registered users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-2xl">👥</div>
              <div className="text-sm font-bold text-[var(--ink)]">No Users Found</div>
              <div className="text-xs text-[var(--muted)]">
                No accounts match your current filter query.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--card-alt)] text-[10.5px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-3 px-4">User Identity</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 hidden md:table-cell">Department &amp; Title</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredUsers.map((u) => {
                    const isSelf = user.email === u.email;
                    const initial = (u.name || 'U').charAt(0).toUpperCase();

                    return (
                      <tr key={u._id} className="hover:bg-[var(--card-alt)]/50 transition-colors">
                        {/* User Identity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-[var(--line)] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {initial}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--ink)] truncate flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--blue)]/10 text-[var(--blue)] font-bold uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--muted)] truncate font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {u.role === 'Admin' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                              👑 SuperAdmin
                            </span>
                          ) : u.role === 'Manager' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                              📋 Manager
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                              👤 Standard User
                            </span>
                          )}
                        </td>

                        {/* Department & Title */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="font-medium text-[var(--ink)]">{u.department || 'Operations'}</div>
                          <div className="text-[11px] text-[var(--muted)]">{u.title || 'Logistics Associate'}</div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4 hidden lg:table-cell font-mono text-[11px] text-[var(--ink-soft)]">
                          {u.phone || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {(u.status || 'Active') === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </span>
                          ) : u.status === 'Suspended' ? (
                            <span className="inline-flex items-center gap-1.5 text-red-600 font-bold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span>Suspended</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-4 hidden sm:table-cell font-mono text-[11px] text-[var(--muted)]">
                          {u.joinedDate || (u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2026-01-01')}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/users/${u._id}`}
                              className="btn-paper text-[11px] py-1 px-2.5 font-semibold text-[var(--blue)] hover:bg-[var(--blue)]/10"
                              title="Edit user details & view audit logs"
                            >
                              ✏️ Edit &amp; Logs
                            </Link>

                            {user.role === 'Admin' && !isSelf && (
                              <button
                                type="button"
                                onClick={() => openDelete(u)}
                                className="btn-paper text-[11px] py-1 px-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                title="Delete user"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Provision New User Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">➕</span>
                  <h3 className="text-base font-bold text-[var(--ink)] m-0">Provision New User Account</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="w-7 h-7 rounded-lg border border-[var(--line)] flex items-center justify-center text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex.morgan@freightproxy.io"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Role
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    >
                      <option value="User">Standard User</option>
                      <option value="Manager">Manager</option>
                      {user.role === 'Admin' && <option value="Admin">SuperAdmin</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Account Status
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Linehaul Ops, Dispatch"
                      value={createForm.department}
                      onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink)] mb-1 uppercase tracking-wide">
                      Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Dispatcher"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
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
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="btn-paper text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary text-xs py-2 px-5 font-bold"
                  >
                    {actionLoading ? 'Creating User...' : 'Provision Account ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Provision New User Modal */}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-xl flex-shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink)] m-0">Confirm User Account Deletion</h3>
                  <div className="text-xs text-[var(--muted)]">Permanent destructive action</div>
                </div>
              </div>

              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Are you sure you want to permanently delete the user account for{' '}
                <strong className="text-[var(--ink)]">{selectedUser.name}</strong> ({selectedUser.email})? All associated
                session tokens will be invalidated immediately.
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
                  disabled={actionLoading}
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  {actionLoading ? 'Deleting...' : 'Permanently Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
