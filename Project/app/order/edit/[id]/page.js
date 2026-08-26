'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/useAuth';
import { calculatePricing } from '../../../../lib/pricing';
import Footer from '../../../../components/Footer';

export default function OrderEditPage({ params }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth({ redirectTo: '/' });
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form States (Editable)
  const [packageName, setPackageName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(1);
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [fragile, setFragile] = useState(false);
  const [express, setExpress] = useState(false);
  const [insured, setInsured] = useState(false);
  const [carrier, setCarrier] = useState('FreightProxy Standard Air');
  const [presetType, setPresetType] = useState('custom');
  const [notes, setNotes] = useState('');

  // Fetch Existing Order
  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    setFetching(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.order) {
        const o = data.order;
        setOrder(o);
        setPackageName(o.packageName || '');
        setOrigin(o.origin || '');
        setDestination(o.destination || '');
        setQuantity(o.quantity || 1);
        setWeight(parseFloat(o.weight) || 1);
        setLength(parseFloat(o.dimensions?.length) || 10);
        setWidth(parseFloat(o.dimensions?.width) || 10);
        setHeight(parseFloat(o.dimensions?.height) || 10);
        setFragile(!!o.fragile);
        setExpress(!!o.express);
        setInsured(!!o.insured);
        setCarrier(o.carrier || 'FreightProxy Standard Air');
        setNotes(o.notes || '');
      } else {
        setErrorMsg(data.message || 'Order not found.');
      }
    } catch (err) {
      setErrorMsg('Failed to load order for editing.');
    } finally {
      setFetching(false);
    }
  };

  // Live Pricing Matrix Calculation
  const pricing = useMemo(() => {
    return calculatePricing({
      weight: parseFloat(weight) || 0.1,
      length: parseFloat(length) || 1,
      width: parseFloat(width) || 1,
      height: parseFloat(height) || 1,
      fragile,
      express,
      insured,
    });
  }, [weight, length, width, height, fragile, express, insured]);

  const handlePresetSelect = (type) => {
    setPresetType(type);
    if (type === 'small') {
      setLength(20);
      setWidth(15);
      setHeight(10);
      setWeight(1.5);
    } else if (type === 'standard') {
      setLength(40);
      setWidth(30);
      setHeight(20);
      setWeight(4.5);
    } else if (type === 'heavy') {
      setLength(80);
      setWidth(60);
      setHeight(50);
      setWeight(18);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'edit',
          orderId: order?.trackingId || order?.id || orderId,
          updateData: {
            packageName,
            origin,
            destination,
            quantity: parseInt(quantity) || 1,
            weight: parseFloat(weight),
            dimensions: { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
            fragile,
            express,
            insured,
            carrier,
            notes,
            totalPrice: pricing.pricing.totalPrice,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Order #${orderId} specifications updated successfully!`);
        setTimeout(() => {
          router.push(`/order/${orderId}`);
        }, 900);
      } else {
        setErrorMsg(data.message || 'Failed to update order specifications.');
      }
    } catch (err) {
      setErrorMsg('Network error updating order specifications.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Loading Order #{orderId} Specifications…</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>Order Not Found</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>{errorMsg}</p>
        <button className="btn-paper btn-paper-primary" onClick={() => router.push('/dashboard')}>
          &larr; Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--paper)] min-h-[calc(100vh-73px)]">
      <div className="w-full max-w-[1240px] mx-auto p-[28px] font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4">
        {/* Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
              <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Shipments</Link> &rarr; <Link href={`/order/${orderId}`} style={{ color: 'inherit', textDecoration: 'none' }}>Order #{orderId}</Link> &rarr; <strong style={{ color: 'var(--blue)' }}>Edit Specifications</strong>
            </div>
            <h1 className="text-[18px] font-semibold text-[var(--ink)] m-0">✏️ Edit Shipment Order #{orderId}</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
              Update cargo dimensions &middot; Volumetric weight calculation &middot; Addon options &middot; Dispatch notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/order/${orderId}`} className="btn-paper" style={{ textDecoration: 'none' }}>
              &larr; View Waybill
            </Link>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-lg text-xs font-medium bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 rounded-lg text-xs font-medium bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]">
            ✕ {errorMsg}
          </div>
        )}

        {/* Main Grid Layout (1.55fr : 1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Left Column (Forms) */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              {/* Section 1: Customer Account Record (Disabled / Unchangeable) */}
              <div className="paper-card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold text-[var(--ink)] m-0">👤 1. Customer Account Record (Locked)</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--muted)] border border-[var(--line)] uppercase tracking-wider">
                    🔒 Read-Only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[var(--card-alt)] border border-[var(--line)] rounded-lg opacity-75 cursor-not-allowed">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={order?.userName || 'Customer'}
                      disabled
                      className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={order?.userEmail || ''}
                      disabled
                      className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                      Account Reference
                    </label>
                    <input
                      type="text"
                      value={order?.userId || 'USR-AUTO'}
                      disabled
                      className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] cursor-not-allowed font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      value={order?.trackingId || order?.id || ''}
                      disabled
                      className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--blue)] text-[13px] cursor-not-allowed font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Consignment & Routing Details (Editable) */}
              <div className="paper-card">
                <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-3">📍 2. Consignment &amp; Routing Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                      Package / Consignment Description
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      required
                      placeholder="e.g. Precision Avionics Box"
                      className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] outline-none focus:border-[var(--blue)] focus:bg-[var(--card)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                        Origin (City, Country)
                      </label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        required
                        placeholder="e.g. New Delhi, India"
                        className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] outline-none focus:border-[var(--blue)] focus:bg-[var(--card)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                        Destination (City, Country)
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                        placeholder="e.g. London, UK"
                        className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] outline-none focus:border-[var(--blue)] focus:bg-[var(--card)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                        Package Units (Qty)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        required
                        className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] outline-none focus:border-[var(--blue)] focus:bg-[var(--card)]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">
                        Carrier Service
                      </label>
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full p-2.5 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] outline-none focus:border-[var(--blue)] focus:bg-[var(--card)]"
                      >
                        <option value="FreightProxy Standard Air">✈️ FreightProxy Standard Air</option>
                        <option value="Global Express Cargo">⚡ Global Express Cargo</option>
                        <option value="Trans-Ocean Container">🚢 Trans-Ocean Container</option>
                        <option value="Overland Freight Network">🚛 Overland Freight Network</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Volumetric & Weight Specifications (Editable) */}
              <div className="paper-card">
                <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-3">📐 3. Volumetric &amp; Weight Specifications</h2>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    className={`btn text-xs py-1 px-2.5 ${presetType === 'small' ? 'btn-primary' : ''}`}
                    onClick={() => handlePresetSelect('small')}
                  >
                    📦 Small Mailer (20&times;15&times;10 cm &bull; 1.5kg)
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-1 px-2.5 ${presetType === 'standard' ? 'btn-primary' : ''}`}
                    onClick={() => handlePresetSelect('standard')}
                  >
                    📦 Standard Carton (40&times;30&times;20 cm &bull; 4.5kg)
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-1 px-2.5 ${presetType === 'heavy' ? 'btn-primary' : ''}`}
                    onClick={() => handlePresetSelect('heavy')}
                  >
                    📦 Freight Pallet (80&times;60&times;50 cm &bull; 18kg)
                  </button>
                  <button
                    type="button"
                    className={`btn text-xs py-1 px-2.5 ${presetType === 'custom' ? 'btn-primary' : ''}`}
                    onClick={() => setPresetType('custom')}
                  >
                    📐 Custom Sizing
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Actual Measured Weight (kg)
                      </label>
                      <span className="text-[13px] font-bold text-[var(--blue)] font-mono">{weight} kg</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="50"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value))}
                      className="w-full accent-[var(--blue)] cursor-pointer"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                      className="w-full mt-1.5 p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                      Dimensions (Length &times; Width &times; Height in cm)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-[11px] text-[var(--muted)] block mb-1">Length (cm)</span>
                        <input
                          type="number"
                          min="1"
                          value={length}
                          onChange={(e) => setLength(parseFloat(e.target.value) || 1)}
                          required
                          className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--muted)] block mb-1">Width (cm)</span>
                        <input
                          type="number"
                          min="1"
                          value={width}
                          onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                          required
                          className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--muted)] block mb-1">Height (cm)</span>
                        <input
                          type="number"
                          min="1"
                          value={height}
                          onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                          required
                          className="w-full p-2 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-[13px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Addon Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${fragile ? 'bg-[var(--blue-bg)] border-[var(--blue)] text-[var(--blue)] font-semibold' : 'bg-[var(--card)] border-[var(--line)] text-[var(--ink-soft)]'}`}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                        <span className="text-xs">🛡️ Fragile</span>
                      </div>
                      <span className="text-xs font-mono">+$15</span>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${express ? 'bg-[var(--rust-bg)] border-[var(--rust)] text-[var(--rust)] font-semibold' : 'bg-[var(--card)] border-[var(--line)] text-[var(--ink-soft)]'}`}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
                        <span className="text-xs">⚡ Express Air</span>
                      </div>
                      <span className="text-xs font-mono">+$35</span>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${insured ? 'bg-[var(--green-bg)] border-[var(--green)] text-[var(--green)] font-semibold' : 'bg-[var(--card)] border-[var(--line)] text-[var(--ink-soft)]'}`}>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
                        <span className="text-xs">🔒 Insurance</span>
                      </div>
                      <span className="text-xs font-mono">+$20</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 4: Booking Notes & Special Instructions (Editable) */}
              <div className="paper-card">
                <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-3">📝 4. Booking Notes &amp; Special Instructions</h2>
                <div className="notes-field" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <span className="label">Add a note</span>
                  <textarea
                    placeholder="e.g. Call recipient before delivery, leave with reception, handle upright only…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Row */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="btn-paper btn-paper-primary flex-1 justify-center py-3 text-[14px]"
                  disabled={submitting}
                >
                  {submitting ? 'Saving Specifications...' : '💾 Save & Update Shipment Order'}
                </button>
                <Link href={`/order/${orderId}`} className="btn-paper py-3 px-5 text-[14px]" style={{ textDecoration: 'none' }}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Right Column: Live Price & Summary */}
          <div className="space-y-4 sticky top-[80px]">
            <div className="invoice">
              <div className="label">Total Freight Charge &middot; USD</div>
              <div className="total">${pricing.pricing.totalPrice.toFixed(2)}</div>
              <div className="sub">Real-time volumetric recalculated billing</div>

              <div className="invoice-line">
                <span>Base booking fee</span>
                <span>${pricing.pricing.basePrice.toFixed(2)}</span>
              </div>
              <div className="invoice-line">
                <span>Weight fee ({pricing.chargeableWeight.toFixed(1)} kg &times; $12.50)</span>
                <span>${pricing.pricing.weightFee.toFixed(2)}</span>
              </div>
              {fragile && (
                <div className="invoice-line hi">
                  <span>Fragile handling</span>
                  <span>+$15.00</span>
                </div>
              )}
              {express && (
                <div className="invoice-line hi">
                  <span>Express priority air</span>
                  <span>+$35.00</span>
                </div>
              )}
              {insured && (
                <div className="invoice-line hi">
                  <span>Cargo Insurance (100%)</span>
                  <span>+$20.00</span>
                </div>
              )}
            </div>

            <div className="paper-card space-y-2">
              <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-2">⚖️ Weight Analysis</h2>
              <div className="flex justify-between text-[13px] py-1 border-b border-[var(--line-soft)]">
                <span className="text-[var(--muted)]">Actual Weight:</span>
                <span className="font-semibold font-mono text-[var(--ink)]">{weight} kg</span>
              </div>
              <div className="flex justify-between text-[13px] py-1 border-b border-[var(--line-soft)]">
                <span className="text-[var(--muted)]">Volumetric Weight:</span>
                <span className="font-semibold font-mono text-[var(--ink)]">{pricing.volumetricWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between text-[13px] py-1">
                <span className="text-[var(--muted)] font-semibold">Chargeable Weight:</span>
                <span className="font-bold font-mono text-[var(--blue)]">{pricing.chargeableWeight.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
