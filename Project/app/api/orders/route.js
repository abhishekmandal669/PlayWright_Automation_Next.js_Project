import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import User from '../../../models/User';
import { calculatePricing } from '../../../lib/pricing';
import { verifyToken, hashPassword } from '../../../lib/auth';

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

function genTrackingId() {
  return 'TRK-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
}

/** GET /api/orders */
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email  = searchParams.get('email');
    const role   = searchParams.get('role');
    const status = searchParams.get('status');

    const caller = getCallerFromRequest();

    let query = {};

    // Admin/Manager or role=Admin/Manager query param: all orders; Regular user: only own orders
    if (role === 'Admin' || role === 'Manager' || caller?.role === 'Admin' || caller?.role === 'Manager') {
      if (email && email !== 'all') {
        query.userEmail = email.trim().toLowerCase();
      }
    } else if (caller?.email) {
      query.userEmail = caller.email.trim().toLowerCase();
    } else if (email) {
      query.userEmail = email.trim().toLowerCase();
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })  // newest first
      .lean();

    // Shape response to match what UI expects (pure numeric orderId: 1001, 1002...)
    const shaped = orders.map((o, idx) => {
      const num = o.orderNumber || (o.orderId ? parseInt(String(o.orderId).replace(/\D/g, '')) : null) || (1000 + (orders.length - idx));
      return {
        ...o,
        orderId:    String(num),
        orderNumber:num,
        id:         o.trackingId,
        totalPrice: o.pricing?.totalPrice ?? 0,
        dispatchDate: o.pipeline?.dispatchScheduledDate ?? 'Pending',
      };
    });

    return NextResponse.json({ success: true, orders: shaped });
  } catch (err) {
    console.error('[API /orders GET] Error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders.' }, { status: 500 });
  }
}

