import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Driver from '../../../models/Driver';

export const dynamic = 'force-dynamic';

const INITIAL_DEMO_DRIVERS = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@freightproxy.io',
    phone: '+91 98765 43210',
    licenseNumber: 'DL-04202100892',
    vehicleNumber: 'DL-01-AB-1234',
    vehicleType: 'Delivery Van',
    status: 'Active',
    totalDeliveries: 142,
    rating: 4.9,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@freightproxy.io',
    phone: '+91 98123 45678',
    licenseNumber: 'MH-02202000543',
    vehicleNumber: 'MH-02-CD-5678',
    vehicleType: 'Light Truck',
    status: 'Active',
    totalDeliveries: 98,
    rating: 4.8,
  },
  {
    name: 'Amitabh Sharma',
    email: 'amitabh.sharma@freightproxy.io',
    phone: '+91 97234 56789',
    licenseNumber: 'KA-01201900124',
    vehicleNumber: 'KA-04-EF-9988',
    vehicleType: 'Heavy Freight',
    status: 'On Route',
    totalDeliveries: 215,
    rating: 5.0,
  },
  {
    name: 'Gurpreet Singh',
    email: 'gurpreet.s@freightproxy.io',
    phone: '+91 96345 67890',
    licenseNumber: 'PB-10202200781',
    vehicleNumber: 'PB-10-GH-4321',
    vehicleType: 'Air Cargo Shuttle',
    status: 'Off Duty',
    totalDeliveries: 67,
    rating: 4.7,
  },
];

export async function GET(request) {
  try {
    await dbConnect();

    // Check count and auto-seed if empty
    const count = await Driver.countDocuments();
    if (count === 0) {
      await Driver.insertMany(INITIAL_DEMO_DRIVERS);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const drivers = await Driver.find(query).sort({ status: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (err) {
    console.error('GET /api/drivers error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, email, phone, licenseNumber, vehicleNumber, vehicleType, status } = body || {};

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, message: 'Driver name, email, and phone are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Driver.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A driver with this email address already exists.' },
        { status: 400 }
      );
    }

    const driver = await Driver.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      licenseNumber: (licenseNumber || '').trim(),
      vehicleNumber: (vehicleNumber || '').trim(),
      vehicleType: vehicleType || 'Delivery Van',
      status: status || 'Active',
      totalDeliveries: 0,
      rating: 5.0,
    });

    return NextResponse.json({
      success: true,
      message: `Driver ${driver.name} successfully registered!`,
      driver,
    });
  } catch (err) {
    console.error('POST /api/drivers error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
