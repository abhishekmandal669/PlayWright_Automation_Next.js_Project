import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    const headers = [
      'Order Number',
      'Tracking ID',
      'Customer Name',
      'Customer Email',
      'Origin',
      'Destination',
      'Package Title',
      'Quantity',
      'Actual Weight (kg)',
      'Total Price (USD)',
      'Status',
      'Assigned Driver',
      'Driver Vehicle',
      'Booking Date',
    ];

    const rows = orders.map((o) => {
      const numDisplay = o.orderNumber || (o.orderId ? o.orderId.replace(/\D/g, '') : '1001');
      const driverName = o.assignedDriver?.driverName || 'Unassigned';
      const vehicle = o.assignedDriver?.vehicleNumber || '—';
      const date = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
      const price = o.pricing?.totalPrice || o.totalPrice || 25.0;

      return [
        `ORD-${numDisplay}`,
        `"${o.trackingId || ''}"`,
        `"${o.userName || ''}"`,
        `"${o.userEmail || ''}"`,
        `"${o.origin || ''}"`,
        `"${o.destination || ''}"`,
        `"${o.packageName || ''}"`,
        o.quantity || 1,
        o.weight || 1,
        price.toFixed(2),
        `"${o.status || ''}"`,
        `"${driverName}"`,
        `"${vehicle}"`,
        date,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="freightproxy_manifest_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/export error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error generating export' }, { status: 500 });
  }
}