/** POST /api/orders — create a new shipment order */
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      userEmail, userName, userId,
      origin, destination, packageName,
      quantity = 1, weight,
      dimensions = { length: 0, width: 0, height: 0 },
      fragile = false, express = false, insured = false,
      carrier = 'Standard Air',
      notes = '',
    } = body;

    if (!origin || !destination || !packageName || !weight || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: origin, destination, packageName, weight, userEmail.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(userEmail).trim().toLowerCase();

    // Auto-provision customer user account if not yet in database
    let customerUser = await User.findOne({ email: cleanEmail });
    if (!customerUser) {
      const defaultHash = await hashPassword('Customer@123');
      customerUser = await User.create({
        name: String(userName || cleanEmail.split('@')[0]).trim(),
        email: cleanEmail,
        passwordHash: defaultHash,
        role: 'User',
        department: 'Customer Client',
        title: 'Shipping Customer',
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }

    // Compute sequential pure numeric Order ID (1001, 1002, ...)
    const lastNumberedOrder = await Order.findOne({ orderNumber: { $exists: true, $ne: null } })
      .sort({ orderNumber: -1 })
      .lean();

    let nextOrderNum = (lastNumberedOrder?.orderNumber || 0) + 1;
    if (nextOrderNum < 1001) {
      const totalDocs = await Order.countDocuments();
      nextOrderNum = 1000 + totalDocs + 1;
    }
    const orderId = String(nextOrderNum);

    const { volumetricWeight, chargeableWeight, pricing } = calculatePricing({
      weight,
      length: dimensions?.length || 0,
      width: dimensions?.width || 0,
      height: dimensions?.height || 0,
      fragile,
      express,
      insured,
    });

    const newOrder = await Order.create({
      trackingId:      genTrackingId(),
      orderId,
      orderNumber:     nextOrderNum,
      userId:          customerUser?._id || userId || null,
      userEmail:       cleanEmail,
      userName:        customerUser?.name || userName || 'Customer',
      packageName:     String(packageName).trim(),
      quantity:        parseInt(quantity) || 1,
      weight:          parseFloat(weight),
      dimensions,
      volumetricWeight,
      chargeableWeight,
      origin:          String(origin).trim(),
      destination:     String(destination).trim(),
      fragile:         !!fragile,
      express:         !!express,
      insured:         !!insured,
      pricing,
      status:          'PICKUP_PENDING',
      notes:           notes || '',
      pipeline: {
        pickupScheduledDate:   'Pending',
        pickedUpDate:          'Pending',
        warehouseArrivalDate:  'Pending',
        dispatchScheduledDate: 'Pending',
        dispatchedDate:        'Pending',
        deliveryScheduledDate: 'Pending',
        deliveredDate:         'Pending',
      },
      activityLogs: [
        {
          action: 'Shipment Consignment Created',
          status: 'PICKUP_PENDING',
          actor: customerUser?.name || userName || 'Customer',
          details: `Consignment registered from ${origin} to ${destination} for ${packageName}`,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Shipment order created successfully!',
        order: { ...newOrder.toObject(), id: newOrder.trackingId, totalPrice: pricing.totalPrice },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /orders POST] Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/** PUT /api/orders — update pipeline or edit order details */
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action, orderId, updatePayload, updateData } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required.' }, { status: 400 });
    }

    // Find by trackingId, orderNumber, orderId, or MongoDB _id
    let query = { trackingId: orderId };
    if (/^\d+$/.test(orderId)) {
      const num = parseInt(orderId, 10);
      query = { $or: [{ trackingId: orderId }, { orderNumber: num }, { orderId: orderId }, { orderId: `ORD-${orderId}` }] };
    } else if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ trackingId: orderId }, { _id: orderId }, { orderId }] };
    }

    let order = await Order.findOne(query);

    if (!order && /^\d+$/.test(orderId)) {
      const num = parseInt(orderId, 10);
      const allOrders = await Order.find({}).sort({ createdAt: 1 });
      const targetIdx = num - 1001;
      if (targetIdx >= 0 && targetIdx < allOrders.length) {
        order = allOrders[targetIdx];
      }
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (!order.activityLogs) order.activityLogs = [];

    if (action === 'updatePipeline' || (updatePayload && !updateData)) {
      const payload = updatePayload || body;
      if (payload.status)                order.status = payload.status;
      if (payload.pickupScheduledDate)   order.pipeline.pickupScheduledDate   = payload.pickupScheduledDate;
      if (payload.pickedUpDate)          order.pipeline.pickedUpDate          = payload.pickedUpDate;
      if (payload.warehouseArrivalDate)  order.pipeline.warehouseArrivalDate  = payload.warehouseArrivalDate;
      if (payload.dispatchScheduledDate) order.pipeline.dispatchScheduledDate = payload.dispatchScheduledDate;
      if (payload.dispatchedDate)        order.pipeline.dispatchedDate        = payload.dispatchedDate;
      if (payload.deliveryScheduledDate) order.pipeline.deliveryScheduledDate = payload.deliveryScheduledDate;
      if (payload.deliveredDate)         order.pipeline.deliveredDate         = payload.deliveredDate;

      order.activityLogs.push({
        action: `Stage: ${order.status.replace(/_/g, ' ')}`,
        status: order.status,
        actor: 'Operations Dispatcher',
        details: `Shipment dispatch pipeline status transitioned to ${order.status.replace(/_/g, ' ')}`,
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: 'Shipment pipeline status updated!',
        order: { ...order.toObject(), id: order.trackingId, totalPrice: order.pricing?.totalPrice },
      });
    }

    if (action === 'edit' || updateData) {
      const data = updateData || body;
      if (data.origin)          order.origin          = String(data.origin).trim();
      if (data.destination)     order.destination     = String(data.destination).trim();
      if (data.packageName)     order.packageName     = String(data.packageName).trim();
      if (data.carrier)         order.carrier         = data.carrier;
      if (data.quantity)        order.quantity        = parseInt(data.quantity) || 1;
      if (data.weight)          order.weight          = parseFloat(data.weight);
      if (data.dimensions)      order.dimensions      = data.dimensions;
      if (data.fragile !== undefined) order.fragile   = !!data.fragile;
      if (data.express !== undefined) order.express   = !!data.express;
      if (data.insured !== undefined) order.insured   = !!data.insured;
      if (data.notes !== undefined)   order.notes     = String(data.notes).trim();

      // Recalculate pricing
      const { volumetricWeight, chargeableWeight, pricing } = calculatePricing({
        weight: order.weight,
        length: order.dimensions?.length || 0,
        width:  order.dimensions?.width  || 0,
        height: order.dimensions?.height || 0,
        fragile: order.fragile,
        express: order.express,
        insured: order.insured,
      });

      order.volumetricWeight = volumetricWeight;
      order.chargeableWeight = chargeableWeight;
      order.pricing = pricing;

      if (data.totalPrice) {
        order.pricing.totalPrice = parseFloat(data.totalPrice);
      }

      order.activityLogs.push({
        action: 'Cargo Specs Updated',
        status: order.status,
        actor: 'Operations Admin',
        details: `Updated package: ${order.packageName} (${order.weight} kg, Total: $${order.pricing?.totalPrice})`,
        timestamp: new Date(),
      });

      await order.save();
      return NextResponse.json({
        success: true,
        message: 'Order specifications updated successfully!',
        order: {
          ...order.toObject(),
          id: order.trackingId,
          orderId: String(order.orderNumber || order.orderId || order.id),
          totalPrice: order.pricing?.totalPrice,
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action or missing update data.' }, { status: 400 });
  } catch (err) {
    console.error('[API /orders PUT] Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
