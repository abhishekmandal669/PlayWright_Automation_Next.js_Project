import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Driver from '../../../../models/Driver';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const driver = await Driver.findById(params.id);
    if (!driver) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, driver });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();

    const updated = await Driver.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Driver ${updated.name} updated successfully!`,
      driver: updated,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const deleted = await Driver.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Driver not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: `Driver ${deleted.name} removed successfully.`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
