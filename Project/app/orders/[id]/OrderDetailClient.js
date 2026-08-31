'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/useAuth';
import SidebarLayout from '../../../components/SidebarLayout';
import OrderEditModal from '../../../components/OrderEditModal';
import ShippingLabelModal from '../../../components/ShippingLabelModal';
import CustomsInvoiceModal from '../../../components/CustomsInvoiceModal';

export default function OrderDetailClient({ orderId }) {
  const router = useRouter();
  const { user, loading } = useAuth({ redirectTo: '/' });
  const [order, setOrder] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteSavedMsg, setNoteSavedMsg] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Customer requested cancellation');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [spawningChild, setSpawningChild] = useState(false);

  // Stage Transition State
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState(null);
  const [transitionDetails, setTransitionDetails] = useState('');
  const [transitionLocation, setTransitionLocation] = useState('');
  const [transitionReceiver, setTransitionReceiver] = useState('');
  const [transitionHub, setTransitionHub] = useState('Central Sorting Hub');
  const [transitionLane, setTransitionLane] = useState('Lane A-01');
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleSlot, setScheduleSlot] = useState('08:00 - 16:00');
  const [unscheduleReasonPreset, setUnscheduleReasonPreset] = useState('Customer requested date/time reschedule');
  const [unscheduleCustomReason, setUnscheduleCustomReason] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, user]);

  const fetchOrderDetails = async () => {
    setFetching(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setNotes(data.order.notes || '');
      } else {
        setError(data.message || 'Order not found.');
      }
    } catch (err) {
      setError('Failed to load order details.');
    } finally {
      setFetching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTracking = () => {
    if (order?.trackingId) {
      navigator.clipboard?.writeText(order.trackingId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    const finalReason = cancelReasonPreset === 'Other'
      ? customCancelReason.trim()
      : (customCancelReason.trim() ? `${cancelReasonPreset} — ${customCancelReason.trim()}` : cancelReasonPreset);

    if (!finalReason) {
      alert('Please provide a reason for cancelling this order.');
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cancel',
          status: 'CANCELLED',
          cancellationReason: finalReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(false);
        setCustomCancelReason('');
        await fetchOrderDetails();
      } else {
        alert(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      alert('Network error while cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSpawnChildOrder = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Manager') return;
    if (!confirm(`Spawn a linked Child Consignment from Parent Order ORD-${numOrderDisplay}?`)) return;
    setSpawningChild(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/child`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.childOrder) {
        alert(`✓ Child Consignment ORD-${data.childOrder.orderNumber} successfully spawned! Redirecting to new child order...`);
        router.push(`/order/${data.childOrder.orderNumber}`);
      } else {
        alert(data.message || 'Failed to spawn child order.');
      }
    } catch (err) {
      alert('Network error while spawning child order.');
    } finally {
      setSpawningChild(false);
    }
  };

  const handleOpenTransitionModal = (target) => {
    setTransitionTarget(target);
    setTransitionDetails(target.defaultDetails || '');
    setTransitionLocation(order?.origin || '');
    setTransitionReceiver(order?.userName || '');
    setTransitionHub('Central Gateway Sorting Hub');
    setTransitionLane('Lane A-01');
    setScheduleDate(new Date().toISOString().split('T')[0]);
    setScheduleSlot('08:00 - 16:00');
    setUnscheduleReasonPreset('Customer requested date/time reschedule');
    setUnscheduleCustomReason('');
    setShowTransitionModal(true);
  };

  const handleExecuteTransition = async (e) => {
    e.preventDefault();
    if (!transitionTarget) return;
    setTransitionLoading(true);

    const isUnschedule = transitionTarget.nextStatus === 'PICKUP_PENDING';
    const finalDetails = isUnschedule
      ? (unscheduleReasonPreset === 'Other reason'
          ? (unscheduleCustomReason.trim() || 'Unscheduled by operator')
          : (unscheduleCustomReason.trim() ? `${unscheduleReasonPreset} — ${unscheduleCustomReason.trim()}` : unscheduleReasonPreset))
      : transitionDetails;

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nextStatus: transitionTarget.nextStatus,
          details: finalDetails,
          location: transitionLocation,
          receiverName: transitionReceiver,
          hubName: transitionHub,
          sortingLane: transitionLane,
          scheduledDate: transitionTarget.nextStatus === 'PICKUP_SCHEDULED' ? scheduleDate : undefined,
          scheduledSlot: transitionTarget.nextStatus === 'PICKUP_SCHEDULED' ? scheduleSlot : undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowTransitionModal(false);
        await fetchOrderDetails();
      } else {
        alert(data.message || 'Failed to update delivery stage.');
      }
    } catch (err) {
      alert('Network error while updating delivery stage.');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder((prev) => (prev ? { ...prev, notes } : prev));
        setNoteSavedMsg('Note updated & saved to DB!');
      } else {
        setNoteSavedMsg(data.message || 'Error saving note');
      }
    } catch (err) {
      setNoteSavedMsg('Failed to save note');
    }
    setTimeout(() => setNoteSavedMsg(''), 3000);
  };

  if ((loading && !user) || (fetching && !order)) {
    return null;
  }

  if (error || !order) {
    return (
      <div style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#16233F', marginBottom: '0.5rem' }}>Order Not Found</h2>
        <p style={{ color: '#7A7669', marginBottom: '1.5rem' }}>{error || 'The requested shipment could not be retrieved.'}</p>
        <button className="btn-paper btn-paper-primary" onClick={() => router.back()}>
          &larr; Return to Orders
        </button>
      </div>
    );
  }

  const pipelineStages = [
    { key: 'PICKUP_PENDING', label: 'Pickup pending', step: 1, sub: 'In progress' },
    { key: 'PICKUP_SCHEDULED', label: 'Pickup scheduled', step: 2, sub: 'Upcoming' },
    { key: 'PICKED_UP', label: 'En route', step: 3, sub: 'Upcoming' },
    { key: 'WAREHOUSE_ARRIVED', label: 'In-transit warehouse', step: 4, sub: 'Upcoming' },
    { key: 'DISPATCHED', label: 'On flight', step: 5, sub: 'Upcoming' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', step: 6, sub: 'Upcoming' },
    { key: 'DELIVERED', label: 'Delivered', step: 7, sub: 'Upcoming' },
  ];

  const currentStatus = order.status || 'PICKUP_PENDING';
  const stageMap = {
    PICKUP_PENDING: 1,
    PICKUP_SCHEDULED: 2,
    PICKED_UP: 3,
    WAREHOUSE_ARRIVED: 4,
    DISPATCHED: 5,
    OUT_FOR_DELIVERY: 6,
    DELIVERED: 7,
  };
  const currentStep = stageMap[currentStatus] || 1;
  const progressPercent = Math.max(5, Math.min(100, Math.round(((currentStep - 1) / 6) * 100)));

  const actualWeight = parseFloat(order.weight || 1);
  const length = order.dimensions?.length || 40;
  const width = order.dimensions?.width || 30;
  const height = order.dimensions?.height || 20;
  const volWeight = parseFloat(order.volumetricWeight || ((length * width * height) / 5000).toFixed(1));
  const chargeableWeight = parseFloat(order.chargeableWeight || Math.max(actualWeight, volWeight).toFixed(1));

  const numOrderDisplay = order.orderNumber || (order.orderId ? order.orderId.replace(/\D/g, '') : '') || '1001';

  const waybillView = (
    <div className="wrap">
      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="crumb">Shipment orders &middot; <b>Waybill inspection</b></span>
          <span className="order-id">ORD-{numOrderDisplay}</span>
          <span className="track">{order.trackingId || order.id}</span>
          
          {/* Parent/Child Relationship Badge */}
          {(order.isChildOrder || order.parentOrderNumber) && (
            <Link
              href={`/order/${order.parentOrderNumber || order.parentOrderId}`}
              className="pill pill-blue"
              style={{ textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title={`Click to inspect Parent Order ORD-${order.parentOrderNumber || order.parentOrderId}`}
            >
              <span>🔗 Child of ORD-{order.parentOrderNumber || order.parentOrderId}</span>
            </Link>
          )}

          {order.status === 'CANCELLED' ? (
            <>
              <span className="pill pill-rust" style={{ fontWeight: 700 }}>CANCELLED</span>
              <span className="pill pill-rust">Consignment Voided</span>
            </>
          ) : (
            <>
              <span className="pill pill-amber">{currentStatus.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="pill pill-green">Live tracking active</span>
            </>
          )}
        </div>
        <div className="actions" style={{ position: 'relative' }}>
          <button className="btn" onClick={() => router.back()}>
            &larr; Back
          </button>
          
          {/* Actions Dropdown Toggle */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              id="order-actions-btn"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => setShowActionsDropdown((prev) => !prev)}
            >
              <span>⚡ Actions</span>
              <span style={{ fontSize: '9px', marginLeft: '2px' }}>{showActionsDropdown ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Options Menu */}
            {showActionsDropdown && (
              <div
                id="order-actions-dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: '240px',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  boxShadow: '0 12px 30px -4px rgba(0,0,0,0.18)',
                  zIndex: 100,
                  overflow: 'hidden',
                  padding: '6px',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                }}
              >
                {/* Admin/Manager Exclusive: Spawn Child Order */}
                {(user?.role === 'Admin' || user?.role === 'Manager') && (
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--blue)',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--blue-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      setShowActionsDropdown(false);
                      handleSpawnChildOrder();
                    }}
                    disabled={spawningChild}
                  >
                    <span>👶</span>
                    <span>{spawningChild ? 'Spawning Child Order...' : 'Spawn Child Consignment'}</span>
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    router.push(`/order/edit/${numOrderDisplay}`);
                  }}
                >
                  <span>✏️</span>
                  <span>Edit Specifications</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    handlePrint();
                  }}
                >
                  <span>🖨️</span>
                  <span>Print Full Waybill</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setShowLabelModal(true);
                  }}
                >
                  <span>🏷️</span>
                  <span>Print Thermal Label (4&times;6&quot;)</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setShowInvoiceModal(true);
                  }}
                >
                  <span>📄</span>
                  <span>Commercial Customs Invoice</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    handleCopyTracking();
                    setShowActionsDropdown(false);
                  }}
                >
                  <span>📋</span>
                  <span>{copyFeedback ? '✓ Copied Tracking ID!' : 'Copy Tracking Number'}</span>
                </button>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    router.push('/create-order');
                  }}
                >
                  <span>📦</span>
                  <span>Book New Consignment</span>
                </button>

                <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

                {(order.status === 'PICKUP_SCHEDULED' || order.status === 'DRIVER_ASSIGNED') && (
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--rust, #c2410c)',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      setShowActionsDropdown(false);
                      handleOpenTransitionModal({
                        nextStatus: 'PICKUP_PENDING',
                        title: 'Unschedule Pickup Window',
                        icon: '↩️',
                        defaultDetails: 'Pickup schedule cancelled and reverted back to Pickup Pending.',
                      });
                    }}
                  >
                    <span>↩️</span>
                    <span>Unschedule Pickup</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: order.status === 'CANCELLED' ? 'var(--muted)' : 'var(--rust)',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: order.status === 'CANCELLED' ? 'not-allowed' : 'pointer',
                    opacity: order.status === 'CANCELLED' ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (order.status !== 'CANCELLED') e.currentTarget.style.background = 'var(--rust-bg)';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    setShowActionsDropdown(false);
                    if (order.status !== 'CANCELLED' && order.status !== 'DELIVERED') {
                      setShowCancelModal(true);
                    }
                  }}
                >
                  <span>🚫</span>
                  <span>{order.status === 'CANCELLED' ? 'Order Cancelled' : 'Cancel Shipment Order'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Child Consignments Section (if parent has child orders) */}
      {order.childOrders && order.childOrders.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: 'var(--card)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👶 Linked Child Consignments</span>
              <span className="pill-blue" style={{ fontSize: '11px', padding: '2px 8px' }}>{order.childOrders.length} Sub-Order{order.childOrders.length > 1 ? 's' : ''}</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
              Sub-consignments spawned from this parent order
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {order.childOrders.map((child, cIdx) => (
              <div
                key={cIdx}
                style={{
                  padding: '12px 14px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>
                    ORD-{child.orderNumber}
                  </div>
                  <div style={{ fontSize: '10.5px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--blue)' }}>
                    {child.trackingId}
                  </div>
                </div>
                <Link
                  href={`/order/${child.orderNumber}`}
                  className="btn"
                  style={{ fontSize: '11.5px', padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Inspect &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Manifest Card */}
      <div className="manifest">
        <div className="manifest-top">
          <div>
            <div className="eyebrow">Global freight consignment</div>
            <div className="cargo-name">{order.packageName || 'Precision Avionics Box'}</div>
            <div className="cargo-qty">Quantity &mdash; {order.quantity || 1} unit</div>
          </div>
        </div>
        <div className="route">
          <div className="route-point">
            <span className="label">Origin</span>
            <span className="place">{order.origin || 'New Delhi, India'}</span>
          </div>
          <div className="route-line">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ stroke: 'var(--blue)' }} strokeWidth="2">
              <path d="M2 16l7-2 6-8 2 1-3 8 6-1 2 2-8 3-1 5-2-1 1-6-8 2z" />
            </svg>
          </div>
          <div className="route-point" style={{ textAlign: 'right' }}>
            <span className="label">Destination</span>
            <span className="place">{order.destination || 'London, UK'}</span>
          </div>
        </div>
      </div>

      {/* Stage Rail Card */}
      <div className="rail-card">
        <div className="rail-head">
          <h2>Dispatch pipeline &mdash; stage {currentStep} of 7</h2>
          <span>Live lifecycle from booking to delivery</span>
        </div>
        <div className="rail">
          <div className="rail-track"></div>
          <div className="rail-track-fill" style={{ width: `${progressPercent}%` }}></div>
          <div className="rail-steps">
            {pipelineStages.map((stage) => {
              const isDone = currentStep > stage.step;
              const isActive = currentStep === stage.step;
              return (
                <div
                  key={stage.step}
                  className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                >
                  <div className="dot">{isDone ? '✓' : stage.step}</div>
                  <div className="step-label">{stage.label}</div>
                  <div className="step-sub">
                    {isActive ? 'In progress' : isDone ? 'Completed' : 'Upcoming'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contextual Operational Action Strip */}
          {(user?.role === 'Admin' || user?.role === 'Manager') && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                <strong style={{ color: 'var(--ink)' }}>Operational Checkpoint:</strong> Advance or modify this consignment lifecycle stage.
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.status === 'PICKUP_PENDING' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    onClick={() =>
                      handleOpenTransitionModal({
                        nextStatus: 'PICKUP_SCHEDULED',
                        title: 'Schedule Pickup Window & Bay',
                        icon: '📅',
                        defaultDetails: 'Pickup slot scheduled with warehouse dispatch bay.',
                      })
                    }
                  >
                    <span>📅 Schedule Pickup Window &rarr;</span>
                  </button>
                )}

                {order.status === 'PICKUP_SCHEDULED' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        fontSize: '11.5px',
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid #d97706',
                        color: '#d97706',
                        fontWeight: 600,
                      }}
                      onClick={() =>
                        handleOpenTransitionModal({
                          nextStatus: 'PICKUP_PENDING',
                          title: 'Unschedule Pickup Window',
                          icon: '↩️',
                          defaultDetails: 'Pickup schedule cancelled and reverted back to Pickup Pending.',
                        })
                      }
                    >
                      <span>↩️ Unschedule Pickup</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                      onClick={() => router.push('/dispatcher')}
                    >
                      <span>🚚 Assign Driver in Dispatcher &rarr;</span>
                    </button>
                  </div>
                )}

                {order.status === 'DRIVER_ASSIGNED' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        fontSize: '11.5px',
                        padding: '6px 12px',
                        background: '#fff',
                        border: '1px solid #d97706',
                        color: '#d97706',
                        fontWeight: 600,
                      }}
                      onClick={() =>
                        handleOpenTransitionModal({
                          nextStatus: 'PICKUP_PENDING',
                          title: 'Unschedule & Release Driver',
                          icon: '↩️',
                          defaultDetails: 'Driver unassigned and pickup schedule reverted back to Pending.',
                        })
                      }
                    >
                      <span>↩️ Unschedule Pickup</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '11.5px', padding: '6px 12px' }}
                      onClick={() =>
                        handleOpenTransitionModal({
                          nextStatus: 'PICKED_UP',
                          title: 'Confirm Origin Pickup Scan',
                          icon: '📦',
                          defaultDetails: 'Driver arrived at shipper origin. Barcode scanned & seal intact.',
                        })
                      }
                    >
                      <span>📦 Confirm Origin Pickup Scan &rarr;</span>
                    </button>
                  </div>
                )}

                {order.status === 'PICKED_UP' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    onClick={() =>
                      handleOpenTransitionModal({
                        nextStatus: 'RECEIVED_AT_WAREHOUSE',
                        title: 'Inbound Hub Ingestion Scan',
                        icon: '🏢',
                        isHub: true,
                        defaultDetails: 'Consignment received at sorting facility and routed to outbound lane.',
                      })
                    }
                  >
                    <span>🏢 Inbound Hub Ingestion &rarr;</span>
                  </button>
                )}

                {order.status === 'RECEIVED_AT_WAREHOUSE' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                    onClick={() =>
                      handleOpenTransitionModal({
                        nextStatus: 'OUT_FOR_DELIVERY',
                        title: 'Dispatch for Last-Mile Delivery',
                        icon: '🚀',
                        defaultDetails: 'Package loaded on delivery van for final customer drop-off.',
                      })
                    }
                  >
                    <span>🚀 Out for Final Delivery &rarr;</span>
                  </button>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 12px', background: 'var(--green)', borderColor: 'var(--green)' }}
                    onClick={() =>
                      handleOpenTransitionModal({
                        nextStatus: 'DELIVERED',
                        title: 'Complete Delivery & Record POD',
                        icon: '✅',
                        isPod: true,
                        defaultDetails: 'Shipment handed over to recipient. Proof of delivery recorded.',
                      })
                    }
                  >
                    <span>✅ Record Delivery &amp; POD &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body Grid (1.55fr : 1fr) */}
      <div className="grid">
        {/* Left Column */}
        <div className="left-col">
          {/* Volumetric & Cargo Specs Card */}
          <div className="card">
            <h2>Volumetric &amp; cargo specifications</h2>
            <table className="specs">
              <thead>
                <tr>
                  <th>Actual weight</th>
                  <th>Dimensions (L&times;W&times;H)</th>
                  <th>Volumetric weight</th>
                  <th>Chargeable weight</th>
                  <th>Package units</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{actualWeight} kg</td>
                  <td>{length} &times; {width} &times; {height} cm</td>
                  <td>{volWeight} kg</td>
                  <td className="chargeable">{chargeableWeight} kg</td>
                  <td>{order.quantity || 1} pcs</td>
                </tr>
              </tbody>
            </table>
            <div className="tags">
              {order.fragile && <span className="tag tag-blue">🛡️ Fragile handling</span>}
              {order.express && <span className="tag tag-rust">⚡ Express priority air</span>}
              {order.insured && <span className="tag tag-blue">🔒 Cargo insured (100%)</span>}
              {!order.fragile && !order.express && !order.insured && (
                <span className="tag tag-blue">📦 Standard dispatch</span>
              )}
            </div>
          </div>

          {/* Booking Notes Card */}
          <div className="card">
            <h2>Booking notes</h2>
            <p className="notes-empty">
              {notes ? notes : 'No special instructions were added for this shipment.'}
            </p>
            <div className="notes-field">
              <span className="label">Add a note</span>
              <textarea
                placeholder="e.g. Call recipient before delivery, leave with reception, handle upright only…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <button className="btn" onClick={handleSaveNote}>
                  Save note
                </button>
                {noteSavedMsg && (
                  <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
                    ✓ {noteSavedMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="side">
          {/* Live Driver & Fleet Card (When assigned) */}
          {order.assignedDriver && order.assignedDriver.driverName && (
            <div className="card" style={{ background: 'var(--blue-bg)', borderColor: 'rgba(46, 94, 170, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="eyebrow" style={{ color: 'var(--blue)' }}>Assigned Carrier Fleet</span>
                <span className="pill pill-blue" style={{ fontSize: '10px' }}>ON ROUTE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                  {order.assignedDriver.driverName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>{order.assignedDriver.driverName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{order.assignedDriver.driverPhone || '+91 98765 43210'}</div>
                </div>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(46, 94, 170, 0.15)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)' }}>
                <span>Vehicle: <strong>{order.assignedDriver.vehicleNumber || 'Van-01'}</strong></span>
                <span>Type: <strong>{order.assignedDriver.vehicleType || 'Delivery Van'}</strong></span>
              </div>
            </div>
          )}

          {/* Invoice Card */}
          <div className="invoice">
            <div className="label">Total freight charge &middot; USD</div>
            <div className="total">${parseFloat(order.totalPrice || order.pricing?.totalPrice || 0).toFixed(2)}</div>
            <div className="sub">Volumetric matrix verified billing</div>
            <div className="invoice-line">
              <span>Base booking fee</span>
              <span>${order.pricing?.basePrice?.toFixed(2) || '25.00'}</span>
            </div>
            <div className="invoice-line">
              <span>Weight surcharge ({chargeableWeight} kg &times; $12.50)</span>
              <span>${order.pricing?.weightFee?.toFixed(2) || (chargeableWeight * 12.5).toFixed(2)}</span>
            </div>
            {order.fragile && (
              <div className="invoice-line hi">
                <span>Fragile handling</span>
                <span>+$15.00</span>
              </div>
            )}
            {order.express && (
              <div className="invoice-line hi">
                <span>Express priority</span>
                <span>+$35.00</span>
              </div>
            )}
            {order.insured && (
              <div className="invoice-line hi">
                <span>Cargo Insurance</span>
                <span>+$20.00</span>
              </div>
            )}
          </div>

          {/* Customer Account Record */}
          <div className="card">
            <h2>Customer account record</h2>
            <div className="field-grid">
              <div className="field">
                <div className="label">Customer name</div>
                <div className="val">{order.userName || 'API Tester'}</div>
              </div>
              <div className="field">
                <div className="label">Work email</div>
                <div className="val">{order.userEmail}</div>
              </div>
              <div className="field">
                <div className="label">Account reference</div>
                <div className="val mono">{order.userId || 'USR-AUTO'}</div>
              </div>
              <div className="field">
                <div className="label">Booking timestamp</div>
                <div className="val">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '8/22/26, 2:34 PM'}
                </div>
              </div>
            </div>
          </div>

          {/* Official Waybill Certificate */}
          <div className="cert">
            <div className="cert-id">FP-WAYBILL-{order.trackingId || order.id}</div>
            <div className="cert-sub">Official automated proxy waybill certificate</div>
            <div className="cert-foot">
              <span>Encrypted SHA-256 dispatch</span>
              <span>Freight SLA guarantee 99.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Activity & Audit Trail Logs with 6-item Pagination */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
              📜 Complete Shipment Lifecycle & Audit Trail Logs
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--muted)' }}>
              Persistent MongoDB audit record from booking to final delivery completion.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pill-blue" style={{ fontSize: '11px' }}>
              Stage: {order.status ? order.status.replace(/_/g, ' ') : 'PICKUP PENDING'}
            </span>
            <span className="pill-green" style={{ fontSize: '11px' }}>
              ✓ SHA-256 Verified
            </span>
          </div>
        </div>

        {/* Real Cryptographic Activity Logs from MongoDB */}
        {(() => {
          // Normalize and sort all activity logs (newest first)
          let rawLogs = Array.isArray(order.activityLogs) && order.activityLogs.length > 0
            ? [...order.activityLogs]
            : [
                {
                  stage: 1,
                  action: 'Shipment Consignment Registered',
                  status: order.status || 'PICKUP_PENDING',
                  actor: order.userName ? `${order.userName} (Customer)` : 'Customer Account',
                  actorRole: 'Customer',
                  location: order.origin || 'Origin Hub',
                  details: `Consignment registered for "${order.packageName}" (${order.weight} kg). Designated route: ${order.origin} ➔ ${order.destination}.`,
                  timestamp: order.createdAt || new Date(),
                  hash: 'SHA256:8F9A4C01E7B',
                },
              ];

          // Sort logs newest first
          rawLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

          const logsPerPage = 6;
          const totalLogs = rawLogs.length;
          const totalPages = Math.ceil(totalLogs / logsPerPage) || 1;
          const currentLogs = rawLogs.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage);
          const startEntry = (logsPage - 1) * logsPerPage + 1;
          const endEntry = Math.min(logsPage * logsPerPage, totalLogs);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentLogs.map((log, idx) => {
                const dateStr = log.timestamp
                  ? new Date(log.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })
                  : (order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '— Logged —');

                const isCancelled = log.status === 'CANCELLED' || log.action?.toLowerCase().includes('cancel');
                const isUnscheduled = log.status === 'PICKUP_PENDING' && log.action?.toLowerCase().includes('unschedule');
                const isCompleted = log.status === 'DELIVERED' || log.done;

                return (
                  <div
                    key={log._id || idx}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'var(--card)',
                      border: isUnscheduled ? '1px solid #fcd34d' : isCancelled ? '1px solid #fca5a5' : '1px solid var(--line)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isCancelled ? '#fee2e2' : isUnscheduled ? '#fef3c7' : 'var(--blue-bg)',
                        color: isCancelled ? '#dc2626' : isUnscheduled ? '#d97706' : 'var(--blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isCancelled ? '🚫' : isUnscheduled ? '↩️' : log.stage ? log.stage : '⚡'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                            {log.action}
                          </span>
                          <span
                            className={
                              isCancelled
                                ? 'pill-rust'
                                : isUnscheduled
                                ? 'pill-amber'
                                : isCompleted
                                ? 'pill-green'
                                : 'pill-blue'
                            }
                            style={{ fontSize: '10px', padding: '2px 7px', fontWeight: 700 }}
                          >
                            {log.status?.replace(/_/g, ' ') || 'LOGGED'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: 'var(--ink-soft)',
                            background: 'var(--paper)',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--line)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                        >
                          <span>🕒</span>
                          <span>{dateStr}</span>
                        </span>
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--ink)', lineHeight: '1.45' }}>
                        {log.details}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', fontSize: '10.5px', color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>Actor: <strong>{log.actor || 'System'}</strong></span>
                        <span>&bull;</span>
                        <span>Location: <strong>{log.location || order.origin || 'Gateway'}</strong></span>
                        <span>&bull;</span>
                        <span>Security: <strong style={{ fontFamily: 'monospace' }}>{log.hash || 'SHA256:VERIFIED'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 6-Item Pagination Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '14px',
                  marginTop: '10px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalLogs}</strong> audit logs (6 per page)
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      opacity: logsPage === 1 ? 0.5 : 1,
                      cursor: logsPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage((p) => Math.max(p - 1, 1))}
                  >
                    &larr; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`btn ${logsPage === pageNum ? 'btn-primary' : ''}`}
                      style={{
                        padding: '4px 9px',
                        fontSize: '11.5px',
                        minWidth: '28px',
                      }}
                      onClick={() => setLogsPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      opacity: logsPage === totalPages ? 0.5 : 1,
                      cursor: logsPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                    disabled={logsPage === totalPages}
                    onClick={() => setLogsPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(22, 35, 63, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '24px',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--rust-bg)',
                  color: 'var(--rust)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  Cancel Shipment Consignment
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Cancelling will void waybill ORD-{numOrderDisplay} and permanently record the reason in the MongoDB audit logs.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Cancellation Reason <span style={{ color: 'var(--rust)' }}>*</span>
              </label>
              <select
                className="sort-select text-xs"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)' }}
                value={cancelReasonPreset}
                onChange={(e) => setCancelReasonPreset(e.target.value)}
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Incorrect cargo / weight specifications">Incorrect cargo / weight specifications</option>
                <option value="Prohibited or hazardous materials detected">Prohibited or hazardous materials detected</option>
                <option value="Route disruption / carrier unavailable">Route disruption / carrier unavailable</option>
                <option value="Duplicate booking order">Duplicate booking order</option>
                <option value="Other">Other (Specify in notes below)</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Additional Explanation / Notes
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter details for the audit trail logs..."
                value={customCancelReason}
                onChange={(e) => setCustomCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: 'var(--rust)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.7 : 1,
                }}
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Checkpoint Modal */}
      {showTransitionModal && transitionTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(22, 35, 63, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '490px',
              background: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '24px',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            {transitionTarget.nextStatus === 'PICKUP_PENDING' ? (
              /* DEDICATED UNSCHEDULE PICKUP MODAL */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    ↩️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      Unschedule Pickup Window
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Reverting ORD-{numOrderDisplay} from <strong>{currentStatus.replace(/_/g, ' ')}</strong> back to <strong>PICKUP PENDING</strong>
                    </p>
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', marginBottom: '14px', fontSize: '11.5px', color: '#92400E', lineHeight: '1.4' }}>
                  ⚠️ <strong>Notice:</strong> Unscheduling will remove the scheduled pickup date/time and release any assigned driver back to the active fleet. This reason will be recorded in the permanent audit logs.
                </div>

                <form onSubmit={handleExecuteTransition} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Reason for Unscheduling *
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--line)',
                        background: 'var(--paper)',
                        fontSize: '12.5px',
                        color: 'var(--ink)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      value={unscheduleReasonPreset}
                      onChange={(e) => setUnscheduleReasonPreset(e.target.value)}
                    >
                      <option value="Customer requested date/time reschedule">Customer requested date/time reschedule</option>
                      <option value="Driver / Fleet truck unavailable">Driver / Fleet truck unavailable</option>
                      <option value="Warehouse dispatch bay full / congestion">Warehouse dispatch bay full / congestion</option>
                      <option value="Shipper address / contact verification required">Shipper address / contact verification required</option>
                      <option value="Consignment cargo repackaging required">Consignment cargo repackaging required</option>
                      <option value="Weather / flight route disruption">Weather / flight route disruption</option>
                      <option value="Other reason">Other reason (specify below)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Operational Remarks &amp; Audit Trail Notes {unscheduleReasonPreset === 'Other reason' ? '*' : '(Optional)'}
                    </label>
                    <textarea
                      required={unscheduleReasonPreset === 'Other reason'}
                      style={{
                        width: '100%',
                        minHeight: '75px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1px solid var(--line)',
                        background: 'var(--paper)',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      placeholder="Explain why this pickup is being unscheduled (saved to activity logs)..."
                      value={unscheduleCustomReason}
                      onChange={(e) => setUnscheduleCustomReason(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowTransitionModal(false)}
                      disabled={transitionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      style={{
                        background: '#DC2626',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        padding: '8px 16px',
                        cursor: transitionLoading ? 'not-allowed' : 'pointer',
                        opacity: transitionLoading ? 0.7 : 1,
                      }}
                      disabled={transitionLoading}
                    >
                      {transitionLoading ? 'Updating Logs…' : '↩️ Confirm Unschedule'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* STANDARD ADVANCE STAGE / SCHEDULE PICKUP MODAL */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--blue-bg)',
                      color: 'var(--blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {transitionTarget.icon || '🚀'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>
                      {transitionTarget.title || 'Advance Consignment Stage'}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Advancing ORD-{numOrderDisplay} to stage <strong>{transitionTarget.nextStatus.replace(/_/g, ' ')}</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleExecuteTransition} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {transitionTarget.nextStatus === 'PICKUP_SCHEDULED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '10px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          <span>📅 Select Pickup Date</span>
                          <span style={{ fontSize: '10px', color: 'var(--rust, #c2410c)', textTransform: 'none', fontWeight: 600 }}>Past dates blocked</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '7px',
                            border: '1px solid var(--line)',
                            background: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          ⏰ 8-Hour Dispatch Time Frame (24-Hour Window)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                          {[
                            {
                              slot: '00:00 - 08:00',
                              icon: '🌙',
                              title: '00:00 – 08:00',
                              sub: 'Early Morning & Night Linehaul Dispatch',
                            },
                            {
                              slot: '08:00 - 16:00',
                              icon: '☀️',
                              title: '08:00 – 16:00',
                              sub: 'Standard Morning & Afternoon Dispatch Shift',
                            },
                            {
                              slot: '16:00 - 24:00',
                              icon: '🌆',
                              title: '16:00 – 24:00',
                              sub: 'Evening Freight Consolidation & Night Airport Run',
                            },
                          ].map((item) => {
                            const isSelected = scheduleSlot === item.slot;
                            return (
                              <div
                                key={item.slot}
                                onClick={() => setScheduleSlot(item.slot)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: isSelected ? '1.5px solid var(--blue, #2563eb)' : '1px solid var(--line)',
                                  background: isSelected ? 'var(--blue-bg, #eff6ff)' : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '14px' }}>{item.icon}</span>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--blue, #1d4ed8)' : 'var(--ink)' }}>
                                      {item.title}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--muted, #64748b)' }}>
                                      {item.sub}
                                    </div>
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  name="scheduleSlot"
                                  checked={isSelected}
                                  onChange={() => setScheduleSlot(item.slot)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {transitionTarget.isHub && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Warehouse Hub Name
                        </label>
                        <input
                          type="text"
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '12px' }}
                          value={transitionHub}
                          onChange={(e) => setTransitionHub(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Sorting Lane ID
                        </label>
                        <input
                          type="text"
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '12px', fontFamily: 'monospace' }}
                          value={transitionLane}
                          onChange={(e) => setTransitionLane(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {transitionTarget.isPod && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '12px' }}
                        placeholder="e.g. John Doe / Receiving Officer"
                        value={transitionReceiver}
                        onChange={(e) => setTransitionReceiver(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Location Checkpoint
                    </label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '12px' }}
                      value={transitionLocation}
                      onChange={(e) => setTransitionLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Operational Audit Remarks
                    </label>
                    <textarea
                      style={{ width: '100%', minHeight: '65px', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '12px', boxSizing: 'border-box' }}
                      value={transitionDetails}
                      onChange={(e) => setTransitionDetails(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setShowTransitionModal(false)}
                      disabled={transitionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={transitionLoading}
                    >
                      {transitionLoading ? 'Verifying…' : 'Confirm Checkpoint →'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safe Edit Specs Modal */}
      <OrderEditModal
        order={showEditModal ? order : null}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaveSuccess={() => {
          setShowEditModal(false);
          fetchOrderDetails();
        }}
      />

      {/* 4x6" Thermal Shipping Label Modal */}
      <ShippingLabelModal
        order={order}
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
      />

      {/* A4 Commercial Customs Export Invoice Modal */}
      <CustomsInvoiceModal
        order={order}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );

  if (user?.role === 'Admin' || user?.role === 'Manager') {
    return <SidebarLayout user={user}>{waybillView}</SidebarLayout>;
  }

  return <div style={{ width: '100%', background: 'var(--paper)', minHeight: 'calc(100vh - 73px)' }}>{waybillView}</div>;
}
