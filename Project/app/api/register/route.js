import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { hashPassword } from '../../../lib/auth';

export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }

    const { name, email, password } = body || {};

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, message: 'Full Name is required.' }, { status: 400 });
    }
    if (!email || !String(email).trim()) {
      return NextResponse.json({ success: false, message: 'Email address is required.' }, { status: 400 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    await dbConnect();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    const newUser = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: 'User',
      department: 'Operations',
      title: 'Shipping Associate',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! You can now log in.',
        user: {
          id:    newUser._id,
          name:  newUser.name,
          email: newUser.email,
          role:  newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /register] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error during registration.' },
      { status: 500 }
    );
  }
}
