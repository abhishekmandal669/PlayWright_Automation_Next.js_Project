'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';

export default function ManagerPage() {
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
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
  const [msg, setMsg]               = useState('');

  // Real session guard — Admin or Manager only
  const { user, loading } = useAuth({ requiredRole: ['Admin', 'Manager'], redirectTo: '/' });

  useEffect(() => {
    if (user) {
      fetchOrdersData();
      fetchUsersData();
    }
  }, [user]);

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
    setPickupSchedVal(order.pipeline?.pickupScheduledDate || order.pickupScheduledDate || 'Pending');
    setPickedUpVal(order.pipeline?.pickedUpDate || order.pickedUpDate || 'Pending');
    setWarehouseVal(order.pipeline?.warehouseArrivalDate || order.warehouseArrivalDate || 'Pending');
    setDispatchSchedVal(order.pipeline?.dispatchScheduledDate || order.dispatchScheduledDate || 'Pending');
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
        setMsg('Pipeline status updated!');
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
            totalPrice: editPrice
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

  if (!user) return null; // useAuth already redirected

  return (
    <div className="dashboard-container w-full">
      <div className="dashboard-header">
        <div>
          <h1>📊 Manager Freight & Dispatch Operations Hub</h1>
          <p>Control 7-stage shipment pipeline, schedule pickups & warehouse dispatches</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-title">Total Active Orders</div>
          <div className="card-value">{orders.length} Shipments</div>
        </div>
        <div className="card">
          <div className="card-title">Pending Pickups</div>
          <div className="card-value" style={{ color: '#D69E2E' }}>
            {orders.filter(o => o.status === 'PICKUP_PENDING' || o.status === 'PICKUP_SCHEDULED').length} Orders
          </div>
        </div>
        <div className="card">
          <div className="card-title">Warehouse Sorting</div>
          <div className="card-value" style={{ color: '#2E6FE8' }}>
            {orders.filter(o => o.status === 'RECEIVED_AT_WAREHOUSE' || o.status === 'DISPATCH_SCHEDULED').length} In-House
          </div>
        </div>
      </div>

      <div className="tab-buttons" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          📦 Freight Operations Pipeline ({orders.length})
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Customer & Staff Roster ({usersList.length})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="activity-panel">
          <div className="panel-title">
            <span>🚚 Live Freight Shipments — 7-Stage Operations Control</span>
            <span className="status-pill">Interactive Pipeline Editor Enabled</span>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Customer</th>
                <th>Package Details</th>
                <th>Route (Origin → Dest)</th>
                <th>Total Price</th>
                <th>Current Pipeline Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#8C96A6', padding: '2rem' }}>
                    No orders created yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2E6FE8' }}>{ord.id}</td>
                    <td>{ord.userName}<br /><span style={{ fontSize: '0.8rem', color: '#8C96A6' }}>{ord.userEmail}</span></td>
                    <td><strong>{ord.packageName}</strong> (x{ord.quantity})<br /><span style={{ fontSize: '0.8rem', color: '#8C96A6' }}>{ord.weight}kg • Vol: {ord.volumetricWeight}kg</span></td>
                    <td>{ord.origin} → {ord.destination}</td>
                    <td style={{ fontWeight: 'bold', color: '#38A169' }}>${ord.totalPrice?.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-sm btn-outline" onClick={() => handleOpenPipelineModal(ord)}>
                          ⚡ Advance Stage
                        </button>
                        <button className="btn-sm btn-outline" onClick={() => handleOpenEditModal(ord)}>
                          ✏️ Edit Specs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="activity-panel">
          <div className="panel-title">
            <span>👥 Customer & Staff Registry</span>
            <span className="status-pill">Read Only Operational Roster</span>
          </div>

          <table className="log-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name / Title</th>
                <th>Email</th>
                <th>Department</th>
                <th>System Role</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', color: '#2E6FE8' }}>{u.id}</td>
                  <td><strong>{u.name}</strong><br /><span style={{ fontSize: '0.8rem', color: '#8C96A6' }}>{u.title}</span></td>
                  <td>{u.email}</td>
                  <td>{u.department}</td>
                  <td><span className={`role-pill role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                  <td>
                    <span className={`status-pill status-${u.status === 'Active' ? 'active' : 'suspended'}`}>
                      {u.status === 'Active' ? '🟢 Active' : '🔴 Suspended'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Advance 7-Stage Pipeline Status Modal */}
      {showPipelineModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🚚 Update 7-Stage Pipeline: {selectedOrder?.id}</h2>
              <button className="close-btn" onClick={() => setShowPipelineModal(false)}>✕</button>
            </div>
            {msg && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={handleSavePipeline} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Pipeline Stage</label>
                <select className="form-input" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
                  <option value="PICKUP_PENDING">Stage 1: Pickup Pending</option>
                  <option value="PICKUP_SCHEDULED">Stage 2: Pickup Scheduled</option>
                  <option value="PICKED_UP">Stage 3: Package Picked Up</option>
                  <option value="RECEIVED_AT_WAREHOUSE">Stage 4: Received at Sorting Warehouse</option>
                  <option value="DISPATCH_SCHEDULED">Stage 5: Linehaul Dispatch Scheduled</option>
                  <option value="OUT_FOR_DELIVERY">Stage 6: Out for Final Delivery</option>
                  <option value="DELIVERED">Stage 7: Delivered to Recipient</option>
                  <option value="CANCELLED">Terminal: Cancelled</option>
                  <option value="RETURNED">Terminal: Returned to Sender</option>
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
