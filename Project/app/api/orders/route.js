import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';

export const dynamic = 'force-dynamic';

// ── Pricing helper ──────────────────────────────────────────
function calculatePricing(weight, length, width, height, fragile, express, insured) {
  const vol  = (length * width * height) / 5000;
  const chrg = Math.max(parseFloat(weight), vol);
  const base = 25.00;
  const wf   = parseFloat((chrg * 12.50).toFixed(2));
  const ff   = fragile ? 15.00 : 0;
  const ef   = express ? 35.00 : 0;
  const inf  = insured ? 20.00 : 0;
  return {
    volumetricWeight: parseFloat(vol.toFixed(2)),
    chargeableWeight: parseFloat(chrg.toFixed(2)),
    pricing: {
      basePrice:    base,
      weightFee:    wf,
      fragileFee:   ff,
      expressFee:   ef,
      insuranceFee: inf,
      totalPrice:   parseFloat((base + wf + ff + ef + inf).toFixed(2)),
      currency:     'USD',
    },
  };
}

function genTrackingId() {
  return 'TRK-' + Math.floor(1000 + Math.random() * 9000);
}

/** GET /api/orders */
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email  = searchParams.get('email');
    const role   = searchParams.get('role');
    const status = searchParams.get('status');

    let query = {};

    // Admin/Manager: all orders; User: only their own
    if (role === 'Admin' || role === 'Manager') {
      // No filter — all orders
    } else if (email) {
      query.userEmail = email.trim().toLowerCase();
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })  // newest first
      .lean();

    // Shape response to match what UI expects (flatten pricing.totalPrice → totalPrice)
    const shaped = orders.map((o) => ({
      ...o,
      id:         o.trackingId,
      totalPrice: o.pricing?.totalPrice ?? 0,
      dispatchDate: o.pipeline?.dispatchScheduledDate ?? 'Pending',
    }));

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
    } = body;

    if (!origin || !destination || !packageName || !weight || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: origin, destination, packageName, weight, userEmail.' },
        { status: 400 }
      );
    }

    const { volumetricWeight, chargeableWeight, pricing } = calculatePricing(
      weight,
      dimensions.length,
      dimensions.width,
      dimensions.height,
      fragile,
      express,
      insured
    );

    const newOrder = await Order.create({
      trackingId:      genTrackingId(),
      userId:          userId || null,
      userEmail:       String(userEmail).trim().toLowerCase(),
      userName:        userName || 'Customer',
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
      pipeline: {
        pickupScheduledDate:   'Pending',
        pickedUpDate:          'Pending',
        warehouseArrivalDate:  'Pending',
        dispatchScheduledDate: 'Pending',
        dispatchedDate:        'Pending',
        deliveryScheduledDate: 'Pending',
        deliveredDate:         'Pending',
      },
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

    // Find by trackingId (the "id" used in UI) or MongoDB _id
    const order = await Order.findOne({ trackingId: orderId });

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (action === 'updatePipeline') {
      if (updatePayload.status)                order.status = updatePayload.status;
      if (updatePayload.pickupScheduledDate)   order.pipeline.pickupScheduledDate   = updatePayload.pickupScheduledDate;
      if (updatePayload.pickedUpDate)          order.pipeline.pickedUpDate          = updatePayload.pickedUpDate;
      if (updatePayload.warehouseArrivalDate)  order.pipeline.warehouseArrivalDate  = updatePayload.warehouseArrivalDate;
      if (updatePayload.dispatchScheduledDate) order.pipeline.dispatchScheduledDate = updatePayload.dispatchScheduledDate;
      if (updatePayload.dispatchedDate)        order.pipeline.dispatchedDate        = updatePayload.dispatchedDate;
      if (updatePayload.deliveryScheduledDate) order.pipeline.deliveryScheduledDate = updatePayload.deliveryScheduledDate;
      if (updatePayload.deliveredDate)         order.pipeline.deliveredDate         = updatePayload.deliveredDate;

      await order.save();
      return NextResponse.json({
        success: true,
        message: 'Shipment pipeline status updated!',
        order: { ...order.toObject(), id: order.trackingId, totalPrice: order.pricing?.totalPrice },
      });
    }

    if (action === 'edit') {
      if (updateData.origin)      order.origin      = updateData.origin;
      if (updateData.destination) order.destination = updateData.destination;
      if (updateData.packageName) order.packageName = updateData.packageName;
      if (updateData.weight)      order.weight      = parseFloat(updateData.weight);
      if (updateData.totalPrice)  order.pricing.totalPrice = parseFloat(updateData.totalPrice);

      await order.save();
      return NextResponse.json({
        success: true,
        message: 'Order details updated!',
        order: { ...order.toObject(), id: order.trackingId, totalPrice: order.pricing?.totalPrice },
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[API /orders PUT] Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
