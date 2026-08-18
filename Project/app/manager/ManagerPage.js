'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function ManagerPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form States for Scheduler & Edit
  const [statusVal, setStatusVal] = useState('SCHEDULED');
  const [dispatchDateVal, setDispatchDateVal] = useState('2026-08-20 14:00');
  const [editOrigin, setEditOrigin] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [msg, setMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('demoUser');
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          setUser(u);
          if (u.role !== 'Admin' && u.role !== 'Manager') {
            setAccessDenied(true);
            return;
          }
        } catch (e) {
          setAccessDenied(true);
          return;
        }
      } else {
        const fallbackManager = { name: 'Sarah Jenkins', email: 'manager@system.com', role: 'Manager' };
        setUser(fallbackManager);
      }

      fetchOrdersData();
      fetchUsersData();
    }
  }, []);

  const fetchOrdersData = async () => {
    try {
      const res = await fetch('/api/orders?role=Manager');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {}
  };

  const fetchUsersData = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (e) {}
  };

  const handleOpenScheduleModal = (order) => {
    setSelectedOrder(order);
    setStatusVal(order.status || 'SCHEDULED');
    setDispatchDateVal(order.dispatchDate !== 'Not Scheduled' ? order.dispatchDate : '2026-08-20 14:00');
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          orderId: selectedOrder.id,
          status: statusVal,
          dispatchDate: dispatchDateVal
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Dispatch Schedule & Status updated!');
        fetchOrdersData();
        setTimeout(() => {
          setShowScheduleModal(false);
          setMsg('');
        }, 1000);
      }
    } catch (e) {
      setMsg('Update failed.');
    }
  };

  const handleOpenEditModal = (order) => {
    setSelectedOrder(order);
    setEditOrigin(order.origin);
    setEditDest(order.destination);
    setEditPrice(order.totalPrice);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          orderId: selectedOrder.id,
          updateData: {
            origin: editOrigin,
            destination: editDest,
            totalPrice: parseFloat(editPrice)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Order details updated!');
        fetchOrdersData();
        setTimeout(() => {
          setShowEditModal(false);
          setMsg('');
        }, 1000);
      }
    } catch (e) {
      setMsg('Edit failed.');
    }
  };

  if (accessDenied) {
    return (
      <div className="layout-wrapper">
        <Header />
        <main className="main-content">
          <div className="auth-wrapper">
            <div className="auth-card" style={{ textAlign: 'center' }}>
              <div className="alert alert-error">
                <span>⚠️ Access Denied: Manager or Admin credentials required.</span>
              </div>
              <p style={{ marginTop: '1rem' }}>You do not have permission to view the Manager Dispatch Hub.</p>
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/dashboard')}>
                Return to My Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Header />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>📊 Manager Dispatch Operations Hub</h1>
              <p>Schedule dispatches, edit orders, and supervise user shipments</p>
            </div>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                📦 Orders Dispatch ({orders.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                👥 User Directory ({usersList.length})
              </button>
            </div>
          </div>

          {activeTab === 'orders' ? (
            <div className="activity-panel">
              <div className="panel-title">
                <span>📦 Active Customer Proxy Shipments</span>
                <span className="status-pill">Manager Controls Active</span>
              </div>

              <table className="log-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Customer Name</th>
                    <th>Package Description</th>
                    <th>Route (Origin $\rightarrow$ Dest)</th>
                    <th>Price ($)</th>
                    <th>Dispatch Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2E6FE8' }}>{ord.id}</td>
                      <td>{ord.userName} ({ord.userEmail})</td>
                      <td>{ord.packageName} (x{ord.quantity})</td>
                      <td style={{ fontSize: '0.85rem' }}>{ord.origin} $\rightarrow$ {ord.destination}</td>
                      <td style={{ fontWeight: 'bold', color: '#38A169' }}>${ord.totalPrice?.toFixed(2)}</td>
                      <td>{ord.dispatchDate || 'Pending'}</td>
                      <td>
                        <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-sm btn-schedule" onClick={() => handleOpenScheduleModal(ord)}>
                            📅 Schedule / Status
                          </button>
                          <button className="btn-sm btn-edit" onClick={() => handleOpenEditModal(ord)}>
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="activity-panel">
              <div className="panel-title">
                <span>👥 User Roster & Account Directory</span>
                <span className="status-pill">{usersList.length} Team Members</span>
              </div>

              <table className="log-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace' }}>{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-pill role-${u.role?.toLowerCase()}`}>{u.role}</span>
                      </td>
                      <td>{u.department}</td>
                      <td>
                        <span className={`status-badge status-${u.status === 'Active' ? 'success' : 'suspended'}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Schedule Dispatch Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📅 Schedule Dispatch: {selectedOrder?.id}</h2>
              <button className="close-btn" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={handleSaveSchedule} className="modal-form">
              <div className="form-group">
                <label className="form-label">Shipment Status</label>
                <select className="form-input" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
                  <option value="PENDING_SCHEDULE">PENDING_SCHEDULE</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dispatch Date & Time</label>
                <input
                  type="text"
                  className="form-input"
                  value={dispatchDateVal}
                  onChange={(e) => setDispatchDateVal(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Order: {selectedOrder?.id}</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Origin Location</label>
                <input type="text" className="form-input" value={editOrigin} onChange={(e) => setEditOrigin(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Destination Address</label>
                <input type="text" className="form-input" value={editDest} onChange={(e) => setEditDest(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Shipping Price ($)</label>
                <input type="number" step="0.1" className="form-input" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
