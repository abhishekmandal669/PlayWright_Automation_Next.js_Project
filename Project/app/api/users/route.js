import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { hashPassword, verifyToken } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

/** Helper: get and verify caller's JWT from cookie */
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

/** GET /api/users — list all users (sanitized, no passwordHash) */
export async function GET() {
  try {
    const caller = getCallerFromRequest();
    if (!caller || (caller.role !== 'Admin' && caller.role !== 'Manager')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin or Manager session required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    const users = await User.find({}).sort({ createdAt: 1 }).lean();
    // Remove passwordHash from all results
    const safe = users.map(({ passwordHash, ...u }) => u);
    return NextResponse.json({ success: true, users: safe });
  } catch (err) {
    console.error('[API /users GET] Error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch users.' }, { status: 500 });
  }
}

/** POST /api/users — Admin creates a new user */
export async function POST(request) {
  try {
    const caller = getCallerFromRequest();
    if (!caller || caller.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin only.' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role = 'User', department = 'Operations', title = 'Shipping Associate' } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({ success: false, message: 'User with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(String(password));
    const newUser = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role,
      department,
      title,
      joinedDate: new Date().toISOString().split('T')[0],
    });

    const { passwordHash: _ph, ...safeUser } = newUser.toObject();
    return NextResponse.json({ success: true, message: `User ${newUser.name} created successfully.`, user: safeUser }, { status: 201 });
  } catch (err) {
    console.error('[API /users POST] Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/** PUT /api/users — Admin updates role or toggles status */
export async function PUT(request) {
  try {
    const caller = getCallerFromRequest();
    if (!caller || caller.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin only.' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { action, email, role } = body;

    const user = await User.findOne({ email: email?.trim().toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // Protect the SuperAdmin account
    if (user.isAdmin) {
      return NextResponse.json({ success: false, message: 'Cannot modify the SuperAdmin account.' }, { status: 403 });
    }

    if (action === 'updateRole') {
      user.role = role;
      await user.save();
      return NextResponse.json({ success: true, message: `Role updated to ${role}.` });
    }

    if (action === 'toggleStatus') {
      user.status = user.status === 'Active' ? 'Suspended' : 'Active';
      await user.save();
      return NextResponse.json({ success: true, message: `Status changed to ${user.status}.`, newStatus: user.status });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[API /users PUT] Error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
