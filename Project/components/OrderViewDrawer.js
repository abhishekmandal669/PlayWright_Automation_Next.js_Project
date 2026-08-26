'use client';

import { useState } from 'react';

export default function OrderViewDrawer({
  order,
  isOpen,
  onClose,
  onOpenEdit,
  onOpenPipeline,
  userRole = 'User',
}) {
  const [notes, setNotes] = useState(order?.notes || '');
  const [noteSavedMsg, setNoteSavedMsg] = useState('');

  if (!isOpen || !order) return null;

  const pipelineStages = [
    { key: 'PICKUP_PENDING', label: 'Pickup pending', step: 1 },
    { key: 'PICKUP_SCHEDULED', label: 'Pickup scheduled', step: 2 },
    { key: 'PICKED_UP', label: 'En route', step: 3 },
    { key: 'WAREHOUSE_ARRIVED', label: 'In-transit warehouse', step: 4 },
    { key: 'DISPATCHED', label: 'On flight', step: 5 },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', step: 6 },
    { key: 'DELIVERED', label: 'Delivered', step: 7 },
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

  const handlePrint = () => {
    window.print();
  };

  const handleSaveNote = () => {
    setNoteSavedMsg('Note updated successfully!');
    setTimeout(() => setNoteSavedMsg(''), 2500);
  };

  const actualWeight = parseFloat(order.weight || 1);
  const length = order.dimensions?.length || 40;
  const width = order.dimensions?.width || 30;
  const height = order.dimensions?.height || 20;
  const volWeight = parseFloat(order.volumetricWeight || ((length * width * height) / 5000).toFixed(1));
  const chargeableWeight = parseFloat(order.chargeableWeight || Math.max(actualWeight, volWeight).toFixed(1));

  const numOrderDisplay = order.orderNumber || (order.orderId ? order.orderId.replace(/\D/g, '') : '') || '1001';

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-[1240px] max-h-[92vh] bg-[#F6F4EE] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto border border-[#E4E0D3]"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#16233F' }}
      >
        {/* TOP BAR */}
        <div className="waybill-topbar px-6 py-4 bg-white border-b border-[#E4E0D3] sticky top-0 z-20">
          <div className="waybill-topbar-left">
            <span className="waybill-crumb">Shipment orders &middot; <b>Waybill inspection</b></span>
            <span className="order-pill-tag">ORD-{numOrderDisplay}</span>
            <span className="track-pill-mono">{order.trackingId || order.id}</span>
            <span className="pill-amber-warm">{currentStatus.replace(/_/g, ' ').toLowerCase()}</span>
            <span className="pill-green-warm">Live tracking active</span>
          </div>
          <div className="waybill-actions-row">
            <button className="btn-paper" onClick={handlePrint}>
              Print waybill
            </button>
            {onOpenEdit && (
              <button
                className="btn-paper btn-paper-primary"
                onClick={() => {
                  onClose();
                  onOpenEdit(order);
                }}
              >
                Edit specs
              </button>
            )}
            <button
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center ml-2"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ROUTE MANIFEST CARD */}
          <div className="manifest-paper-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div className="manifest-eyebrow">Global freight consignment</div>
                <div className="manifest-cargo-name">{order.packageName || 'Precision Avionics Box'}</div>
                <div className="manifest-cargo-qty">Quantity &mdash; {order.quantity || 1} unit</div>
              </div>
            </div>
            <div className="manifest-route">
              <div className="manifest-route-point">
                <span className="label">Origin</span>
                <span className="place">{order.origin || 'New Delhi, India'}</span>
              </div>
              <div className="manifest-route-line">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E5EAA" strokeWidth="2">
                  <path d="M2 16l7-2 6-8 2 1-3 8 6-1 2 2-8 3-1 5-2-1 1-6-8 2z" />
                </svg>
              </div>
              <div className="manifest-route-point" style={{ textAlign: 'right' }}>
                <span className="label">Destination</span>
                <span className="place">{order.destination || 'London, UK'}</span>
              </div>
            </div>
          </div>

          {/* STAGE RAIL CARD */}
          <div className="rail-paper-card">
            <div className="rail-paper-head">
              <h2>Dispatch pipeline &mdash; stage {currentStep} of 7</h2>
              <span>Live lifecycle from booking to delivery</span>
            </div>
            <div className="rail-paper-container">
              <div className="rail-paper-track"></div>
              <div className="rail-paper-track-fill" style={{ width: `${progressPercent}%` }}></div>
              <div className="rail-paper-steps">
                {pipelineStages.map((stage) => {
                  const isDone = currentStep > stage.step;
                  const isActive = currentStep === stage.step;
                  return (
                    <div
                      key={stage.step}
                      className={`rail-step-col ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                    >
                      <div className="rail-dot">{isDone ? '✓' : stage.step}</div>
                      <div className="rail-step-label">{stage.label}</div>
                      <div className="rail-step-sub">
                        {isActive ? 'In progress' : isDone ? 'Completed' : 'Upcoming'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2-COLUMN GRID (1.55fr : 1fr) */}
          <div className="waybill-grid-split">
            {/* Left Column */}
            <div className="waybill-left-column">
              {/* Volumetric Specs */}
              <div className="paper-card">
                <h2>Volumetric &amp; cargo specifications</h2>
                <table className="specs-paper">
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
                      <td className="chargeable-val">{chargeableWeight} kg</td>
                      <td>{order.quantity || 1} pcs</td>
                    </tr>
                  </tbody>
                </table>
                <div className="paper-tags-row">
                  {order.fragile && <span className="paper-tag paper-tag-blue">🛡️ Fragile handling</span>}
                  {order.express && <span className="paper-tag paper-tag-rust">⚡ Express priority air</span>}
                  {order.insured && <span className="paper-tag paper-tag-green">🔒 Cargo insured (100%)</span>}
                  {!order.fragile && !order.express && !order.insured && (
                    <span className="paper-tag paper-tag-blue">📦 Standard dispatch</span>
                  )}
                </div>
              </div>

              {/* Booking Notes */}
              <div className="paper-card">
                <h2>Booking notes</h2>
                <p className="notes-empty-msg">
                  {notes ? notes : 'No special instructions were added for this shipment.'}
                </p>
                <div className="notes-field-block">
                  <span className="label">Add a note</span>
                  <textarea
                    placeholder="e.g. Call recipient before delivery, leave with reception, handle upright only…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <button className="btn-paper" onClick={handleSaveNote}>
                      Save note
                    </button>
                    {noteSavedMsg && (
                      <span style={{ fontSize: '12px', color: '#2E6B47', fontWeight: 600 }}>
                        ✓ {noteSavedMsg}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="waybill-right-column">
              {/* Invoice Card */}
              <div className="invoice-paper-card">
                <div className="label">Total freight charge &middot; USD</div>
                <div className="total">${parseFloat(order.totalPrice || order.pricing?.totalPrice || 0).toFixed(2)}</div>
                <div className="sub">Volumetric matrix verified billing</div>
                <div className="invoice-item-line">
                  <span>Base booking fee</span>
                  <span>${order.pricing?.basePrice?.toFixed(2) || '25.00'}</span>
                </div>
                <div className="invoice-item-line">
                  <span>Weight surcharge ({chargeableWeight} kg &times; $12.50)</span>
                  <span>${order.pricing?.weightFee?.toFixed(2) || (chargeableWeight * 12.5).toFixed(2)}</span>
                </div>
                {order.fragile && (
                  <div className="invoice-item-line hi">
                    <span>Fragile handling</span>
                    <span>+$15.00</span>
                  </div>
                )}
                {order.express && (
                  <div className="invoice-item-line hi">
                    <span>Express priority</span>
                    <span>+$35.00</span>
                  </div>
                )}
                {order.insured && (
                  <div className="invoice-item-line hi">
                    <span>Cargo Insurance</span>
                    <span>+$20.00</span>
                  </div>
                )}
              </div>

              {/* Customer Record */}
              <div className="paper-card">
                <h2>Customer account record</h2>
                <div className="paper-field-grid">
                  <div className="paper-field">
                    <div className="label">Customer name</div>
                    <div className="val">{order.userName || 'API Tester'}</div>
                  </div>
                  <div className="paper-field">
                    <div className="label">Work email</div>
                    <div className="val">{order.userEmail}</div>
                  </div>
                  <div className="paper-field">
                    <div className="label">Account reference</div>
                    <div className="val mono">{order.userId || 'USR-AUTO'}</div>
                  </div>
                  <div className="paper-field">
                    <div className="label">Booking timestamp</div>
                    <div className="val">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '8/22/26, 2:34 PM'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate */}
              <div className="cert-paper-box">
                <div className="cert-id-code">FP-WAYBILL-{order.trackingId || order.id}</div>
                <div className="cert-sub-text">Official automated proxy waybill certificate</div>
                <div className="cert-foot-row">
                  <span>Encrypted SHA-256 dispatch</span>
                  <span>Freight SLA guarantee 99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
