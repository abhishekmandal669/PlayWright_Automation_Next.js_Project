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
    const { orderIds, driverId, vehicleNumber, vehicleType, dispatchNotes } = body || {};

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one orderId is required for fleet assignment.' },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { success: false, message: 'Driver selection is required.' },
        { status: 400 }
      );
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Selected driver not found.' }, { status: 404 });
    }

    const finalVehicleNum = vehicleNumber || driver.vehicleNumber || 'Van-01';
    const finalVehicleType = vehicleType || driver.vehicleType || 'Delivery Van';

    // Find and update each order in batch
    const updatedOrderNumbers = [];
    const actorName = caller ? `${caller.name} (${caller.role})` : 'Dispatcher';
    const actorRole = caller ? caller.role : 'Manager';

    for (const rawId of orderIds) {
      const numId = !isNaN(parseInt(rawId, 10)) ? parseInt(rawId, 10) : null;
      const queryConditions = [
        { orderId: String(rawId) },
        { orderId: `ORD-${rawId}` },
        { trackingId: String(rawId) },
      ];
      if (typeof rawId === 'string' && rawId.length === 24) {
        queryConditions.push({ _id: rawId });
      }
      if (numId !== null) {
        queryConditions.push({ orderNumber: numId });
      }

      const order = await Order.findOne({ $or: queryConditions });
      if (order) {
        const logEntry = {
          stage: 3,
          action: 'Driver & Vehicle Batch Assigned',
          status: 'DRIVER_ASSIGNED',
          actor: actorName,
          actorRole: actorRole,
          location: order.origin || 'Origin Dispatch Hub',
          details: `Consignment bundled into Fleet Truck [${finalVehicleNum}] (${finalVehicleType}) driven by ${driver.name} (Phone: ${driver.phone}).`,
          timestamp: new Date(),
          hash: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase(),
        };

        const updateSet = {
          assignedDriver: {
            driverId: driver._id,
            driverName: driver.name,
            driverPhone: driver.phone,
            vehicleNumber: finalVehicleNum,
            vehicleType: finalVehicleType,
            assignedAt: new Date(),
          },
          status: 'DRIVER_ASSIGNED',
          'pipeline.pickupScheduledDate': new Date().toISOString().split('T')[0],
        };

        if (dispatchNotes) {
          updateSet.notes = (order.notes ? order.notes + '\n' : '') + `[Dispatcher Batch Note]: ${dispatchNotes}`;
        }

        await Order.updateOne(
          { _id: order._id },
          {
            $set: updateSet,
            $push: {
              activityLogs: {
                $each: [logEntry],
                $position: 0,
              },
            },
          }
        );

        updatedOrderNumbers.push(`ORD-${order.orderNumber || order.orderId}`);
      }
    }

    // Update Driver status to On Route
    await Driver.updateOne(
      { _id: driver._id },
      {
        $set: {
          status: 'On Route',
          currentOrderId: updatedOrderNumbers.join(', '),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${updatedOrderNumbers.length} order(s) [${updatedOrderNumbers.join(', ')}] to ${driver.name} (${finalVehicleNum})!`,
      assignedCount: updatedOrderNumbers.length,
      driver,
    });
  } catch (err) {
    console.error('POST /api/dispatcher/batch-assign error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
