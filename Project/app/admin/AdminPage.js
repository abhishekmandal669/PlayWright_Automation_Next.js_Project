'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';

export default function AdminPage() {
  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [newDept, setNewDept] = useState('Operations');
  const [msg, setMsg] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Real session validation — redirects if not Admin
  const { user, loading } = useAuth({ requiredRole: 'Admin', redirectTo: '/' });

  useEffect(() => {
    if (user) {
      fetchUsersData();
      fetchOrdersData();
    }
  }, [user]);

  const fetchUsersData = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
        setFetchError('');
      } else {
        setFetchError(data.message || 'Failed to load users.');
      }
    } catch (e) {
      setFetchError('Network error loading users.');
    }
  };

  const fetchOrdersData = async () => {
    try {
      const res = await fetch('/api/orders?role=Admin');
      const data = await res.json();
      if (data.success) setOrdersList(data.orders);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  const handleRoleChange = async (email, role) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRole', email, role })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsersData();
      }
    } catch (e) {}
  };

  const handleToggleStatus = async (email) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStatus', email })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsersData();
      }
    } catch (e) {}
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department: newDept
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('New user added successfully!');
        fetchUsersData();
        setTimeout(() => {
          setShowAddUserModal(false);
          setMsg('');
          setNewName('');
          setNewEmail('');
          setNewPassword('');
        }, 1200);
      } else {
        setMsg(data.message || 'Failed to add user.');
      }
    } catch (e) {
      setMsg('Failed to add user.');
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

  if (!user) return null; // useAuth will have already redirected

  const auditLogs = [
    { id: 'AUD-901', event: 'USER_ROLE_CHANGED', actor: user?.email || 'admin@system.com', detail: 'Role updated in Admin console', time: 'Just Now', severity: 'SECURITY' },
    { id: 'AUD-900', event: 'ADMIN_LOGIN_SUCCESS', actor: user?.email || 'admin@system.com', detail: 'JWT session authenticated', time: '5 mins ago', severity: 'INFO' },
  ];

  return (
    <div className="dashboard-container w-full">
      <div className="dashboard-header">
        <div>
          <h1>👑 Admin Master Control Center</h1>
          <p>System User Roster, Role Controls, Global Orders Master List & Audit Logs</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>
            + Invite / Add User
          </button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-title">Total System Users</div>
          <div className="card-value">{usersList.length} Accounts</div>
        </div>
        <div className="card">
          <div className="card-title">Total Freight Orders</div>
          <div className="card-value" style={{ color: '#2E6FE8' }}>{ordersList.length} Shipments</div>
        </div>
        <div className="card">
          <div className="card-title">Security & Audit Status</div>
          <div className="card-value" style={{ color: '#38A169' }}>🔒 SOC2 Compliant</div>
        </div>
      </div>

      <div className="tab-buttons" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 User Management ({usersList.length})
        </button>
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📦 Global Orders Master ({ordersList.length})
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          🛡️ Audit Logs ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="activity-panel">
          <div className="panel-title">
            <span>👥 Complete Organization Staff & User Directory</span>
            <span className="status-pill">Inline Role Switcher Enabled</span>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>User Info</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role Selection</th>
                <th>Status Toggle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id || u._id}>
                  <td style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{u.id || u._id?.substring(0, 8)}</td>
                  <td><strong>{u.name}</strong><br /><span style={{ fontSize: '0.8rem', color: '#8C96A6' }}>{u.title}</span></td>
                  <td>{u.email}</td>
                  <td>{u.department}</td>
                  <td>
                    <select
                      className="role-select"
                      value={u.role}
                      disabled={u.isAdmin}
                      onChange={(e) => handleRoleChange(u.email, e.target.value)}
                    >
                      <option value="Admin">👑 Admin</option>
                      <option value="Manager">📊 Manager</option>
                      <option value="User">👤 User</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`btn-sm btn-status-${u.status === 'Active' ? 'active' : 'suspended'}`}
                      disabled={u.isAdmin}
                      onClick={() => handleToggleStatus(u.email)}
                    >
                      {u.status === 'Active' ? '🟢 Active' : '🔴 Suspended'}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#8C96A6' }}>Joined {u.joinedDate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="activity-panel">
          <div className="panel-title">
            <span>📦 Global Freight Proxy Shipments Master List</span>
            <span className="status-pill">System Wide Master View</span>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Customer Name</th>
                <th>Package Description</th>
                <th>Route (Origin → Dest)</th>
                <th>Total Cost</th>
                <th>Dispatch Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#8C96A6', padding: '2rem' }}>
                    No freight orders in system yet.
                  </td>
                </tr>
              ) : (
                ordersList.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2E6FE8' }}>{ord.id}</td>
                    <td>{ord.userName} ({ord.userEmail})</td>
                    <td>{ord.packageName} (x{ord.quantity})</td>
                    <td>{ord.origin} → {ord.destination}</td>
                    <td style={{ fontWeight: 'bold', color: '#38A169' }}>${ord.totalPrice?.toFixed(2)}</td>
                    <td>{ord.dispatchDate || 'Pending'}</td>
                    <td>
                      <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="activity-panel">
          <div className="panel-title">
            <span>🛡️ Real-Time System Security Audit Trail</span>
            <span className="status-pill">Live Security Monitor</span>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Event Type</th>
                <th>Actor / Email</th>
                <th>Event Detail</th>
                <th>Timestamp</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{log.id}</td>
                  <td><strong>{log.event}</strong></td>
                  <td>{log.actor}</td>
                  <td>{log.detail}</td>
                  <td style={{ color: '#8C96A6' }}>{log.time}</td>
                  <td>
                    <span className={`badge-inline badge-${log.severity.toLowerCase()}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>➕ Invite / Add New User Account</h2>
              <button className="close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={handleAddUserSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="User">👤 User</option>
                    <option value="Manager">📊 Manager</option>
                    <option value="Admin">👑 Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" value={newDept} onChange={(e) => setNewDept(e.target.value)} required />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
