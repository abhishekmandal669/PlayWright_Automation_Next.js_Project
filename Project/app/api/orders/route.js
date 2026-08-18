import { NextResponse } from 'next/server';
import { getOrders, getOrdersByUser, createOrder, updateOrderStatus, editOrder } from '../../../lib/orders';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  if (role === 'Admin' || role === 'Manager') {
    return NextResponse.json({ success: true, orders: getOrders() });
  }

  if (email) {
    return NextResponse.json({ success: true, orders: getOrdersByUser(email) });
  }

  return NextResponse.json({ success: true, orders: getOrders() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.origin || !body.destination || !body.packageName || !body.weight || !body.dimensions) {
      return NextResponse.json(
        { success: false, message: 'Missing required shipment details.' },
        { status: 400 }
      );
    }

    const newOrder = createOrder(body);
    return NextResponse.json({ success: true, message: 'Shipment Order created successfully!', order: newOrder }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { action, orderId, status, dispatchDate, updateData } = body;

    if (action === 'schedule' || action === 'updateStatus') {
      const updated = updateOrderStatus(orderId, status, dispatchDate);
      if (updated) {
        return NextResponse.json({ success: true, message: 'Order status & schedule updated successfully!', order: updated });
      }
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (action === 'edit') {
      const updated = editOrder(orderId, updateData);
      if (updated) {
        return NextResponse.json({ success: true, message: 'Order edited successfully!', order: updated });
      }
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
