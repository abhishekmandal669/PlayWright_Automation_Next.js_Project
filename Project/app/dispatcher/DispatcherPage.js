'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';
import DispatcherMap from '../../components/DispatcherMap';
import OrderViewDrawer from '../../components/OrderViewDrawer';

export default function DispatcherPage() {
  const { user, loading: authLoading } = useAuth({ redirectTo: '/' });
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Initialize today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'tomorrow', 'all', or 'YYYY-MM-DD'
  const [customDate, setCustomDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('All');

  // Location Accordion & Selection State
  const [expandedLocations, setExpandedLocations] = useState({}); // { [location]: boolean }
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [selectedOrderIdsByLocation, setSelectedOrderIdsByLocation] = useState({}); // { [location]: [orderMongoId1, orderMongoId2] }
  const [selectedDriverByLocation, setSelectedDriverByLocation] = useState({}); // { [location]: driverId }
  const [assigningLocation, setAssigningLocation] = useState(null);
  const [unassigningOrderId, setUnassigningOrderId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);

  const toggleLocationExpand = (locationName) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [locationName]: !prev[locationName],
    }));
  };

  const handleToggleAllAccordions = (shouldExpand) => {
    const nextState = {};
    locationGroups.forEach((g) => {
      nextState[g.locationName] = shouldExpand;
    });
    setExpandedLocations(nextState);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchDrivers();
    }
  }, [user, dateFilter, statusFilter]);

  const fetchOrders = async () => {
    setFetching(true);
    try {
      const activeDate = dateFilter === 'custom' ? customDate : dateFilter;
      const url = `/api/dispatcher/orders?date=${encodeURIComponent(activeDate || 'today')}&status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders for dispatcher:', err);
    } finally {
      setFetching(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  };

  // Group unassigned / pending staging orders by origin location
  const { locationGroups, dispatchedOrders } = useMemo(() => {
    const groups = {};
    const dispatched = [];

    orders.forEach((order) => {
      const isDispatched =
        order.status === 'DRIVER_ASSIGNED' ||
        order.status === 'PICKED_UP' ||
        order.status === 'RECEIVED_AT_WAREHOUSE' ||
        order.status === 'OUT_FOR_DELIVERY' ||
        (order.assignedDriver && order.assignedDriver.driverName);

      if (isDispatched) {
        dispatched.push(order);
      } else {
        const origin = order.origin || 'Regional Gateway Hub';
        if (!groups[origin]) {
          groups[origin] = {
            locationName: origin,
            orders: [],
            totalWeight: 0,
          };
        }
        groups[origin].orders.push(order);
        groups[origin].totalWeight += parseFloat(order.weight || 1);
      }
    });

    return {
      locationGroups: Object.values(groups),
      dispatchedOrders: dispatched,
    };
  }, [orders]);

  // Group dispatched orders by assigned Truck / Vehicle & Driver
  const dispatchedTruckGroups = useMemo(() => {
    const truckMap = {};

    dispatchedOrders.forEach((order) => {
      const driver = order.assignedDriver;
      const truckKey = driver?.vehicleNumber
        ? `${driver.vehicleNumber}_${driver.driverName || 'Driver'}`
        : `Van-01_Carrier`;

      if (!truckMap[truckKey]) {
        truckMap[truckKey] = {
          key: truckKey,
          vehicleNumber: driver?.vehicleNumber || 'Van-01',
          vehicleType: driver?.vehicleType || 'Delivery Van',
          driverName: driver?.driverName || 'Carrier Driver',
          driverPhone: driver?.driverPhone || 'N/A',
          driverId: driver?.driverId,
          assignedAt: driver?.assignedAt,
          orders: [],
          totalWeight: 0,
        };
      }

      truckMap[truckKey].orders.push(order);
      truckMap[truckKey].totalWeight += parseFloat(order.weight || 1);
    });

    return Object.values(truckMap);
  }, [dispatchedOrders]);

  // Total selected orders across all hubs
  const totalSelectedOrdersCount = useMemo(() => {
    return Object.values(selectedOrderIdsByLocation).reduce((sum, list) => sum + (list ? list.length : 0), 0);
  }, [selectedOrderIdsByLocation]);

  // Handle single order checkbox toggle using UNIQUE _id
  const handleToggleOrderSelection = (location, mongoId) => {
    setSelectedOrderIdsByLocation((prev) => {
      const current = prev[location] || [];
      const isSelected = current.includes(mongoId);
      const updated = isSelected ? current.filter((id) => id !== mongoId) : [...current, mongoId];
      return { ...prev, [location]: updated };
    });
  };

  // Handle Select All orders in a location
  const handleSelectAllInLocation = (location, locationOrders) => {
    setSelectedOrderIdsByLocation((prev) => {
      const current = prev[location] || [];
      const allSelected = current.length === locationOrders.length;
      return {
        ...prev,
        [location]: allSelected ? [] : locationOrders.map((o) => o._id),
      };
    });
  };

  // Driver selection change for a location
  const handleDriverChange = (location, driverId) => {
    setSelectedDriverByLocation((prev) => ({
      ...prev,
      [location]: driverId,
    }));
  };

  // Batch Assign Driver & Truck to Selected Orders in Location
  const handleBatchAssign = async (location) => {
    const selectedIds = selectedOrderIdsByLocation[location] || [];
    const driverId = selectedDriverByLocation[location];

    if (selectedIds.length === 0) {
      setErrorMsg(`Please select at least 1 order at ${location} to assign.`);
      return;
    }

    if (!driverId) {
      setErrorMsg(`Please select a fleet driver & truck for ${location}.`);
      return;
    }

    const chosenDriver = drivers.find((d) => d._id === driverId);
    setAssigningLocation(location);
    setErrorMsg('');

    try {
      const res = await fetch('/api/dispatcher/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderIds: selectedIds,
          driverId,
          vehicleNumber: chosenDriver?.vehicleNumber || 'Van-01',
          vehicleType: chosenDriver?.vehicleType || 'Delivery Van',
          dispatchNotes: `Batch staged at ${location}`,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedbackMsg(data.message || 'Truck & Driver successfully allocated!');
        setTimeout(() => setFeedbackMsg(''), 5000);
        // Clear selection for this location
        setSelectedOrderIdsByLocation((prev) => ({ ...prev, [location]: [] }));
        await fetchOrders();
        await fetchDrivers();
      } else {
        setErrorMsg(data.message || 'Failed to assign batch.');
      }
    } catch (err) {
      setErrorMsg('Network error while assigning fleet batch.');
    } finally {
      setAssigningLocation(null);
    }
  };

  // Global Save & Dispatch action across all locations
  const handleGlobalSaveAssignments = async () => {
    const locationsWithOrders = Object.entries(selectedOrderIdsByLocation).filter(
      ([loc, ids]) => Array.isArray(ids) && ids.length > 0
    );

    if (locationsWithOrders.length === 0) {
      setErrorMsg('Please select at least one order and driver before saving.');
      return;
    }

    // Check if all locations with selected orders have a driver chosen
    for (const [loc] of locationsWithOrders) {
      if (!selectedDriverByLocation[loc]) {
        setErrorMsg(`Please select a driver & truck for "${loc}" before saving.`);
        return;
      }
    }

    setIsGlobalSaving(true);
    setErrorMsg('');
    let successCount = 0;

    try {
      for (const [loc, selectedIds] of locationsWithOrders) {
        const driverId = selectedDriverByLocation[loc];
        const chosenDriver = drivers.find((d) => d._id === driverId);

        const res = await fetch('/api/dispatcher/batch-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            orderIds: selectedIds,
            driverId,
            vehicleNumber: chosenDriver?.vehicleNumber || 'Van-01',
            vehicleType: chosenDriver?.vehicleType || 'Delivery Van',
            dispatchNotes: `Global batch dispatch staged at ${loc}`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successCount += selectedIds.length;
        }
      }

      setFeedbackMsg(`✓ Successfully saved and dispatched ${successCount} order(s) to assigned carrier trucks!`);
      setTimeout(() => setFeedbackMsg(''), 5000);
      setSelectedOrderIdsByLocation({});
      await fetchOrders();
      await fetchDrivers();
    } catch (err) {
      setErrorMsg('Network error while saving assignments.');
    } finally {
      setIsGlobalSaving(false);
    }
  };

  // Unassign single order from a truck and return it to its location queue
  const handleUnassignOrder = async (orderId) => {
    setUnassigningOrderId(orderId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/dispatcher/unassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg(data.message || 'Order unassigned and returned to location queue!');
        setTimeout(() => setFeedbackMsg(''), 4000);
        await fetchOrders();
        await fetchDrivers();
      } else {
        setErrorMsg(data.message || 'Failed to unassign order.');
      }
    } catch (err) {
      setErrorMsg('Network error unassigning order.');
    } finally {
      setUnassigningOrderId(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#8C96A6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📡</div>
          <p style={{ fontWeight: 700 }}>Connecting to Dispatch Control…</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
    return (
      <div className="p-8 text-center text-slate-600 font-medium">
        <h2>Access Restricted</h2>
        <p className="text-sm mt-1">Dispatcher Hub is reserved for Dispatchers, Admins, and Operations Managers.</p>
      </div>
    );
  }

  const unassignedCount = orders.filter((o) => !o.assignedDriver || !o.assignedDriver.driverName).length;
  const activeDriversCount = drivers.filter((d) => d.status === 'Active').length;

  const content = (
    <div className="w-full max-w-[1360px] mx-auto p-[24px] font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--ink)] m-0 flex items-center gap-2">
            <span>📡 Dispatcher Staging Hub &amp; Multi-Truck Allocator</span>
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
            Date Staging &middot; Location Hub Bundling &middot; Multi-Order Fleet Allocation &middot; Live Real Leaflet Map
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/drivers" className="btn-paper">
            <span>👥 Fleet Drivers ({drivers.length})</span>
          </Link>
          <button
            type="button"
            onClick={handleGlobalSaveAssignments}
            disabled={totalSelectedOrdersCount === 0 || isGlobalSaving}
            className={`btn-paper ${totalSelectedOrdersCount > 0 ? 'btn-paper-primary' : ''} flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all`}
            title="Save and dispatch all selected truck assignments"
          >
            <span>{isGlobalSaving ? 'Saving…' : `💾 Save & Dispatch (${totalSelectedOrdersCount})`}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8] flex items-center justify-between">
          <span>✓ {feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-xs font-bold">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-[#F7EAE2] text-[#A8471F] border border-[#ECCDC1] flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs font-bold">✕</button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="paper-card p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Consignments in Queue</div>
          <div className="text-[20px] font-bold text-[var(--ink)] mt-0.5 font-mono">{orders.length}</div>
        </div>
        <div className="paper-card p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--rust)]">Awaiting Fleet Assignment</div>
          <div className="text-[20px] font-bold text-[var(--rust)] mt-0.5 font-mono">{unassignedCount}</div>
        </div>
        <div className="paper-card p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--blue)]">Dispatched Trucks</div>
          <div className="text-[20px] font-bold text-[var(--blue)] mt-0.5 font-mono">{dispatchedTruckGroups.length}</div>
        </div>
        <div className="paper-card p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--green)]">Ready Carrier Drivers</div>
          <div className="text-[20px] font-bold text-[var(--green)] mt-0.5 font-mono">{activeDriversCount}</div>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--line)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mr-1">📅 Staging Date:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'all', label: 'All Dates' },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              className={`status-tab-btn ${dateFilter === d.id ? 'active' : ''}`}
              onClick={() => {
                setDateFilter(d.id);
                if (d.id === 'today') setCustomDate(todayStr);
                else if (d.id === 'tomorrow') {
                  const tom = new Date();
                  tom.setDate(tom.getDate() + 1);
                  setCustomDate(tom.toISOString().split('T')[0]);
                }
              }}
            >
              {d.label}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="date"
              className="sort-select text-xs font-mono"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Status:</span>
          <select
            className="sort-select text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Active Statuses</option>
            <option value="PICKUP_SCHEDULED">Pickup Scheduled (Ready to Dispatch)</option>
            <option value="PICKUP_PENDING">Pickup Pending</option>
            <option value="DRIVER_ASSIGNED">Driver Assigned (On Route)</option>
            <option value="PICKED_UP">Picked Up</option>
          </select>
        </div>
      </div>

      {/* MAIN 60/40 SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT SECTION (60% / 7 Cols): LOCATION HUBS & BATCH ALLOCATION */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2 m-0">
              <span>📍 Pickup Locations &amp; Staging Consignments</span>
              <span className="pill-blue" style={{ fontSize: '10px' }}>
                {locationGroups.length} Location Hub{locationGroups.length > 1 ? 's' : ''}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                className="font-semibold text-[var(--blue)] hover:underline"
                onClick={() => handleToggleAllAccordions(true)}
              >
                📂 Expand All
              </button>
              <span className="text-[var(--muted)]">&middot;</span>
              <button
                type="button"
                className="font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                onClick={() => handleToggleAllAccordions(false)}
              >
                📁 Collapse All
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="paper-card p-8 text-center text-xs text-[var(--muted)]">
              Loading date staging and location hubs…
            </div>
          ) : locationGroups.length === 0 ? (
            <div className="paper-card p-10 text-center text-[var(--muted)]">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs font-semibold">No pending orders waiting in location queues.</div>
              <p className="text-[11px] mt-1 text-[var(--muted)]">
                All scheduled consignments have been dispatched to fleet trucks below!
              </p>
            </div>
          ) : (
            locationGroups.map((group, gIdx) => {
              const locSelectedIds = selectedOrderIdsByLocation[group.locationName] || [];
              const chosenDriverId = selectedDriverByLocation[group.locationName] || '';
              const chosenDriver = drivers.find((d) => d._id === chosenDriverId);
              const isAllSelected = locSelectedIds.length === group.orders.length && group.orders.length > 0;
              const isAssigning = assigningLocation === group.locationName;
              const isExpanded = expandedLocations[group.locationName] !== undefined
                ? expandedLocations[group.locationName]
                : gIdx === 0;

              return (
                <div
                  key={group.locationName}
                  onMouseEnter={() => setHoveredLocation(group.locationName)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className={`paper-card p-0 overflow-hidden transition-all duration-200 border-2 ${
                    hoveredLocation === group.locationName
                      ? 'border-[var(--blue)] shadow-md bg-[var(--card)]'
                      : 'border-[var(--line)] bg-[var(--card)]'
                  }`}
                >
                  {/* Location Accordion Clickable Header Strip */}
                  <div
                    onClick={() => toggleLocationExpand(group.locationName)}
                    className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-[var(--card-alt)] hover:bg-[var(--card)] cursor-pointer select-none transition-colors border-b border-[var(--line)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📍</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-[var(--ink)] m-0">{group.locationName}</h3>
                          <span className="pill pill-amber" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                            {group.orders.length} order{group.orders.length > 1 ? 's' : ''} staging
                          </span>
                          {locSelectedIds.length > 0 && (
                            <span className="pill pill-blue" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                              ✓ {locSelectedIds.length} Selected
                            </span>
                          )}
                        </div>
                        <span className="text-[10.5px] text-[var(--muted)]">
                          Total cargo weight: <strong>{group.totalWeight.toFixed(1)} kg</strong> &middot; Click to {isExpanded ? 'collapse' : 'open batch allocator'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-[var(--blue)] font-bold">
                        {isExpanded ? '▲ Close' : '▼ Assign Truck'}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Accordion Body */}
                  {isExpanded && (
                    <div className="p-4 space-y-3.5 bg-[var(--card)]">
                      {/* Step 1: Select Carrier Truck & Driver */}
                      <div className="bg-[var(--paper)] p-3 rounded-lg border border-[var(--line)] space-y-2">
                        <div className="text-[11px] font-bold text-[var(--ink)] uppercase flex items-center justify-between">
                          <span>1. Choose Fleet Carrier &amp; Truck:</span>
                          {chosenDriver && (
                            <span className="text-[10.5px] text-[var(--green)] font-semibold">
                              ✓ Assigned Plate: {chosenDriver.vehicleNumber || 'Van-01'} ({chosenDriver.vehicleType})
                            </span>
                          )}
                        </div>

                        <select
                          className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-xs"
                          value={chosenDriverId}
                          onChange={(e) => handleDriverChange(group.locationName, e.target.value)}
                        >
                          <option value="">-- Select Active Carrier Driver &amp; Truck --</option>
                          {drivers.map((drv) => (
                            <option key={drv._id} value={drv._id}>
                              {drv.name} ({drv.status}) - Truck: {drv.vehicleNumber || 'Van-01'} [{drv.vehicleType}] - Tel: {drv.phone}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Step 2: Orders Checkbox List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[var(--muted)] uppercase">
                            2. Select Consignments to Load into this Truck:
                          </span>
                          <button
                            type="button"
                            className="font-bold text-[var(--blue)] hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInLocation(group.locationName, group.orders);
                            }}
                          >
                            {isAllSelected ? '✕ Deselect All' : '✓ Select All in Location'}
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {group.orders.map((o) => {
                            const isChecked = locSelectedIds.includes(o._id);
                            const numDisplay = o.orderNumber || (o.orderId ? o.orderId.replace(/\D/g, '') : '1001');

                            return (
                              <div
                                key={o._id}
                                onClick={() => handleToggleOrderSelection(group.locationName, o._id)}
                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-[var(--blue-bg)] border-[var(--blue)]'
                                    : 'bg-[var(--paper)] border-[var(--line)] hover:bg-[var(--card-alt)]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}} // Handled by parent container click
                                    className="cursor-pointer accent-[var(--blue)] w-4 h-4"
                                  />
                                  <div>
                                    <div className="font-mono font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
                                      <span>ORD-{numDisplay}</span>
                                      <span className="font-sans font-normal text-[var(--muted)]">&rarr; {o.destination}</span>
                                    </div>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      {o.packageName} &middot; <strong>{o.weight || 1} kg</strong> &middot; Client: {o.userName || o.userEmail}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedViewOrder(o);
                                    }}
                                    className="text-[10px] text-[var(--blue)] hover:underline font-mono"
                                    title="Quick view order specifications"
                                  >
                                    👁️ View
                                  </button>
                                  <span className="pill pill-amber" style={{ fontSize: '9.5px' }}>
                                    {o.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Batch Action Button */}
                      <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                        <div className="text-xs">
                          {locSelectedIds.length > 0 ? (
                            <span className="font-bold text-[var(--blue)]">
                              {locSelectedIds.length} order{locSelectedIds.length > 1 ? 's' : ''} ready to bundle
                            </span>
                          ) : (
                            <span className="text-[var(--muted)]">No orders checked yet</span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={locSelectedIds.length === 0 || !chosenDriverId || isAssigning}
                          onClick={() => handleBatchAssign(group.locationName)}
                          className={`btn-paper ${
                            locSelectedIds.length > 0 && chosenDriverId ? 'btn-paper-primary' : ''
                          } text-xs py-2 px-4 flex items-center gap-2`}
                        >
                          {isAssigning
                            ? 'Assigning Fleet…'
                            : `🚀 Assign & Dispatch ${locSelectedIds.length} Order${locSelectedIds.length > 1 ? 's' : ''} ➔`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT SECTION (40% / 5 Cols): REAL LEAFLET ROUTING MAP & STAGING STATS */}
        <div className="lg:col-span-5 space-y-4 sticky top-[80px] self-start">
          {/* Real Leaflet Map */}
          <DispatcherMap
            orders={orders}
            highlightedLocation={hoveredLocation}
            onSelectLocation={(loc) => setHoveredLocation(loc)}
          />

          {/* Staging Summary Card */}
          <div className="paper-card p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--line)] pb-1.5 m-0 flex items-center justify-between">
              <span>📊 Dispatch Operations Summary</span>
              <span className="text-[10px] text-[var(--green)]">READY</span>
            </h3>

            <div className="space-y-1.5 text-xs text-[var(--ink-soft)]">
              <div className="flex justify-between">
                <span>Active Consignment Volume:</span>
                <strong className="font-mono text-[var(--ink)]">
                  {orders.reduce((acc, o) => acc + (parseFloat(o.weight) || 1), 0).toFixed(1)} kg
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Location Hubs Staging:</span>
                <strong className="font-mono text-[var(--ink)]">{locationGroups.length} Hubs</strong>
              </div>
              <div className="flex justify-between">
                <span>Dispatched Carrier Trucks:</span>
                <strong className="font-mono text-[var(--blue)]">{dispatchedTruckGroups.length} Trucks ({dispatchedOrders.length} Orders)</strong>
              </div>
              <div className="flex justify-between">
                <span>Available Carrier Drivers:</span>
                <strong className="font-mono text-[var(--green)]">{activeDriversCount} Ready</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TRUCK-GROUPED DISPATCHED FLEET CARDS */}
      <div className="paper-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2 m-0">
            <span>🚛 Dispatched Carrier Fleets &amp; Attached Consignments</span>
            <span className="pill-green" style={{ fontSize: '10px' }}>
              {dispatchedTruckGroups.length} Truck{dispatchedTruckGroups.length > 1 ? 's' : ''} Active &middot; {dispatchedOrders.length} Waybills
            </span>
          </h2>
          <span className="text-[11px] text-[var(--muted)]">Click order to view &middot; Click Unassign to return to location queue</span>
        </div>

        {dispatchedTruckGroups.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--muted)]">
            No carrier trucks dispatched yet for this date. Select truck and check orders above to dispatch!
          </div>
        ) : (
          <div className="space-y-3.5">
            {dispatchedTruckGroups.map((truck) => (
              <div
                key={truck.key}
                className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] space-y-3 shadow-sm hover:border-[var(--blue)] transition-all"
              >
                {/* Truck Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚚</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[var(--ink)]">
                          {truck.vehicleNumber}
                        </span>
                        <span className="pill pill-blue font-mono" style={{ fontSize: '10px' }}>
                          {truck.vehicleType}
                        </span>
                        <span className="pill-green font-mono" style={{ fontSize: '10px' }}>
                          ● ON ROUTE
                        </span>
                      </div>
                      <div className="text-xs text-[var(--ink-soft)] mt-0.5 flex items-center gap-2">
                        <span>👤 Driver: <strong>{truck.driverName}</strong></span>
                        <span>&middot;</span>
                        <span>📞 Tel: <strong>{truck.driverPhone}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-[var(--ink)]">
                      {truck.orders.length} Consignment{truck.orders.length > 1 ? 's' : ''} Bundled
                    </div>
                    <div className="text-[10.5px] text-[var(--muted)]">
                      Total Weight: <strong className="font-mono text-[var(--ink)]">{truck.totalWeight.toFixed(1)} kg</strong>
                    </div>
                  </div>
                </div>

                {/* Attached Orders Grid */}
                <div className="space-y-1.5">
                  <div className="text-[10.5px] font-bold text-[var(--muted)] uppercase">
                    Attached Waybill Consignments:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {truck.orders.map((o) => {
                      const numDisplay = o.orderNumber || (o.orderId ? o.orderId.replace(/\D/g, '') : '1001');
                      const isUnassigning = unassigningOrderId === o._id || unassigningOrderId === numDisplay;

                      return (
                        <div
                          key={o._id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--line)] bg-[var(--card)] hover:shadow-sm transition-all"
                        >
                          <div
                            onClick={() => setSelectedViewOrder(o)}
                            className="cursor-pointer group flex-1 pr-2"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[var(--blue)] group-hover:underline">
                                ORD-{numDisplay}
                              </span>
                              <span className="text-[10px] text-[var(--muted)]">&rarr; {o.destination}</span>
                            </div>
                            <div className="text-[11px] text-[var(--ink)] font-medium truncate max-w-[200px]">
                              {o.packageName}
                            </div>
                            <div className="text-[10px] text-[var(--muted)]">
                              Origin: <strong>{o.origin}</strong> &middot; {o.weight || 1} kg
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedViewOrder(o)}
                              className="btn-paper text-[10px] py-0.5 px-1.5"
                              title="Click to view full order overview"
                            >
                              👁️ View
                            </button>
                            <button
                              type="button"
                              disabled={isUnassigning}
                              onClick={() => handleUnassignOrder(o._id)}
                              className="text-[10.5px] font-bold text-[var(--rust)] hover:bg-[var(--rust-bg)] px-2 py-1 rounded border border-transparent hover:border-[var(--rust)] transition-all"
                              title="Unassign this order and return it to its location queue"
                            >
                              {isUnassigning ? '…' : '✕ Unassign'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDER VIEW DRAWER (OVERVIEW MODAL) */}
      <OrderViewDrawer
        order={selectedViewOrder}
        isOpen={!!selectedViewOrder}
        onClose={() => setSelectedViewOrder(null)}
        userRole={user.role}
      />
    </div>
  );

  return <SidebarLayout user={user}>{content}</SidebarLayout>;
}
