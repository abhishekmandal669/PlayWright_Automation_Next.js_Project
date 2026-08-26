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
    const { orderId } = body || {};

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    const numId = !isNaN(parseInt(orderId, 10)) ? parseInt(orderId, 10) : null;
    const queryConditions = [
      { orderId: String(orderId) },
      { orderId: `ORD-${orderId}` },
      { trackingId: String(orderId) },
    ];
    if (typeof orderId === 'string' && orderId.length === 24) {
      queryConditions.push({ _id: orderId });
    }
    if (numId !== null) {
      queryConditions.push({ orderNumber: numId });
    }

    const order = await Order.findOne({ $or: queryConditions });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const prevDriver = order.assignedDriver;
    const actorName = caller ? `${caller.name} (${caller.role})` : 'Dispatcher';
    const actorRole = caller ? caller.role : 'Manager';

    const logEntry = {
      stage: 2,
      action: 'Driver & Vehicle Unassigned',
      status: 'PICKUP_SCHEDULED',
      actor: actorName,
      actorRole: actorRole,
      location: order.origin || 'Origin Dispatch Hub',
      details: `Consignment unlinked from Fleet Truck [${prevDriver?.vehicleNumber || 'Carrier'}] and returned to ${order.origin || 'origin'} staging queue.`,
      timestamp: new Date(),
      hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    };

    // Unassign order
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'PICKUP_SCHEDULED',
          assignedDriver: {
            driverId: null,
            driverName: '',
            driverPhone: '',
            vehicleNumber: '',
            vehicleType: '',
          },
        },
        $push: {
          activityLogs: {
            $each: [logEntry],
            $position: 0,
          },
        },
      }
    );

    // If driver had this order, update driver status
    if (prevDriver && prevDriver.driverId) {
      const remainingOrdersCount = await Order.countDocuments({
        'assignedDriver.driverId': prevDriver.driverId,
        status: 'DRIVER_ASSIGNED',
        _id: { $ne: order._id },
      });

      if (remainingOrdersCount === 0) {
        await Driver.updateOne(
          { _id: prevDriver.driverId },
          { $set: { status: 'Active', currentOrderId: '' } }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order ORD-${order.orderNumber || order.orderId} unassigned and returned to ${order.origin || 'location'} staging queue!`,
      order,
    });
  } catch (err) {
    console.error('POST /api/dispatcher/unassign error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
