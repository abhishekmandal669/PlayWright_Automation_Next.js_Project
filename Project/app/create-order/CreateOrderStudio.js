'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { calculatePricing } from '../../lib/pricing';
import SidebarLayout from '../../components/SidebarLayout';

export default function CreateOrderStudio() {
  const router = useRouter();
  const { user, loading } = useAuth({ redirectTo: '/' });

  // Users List (for Admin/Manager customer selection)
  const [usersList, setUsersList] = useState([]);
  const [selectedUserMode, setSelectedUserMode] = useState('existing');
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Order Details
  const [packageName, setPackageName] = useState('Precision Electronic Sensors');
  const [origin, setOrigin] = useState('New Delhi, India');
  const [destination, setDestination] = useState('London, UK');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(3.5);
  const [length, setLength] = useState(25);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [fragile, setFragile] = useState(true);
  const [express, setExpress] = useState(true);
  const [insured, setInsured] = useState(false);
  const [carrier, setCarrier] = useState('FreightProxy Standard Air');
  const [presetType, setPresetType] = useState('custom');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    if (user) {
      if (isAdminOrManager) {
        fetchUsers();
      } else {
        setSelectedCustomerEmail(user.email);
      }
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.users) {
        const customersOnly = data.users.filter(
          (u) => u.role !== 'Admin' && u.role !== 'Manager'
        );
        setUsersList(customersOnly);
        if (customersOnly.length > 0) {
          setSelectedCustomerEmail(customersOnly[0].email);
        }
      }
    } catch (e) {
      console.error('Failed to load user roster:', e);
    }
  };

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
      setWeight(18.0);
    }
  };

  const { volumetricWeight, chargeableWeight, pricing } = useMemo(() => {
    return calculatePricing({
      weight,
      length,
      width,
      height,
      fragile,
      express,
      insured,
    });
  }, [weight, length, width, height, fragile, express, insured]);

  if (!user) return null;

  const targetEmail = isAdminOrManager
    ? selectedUserMode === 'existing'
      ? selectedCustomerEmail
      : newCustomerEmail
    : user.email;

  const targetName = isAdminOrManager
    ? selectedUserMode === 'existing'
      ? usersList.find((u) => u.email === selectedCustomerEmail)?.name || 'Selected Customer'
      : newCustomerName || 'New Customer'
    : user.name;

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!targetEmail) {
      setErrorMsg('Please select or specify a valid customer email.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: targetEmail,
          userName: targetName,
          origin,
          destination,
          packageName,
          quantity: parseInt(quantity) || 1,
          weight: parseFloat(weight),
          dimensions: { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) },
          fragile,
          express,
          insured,
          carrier,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Shipment Order created! Tracking ID: ${data.order?.trackingId || data.order?.id}`);
        setTimeout(() => {
          if (user.role === 'Manager') router.push('/manager');
          else if (user.role === 'Admin') router.push('/admin');
          else router.push('/dashboard');
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Failed to create shipment order.');
      }
    } catch (err) {
      setErrorMsg('Network error booking shipment order.');
    } finally {
      setSubmitting(false);
    }
  };

  const formBody = (
    <div className="w-full max-w-[1240px] mx-auto px-3 py-4 sm:p-7 font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4 sm:space-y-6 min-w-0 box-border">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--line)]">
        <div>
          <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">
            <span>Console</span> &rarr; <span>Shipments</span> &rarr; <strong style={{ color: 'var(--blue)' }}>Creation Studio</strong>
          </div>
          <h1 className="text-base sm:text-[18px] font-semibold text-[var(--ink)] m-0">📦 New Freight Shipment Studio</h1>
          <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Configure package dimensions &middot; Volumetric rates &middot; Carrier priority &middot; Customer assignment
          </p>
        </div>
        <button className="btn-paper text-xs py-1.5 px-3 self-start sm:self-auto" onClick={() => router.back()}>
          &larr; Back to Console
        </button>
      </div>

      {successMsg && (
        <div className="p-3 sm:p-3.5 rounded-lg text-xs font-medium bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-lg text-xs font-medium bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0 max-w-full">
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
          <form onSubmit={handleCreateShipment} className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
            <div className="paper-card p-3.5 sm:p-5 space-y-3.5">
              <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-0">👤 1. Customer Assignment &amp; Ownership</h2>

              {!isAdminOrManager ? (
                <div className="flex items-center gap-3 p-3 bg-[var(--paper)] border border-[var(--line)] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>{user.name} (Your Account)</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <button
                      type="button"
                      className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center ${
                        selectedUserMode === 'existing'
                          ? 'bg-[var(--chip-bg)] text-[var(--chip-text)] border-[var(--chip-bg)] shadow-sm'
                          : 'bg-[var(--card)] text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--paper)]'
                      }`}
                      onClick={() => setSelectedUserMode('existing')}
                    >
                      <span>🔍</span>
                      <span className="truncate">Select Existing Customer ({usersList.length})</span>
                    </button>
                    <button
                      type="button"
                      className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center ${
                        selectedUserMode === 'new'
                          ? 'bg-[var(--chip-bg)] text-[var(--chip-text)] border-[var(--chip-bg)] shadow-sm'
                          : 'bg-[var(--card)] text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--paper)]'
                      }`}
                      onClick={() => setSelectedUserMode('new')}
                    >
                      <span>➕</span>
                      <span className="truncate">Create on Behalf of New Customer</span>
                    </button>
                  </div>

                  {selectedUserMode === 'existing' ? (
                    <div className="space-y-1.5 relative w-full">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block">
                        Assigned Customer Account
                      </label>

                      {/* Selected Customer Active Card */}
                      {(() => {
                        const activeCust = usersList.find((u) => u.email === selectedCustomerEmail) || usersList[0];
                        return (
                          <div className="w-full">
                            <div
                              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                              className="flex items-center justify-between p-3 rounded-[7px] border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--card)] hover:border-[var(--blue)] cursor-pointer transition-all gap-2 w-full overflow-hidden"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                                  {activeCust?.name ? activeCust.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <div className="text-[13px] font-semibold text-[var(--ink)] truncate">
                                    {activeCust?.name || 'No customer selected'}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] truncate">
                                    {activeCust?.email || 'Select an account'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--blue)] uppercase tracking-wider whitespace-nowrap">
                                  {isCustomerDropdownOpen ? 'Close' : 'Change'}
                                </span>
                                <span className="text-xs text-[var(--muted)]">{isCustomerDropdownOpen ? '▲' : '▼'}</span>
                              </div>
                            </div>

                            {/* Dropdown Menu with Live Search */}
                            {isCustomerDropdownOpen && (
                              <div className="mt-2 p-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] shadow-lg space-y-2 z-30 w-full overflow-hidden">
                                <input
                                  type="text"
                                  placeholder="🔍 Search customer by name or email..."
                                  value={customerSearch}
                                  onChange={(e) => setCustomerSearch(e.target.value)}
                                  className="w-full p-2 text-[13px] bg-[var(--paper)] border border-[var(--line)] rounded-[7px] text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                                  autoFocus
                                />
                                <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                                  {usersList
                                    .filter(
                                      (u) =>
                                        u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                        u.email.toLowerCase().includes(customerSearch.toLowerCase())
                                    )
                                    .map((u) => {
                                      const isSelected = u.email === selectedCustomerEmail;
                                      return (
                                        <div
                                          key={u.email}
                                          onClick={() => {
                                            setSelectedCustomerEmail(u.email);
                                            setIsCustomerDropdownOpen(false);
                                            setCustomerSearch('');
                                          }}
                                          className={`flex items-center justify-between p-2 rounded-[7px] cursor-pointer transition-all ${
                                            isSelected
                                              ? 'bg-[var(--blue-bg)] text-[var(--blue)] font-semibold border border-[var(--blue)]'
                                              : 'hover:bg-[var(--paper)] text-[var(--ink)]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                                            <div
                                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
                                                isSelected
                                                  ? 'bg-[var(--blue)] text-white'
                                                  : 'bg-[var(--card-alt)] text-[var(--ink)] border border-[var(--line)]'
                                              }`}
                                            >
                                              {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1 overflow-hidden">
                                              <div className="text-[13px] truncate">{u.name}</div>
                                              <div className="text-[11px] opacity-75 truncate">{u.email}</div>
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <span className="text-xs font-bold text-[var(--blue)] whitespace-nowrap ml-2">✓ Selected</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="new-customer-fields space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                          <label className="form-label">Customer Full Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Vikram Sharma"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Customer Email Address</label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="vikram@company.com"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Contact Phone / Reference (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="+1 (555) 019-2834"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px' }}>
                          ⚡ System will automatically provision this customer account upon order dispatch.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="paper-card p-3.5 sm:p-5 space-y-3.5">
              <div className="studio-card-header">
                <h3 className="text-sm font-bold text-[var(--ink)] m-0">📦 2. Package Cargo &amp; Global Route</h3>
              </div>

              <div>
                <label className="form-label">Cargo Description / Item Title</label>
                <input
                  type="text"
                  className="form-input text-xs sm:text-[13px]"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. Aerospace Carbon Prototype"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Origin Location / Hub</label>
                  <input
                    type="text"
                    className="form-input text-xs sm:text-[13px]"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="City, Country"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Destination Location / Hub</label>
                  <input
                    type="text"
                    className="form-input text-xs sm:text-[13px]"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="City, Country"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Package Units Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input text-xs sm:text-[13px]"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="paper-card p-3.5 sm:p-5 space-y-3.5">
              <div className="studio-card-header">
                <h3 className="text-sm font-bold text-[var(--ink)] m-0">⚖️ 3. Volumetric Engine &amp; Carton Presets</h3>
              </div>

              <div className="preset-chips-row">
                <button
                  type="button"
                  className={`preset-chip ${presetType === 'small' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('small')}
                >
                  📦 Small Mailer (20&times;15&times;10 cm &bull; 1.5kg)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${presetType === 'standard' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('standard')}
                >
                  📦 Standard Carton (40&times;30&times;20 cm &bull; 4.5kg)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${presetType === 'heavy' ? 'active' : ''}`}
                  onClick={() => handlePresetSelect('heavy')}
                >
                  📦 Freight Pallet (80&times;60&times;50 cm &bull; 18kg)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${presetType === 'custom' ? 'active' : ''}`}
                  onClick={() => setPresetType('custom')}
                >
                  📐 Custom Sizing
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="form-label mb-0">Actual Measured Weight (kg)</label>
                  <span className="font-mono font-bold text-xs text-[var(--blue)] flex-shrink-0">{weight} kg</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="slider-range"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                  className="form-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="form-label">Dimensions (Length &times; Width &times; Height in cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-0">
                    <span className="dim-label">Length (cm)</span>
                    <input type="number" min="1" className="form-input text-xs" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 1)} required />
                  </div>
                  <div className="min-w-0">
                    <span className="dim-label">Width (cm)</span>
                    <input type="number" min="1" className="form-input text-xs" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 1)} required />
                  </div>
                  <div className="min-w-0">
                    <span className="dim-label">Height (cm)</span>
                    <input type="number" min="1" className="form-input text-xs" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 1)} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="paper-card p-3.5 sm:p-5 space-y-3.5">
              <div className="studio-card-header">
                <h3 className="text-sm font-bold text-[var(--ink)] m-0">🚚 4. Priority Add-ons &amp; Handling</h3>
              </div>

              <div className="addons-selection-grid">
                <label className={`addon-selection-card ${fragile ? 'selected' : ''}`}>
                  <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
                  <div className="min-w-0 flex-1">
                    <div className="addon-name">🛡️ Fragile Handling</div>
                    <div className="addon-desc">Air-cushioned bubble packing + safety seal</div>
                  </div>
                  <span className="addon-fee">+$15.00</span>
                </label>

                <label className={`addon-selection-card ${express ? 'selected' : ''}`}>
                  <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
                  <div className="min-w-0 flex-1">
                    <div className="addon-name">⚡ Express Priority Air</div>
                    <div className="addon-desc">Direct next-flight dispatch guaranteed</div>
                  </div>
                  <span className="addon-fee">+$35.00</span>
                </label>

                <label className={`addon-selection-card ${insured ? 'selected' : ''}`}>
                  <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
                  <div className="min-w-0 flex-1">
                    <div className="addon-name">🔒 Cargo Insurance</div>
                    <div className="addon-desc">Full 100% loss/damage reimbursement coverage</div>
                  </div>
                  <span className="addon-fee">+$20.00</span>
                </label>
              </div>
            </div>

            {/* 5. Booking Notes & Special Instructions */}
            <div className="paper-card p-3.5 sm:p-5 space-y-3">
              <h2 className="text-[14px] font-semibold text-[var(--ink)] mb-0">📝 5. Booking Notes &amp; Special Instructions</h2>
              <div className="notes-field" style={{ borderTop: 'none', paddingTop: 0 }}>
                <span className="label">Add a note</span>
                <textarea
                  placeholder="e.g. Call recipient before delivery, leave with reception, handle upright only…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="studio-submit-row">
              <button type="submit" className="btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Booking & Dispatching Shipment...' : '🚀 Confirm & Dispatch Shipment Order'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-[85px] self-start w-full min-w-0 max-w-full">
          <div className="sticky-waybill-card w-full">
            <div className="waybill-top-badge">
              <span>LIVE VOLUMETRIC PRICE ENGINE</span>
              <span className="currency-badge">USD</span>
            </div>

            <div className="waybill-price-display">
              <div className="price-amount">${pricing.totalPrice.toFixed(2)}</div>
              <div className="price-subtext">Estimated Total Freight Charge</div>
            </div>

            <div className="gauge-card">
              <div className="gauge-row">
                <span>Actual Measured Weight:</span>
                <strong>{weight} kg</strong>
              </div>
              <div className="gauge-row">
                <span>Volumetric Weight:</span>
                <strong>{volumetricWeight} kg</strong>
              </div>
              <div className="gauge-divider"></div>
              <div className="gauge-row chargeable">
                <span>⚡ Chargeable Billed Weight:</span>
                <strong style={{ color: '#4F46E5', fontSize: '1.05rem' }}>{chargeableWeight} kg</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Formula: (Length &times; Width &times; Height) / 5000 = {volumetricWeight} kg
              </div>
            </div>

            <div className="breakdown-list">
              <div className="breakdown-item">
                <span>Base Booking Fee</span>
                <span>${pricing.basePrice.toFixed(2)}</span>
              </div>
              <div className="breakdown-item">
                <span>Weight Surcharge ({chargeableWeight} kg &times; $12.50)</span>
                <span>${pricing.weightFee.toFixed(2)}</span>
              </div>
              {fragile && (
                <div className="breakdown-item addon">
                  <span>🛡️ Fragile Handling Surcharge</span>
                  <span>+$15.00</span>
                </div>
              )}
              {express && (
                <div className="breakdown-item addon">
                  <span>⚡ Express Air Surcharge</span>
                  <span>+$35.00</span>
                </div>
              )}
              {insured && (
                <div className="breakdown-item addon">
                  <span>🔒 Cargo Insurance</span>
                  <span>+$20.00</span>
                </div>
              )}
            </div>

            <div className="live-customer-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                Assigned Booking Recipient
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '2px' }}>{targetName}</div>
              <div style={{ fontSize: '0.85rem', color: '#4F46E5' }}>{targetEmail || 'No recipient set'}</div>
            </div>

            <div className="waybill-barcode-box">
              <div className="barcode-font">FP-TRACK-WAYBILL-2026-AIR</div>
              <div className="barcode-caption">AUTOMATED PROXY DISPATCH WAYBILL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isAdminOrManager) {
    return <SidebarLayout user={user}>{formBody}</SidebarLayout>;
  }

  return <div className="w-full min-w-0 bg-[var(--paper)] overflow-x-hidden">{formBody}</div>;
}
