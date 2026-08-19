import { NextResponse } from 'next/server';

/**
 * GET /api/auth/demo-info
 * Returns the SuperAdmin email for display on the login page.
 * Password is NEVER returned — only a hint that credentials exist.
 */
export async function GET() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@freightproxy.io';
  const adminName  = process.env.SUPER_ADMIN_NAME  || 'System SuperAdmin';

  return NextResponse.json({
    success: true,
    admin: {
      name: adminName,
      email: adminEmail,
      role: 'Admin',
      hint: 'Contact your IT administrator for login credentials.',
    },
  });
}
