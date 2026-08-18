'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardView() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const router = useRouter();

  // Order Creator State
  const [origin, setOrigin] = useState('New Delhi, India');
  const [destination, setDestination] = useState('London, UK');
  const [packageName, setPackageName] = useState('Precision Machinery Samples');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(3.5);
  const [length, setLength] = useState(25);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [fragile, setFragile] = useState(true);
  const [express, setExpress] = useState(true);
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('demoUser');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setUser(u);
          fetchUserOrders(u.email);
        } catch (e) {
          fetchUserOrders('user@example.com');
        }
      } else {
        const fallback = { name: 'Demo User', email: 'user@example.com', role: 'User' };
        setUser(fallback);
        fetchUserOrders(fallback.email);
      }
    }
  }, []);

  const fetchUserOrders = async (email) => {
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Live Pricing Calculation
  const actualW = parseFloat(weight) || 0;
  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const volumetricW = ((l * w * h) / 5000).toFixed(2);
  const chargeableW = Math.max(actualW, parseFloat(volumetricW)).toFixed(2);
  const calculatedPrice = (25.00 + (chargeableW * 12.50) + (fragile ? 15.00 : 0) + (express ? 35.00 : 0)).toFixed(2);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCreateMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || 'user@example.com',
          userName: user?.name || 'Customer',
          origin,
          destination,
          packageName,
          quantity,
          weight,
          dimensions: { length, width, height },
          fragile,
          express
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreateMsg('Shipment Proxy Order created successfully!');
        fetchUserOrders(user?.email || 'user@example.com');
        setTimeout(() => {
          setShowOrderModal(false);
          setCreateMsg('');
        }, 1200);
      }
    } catch (err) {
      setCreateMsg('Failed to create shipment order.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('demoUser');
    localStorage.removeItem('userRole');
    router.push('/');
  };

  return (
    <div className="dashboard-container" id="dashboard-root">
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1 id="welcome-heading">Welcome, {user?.name || 'User'}!</h1>
          <p id="user-role-badge">
            <span className={`role-pill role-${user?.role?.toLowerCase() || 'user'}`}>
              {user?.role || 'User'}
            </span>
            {' '} | Freight Proxy Customer Dashboard
          </p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowOrderModal(true)} className="btn-primary" id="create-order-btn">
            + Create Proxy Shipment
          </button>
          <button onClick={handleLogout} id="logout-btn" className="btn-outline">
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid-cards">
        <div className="card">
          <div className="card-title">Active Proxy Orders</div>
          <div className="card-value">{orders.length} Shipments</div>
        </div>

        <div className="card">
          <div className="card-title">In-Transit Packages</div>
          <div className="card-value" style={{ color: '#2E6FE8' }}>
            {orders.filter(o => o.status === 'IN_TRANSIT').length} En Route
          </div>
        </div>

        <div className="card">
          <div className="card-title">Live Dispatch Status</div>
          <div className="card-value" style={{ color: '#38A169' }}>
            🟢 Network Operational
          </div>
        </div>
      </div>

      {/* User Orders Table */}
      <div className="activity-panel">
        <div className="panel-title">
          <span>📦 My Proxy Shipment Orders</span>
          <span className="status-pill">Showing {orders.length} Shipments</span>
        </div>

        <table className="log-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Package Info</th>
              <th>Route (Origin $\rightarrow$ Destination)</th>
              <th>Weight & Specs</th>
              <th>Total Cost</th>
              <th>Dispatch Schedule</th>
              <th>Shipment Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((ord) => (
              <tr key={ord.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2E6FE8' }}>{ord.id}</td>
                <td>
                  <strong>{ord.packageName}</strong> (x{ord.quantity})
                </td>
                <td style={{ fontSize: '0.9rem' }}>
                  {ord.origin} $\rightarrow$ {ord.destination}
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {ord.weight}kg | {ord.dimensions?.length}x{ord.dimensions?.width}x{ord.dimensions?.height}cm
                  {ord.fragile && <span className="badge-inline">Fragile</span>}
                  {ord.express && <span className="badge-inline badge-express">Express</span>}
                </td>
                <td style={{ fontWeight: 'bold', color: '#38A169' }}>${ord.totalPrice?.toFixed(2)}</td>
                <td style={{ color: '#8C96A6', fontSize: '0.85rem' }}>{ord.dispatchDate || 'Pending'}</td>
                <td>
                  <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                    {ord.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📦 Create Proxy Shipping Order</h2>
              <button className="close-btn" onClick={() => setShowOrderModal(false)}>✕</button>
            </div>

            {createMsg && <div className="alert alert-success">{createMsg}</div>}

            <form onSubmit={handleCreateOrder} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Package Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dimensions (L x W x H cm)</label>
                  <div className="dim-inputs">
                    <input type="number" placeholder="L" className="form-input" value={length} onChange={(e) => setLength(e.target.value)} required />
                    <input type="number" placeholder="W" className="form-input" value={width} onChange={(e) => setWidth(e.target.value)} required />
                    <input type="number" placeholder="H" className="form-input" value={height} onChange={(e) => setHeight(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                  Fragile Handling (+ $15.00)
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
                  Express Priority (+ $35.00)
                </label>
              </div>

              {/* Live Calculator Box */}
              <div className="price-calc-box">
                <div className="calc-item">Volumetric Weight: <strong>{volumetricW} kg</strong></div>
                <div className="calc-item">Chargeable Weight: <strong>{chargeableW} kg</strong></div>
                <div className="calc-total">Estimated Total: <strong>${calculatedPrice}</strong></div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Confirm & Place Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
