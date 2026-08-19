import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { comparePassword, signToken, getCookieOptions } from '../../../lib/auth';

export async function POST(request) {
  try {
    let body = {};
    try { body = await request.json(); } catch { body = {}; }

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Explicitly select passwordHash (excluded by default via `select: false`)
    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash');

    if (!user) {
      // Constant-time: still run a bcrypt compare to prevent timing attacks
      await comparePassword(password, '$2a$12$invalidhashtopreventtimingxx0000000000000000000000000000');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    if (user.status === 'Suspended') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Update lastLoginAt
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // Build JWT payload — never include passwordHash
    const tokenPayload = {
      id:         user._id.toString(),
      email:      user.email,
      name:       user.name,
      role:       user.role,
      isAdmin:    user.isAdmin,
      department: user.department,
      title:      user.title,
      status:     user.status,
      joinedDate: user.joinedDate,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        message: `Welcome back, ${user.name}! Logged in as ${user.role}.`,
        user: tokenPayload,
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set('fp_session', token, getCookieOptions());

    return response;
  } catch (error) {
    console.error('[API /login] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
