'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { calculatePricing } from '../lib/pricing';
import SidebarLayout from './SidebarLayout';
import OrderFilterToolbar from './OrderFilterToolbar';
import OrderViewDrawer from './OrderViewDrawer';
import OrderEditModal from './OrderEditModal';
import Pagination from './Pagination';

export default function DashboardView() {
  const { user, loading, logout } = useAuth({ redirectTo: '/' });
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer / Edit Modal State
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);

  // Modal Order Creator State
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
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const url =
        user.role === 'Admin' || user.role === 'Manager'
          ? '/api/orders'
          : `/api/orders?email=${encodeURIComponent(user.email)}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          (o.orderId && o.orderId.toLowerCase().includes(term)) ||
          (o.trackingId && o.trackingId.toLowerCase().includes(term)) ||
          (o.id && o.id.toLowerCase().includes(term)) ||
          (o.packageName && o.packageName.toLowerCase().includes(term)) ||
          (o.origin && o.origin.toLowerCase().includes(term)) ||
          (o.destination && o.destination.toLowerCase().includes(term)) ||
          (o.userEmail && o.userEmail.toLowerCase().includes(term))
      );
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
    } else if (sortBy === 'price_low') {
      list.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    } else if (sortBy === 'weight_high') {
      list.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    }

    return list;
  }, [orders, statusFilter, searchTerm, sortBy]);

  // Paginated Orders
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  // Memoized Live Pricing Calculation for Modal
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
          express,
        }),
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
      case 'WAREHOUSE_ARRIVED': return 4;
      case 'DISPATCHED': return 5;
      case 'OUT_FOR_DELIVERY': return 6;
      case 'DELIVERED': return 7;
      default: return 1;
    }
  };

  if (!user) return null;

  const dashboardContent = (
    <div className="w-full max-w-[1240px] mx-auto p-3.5 sm:p-7 font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4 overflow-x-hidden" id="dashboard-root">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-base sm:text-[18px] font-semibold text-[var(--ink)] m-0" id="welcome-heading">Welcome, {user?.name || 'User'}!</h1>
          <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5" id="user-role-badge">
            <span className="pill-blue">
              {user?.role || 'User'}
            </span>
            {' '}&middot; Freight Proxy Customer Dashboard
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link href="/create-order" className="btn-paper text-xs py-1.5 px-3" style={{ textDecoration: 'none' }}>
            🚀 Full Studio
          </Link>
          <button onClick={() => setShowOrderModal(true)} className="btn-paper btn-paper-primary text-xs py-1.5 px-3" id="create-order-btn">
            + Create Shipment
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="paper-card p-4 sm:p-5">
          <div className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {user.role === 'Admin' || user.role === 'Manager' ? 'Total Freight Shipments' : 'My Proxy Orders'}
          </div>
          <div className="text-[28px] font-semibold font-mono text-[var(--ink)] mt-1.5">{orders.length} <span className="text-sm font-normal text-[var(--muted)]">Shipments</span></div>
        </div>

        <div className="paper-card">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">En-Route / In Transit</div>
          <div className="text-[28px] font-semibold font-mono text-[var(--blue)] mt-1.5">
            {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} <span className="text-sm font-normal text-[var(--muted)]">Active</span>
          </div>
        </div>

        <div className="paper-card">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Delivered Total</div>
          <div className="text-[28px] font-semibold font-mono text-[var(--green)] mt-1.5">
            {orders.filter((o) => o.status === 'DELIVERED').length} <span className="text-sm font-normal text-[var(--muted)]">Completed</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <OrderFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={filteredOrders.length}
      />

      {/* Main Order Pipeline Display */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-2">
          <span className="text-[14px] font-semibold text-[var(--ink)]">📦 Active Freight Proxy Pipeline Tracker</span>
          <span className="pill-green">Live Tracking Active</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8C96A6' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#4A5568' }}>
              {orders.length === 0 ? 'No Active Shipments Found' : 'No Shipments Match Filter'}
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {orders.length === 0
                ? "You haven't created any proxy shipment orders yet."
                : 'Try adjusting your search query or status filter above.'}
            </p>
            {orders.length === 0 && (
              <button onClick={() => setShowOrderModal(true)} className="btn-primary">
                + Create Your First Proxy Shipment
              </button>
            )}
          </div>
        ) : (
          pagedOrders.map((ord) => {
            const currentStep = getStepIndex(ord.status);
            return (
              <div
                key={ord.id}
                className="order-pipeline-card"
                style={{
                  marginBottom: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--card)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span className="order-pill-tag">
                        ORD-#{ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || (1000 + (orders.indexOf(ord) + 1))}
                      </span>
                      <span className="track-pill-mono">
                        {ord.trackingId || ord.id}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0.35rem 0 0.2rem 0', color: 'var(--ink)' }}>
                      {ord.packageName} (x{ord.quantity})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      Route: <strong style={{ color: 'var(--ink)' }}>{ord.origin}</strong> &rarr; <strong style={{ color: 'var(--ink)' }}>{ord.destination}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)', fontFamily: 'IBM Plex Mono, monospace' }}>
                      ${parseFloat(ord.totalPrice || ord.pricing?.totalPrice || 0).toFixed(2)}
                    </div>
                    <span className="pill-amber">
                      {ord.status?.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <Link
                        href={`/order/${ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || ord.trackingId}`}
                        className="btn-paper"
                        style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}
                      >
                        👁️ View Details
                      </Link>
                      <Link
                        href={`/order/edit/${ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || ord.trackingId}`}
                        className="btn-paper btn-paper-primary"
                        style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}
                      >
                        ✏️ Edit Specs
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 7-Stage Stepper visual */}
                <div className="pipeline-stepper" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', position: 'relative' }}>
                  {[
                    { step: 1, label: 'Pickup Pending' },
                    { step: 2, label: 'Scheduled' },
                    { step: 3, label: 'Picked Up' },
                    { step: 4, label: 'In Warehouse' },
                    { step: 5, label: 'Dispatched' },
                    { step: 6, label: 'Out for Delivery' },
                    { step: 7, label: 'Delivered' },
                  ].map((s) => (
                    <div key={s.step} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: currentStep > s.step ? '#2E6B47' : currentStep === s.step ? '#E9EFF9' : '#FFFFFF',
                          border: currentStep > s.step ? '2px solid #2E6B47' : currentStep === s.step ? '2px solid #2E5EAA' : '2px solid #E4E0D3',
                          color: currentStep > s.step ? '#FFF' : currentStep === s.step ? '#2E5EAA' : '#7A7669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 6px auto',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {currentStep > s.step ? '✓' : s.step}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: currentStep === s.step ? 600 : 500,
                          color: currentStep === s.step ? '#2E5EAA' : '#7A7669',
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Pagination for Dashboard */}
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      {/* View Drawer */}
      <OrderViewDrawer
        order={selectedViewOrder}
        isOpen={!!selectedViewOrder}
        onClose={() => setSelectedViewOrder(null)}
        onOpenEdit={(ord) => setSelectedEditOrder(ord)}
        userRole={user.role}
      />

      {/* Edit Specs Modal */}
      <OrderEditModal
        order={selectedEditOrder}
        isOpen={!!selectedEditOrder}
        onClose={() => setSelectedEditOrder(null)}
        onSaveSuccess={() => fetchUserOrders(user.email)}
      />

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
                  <label className="form-label">Destination Location</label>
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
                <label className="form-label">Package Dimensions (L &times; Width &times; Height in cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min="1" placeholder="Length" className="form-input text-xs" value={length} onChange={(e) => setLength(e.target.value)} required />
                  <input type="number" min="1" placeholder="Width" className="form-input text-xs" value={width} onChange={(e) => setWidth(e.target.value)} required />
                  <input type="number" min="1" placeholder="Height" className="form-input text-xs" value={height} onChange={(e) => setHeight(e.target.value)} required />
                </div>
              </div>

              {/* Price Calculation Engine Live Preview */}
              <div style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  ⚡ Live Volumetric Pricing Engine
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-600 gap-1">
                  <span>Volumetric Weight: <strong>{volumetricW} kg</strong></span>
                  <span>Chargeable Weight: <strong>{chargeableW} kg</strong></span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#4F46E5' }}>
                  Estimated Total: ${calculatedPrice} USD
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
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

  if (user?.role === 'Admin' || user?.role === 'Manager') {
    return <SidebarLayout user={user}>{dashboardContent}</SidebarLayout>;
  }

  return <div className="w-full p-4 sm:p-8">{dashboardContent}</div>;
}
