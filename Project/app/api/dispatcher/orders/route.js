import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';

export const dynamic = 'force-dynamic';

function getStartAndEndOfDay(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  const dateStr = date.toISOString().split('T')[0];
  return { start, end, dateStr };
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date') || 'today';
    const status = searchParams.get('status');

    // 1. Pending staging queue across all location hubs
    const pendingQuery = {
      status: { $in: ['PICKUP_PENDING', 'PICKUP_SCHEDULED'] },
    };
    if (status && status !== 'All' && ['PICKUP_PENDING', 'PICKUP_SCHEDULED'].includes(status)) {
      pendingQuery.status = status;
    }
    const pendingOrders = await Order.find(pendingQuery).sort({ createdAt: -1 }).lean();

    // 2. Dispatched / On Route fleets (filtered by date if specified)
    let dispatchedQuery = {
      status: { $in: ['DRIVER_ASSIGNED', 'PICKED_UP', 'RECEIVED_AT_WAREHOUSE', 'OUT_FOR_DELIVERY', 'DELIVERED'] },
    };

    const now = new Date();
    if (dateFilter === 'today') {
      const { start, end, dateStr } = getStartAndEndOfDay(now);
      dispatchedQuery.$or = [
        { 'assignedDriver.assignedAt': { $gte: start, $lte: end } },
        { 'pipeline.pickupScheduledDate': dateStr },
        { updatedAt: { $gte: start, $lte: end } },
      ];
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { start, end, dateStr } = getStartAndEndOfDay(tomorrow);
      dispatchedQuery.$or = [
        { 'assignedDriver.assignedAt': { $gte: start, $lte: end } },
        { 'pipeline.pickupScheduledDate': dateStr },
      ];
    } else if (dateFilter !== 'all' && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      const parts = dateFilter.split('-').map(Number);
      const chosenDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const { start, end, dateStr } = getStartAndEndOfDay(chosenDate);
      dispatchedQuery.$or = [
        { 'assignedDriver.assignedAt': { $gte: start, $lte: end } },
        { 'pipeline.pickupScheduledDate': dateStr },
        { updatedAt: { $gte: start, $lte: end } },
      ];
    }

    let dispatchedOrders = await Order.find(dispatchedQuery).sort({ updatedAt: -1 }).limit(30).lean();

    // Fallback: If 0 dispatched orders match today's date filter, load all recent active dispatched orders
    if (dispatchedOrders.length === 0) {
      dispatchedOrders = await Order.find({
        status: { $in: ['DRIVER_ASSIGNED', 'PICKED_UP', 'RECEIVED_AT_WAREHOUSE', 'OUT_FOR_DELIVERY'] },
      })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();
    }

    // Combine pending + dispatched orders
    const combinedOrders = [...pendingOrders, ...dispatchedOrders];

    const normalizedOrders = combinedOrders.map((o) => ({
      ...o,
      _id: String(o._id),
      orderId: o.orderNumber ? String(o.orderNumber) : o.orderId,
      orderNumber: o.orderNumber || (o.orderId ? parseInt(o.orderId.replace(/\D/g, ''), 10) : 1001),
      totalPrice: o.pricing?.totalPrice || o.totalPrice || 25,
    }));

    return NextResponse.json({
      success: true,
      count: normalizedOrders.length,
      orders: normalizedOrders,
    });
  } catch (err) {
    console.error('GET /api/dispatcher/orders error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
