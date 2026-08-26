'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';

export default function DriversPage() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/' });
  const [drivers, setDrivers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: 'Delivery Van',
    status: 'Active',
  });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      fetchDrivers();
    }
  }, [user, statusFilter]);

  const fetchDrivers = async () => {
    setFetching(true);
    try {
      const url = statusFilter === 'All' ? '/api/drivers' : `/api/drivers?status=${statusFilter}`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      vehicleNumber: '',
      vehicleType: 'Delivery Van',
      status: 'Active',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      vehicleNumber: driver.vehicleNumber || '',
      vehicleType: driver.vehicleType || 'Delivery Van',
      status: driver.status || 'Active',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setModalLoading(true);

    try {
      const url = editingDriver ? `/api/drivers/${editingDriver._id}` : '/api/drivers';
      const method = editingDriver ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setFeedbackMsg(data.message || 'Driver saved successfully!');
        setTimeout(() => setFeedbackMsg(''), 4000);
        fetchDrivers();
      } else {
        setErrorMsg(data.message || 'Failed to save driver.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving driver.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDriver = async (driver) => {
    if (!confirm(`Are you sure you want to remove Driver ${driver.name}?`)) return;
    try {
      const res = await fetch(`/api/drivers/${driver._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg(`Driver ${driver.name} removed.`);
        setTimeout(() => setFeedbackMsg(''), 3000);
        fetchDrivers();
      } else {
        alert(data.message || 'Failed to delete driver.');
      }
    } catch (err) {
      alert('Error deleting driver.');
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#8C96A6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚚</div>
          <p style={{ fontWeight: 700 }}>Loading Fleet Directory…</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return (
      <div className="p-8 text-center text-slate-600 font-medium">
        <h2>Access Restricted</h2>
        <p className="text-sm mt-1">Fleet &amp; Driver management is reserved for Admin and Operations Managers.</p>
      </div>
    );
  }

  // Filtered search list
  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const totalDrivers = drivers.length;
  const activeCount = drivers.filter((d) => d.status === 'Active').length;
  const onRouteCount = drivers.filter((d) => d.status === 'On Route').length;
  const offDutyCount = drivers.filter((d) => d.status === 'Off Duty').length;

  const content = (
    <div className="w-full max-w-[1240px] mx-auto p-[28px] font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)] m-0 flex items-center gap-2">
            <span>🚚 Fleet &amp; Driver Operations</span>
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Active carrier fleet &middot; Driver directory &middot; Vehicle allocations
          </p>
        </div>

        <button
          type="button"
          className="btn-paper btn-paper-primary"
          onClick={handleOpenAddModal}
        >
          <span>➕ Add Fleet Driver</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]">
          <span>✓ {feedbackMsg}</span>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="paper-card p-3.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">Total Drivers</div>
          <div className="text-[20px] font-bold text-[var(--ink)] mt-0.5 font-mono">{totalDrivers}</div>
        </div>
        <div className="paper-card p-3.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">Active &amp; Available</div>
          <div className="text-[20px] font-bold text-[var(--green)] mt-0.5 font-mono">{activeCount}</div>
        </div>
        <div className="paper-card p-3.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">Currently On Route</div>
          <div className="text-[20px] font-bold text-[var(--blue)] mt-0.5 font-mono">{onRouteCount}</div>
        </div>
        <div className="paper-card p-3.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">Off Duty / Inactive</div>
          <div className="text-[20px] font-bold text-[var(--amber)] mt-0.5 font-mono">{offDutyCount}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['All', 'Active', 'On Route', 'Off Duty'].map((st) => (
            <button
              key={st}
              type="button"
              className={`status-tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            className="search-input text-xs"
            placeholder="Search driver, phone, truck #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Drivers Data Table */}
      <div className="paper-card p-0 overflow-hidden">
        {fetching ? (
          <div className="p-8 text-center text-xs text-[var(--muted)]">Loading drivers…</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-10 text-center text-[var(--muted)]">
            <div className="text-2xl mb-1">🚚</div>
            <div className="text-xs font-semibold">No fleet drivers found matching criteria.</div>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="specs-paper">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Contact Info</th>
                  <th>License Number</th>
                  <th>Assigned Vehicle</th>
                  <th>Status</th>
                  <th>Deliveries</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  let statusClass = 'pill-amber';
                  if (driver.status === 'Active') statusClass = 'pill-green';
                  else if (driver.status === 'On Route') statusClass = 'pill-blue';
                  else if (driver.status === 'Inactive') statusClass = 'pill-rust';

                  return (
                    <tr key={driver._id} className="border-b border-[var(--line)] hover:bg-[var(--card-alt)] transition-colors">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--chip-bg)] text-[var(--chip-text)] flex items-center justify-center font-bold text-xs">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--ink)]">{driver.name}</div>
                            <div className="text-[10.5px] text-[var(--muted)]">ID: {driver._id.slice(-6).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-[var(--ink)] font-medium">{driver.phone}</div>
                        <div className="text-[11px] text-[var(--muted)]">{driver.email}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-[var(--ink)]">{driver.licenseNumber || '—'}</span>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-[var(--ink)]">{driver.vehicleNumber || 'Unassigned'}</div>
                        <div className="text-[10.5px] text-[var(--muted)]">{driver.vehicleType}</div>
                      </td>
                      <td>
                        <span className={`pill ${statusClass}`} style={{ fontSize: '10px' }}>
                          {driver.status}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono text-xs font-bold text-[var(--ink)]">
                          {driver.totalDeliveries || 0} <span className="text-[10px] text-[var(--muted)] font-normal">orders</span>
                        </div>
                        <div className="text-[10.5px] text-[#B4720C]">★ {driver.rating || 4.9}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn-paper text-[11px] py-1 px-2"
                            onClick={() => handleOpenEditModal(driver)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-paper btn-paper-rust text-[11px] py-1 px-2"
                            onClick={() => handleDeleteDriver(driver)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#16233F]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                <span>🚚</span>
                <span>{editingDriver ? 'Edit Fleet Driver' : 'Register New Fleet Driver'}</span>
              </h3>
              <button
                type="button"
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-bold"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg text-xs font-semibold bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1]">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDriver} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs"
                    placeholder="driver@freightproxy.io"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">License Number</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs font-mono"
                    placeholder="DL-04202100892"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Vehicle Plate #</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs font-mono"
                    placeholder="DL-01-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Vehicle Type</label>
                  <select
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  >
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Light Truck">Light Truck</option>
                    <option value="Heavy Freight">Heavy Freight</option>
                    <option value="Air Cargo Shuttle">Air Cargo Shuttle</option>
                    <option value="Bike Courier">Bike Courier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] uppercase mb-1">Status</label>
                  <select
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active (Available)</option>
                    <option value="On Route">On Route</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  className="btn-paper"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-paper btn-paper-primary"
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Saving…' : editingDriver ? 'Update Driver' : 'Register Driver ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return <SidebarLayout user={user}>{content}</SidebarLayout>;
}
