import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { cookies } from 'next/headers';

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

    // Return sanitized user payload (JWT already excludes passwordHash)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          department: decoded.department,
          title: decoded.title,
          status: decoded.status,
          joinedDate: decoded.joinedDate,
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
