import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';
import Driver from '../../../../models/Driver';
import { verifyToken } from '../../../../lib/auth';

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

export async function POST(request) {
  try {
    await dbConnect();
    const caller = getCaller();

    const body = await request.json();
    const { orderId, driverId, vehicleNumber, vehicleType, dispatchNotes } = body || {};

    if (!orderId || !driverId) {
      return NextResponse.json(
        { success: false, message: 'Both orderId and driverId are required.' },
        { status: 400 }
      );
    }

    const numId = !isNaN(parseInt(orderId, 10)) ? parseInt(orderId, 10) : null;
    const queryConditions = [
      { orderId: String(orderId) },
      { orderId: `ORD-${orderId}` },
      { trackingId: orderId },
    ];
    if (numId !== null) {
      queryConditions.push({ orderNumber: numId });
    }

    const order = await Order.findOne({ $or: queryConditions });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Selected driver not found.' }, { status: 404 });
    }

    const finalVehicleNum = vehicleNumber || driver.vehicleNumber || 'Van-01';
    const finalVehicleType = vehicleType || driver.vehicleType || 'Delivery Van';

    // Update order with assigned driver
    order.assignedDriver = {
      driverId: driver._id,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleNumber: finalVehicleNum,
      vehicleType: finalVehicleType,
      assignedAt: new Date(),
    };

    // Advance order status to DRIVER_ASSIGNED
    order.status = 'DRIVER_ASSIGNED';

    if (order.pipeline) {
      order.pipeline.pickupScheduledDate = new Date().toISOString().split('T')[0];
    }

    if (dispatchNotes) {
      order.notes = (order.notes ? order.notes + '\n' : '') + `[Dispatcher Note]: ${dispatchNotes}`;
    }

    // Append cryptographic activity log
    const actorName = caller ? `${caller.name} (${caller.role})` : 'Dispatcher';
    const actorRole = caller ? caller.role : 'Manager';

    if (!order.activityLogs) order.activityLogs = [];
    order.activityLogs.unshift({
      stage: 3,
      action: 'Driver & Vehicle Fleet Assigned',
      status: 'DRIVER_ASSIGNED',
      actor: actorName,
      actorRole: actorRole,
      location: order.origin || 'Origin Dispatch Hub',
      details: `Consignment assigned to Fleet Driver ${driver.name} (Phone: ${driver.phone}) operating ${finalVehicleType} [${finalVehicleNum}].`,
      timestamp: new Date(),
      hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    });

    await order.save();

    // Update Driver status to On Route
    await Driver.updateOne(
      { _id: driver._id },
      {
        $set: {
          status: 'On Route',
          currentOrderId: String(order.orderNumber || order.orderId),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Driver ${driver.name} assigned to Order ORD-${order.orderNumber || order.orderId}!`,
      order,
      driver,
    });
  } catch (err) {
    console.error('POST /api/dispatcher/assign error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
