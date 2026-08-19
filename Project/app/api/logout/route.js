import { NextResponse } from 'next/server';

/**
 * POST /api/logout
 * Clears the HTTP-only session cookie, terminating the user's session.
 */
export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully.' },
    { status: 200 }
  );

  // Clear the session cookie by setting maxAge to 0
  response.cookies.set('fp_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
