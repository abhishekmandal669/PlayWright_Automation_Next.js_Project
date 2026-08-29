import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getAdminCaller() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value || cookieStore.get('session_token')?.value;
    if (!token) return null;
    const caller = verifyToken(token);
    if (!caller || (caller.role !== 'Admin' && caller.role !== 'Manager')) return null;
    return caller;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = getAdminCaller();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
    }

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
