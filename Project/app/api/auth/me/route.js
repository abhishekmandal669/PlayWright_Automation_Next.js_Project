import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

import mongoose from 'mongoose';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

// This route reads cookies on every request — must never be statically rendered
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Validates the HTTP-only session cookie and returns the authenticated user payload.
 * Returns 401 if no valid session exists.
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('fp_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'No active session.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(sessionCookie.value);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Session expired or invalid. Please log in again.' },
        { status: 401 }
      );
    }

    let dbUser = null;
    try {
      await dbConnect();
      if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
        dbUser = await User.findById(decoded.id).lean();
      }
      if (!dbUser && decoded.email) {
        dbUser = await User.findOne({ email: decoded.email.trim().toLowerCase() }).lean();
      }
    } catch (dbErr) {
      console.error('[API /auth/me DB error]:', dbErr);
    }

    const u = dbUser || decoded;

    // Return sanitized user payload
    return NextResponse.json(
      {
        success: true,
        user: {
          id: decoded.id || u._id?.toString(),
          email: u.email || decoded.email,
          name: u.name || decoded.name,
          role: u.role || decoded.role,
          department: u.department || decoded.department,
          title: u.title || decoded.title,
          status: u.status || decoded.status,
          joinedDate: u.joinedDate || decoded.joinedDate,
          avatarUrl: u.avatarUrl || decoded.avatarUrl || '',
          mfaEnabled: !!u.mfaEnabled,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /auth/me] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
