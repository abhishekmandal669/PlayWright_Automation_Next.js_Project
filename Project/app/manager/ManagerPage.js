'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import SidebarLayout from '../../components/SidebarLayout';
import OrderFilterToolbar from '../../components/OrderFilterToolbar';
import OrderViewDrawer from '../../components/OrderViewDrawer';
import OrderEditModal from '../../components/OrderEditModal';
import Pagination from '../../components/Pagination';

export default function ManagerPage() {
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination States
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // Drawer / Modals State
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  // Pipeline Form States
  const [statusVal, setStatusVal] = useState('PICKUP_SCHEDULED');
  const [pickupSchedVal, setPickupSchedVal] = useState('2026-08-19 10:00');
  const [pickedUpVal, setPickedUpVal] = useState('2026-08-19 11:30');
  const [warehouseVal, setWarehouseVal] = useState('2026-08-19 15:45');
  const [dispatchSchedVal, setDispatchSchedVal] = useState('2026-08-20 09:00');
  const [msg, setMsg] = useState('');

  // Real session guard — Admin or Manager only
  const { user, loading } = useAuth({ requiredRole: ['Admin', 'Manager'], redirectTo: '/' });

  useEffect(() => {
    if (user) {
      fetchOrdersData();
      fetchUsersData();
    }
  }, [user]);

  const fetchOrdersData = async () => {
    try {
      const res = await fetch('/api/orders?role=Manager');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to load manager orders:', e);
    }
  };

  const fetchUsersData = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (e) {
      console.error('Failed to load roster:', e);
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
          (o.userEmail && o.userEmail.toLowerCase().includes(term)) ||
          (o.userName && o.userName.toLowerCase().includes(term))
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

  // Paginated Orders & Users
  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return usersList.slice(start, start + userPageSize);
  }, [usersList, userPage, userPageSize]);

  const handleOpenPipelineModal = (order) => {
    setSelectedOrder(order);
    setStatusVal(order.status || 'PICKUP_SCHEDULED');
    setPickupSchedVal(order.pipeline?.pickupScheduledDate || order.pickupScheduledDate || 'Pending');
    setPickedUpVal(order.pipeline?.pickedUpDate || order.pickedUpDate || 'Pending');
    setWarehouseVal(order.pipeline?.warehouseArrivalDate || order.warehouseArrivalDate || 'Pending');
    setDispatchSchedVal(order.pipeline?.dispatchScheduledDate || order.dispatchScheduledDate || 'Pending');
    setShowPipelineModal(true);
  };

  const handleSavePipeline = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePipeline',
          orderId: selectedOrder.trackingId || selectedOrder.id,
          updatePayload: {
            status: statusVal,
            pickupScheduledDate: pickupSchedVal,
            pickedUpDate: pickedUpVal,
            warehouseArrivalDate: warehouseVal,
            dispatchScheduledDate: dispatchSchedVal,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Pipeline status updated!');
        fetchOrdersData();
        setTimeout(() => {
          setShowPipelineModal(false);
          setMsg('');
        }, 800);
      }
    } catch (e) {
      setMsg('Update failed.');
    }
  };

  if (!user) return null;

  return (
    <SidebarLayout user={user}>
      <div className="w-full max-w-[1240px] mx-auto p-3.5 sm:p-7 font-['IBM_Plex_Sans'] text-[var(--ink)] space-y-4 overflow-x-hidden" id="manager-root">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--line)]">
          <div>
            <h1 className="text-base sm:text-[18px] font-semibold text-[var(--ink)] m-0">🚚 Manager Operations</h1>
            <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] mt-0.5">
              Advance 7-stage freight pipeline &middot; Inspect customer shipments &middot; Manage specs
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/create-order" className="btn-paper btn-paper-primary text-xs py-1.5 px-3" style={{ textDecoration: 'none' }}>
              ➕ Create Order
            </Link>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="paper-card p-4 sm:p-5">
            <div className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Active Freight Orders</div>
            <div className="text-[24px] sm:text-[28px] font-semibold font-mono text-[var(--ink)] mt-1.5">{orders.length} <span className="text-xs sm:text-sm font-normal text-[var(--muted)]">Shipments</span></div>
          </div>
          <div className="paper-card p-4 sm:p-5">
            <div className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">En-Route Pipelines</div>
            <div className="text-[24px] sm:text-[28px] font-semibold font-mono text-[var(--blue)] mt-1.5">
              {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} <span className="text-xs sm:text-sm font-normal text-[var(--muted)]">Active</span>
            </div>
          </div>
          <div className="paper-card p-4 sm:p-5">
            <div className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Customer Accounts</div>
            <div className="text-[24px] sm:text-[28px] font-semibold font-mono text-[var(--green)] mt-1.5">
              {usersList.filter((u) => u.role === 'User').length} <span className="text-xs sm:text-sm font-normal text-[var(--muted)]">Users</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 sm:gap-2 pt-1 pb-1 overflow-x-auto">
          <button
            className={`btn-paper ${activeTab === 'orders' ? 'btn-paper-primary' : ''}`}
            style={{ borderRadius: 'var(--radius-pill)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.03em' }}
            onClick={() => setActiveTab('orders')}
          >
            📦 Freight Operations Pipeline ({filteredOrders.length})
          </button>
          <button
            className={`btn-paper ${activeTab === 'users' ? 'btn-paper-primary' : ''}`}
            style={{ borderRadius: 'var(--radius-pill)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.03em' }}
            onClick={() => setActiveTab('users')}
          >
            👥 Customer &amp; Staff Roster ({usersList.length})
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <OrderFilterToolbar
              searchTerm={searchTerm}
              onSearchChange={(val) => {
                setSearchTerm(val);
                setOrderPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(val) => {
                setStatusFilter(val);
                setOrderPage(1);
              }}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalCount={filteredOrders.length}
            />

            {/* Orders Responsive Table */}
            <div className="paper-card">
              <div className="table-responsive-wrapper">
                <table className="specs-paper w-full">
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Customer</th>
                      <th>Cargo Package</th>
                      <th>Route</th>
                      <th>Total Price</th>
                      <th>Current Pipeline Stage</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#8C96A6' }}>
                          No shipment orders match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      pagedOrders.map((ord) => (
                        <tr key={ord.id || ord.trackingId}>
                          <td data-label="Tracking ID">
                            <div>
                              <span className="order-pill-tag" style={{ display: 'inline-block', marginBottom: '3px' }}>
                                ORD-#{ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || (1000 + (orders.indexOf(ord) + 1))}
                              </span>
                              <div className="track-pill-mono">
                                {ord.trackingId || ord.id}
                              </div>
                            </div>
                          </td>
                          <td data-label="Customer">
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>{ord.userName || 'Customer'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{ord.userEmail}</div>
                            </div>
                          </td>
                          <td data-label="Cargo Package">
                            <strong style={{ color: 'var(--ink)' }}>{ord.packageName}</strong> (x{ord.quantity})
                          </td>
                          <td data-label="Route">
                            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                              {ord.origin} ➔ {ord.destination}
                            </span>
                          </td>
                          <td data-label="Total Price">
                            <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace' }}>
                              ${parseFloat(ord.totalPrice || ord.pricing?.totalPrice || 0).toFixed(2)}
                            </span>
                          </td>
                          <td data-label="Pipeline Stage">
                            <span className={ord.status === 'DELIVERED' ? 'pill-green' : 'pill-amber'}>
                              {ord.status?.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </td>
                          <td data-label="Actions" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link
                                href={`/order/${ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || ord.trackingId}`}
                                className="btn-paper"
                                style={{ textDecoration: 'none', padding: '5px 10px', fontSize: '11.5px' }}
                                title="View Complete Waybill Full Page"
                              >
                                👁️ View
                              </Link>
                              <Link
                                href={`/order/edit/${ord.orderNumber || (ord.orderId ? ord.orderId.replace(/\D/g, '') : '') || ord.trackingId}`}
                                className="btn-paper btn-paper-primary"
                                style={{ textDecoration: 'none', padding: '5px 10px', fontSize: '11.5px' }}
                                title="Edit Specifications"
                              >
                                ✏️ Edit
                              </Link>
                              <button
                                className="btn-paper"
                                style={{ padding: '5px 10px', fontSize: '11.5px', background: '#FBF0DC', color: '#B4720C', borderColor: '#E4E0D3' }}
                                onClick={() => handleOpenPipelineModal(ord)}
                                title="Update Dispatch Stage"
                              >
                                📍 Stage
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Manager Orders Table */}
              <Pagination
                currentPage={orderPage}
                totalItems={filteredOrders.length}
                pageSize={orderPageSize}
                onPageChange={setOrderPage}
                onPageSizeChange={setOrderPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        ) : (
          /* User Roster Table */
          <div className="paper-card">
            <div className="table-responsive-wrapper">
              <table className="specs-paper w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u) => (
                    <tr key={u.email} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <td data-label="Name"><strong style={{ color: 'var(--ink)' }}>{u.name}</strong></td>
                      <td data-label="Email" style={{ color: 'var(--muted)' }}>{u.email}</td>
                      <td data-label="Role">
                        <span className={u.role === 'Admin' ? 'pill-blue' : u.role === 'Manager' ? 'pill-amber' : 'pill-green'}>
                          {u.role}
                        </span>
                      </td>
                      <td data-label="Department" style={{ color: 'var(--ink-soft)' }}>{u.department || 'Operations'}</td>
                      <td data-label="Status">
                        <span className={u.status === 'Active' ? 'pill-green' : 'pill-rust'}>
                          {u.status}
                        </span>
                      </td>
                      <td data-label="Joined" style={{ color: 'var(--muted)', fontSize: '11px' }}>{u.joinedDate || '2026-08-01'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Manager Users Table */}
            <div className="pt-4 border-t border-[var(--line-soft)] mt-4">
              <Pagination
                currentPage={userPage}
                totalItems={usersList.length}
                pageSize={userPageSize}
                onPageChange={setUserPage}
                onPageSizeChange={setUserPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        )}

        {/* View Drawer */}
        <OrderViewDrawer
          order={selectedViewOrder}
          isOpen={!!selectedViewOrder}
          onClose={() => setSelectedViewOrder(null)}
          onOpenEdit={(ord) => setSelectedEditOrder(ord)}
          onOpenPipeline={(ord) => handleOpenPipelineModal(ord)}
          userRole={user.role}
        />

        {/* Edit Specs Modal */}
        <OrderEditModal
          order={selectedEditOrder}
          isOpen={!!selectedEditOrder}
          onClose={() => setSelectedEditOrder(null)}
          onSaveSuccess={() => fetchOrdersData()}
        />

        {/* Pipeline Modal */}
        {showPipelineModal && selectedOrder && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={() => setShowPipelineModal(false)}>
            <div className="w-full max-w-lg bg-[var(--card)] rounded-2xl border border-[var(--line)] shadow-2xl p-4 sm:p-6 overflow-hidden my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)]">
                <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] m-0">⚡ Advance Shipment Pipeline Stage</h2>
                <button className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1" onClick={() => setShowPipelineModal(false)}>✕</button>
              </div>

              {msg && (
                <div className="p-3 mb-3 rounded-lg text-xs font-medium bg-[#E8F2EA] text-[#2E6B47] border border-[#C2DEC8]">
                  {msg}
                </div>
              )}

              <form onSubmit={handleSavePipeline} className="space-y-3.5">
                <div className="bg-[var(--paper)] p-3 rounded-lg border border-[var(--line)] text-xs space-y-1">
                  <div>Tracking: <strong className="font-mono text-[var(--blue)]">{selectedOrder.trackingId || selectedOrder.id}</strong></div>
                  <div>Customer: <strong>{selectedOrder.userName} ({selectedOrder.userEmail})</strong></div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Update Pipeline Stage</label>
                  <select
                    className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs sm:text-[13px] outline-none cursor-pointer focus:border-[var(--blue)]"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    required
                  >
                    <option value="PICKUP_PENDING">1. PICKUP_PENDING</option>
                    <option value="PICKUP_SCHEDULED">2. PICKUP_SCHEDULED</option>
                    <option value="PICKED_UP">3. PICKED_UP</option>
                    <option value="WAREHOUSE_ARRIVED">4. WAREHOUSE_ARRIVED</option>
                    <option value="DISPATCHED">5. DISPATCHED</option>
                    <option value="OUT_FOR_DELIVERY">6. OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">7. DELIVERED</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Pickup Scheduled</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs" value={pickupSchedVal} onChange={(e) => setPickupSchedVal(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Picked Up</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs" value={pickedUpVal} onChange={(e) => setPickedUpVal(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Warehouse Arrival</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs" value={warehouseVal} onChange={(e) => setWarehouseVal(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1">Dispatch Scheduled</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-xs" value={dispatchSchedVal} onChange={(e) => setDispatchSchedVal(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                  <button type="button" className="btn-paper text-xs py-1.5 px-3" onClick={() => setShowPipelineModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-paper btn-paper-primary text-xs py-1.5 px-3">
                    Update Pipeline Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
