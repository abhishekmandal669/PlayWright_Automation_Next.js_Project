import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import Order from '../../../../../models/Order';
import { verifyToken } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getCaller() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value || cookieStore.get('session_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

function genTrackingId() {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `TRK-${Date.now()}-${randNum}`;
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const caller = getCaller();

    // Strict Role Guard: Only Admin and Manager can create child orders
    if (!caller || (caller.role !== 'Admin' && caller.role !== 'Manager')) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Only Admins and Managers can spawn child orders.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const numId = !isNaN(parseInt(id, 10)) ? parseInt(id, 10) : null;

    const queryConditions = [
      { orderId: String(id) },
      { orderId: `ORD-${id}` },
      { trackingId: id },
    ];
    if (numId !== null) {
      queryConditions.push({ orderNumber: numId });
    }

    let parentOrder = await Order.findOne({ $or: queryConditions });
    if (!parentOrder && numId !== null) {
      const allOrders = await Order.find({}).sort({ createdAt: 1 });
      const targetIdx = numId - 1001;
      if (targetIdx >= 0 && targetIdx < allOrders.length) {
        parentOrder = allOrders[targetIdx];
      }
    }

    if (!parentOrder) {
      return NextResponse.json({ success: false, message: 'Parent order not found.' }, { status: 404 });
    }

    // Allocate next sequential orderNumber
    const lastNumberedOrder = await Order.findOne({ orderNumber: { $exists: true, $ne: null } })
      .sort({ orderNumber: -1 })
      .lean();

    let nextOrderNum = (lastNumberedOrder?.orderNumber || 0) + 1;
    if (nextOrderNum < 1001) {
      const totalDocs = await Order.countDocuments();
      nextOrderNum = 1000 + totalDocs + 1;
    }
    const newOrderId = String(nextOrderNum);
    const newTrackingId = genTrackingId();

    const parentNum = parentOrder.orderNumber || (parentOrder.orderId ? parseInt(String(parentOrder.orderId).replace(/\D/g, ''), 10) : 1001);

    // Create the new child order copying full package specs
    const childOrder = await Order.create({
      trackingId: newTrackingId,
      orderId: newOrderId,
      orderNumber: nextOrderNum,
      userId: parentOrder.userId || null,
      userEmail: parentOrder.userEmail,
      userName: parentOrder.userName,
      packageName: `${parentOrder.packageName} (Child Consignment)`,
      quantity: parentOrder.quantity || 1,
      weight: parentOrder.weight,
      dimensions: parentOrder.dimensions || { length: 40, width: 30, height: 20 },
      volumetricWeight: parentOrder.volumetricWeight || 0,
      chargeableWeight: parentOrder.chargeableWeight || parentOrder.weight,
      origin: parentOrder.origin,
      destination: parentOrder.destination,
      fragile: !!parentOrder.fragile,
      express: !!parentOrder.express,
      insured: !!parentOrder.insured,
      pricing: parentOrder.pricing || {
        basePrice: 25,
        totalPrice: 25,
        currency: 'USD',
      },
      status: 'PICKUP_PENDING',
      notes: `Spawned from parent order ORD-${parentNum}`,
      pipeline: {
        pickupScheduledDate: 'Pending',
        pickedUpDate: 'Pending',
        warehouseArrivalDate: 'Pending',
        dispatchScheduledDate: 'Pending',
        dispatchedDate: 'Pending',
        deliveryScheduledDate: 'Pending',
        deliveredDate: 'Pending',
      },
      isChildOrder: true,
      parentOrderNumber: parentNum,
      parentOrderId: String(parentNum),
      parentTrackingId: parentOrder.trackingId,
      activityLogs: [
        {
          stage: 1,
          action: 'Child Consignment Created',
          status: 'PICKUP_PENDING',
          actor: `${caller.name} (${caller.role})`,
          actorRole: caller.role,
          location: parentOrder.origin || 'Origin Gateway',
          details: `Child consignment spawned from Parent Order ORD-${parentNum}. Designated route: ${parentOrder.origin} ➔ ${parentOrder.destination}.`,
          timestamp: new Date(),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        },
      ],
    });

    // Update parent order with child reference and activity log
    if (!parentOrder.childOrders) parentOrder.childOrders = [];
    parentOrder.childOrders.push({
      orderNumber: nextOrderNum,
      orderId: newOrderId,
      trackingId: newTrackingId,
      packageName: childOrder.packageName,
      createdAt: new Date(),
    });

    if (!parentOrder.activityLogs) parentOrder.activityLogs = [];
    parentOrder.activityLogs.push({
      action: 'Child Order Spawned',
      status: parentOrder.status,
      actor: `${caller.name} (${caller.role})`,
      actorRole: caller.role,
      location: parentOrder.origin || 'Origin Gateway',
      details: `Spawned Child Consignment ORD-${nextOrderNum} (Tracking: ${newTrackingId}) by ${caller.name}.`,
      timestamp: new Date(),
      hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    });

    await parentOrder.save();

    return NextResponse.json({
      success: true,
      message: `Child order ORD-${nextOrderNum} successfully created!`,
      childOrder: {
        ...childOrder.toObject(),
        orderId: newOrderId,
        id: newTrackingId,
        orderNumber: nextOrderNum,
        totalPrice: childOrder.pricing?.totalPrice || 0,
      },
      parentOrderNumber: parentNum,
    });
  } catch (err) {
    console.error('POST /api/orders/[id]/child error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
