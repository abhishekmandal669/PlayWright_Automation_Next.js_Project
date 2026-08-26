import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/dbConnect';
import SystemConfig from '../../../../models/SystemConfig';
import { verifyToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getAdminCaller() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value || cookieStore.get('session_token')?.value;
    if (!token) return null;
    const caller = verifyToken(token);
    if (!caller || caller.role !== 'Admin') return null;
    return caller;
  } catch {
    return null;
  }
}

const DEFAULT_RATES = {
  key: 'freight_rates',
  basePrice: 25.0,
  pricePerKg: 12.5,
  volumetricDivisor: 5000,
  fragileFee: 15.0,
  expressFee: 35.0,
  insurancePercentage: 1.5,
  fuelSurchargePercent: 4.5,
  updatedBy: 'System Default',
};

export async function GET() {
  try {
    await dbConnect();
    let config = await SystemConfig.findOne({ key: 'freight_rates' });
    if (!config) {
      config = await SystemConfig.create(DEFAULT_RATES);
    }
    return NextResponse.json({ success: true, rates: config });
  } catch (err) {
    console.error('GET /api/admin/rates error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const caller = getAdminCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      basePrice,
      pricePerKg,
      volumetricDivisor,
      fragileFee,
      expressFee,
      insurancePercentage,
      fuelSurchargePercent,
    } = body || {};

    const updated = await SystemConfig.findOneAndUpdate(
      { key: 'freight_rates' },
      {
        $set: {
          basePrice: typeof basePrice === 'number' ? basePrice : 25.0,
          pricePerKg: typeof pricePerKg === 'number' ? pricePerKg : 12.5,
          volumetricDivisor: typeof volumetricDivisor === 'number' ? volumetricDivisor : 5000,
          fragileFee: typeof fragileFee === 'number' ? fragileFee : 15.0,
          expressFee: typeof expressFee === 'number' ? expressFee : 35.0,
          insurancePercentage: typeof insurancePercentage === 'number' ? insurancePercentage : 1.5,
          fuelSurchargePercent: typeof fuelSurchargePercent === 'number' ? fuelSurchargePercent : 4.5,
          updatedBy: `${caller.name} (${caller.email})`,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Freight Rate Matrix updated successfully!',
      rates: updated,
    });
  } catch (err) {
    console.error('PATCH /api/admin/rates error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
