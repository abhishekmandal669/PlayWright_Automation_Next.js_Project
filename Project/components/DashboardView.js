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

  const getStepIndex = (status) => {
    switch (status) {
      case 'PICKUP_PENDING': return 1;
      case 'PICKUP_SCHEDULED': return 2;
      case 'PICKED_UP': return 3;
      case 'RECEIVED_AT_WAREHOUSE': return 4;
      case 'DISPATCH_SCHEDULED': return 5;
      case 'OUT_FOR_DELIVERY': return 6;
      case 'DELIVERED': return 7;
      default: return 1;
    }
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
          <div className="card-title">My Proxy Orders</div>
          <div className="card-value">{orders.length} Shipments</div>
        </div>

        <div className="card">
          <div className="card-title">En-Route / In Transit</div>
          <div className="card-value" style={{ color: '#2E6FE8' }}>
            {orders.filter(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'RECEIVED_AT_WAREHOUSE').length} Active
          </div>
        </div>

        <div className="card">
          <div className="card-title">Live Dispatch Status</div>
          <div className="card-value" style={{ color: '#38A169' }}>
            🟢 Network Operational
          </div>
        </div>
      </div>

      {/* Orders Tracking Cards with 7-Step Pipeline */}
      <div className="activity-panel">
        <div className="panel-title">
          <span>📦 My Proxy Shipment Orders & Live Tracker</span>
          <span className="status-pill">{orders.length} Active Shipments</span>
        </div>

        {orders.map((ord) => {
          const currentStep = getStepIndex(ord.status);
          return (
            <div key={ord.id} className="order-tracker-card">
              <div className="tracker-card-header">
                <div>
                  <span className="trk-id">{ord.id}</span>
                  <strong className="trk-name">{ord.packageName}</strong> (x{ord.quantity})
                </div>
                <div className="trk-price">${ord.totalPrice?.toFixed(2)}</div>
              </div>

              <div className="tracker-route">
                <span>📍 Origin: {ord.origin}</span>
                <span>➔</span>
                <span>🏁 Dest: {ord.destination}</span>
              </div>

              {/* 7-Step Visual Pipeline */}
              <div className="pipeline-container">
                <div className={`pipe-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                  <div className="pipe-dot">1</div>
                  <span>Order Placed</span>
                </div>
                <div className={`pipe-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                  <div className="pipe-dot">2</div>
                  <span>Pickup Sched.</span>
                </div>
                <div className={`pipe-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                  <div className="pipe-dot">3</div>
                  <span>Picked Up</span>
                </div>
                <div className={`pipe-step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
                  <div className="pipe-dot">4</div>
                  <span>Warehouse Hub</span>
                </div>
                <div className={`pipe-step ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'active' : ''}`}>
                  <div className="pipe-dot">5</div>
                  <span>Dispatch Sched.</span>
                </div>
                <div className={`pipe-step ${currentStep >= 6 ? 'completed' : ''} ${currentStep === 6 ? 'active' : ''}`}>
                  <div className="pipe-dot">6</div>
                  <span>Out For Delivery</span>
                </div>
                <div className={`pipe-step ${currentStep >= 7 ? 'completed' : ''} ${currentStep === 7 ? 'active' : ''}`}>
                  <div className="pipe-dot">7</div>
                  <span>Delivered 🟢</span>
                </div>
              </div>

              <div className="tracker-dates">
                <span>📅 Pickup Sched: <strong>{ord.pickupScheduledDate}</strong></span>
                <span>🏬 Warehouse Arrival: <strong>{ord.warehouseArrivalDate}</strong></span>
                <span>🚚 Delivery Sched: <strong>{ord.dispatchScheduledDate}</strong></span>
              </div>
            </div>
          );
        })}
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
