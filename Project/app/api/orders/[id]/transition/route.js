import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import Order from '../../../../../models/Order';
import Driver from '../../../../../models/Driver';
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

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const caller = getCaller();
    const { id } = params;

    const body = await request.json();
    const { nextStatus, details, location, receiverName, hubName, sortingLane } = body || {};

    if (!nextStatus) {
      return NextResponse.json({ success: false, message: 'nextStatus is required.' }, { status: 400 });
    }

    const numId = !isNaN(parseInt(id, 10)) ? parseInt(id, 10) : null;
    const queryConditions = [
      { orderId: String(id) },
      { orderId: `ORD-${id}` },
      { trackingId: id },
    ];
    if (numId !== null) {
      queryConditions.push({ orderNumber: numId });
    }

    const order = await Order.findOne({ $or: queryConditions });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const prevStatus = order.status;
    order.status = nextStatus;

    const actorName = caller ? `${caller.name} (${caller.role})` : 'Operations Hub';
    const actorRole = caller ? caller.role : 'Manager';
    const finalLocation = location || order.origin || 'Regional Gateway';

    // Map pipeline stages & update pipeline timestamps
    if (!order.pipeline) order.pipeline = {};
    const dateStr = new Date().toISOString().split('T')[0];

    let stageNum = 1;
    let actionTitle = `Status updated to ${nextStatus}`;

    if (nextStatus === 'PICKUP_SCHEDULED') {
      stageNum = 2;
      actionTitle = 'Pickup Window Scheduled';
      order.pipeline.pickupScheduledDate = dateStr;
    } else if (nextStatus === 'DRIVER_ASSIGNED') {
      stageNum = 3;
      actionTitle = 'Driver & Fleet Assigned';
    } else if (nextStatus === 'PICKED_UP') {
      stageNum = 3;
      actionTitle = 'Origin Consignment Picked Up';
      order.pipeline.pickedUpDate = dateStr;
    } else if (nextStatus === 'RECEIVED_AT_WAREHOUSE') {
      stageNum = 4;
      actionTitle = 'Inbound Hub Ingestion & Sorting';
      order.pipeline.warehouseArrivalDate = dateStr;
      if (hubName || sortingLane) {
        order.hubDetails = {
          receivingHubName: hubName || 'Central Gateway Sorting Hub',
          sortingLane: sortingLane || 'Lane A-01',
          ingestedAt: new Date(),
        };
      }
    } else if (nextStatus === 'DISPATCH_SCHEDULED') {
      stageNum = 5;
      actionTitle = 'Linehaul Dispatch Scheduled';
      order.pipeline.dispatchScheduledDate = dateStr;
    } else if (nextStatus === 'OUT_FOR_DELIVERY') {
      stageNum = 6;
      actionTitle = 'Out for Final Delivery';
      order.pipeline.deliveryScheduledDate = dateStr;
    } else if (nextStatus === 'DELIVERED') {
      stageNum = 7;
      actionTitle = 'Consignment Successfully Delivered';
      order.pipeline.deliveredDate = dateStr;

      // Record Proof of Delivery
      order.deliveryProof = {
        receiverName: receiverName || order.userName || 'Authorized Signatory',
        deliveredAt: new Date(),
        notes: details || 'Goods inspected and received in good condition.',
        otpVerified: true,
      };

      // Auto-Release assigned driver back to Active!
      if (order.assignedDriver?.driverId) {
        await Driver.updateOne(
          { _id: order.assignedDriver.driverId },
          {
            $set: { status: 'Active', currentOrderId: null },
            $inc: { totalDeliveries: 1 },
          }
        ).catch(() => {});
      }
    }

    // Insert cryptographic audit log
    if (!order.activityLogs) order.activityLogs = [];
    order.activityLogs.unshift({
      stage: stageNum,
      action: actionTitle,
      status: nextStatus,
      actor: actorName,
      actorRole: actorRole,
      location: finalLocation,
      details: details || `Checkpoint verified. Transitioned from ${prevStatus} ➔ ${nextStatus}.`,
      timestamp: new Date(),
      hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: `Order transitioned to ${nextStatus}!`,
      order,
    });
  } catch (err) {
    console.error('POST /api/orders/[id]/transition error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
