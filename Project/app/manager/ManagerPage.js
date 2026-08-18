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

  // Pipeline Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pipeline Form States
  const [statusVal, setStatusVal] = useState('PICKUP_SCHEDULED');
  const [pickupSchedVal, setPickupSchedVal] = useState('2026-08-19 10:00');
  const [pickedUpVal, setPickedUpVal] = useState('2026-08-19 11:30');
  const [warehouseVal, setWarehouseVal] = useState('2026-08-19 15:45');
  const [dispatchSchedVal, setDispatchSchedVal] = useState('2026-08-20 09:00');

  // Edit Order Form States
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

  const handleOpenPipelineModal = (order) => {
    setSelectedOrder(order);
    setStatusVal(order.status || 'PICKUP_SCHEDULED');
    setPickupSchedVal(order.pickupScheduledDate !== 'Pending' ? order.pickupScheduledDate : '2026-08-19 10:00');
    setPickedUpVal(order.pickedUpDate !== 'Pending' ? order.pickedUpDate : '2026-08-19 11:30');
    setWarehouseVal(order.warehouseArrivalDate !== 'Pending' ? order.warehouseArrivalDate : '2026-08-19 15:45');
    setDispatchSchedVal(order.dispatchScheduledDate !== 'Pending' ? order.dispatchScheduledDate : '2026-08-20 09:00');
    setShowPipelineModal(true);
  };

  const handleSavePipeline = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePipeline',
          orderId: selectedOrder.id,
          updatePayload: {
            status: statusVal,
            pickupScheduledDate: pickupSchedVal,
            pickedUpDate: pickedUpVal,
            warehouseArrivalDate: warehouseVal,
            dispatchScheduledDate: dispatchSchedVal
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Pipeline stage & schedules updated!');
        fetchOrdersData();
        setTimeout(() => {
          setShowPipelineModal(false);
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
              <h1>📊 Manager Freight & Dispatch Operations Hub</h1>
              <p>Control 7-stage shipment pipeline, schedule pickups & warehouse dispatches</p>
            </div>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                📦 Orders Pipeline ({orders.length})
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
                <span>📦 Customer Orders & Pipeline Management</span>
                <span className="status-pill">7-Stage Logistics Active</span>
              </div>

              <table className="log-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Customer Name</th>
                    <th>Package Description</th>
                    <th>Route (Origin $\rightarrow$ Dest)</th>
                    <th>Price ($)</th>
                    <th>Pipeline Stage</th>
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
                      <td>
                        <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-sm btn-schedule" onClick={() => handleOpenPipelineModal(ord)}>
                            🔄 Pipeline / Schedule
                          </button>
                          <button className="btn-sm btn-edit" onClick={() => handleOpenEditModal(ord)}>
                            ✏️ Edit Specs
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

      {/* Pipeline & Scheduler Modal */}
      {showPipelineModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔄 Update Pipeline Stage: {selectedOrder?.id}</h2>
              <button className="close-btn" onClick={() => setShowPipelineModal(false)}>✕</button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={handleSavePipeline} className="modal-form">
              <div className="form-group">
                <label className="form-label">Set Pipeline Stage</label>
                <select className="form-input" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
                  <option value="PICKUP_PENDING">1. PICKUP_PENDING (Order Placed)</option>
                  <option value="PICKUP_SCHEDULED">2. PICKUP_SCHEDULED (Pickup Date Set)</option>
                  <option value="PICKED_UP">3. PICKED_UP (Driver Collected Package)</option>
                  <option value="RECEIVED_AT_WAREHOUSE">4. RECEIVED_AT_WAREHOUSE (In Warehouse Hub)</option>
                  <option value="DISPATCH_SCHEDULED">5. DISPATCH_SCHEDULED (Delivery Date Set)</option>
                  <option value="OUT_FOR_DELIVERY">6. OUT_FOR_DELIVERY (In Transit)</option>
                  <option value="DELIVERED">7. DELIVERED (Delivered 🟢)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pickup Scheduled Date</label>
                  <input type="text" className="form-input" value={pickupSchedVal} onChange={(e) => setPickupSchedVal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Picked Up Date</label>
                  <input type="text" className="form-input" value={pickedUpVal} onChange={(e) => setPickedUpVal(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Warehouse Arrival Date</label>
                  <input type="text" className="form-input" value={warehouseVal} onChange={(e) => setWarehouseVal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dispatch / Delivery Date</label>
                  <input type="text" className="form-input" value={dispatchSchedVal} onChange={(e) => setDispatchSchedVal(e.target.value)} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowPipelineModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Pipeline</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Specs Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Order Specs: {selectedOrder?.id}</h2>
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
                <button type="submit" className="btn-primary">Update Specs</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
