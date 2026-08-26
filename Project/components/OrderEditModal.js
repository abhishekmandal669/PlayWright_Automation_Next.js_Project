'use client';

import { useState, useEffect, useMemo } from 'react';
import { calculatePricing } from '../lib/pricing';

export default function OrderEditModal({ order, isOpen, onClose, onSaveSuccess }) {
  const [packageName, setPackageName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState(1);
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [fragile, setFragile] = useState(false);
  const [express, setExpress] = useState(false);
  const [insured, setInsured] = useState(false);
  const [priceOverride, setPriceOverride] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (order) {
      setPackageName(order.packageName || '');
      setOrigin(order.origin || '');
      setDestination(order.destination || '');
      setWeight(order.weight || 1);
      setLength(order.dimensions?.length || 10);
      setWidth(order.dimensions?.width || 10);
      setHeight(order.dimensions?.height || 10);
      setFragile(!!order.fragile);
      setExpress(!!order.express);
      setInsured(!!order.insured);
      setPriceOverride(order.totalPrice || order.pricing?.totalPrice || '');
      setNotes(order.notes || '');
      setMsg('');
    }
  }, [order]);

  // Live Pricing Breakdown
  const { volumetricW, chargeableW, autoPrice } = useMemo(() => {
    const calc = calculatePricing({
      weight,
      length,
      width,
      height,
      fragile,
      express,
      insured,
    });
    return {
      volumetricW: calc.volumetricWeight.toFixed(1),
      chargeableW: calc.chargeableWeight.toFixed(1),
      autoPrice: calc.pricing.totalPrice.toFixed(2),
    };
  }, [weight, length, width, height, fragile, express, insured]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id || order.trackingId,
          updateData: {
            packageName,
            origin,
            destination,
            weight: parseFloat(weight),
            dimensions: { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
            fragile,
            express,
            insured,
            notes,
            totalPrice: parseFloat(priceOverride || autoPrice),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg('Order specifications updated successfully!');
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setMsg(data.message || 'Failed to update order.');
      }
    } catch (err) {
      setMsg('Network error updating order.');
    } finally {
      setLoading(false);
    }
  };

  const numOrderDisplay = order.orderNumber || (order.orderId ? order.orderId.replace(/\D/g, '') : '') || '1001';

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-[650px] max-h-[90vh] bg-white border border-[#E4E0D3] rounded-[10px] shadow-2xl flex flex-col overflow-hidden my-auto font-['IBM_Plex_Sans'] text-[#16233F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D3] bg-[#FBFAF6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="order-pill-tag text-xs">ORD-#{numOrderDisplay}</span>
              <h2 className="text-[14px] font-semibold text-[#16233F] m-0">Edit Shipment Specifications</h2>
            </div>
            <p className="text-[11px] text-[#7A7669] mt-1 font-mono">
              Tracking: <span className="text-[#2E5EAA] font-semibold">{order.trackingId || order.id}</span>
            </p>
          </div>
          <button className="w-7 h-7 rounded-md border border-[#E4E0D3] bg-white text-[#7A7669] hover:bg-[#F6F4EE] flex items-center justify-center text-xs font-bold" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {msg && (
            <div className={`p-3 rounded-lg text-xs font-medium ${msg.includes('successfully') ? 'bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]' : 'bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]'}`}>
              {msg}
            </div>
          )}

          {/* Customer Ownership Locked Card */}
          <div className="bg-[#FBFAF6] border border-dashed border-[#E4E0D3] rounded-lg p-3.5 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] flex items-center gap-1.5">
              <span>🔒</span> Customer Record Locked (Read-Only)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-[#7A7669]">Customer:</span> <strong className="text-[#16233F]">{order.userName || 'Customer'}</strong></div>
              <div><span className="text-[#7A7669]">Email:</span> <strong className="text-[#16233F]">{order.userEmail}</strong></div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Package Title / Description</label>
            <input
              type="text"
              className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2.5 outline-none focus:border-[#2E5EAA] focus:bg-white"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Origin City / Hub</label>
              <input
                type="text"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2.5 outline-none focus:border-[#2E5EAA] focus:bg-white"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Destination City / Hub</label>
              <input
                type="text"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2.5 outline-none focus:border-[#2E5EAA] focus:bg-white"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Physical Dimensions */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2 outline-none focus:border-[#2E5EAA] focus:bg-white font-mono"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Length (cm)</label>
              <input
                type="number"
                min="1"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2 outline-none focus:border-[#2E5EAA] focus:bg-white font-mono"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Width (cm)</label>
              <input
                type="number"
                min="1"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2 outline-none focus:border-[#2E5EAA] focus:bg-white font-mono"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">Height (cm)</label>
              <input
                type="number"
                min="1"
                className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2 outline-none focus:border-[#2E5EAA] focus:bg-white font-mono"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Add-ons Checkboxes */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-[#3B4A6B] cursor-pointer">
              <input
                type="checkbox"
                checked={fragile}
                onChange={(e) => setFragile(e.target.checked)}
                className="rounded text-[#2E5EAA]"
              />
              <span>🛡️ Fragile Handling (+$15)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#3B4A6B] cursor-pointer">
              <input
                type="checkbox"
                checked={express}
                onChange={(e) => setExpress(e.target.checked)}
                className="rounded text-[#2E5EAA]"
              />
              <span>⚡ Express Priority (+$35)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[#3B4A6B] cursor-pointer">
              <input
                type="checkbox"
                checked={insured}
                onChange={(e) => setInsured(e.target.checked)}
                className="rounded text-[#2E5EAA]"
              />
              <span>🔒 Cargo Insured (+$20)</span>
            </label>
          </div>

          {/* Live Calculated Charge Summary */}
          <div className="bg-[#FBFAF6] border border-[#E4E0D3] rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7669]">Calculated Chargeable Weight</div>
              <div className="text-xs font-medium text-[#3B4A6B] mt-0.5">
                Volumetric: <span className="font-mono font-semibold">{volumetricW} kg</span> | Chargeable: <span className="font-mono font-bold text-[#2E5EAA]">{chargeableW} kg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A7669]">Auto Price</div>
              <div className="text-xl font-bold font-mono text-[#16233F]">${autoPrice}</div>
            </div>
          </div>

          {/* Booking Notes Field */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7669] mb-1">
              Booking Notes &amp; Special Instructions
            </label>
            <textarea
              className="w-full text-[13px] text-[#16233F] bg-[#F6F4EE] border border-[#E4E0D3] rounded-[7px] p-2 outline-none focus:border-[#2E5EAA] focus:bg-white resize-y min-h-[60px]"
              placeholder="e.g. Call recipient before delivery, leave with reception, handle upright only…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D3]">
            <button type="button" className="btn-paper" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-paper btn-paper-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Specifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
