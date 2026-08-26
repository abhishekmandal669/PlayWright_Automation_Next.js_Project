import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
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

export async function GET() {
  try {
    await dbConnect();
    const caller = getAdminCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const users = await User.find({}, '-password -mfaSecret -mfaTempSecret')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const caller = getAdminCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'Manager',
    });

    return NextResponse.json({
      success: true,
      message: `Staff account for ${newUser.name} created as ${newUser.role}!`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await dbConnect();
    const caller = getAdminCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, newPassword } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required.' }, { status: 400 });
    }

    const updates = {};
    if (role && ['Admin', 'Manager', 'User'].includes(role)) {
      updates.role = role;
    }
    if (newPassword && newPassword.length >= 6) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated to role ${updatedUser.role}!`,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error('PATCH /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
