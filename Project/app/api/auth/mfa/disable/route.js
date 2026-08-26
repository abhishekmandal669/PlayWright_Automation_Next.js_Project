import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import User from '../../../../../models/User';
import { verifyToken, comparePassword } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getCaller() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value || cookieStore.get('session_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const caller = getCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body || {};

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Please enter your password to disable 2FA.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findById(caller.id || caller._id).select('+passwordHash');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect password.' }, { status: 400 });
    }

    // Disable MFA
    await User.updateOne(
      { _id: user._id },
      {
        $set: { mfaEnabled: false },
        $unset: { mfaSecret: 1, mfaTempSecret: 1, mfaBackupCodes: 1 },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) has been disabled.',
    });
  } catch (err) {
    console.error('POST /api/auth/mfa/disable error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
