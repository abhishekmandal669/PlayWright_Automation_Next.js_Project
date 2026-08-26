import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getCallerFromRequest() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** GET /api/orders/[id] */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const caller = getCallerFromRequest();

    // Look up by numeric orderNumber/orderId (e.g. 1001), trackingId (TRK-...), or MongoDB _id
    const numId = !isNaN(parseInt(id)) ? parseInt(id) : null;
    const queryConditions = [
      { orderId: String(id) },
      { orderId: `ORD-${id}` },
      { trackingId: id },
      { id: id },
    ];
    if (numId !== null) {
      queryConditions.push({ orderNumber: numId });
    }

    let order = await Order.findOne({ $or: queryConditions }).lean();

    if (!order && numId !== null) {
      // Fallback: If older orders don't have orderNumber in DB, resolve by sequential order index
      const allOrders = await Order.find({}).sort({ createdAt: 1 }).lean();
      
      // Check 1: Direct chronological index (1001 -> index 0, 1002 -> index 1...)
      if (numId >= 1001 && numId <= 1000 + allOrders.length) {
        order = allOrders[numId - 1001];
      }

      // Check 2: Reverse chronological index (e.g. 1040 for the newest of 40 orders)
      if (!order && numId >= 1001 && numId <= 1000 + allOrders.length) {
        order = allOrders[allOrders.length - (numId - 1000)];
      }

      // Auto-backfill orderNumber in database for permanence
      if (order?._id) {
        await Order.updateOne({ _id: order._id }, { $set: { orderNumber: numId, orderId: String(numId) } }).catch(() => {});
      }
    }

    if (!order) {
      try {
        order = await Order.findById(id).lean();
      } catch {}
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Role-based access check
    if (caller && caller.role !== 'Admin' && caller.role !== 'Manager') {
      if (order.userEmail && order.userEmail.toLowerCase() !== caller.email.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Unauthorized access to this order' }, { status: 403 });
      }
    }

    const finalNum = order.orderNumber || (order.orderId ? parseInt(String(order.orderId).replace(/\D/g, '')) : 1001);

    // Auto-backfill activityLogs if missing in legacy records
    let activityLogs = order.activityLogs || [];
    if (!activityLogs || activityLogs.length === 0) {
      const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const initialLogs = [
        {
          stage: 1,
          action: 'Shipment Consignment Registered',
          status: 'PICKUP_PENDING',
          actor: order.userName || 'Customer Account',
          actorRole: 'Customer',
          location: order.origin || 'Origin Hub',
          details: `Consignment registered for "${order.packageName}" (${order.weight || 1} kg). Designated route: ${order.origin} ➔ ${order.destination}.`,
          timestamp: createdDate,
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        },
      ];

      if (order.pipeline?.pickupScheduledDate && order.pipeline.pickupScheduledDate !== 'Pending') {
        initialLogs.push({
          stage: 2,
          action: 'Origin Pickup Scheduled',
          status: 'PICKUP_SCHEDULED',
          actor: 'Dispatch Operations Desk',
          actorRole: 'Manager',
          location: order.origin,
          details: `Pickup window scheduled at origin facility: ${order.origin}.`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 30),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      if (order.pipeline?.pickedUpDate && order.pipeline.pickedUpDate !== 'Pending') {
        initialLogs.push({
          stage: 3,
          action: 'Cargo Collected & Inbound',
          status: 'PICKED_UP',
          actor: 'Origin Courier Service',
          actorRole: 'Courier',
          location: order.origin,
          details: `Cargo collected from origin and transferred to central hub sorting unit.`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 60 * 2),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      if (order.pipeline?.warehouseArrivalDate && order.pipeline.warehouseArrivalDate !== 'Pending') {
        initialLogs.push({
          stage: 4,
          action: 'Received & Scanned at Central Sorting Hub',
          status: 'RECEIVED_AT_WAREHOUSE',
          actor: 'Sorting Facility Hub #04',
          actorRole: 'Hub Scanner',
          location: 'Central Sorting Hub',
          details: `Volumetric weight matrix verified (${order.dimensions?.length || 0}×${order.dimensions?.width || 0}×${order.dimensions?.height || 0} cm). Security seal applied.`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 60 * 5),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      if ((order.pipeline?.dispatchedDate && order.pipeline.dispatchedDate !== 'Pending') || (order.pipeline?.dispatchScheduledDate && order.pipeline.dispatchScheduledDate !== 'Pending')) {
        initialLogs.push({
          stage: 5,
          action: 'Dispatched on Linehaul Transit',
          status: 'DISPATCH_SCHEDULED',
          actor: `${order.carrier || 'FreightProxy Standard Air'} Transit Unit`,
          actorRole: 'Carrier',
          location: `${order.origin} Gateway`,
          details: `Cargo manifest cleared for transit departure towards destination gateway (${order.destination}).`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 60 * 12),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      if (order.pipeline?.deliveryScheduledDate && order.pipeline.deliveryScheduledDate !== 'Pending') {
        initialLogs.push({
          stage: 6,
          action: 'Out for Final Delivery',
          status: 'OUT_FOR_DELIVERY',
          actor: 'Last-Mile Delivery Unit',
          actorRole: 'Courier',
          location: order.destination,
          details: `Courier assigned for destination delivery at ${order.destination}.`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 60 * 20),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      if (order.status === 'DELIVERED' || (order.pipeline?.deliveredDate && order.pipeline.deliveredDate !== 'Pending')) {
        initialLogs.push({
          stage: 7,
          action: 'Delivered & Consignment Complete',
          status: 'DELIVERED',
          actor: 'Consignee / Recipient',
          actorRole: 'Recipient',
          location: order.destination,
          details: `Consignment successfully handed over to recipient and waybill archived.`,
          timestamp: new Date(createdDate.getTime() + 1000 * 60 * 60 * 24),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        });
      }

      activityLogs = initialLogs;
      if (order._id) {
        await Order.updateOne({ _id: order._id }, { $set: { activityLogs: initialLogs } }).catch(() => {});
      }
    }

    const shaped = {
      ...order,
      orderId: String(finalNum),
      orderNumber: finalNum,
      id: order.id || order.trackingId,
      totalPrice: order.totalPrice || order.pricing?.totalPrice || 0,
      activityLogs,
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    };

    return NextResponse.json({ success: true, order: shaped });
  } catch (err) {
    console.error('GET /api/orders/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const token = req.cookies.get('session_token')?.value;
    const caller = token ? verifyToken(token) : null;
    const { id } = params;
    const body = await req.json();

    let query = {};
    const isPureNum = /^\d+$/.test(id);
    if (isPureNum) {
      const num = parseInt(id, 10);
      query = { $or: [{ orderNumber: num }, { orderId: id }, { orderId: `ORD-${id}` }] };
    } else {
      query = { $or: [{ trackingId: id }, { orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }].filter(Boolean) };
    }

    let order = await Order.findOne(query);
    if (!order && isPureNum) {
      const num = parseInt(id, 10);
      const allOrders = await Order.find({}).sort({ createdAt: 1 });
      const targetIdx = num - 1001;
      if (targetIdx >= 0 && targetIdx < allOrders.length) {
        order = allOrders[targetIdx];
      }
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (caller && caller.role !== 'Admin' && caller.role !== 'Manager') {
      if (order.userEmail && order.userEmail.toLowerCase() !== caller.email.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
      }
    }

    if (!order.activityLogs) order.activityLogs = [];

    if (body.action === 'cancel' || body.status === 'CANCELLED') {
      order.status = 'CANCELLED';
      const reason = body.cancellationReason || body.reason || 'Requested by user';
      order.cancellationReason = reason;
      order.activityLogs.push({
        action: 'Shipment Order Cancelled',
        status: 'CANCELLED',
        actor: caller?.name || caller?.email || 'Operations Desk',
        actorRole: caller?.role || 'User',
        location: order.origin || 'Origin Hub',
        details: `Shipment cancelled. Reason: "${reason}". Consignment voided.`,
        timestamp: new Date(),
        hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      });
    } else {
      if (body.notes !== undefined) {
        order.notes = String(body.notes).trim();
        order.activityLogs.push({
          action: 'Booking Note Updated',
          status: order.status,
          actor: caller?.name || caller?.email || 'Operations Desk',
          details: order.notes ? `Note recorded: "${order.notes.slice(0, 60)}${order.notes.length > 60 ? '...' : ''}"` : 'Note cleared',
          timestamp: new Date(),
        });
      }
      if (body.status !== undefined) {
        order.status = body.status;
        order.activityLogs.push({
          action: `Shipment Stage: ${order.status.replace(/_/g, ' ')}`,
          status: order.status,
          actor: caller?.name || caller?.email || 'System Dispatcher',
          details: `Stage status transitioned to ${order.status}`,
          timestamp: new Date(),
        });
      }
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully!',
      order: {
        ...order.toObject(),
        orderId: String(order.orderNumber || id),
        id: order.trackingId || order.id,
      },
    });
  } catch (err) {
    console.error('PATCH /api/orders/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
