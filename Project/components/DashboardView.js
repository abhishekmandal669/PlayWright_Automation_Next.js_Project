'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/useAuth';
import { calculatePricing } from '../lib/pricing';

export default function DashboardView() {
  const { user, loading, logout } = useAuth({ redirectTo: '/' });
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

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
    if (user) {
      fetchUserOrders(user.email);
    }
  }, [user]);

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

  // Memoized Live Pricing Calculation
  const { volumetricW, chargeableW, calculatedPrice } = useMemo(() => {
    const calc = calculatePricing({
      weight,
      length,
      width,
      height,
      fragile,
      express,
    });
    return {
      volumetricW: calc.volumetricWeight.toFixed(2),
      chargeableW: calc.chargeableWeight.toFixed(2),
      calculatedPrice: calc.pricing.totalPrice.toFixed(2),
    };
  }, [weight, length, width, height, fragile, express]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setOrderLoading(true);
    setCreateMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email,
          userName: user?.name,
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
        fetchUserOrders(user?.email);
        setTimeout(() => {
          setShowOrderModal(false);
          setCreateMsg('');
        }, 1200);
      }
    } catch (err) {
      setCreateMsg('Failed to create shipment order.');
    } finally {
      setOrderLoading(false);
    }
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

  if (!user) return null;

  return (
    <div className="dashboard-container w-full" id="dashboard-root">
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
            {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} Active
          </div>
        </div>

        <div className="card">
          <div className="card-title">Delivered Total</div>
          <div className="card-value" style={{ color: '#38A169' }}>
            {orders.filter(o => o.status === 'DELIVERED').length} Completed
          </div>
        </div>
      </div>

      {/* Main Order Pipeline Display */}
      <div className="activity-panel">
        <div className="panel-title">
          <span>📦 Active Freight Proxy Pipeline Tracker</span>
          <span className="status-pill">Live Tracking Active</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8C96A6' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#4A5568' }}>No Active Shipments Found</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>You haven't created any proxy shipment orders yet.</p>
            <button onClick={() => setShowOrderModal(true)} className="btn-primary">
              + Create Your First Proxy Shipment
            </button>
          </div>
        ) : (
          orders.map((ord) => {
            const currentStep = getStepIndex(ord.status);
            return (
              <div key={ord.id} className="order-pipeline-card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2E6FE8', fontSize: '1.1rem' }}>{ord.id}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0.2rem 0' }}>{ord.packageName} (x{ord.quantity})</h3>
                    <p style={{ fontSize: '0.85rem', color: '#718096' }}>Route: <strong>{ord.origin}</strong> → <strong>{ord.destination}</strong></p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2B6CB0' }}>${ord.totalPrice?.toFixed(2)}</div>
                    <span className={`status-badge status-${ord.status?.toLowerCase()}`}>
                      {ord.status}
                    </span>
                  </div>
                </div>

                {/* 7-Stage Stepper visual */}
                <div className="pipeline-stepper" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', position: 'relative' }}>
                  {[
                    { step: 1, label: 'Pickup Pending' },
                    { step: 2, label: 'Scheduled' },
                    { step: 3, label: 'Picked Up' },
                    { step: 4, label: 'In Warehouse' },
                    { step: 5, label: 'Dispatched' },
                    { step: 6, label: 'Out for Delivery' },
                    { step: 7, label: 'Delivered' }
                  ].map((s) => (
                    <div key={s.step} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: currentStep >= s.step ? '#2E6FE8' : '#E2E8F0',
                        color: currentStep >= s.step ? '#FFF' : '#718096',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.5rem auto',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {currentStep > s.step ? '✓' : s.step}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: currentStep === s.step ? 'bold' : 'normal', color: currentStep >= s.step ? '#2D3748' : '#A0AEC0' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Proxy Order */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>➕ Create New Proxy Freight Shipment</h2>
              <button className="close-btn" onClick={() => setShowOrderModal(false)}>✕</button>
            </div>

            {createMsg && <div className="alert alert-success">{createMsg}</div>}

            <form onSubmit={handleCreateOrder} className="modal-form">
              <div className="form-group">
                <label className="form-label">Package Description / Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. Electronic Components"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Origin Location</label>
                  <input type="text" className="form-input" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Address</label>
                  <input type="text" className="form-input" value={destination} onChange={(e) => setDestination(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" min="1" className="form-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Actual Weight (kg)</label>
                  <input type="number" step="0.1" min="0.1" className="form-input" value={weight} onChange={(e) => setWeight(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dimensions (Length x Width x Height in cm)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" min="1" placeholder="L" className="form-input" value={length} onChange={(e) => setLength(e.target.value)} required />
                  <input type="number" min="1" placeholder="W" className="form-input" value={width} onChange={(e) => setWidth(e.target.value)} required />
                  <input type="number" min="1" placeholder="H" className="form-input" value={height} onChange={(e) => setHeight(e.target.value)} required />
                </div>
              </div>

              {/* Price Calculation Engine Live Preview */}
              <div style={{ background: '#F7FAFC', border: '1px border #E2E8F0', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  ⚡ Live Volumetric Pricing Engine
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#718096' }}>
                  <span>Volumetric Weight: <strong>{volumetricW} kg</strong></span>
                  <span>Chargeable Weight: <strong>{chargeableW} kg</strong></span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#2E6FE8' }}>
                  Estimated Total: ${calculatedPrice} USD
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                  Fragile Handling (+ $15.00)
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
                  Express Air Delivery (+ $35.00)
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowOrderModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={orderLoading}>
                  {orderLoading ? 'Processing...' : 'Submit Proxy Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
