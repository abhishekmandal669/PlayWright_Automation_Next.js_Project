import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../lib/auth';
import { verifyTotpCode } from '../../../../../lib/totp';

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
    const { code, backupCodes } = body || {};

    if (!code || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Please enter the 6-digit code shown in your Google Authenticator app.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findById(caller.id || caller._id).select('+mfaTempSecret');

    if (!user || !user.mfaTempSecret) {
      return NextResponse.json(
        { success: false, message: 'No pending 2FA setup found. Please restart 2FA setup.' },
        { status: 400 }
      );
    }

    // Verify 6-digit TOTP code against temporary secret
    const isValid = verifyTotpCode(code.trim(), user.mfaTempSecret);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid 6-digit code. Please make sure your device clock is synchronized and enter the current code.' },
        { status: 400 }
      );
    }

    // Activate MFA permanently
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          mfaEnabled: true,
          mfaSecret: user.mfaTempSecret,
          mfaBackupCodes: Array.isArray(backupCodes) ? backupCodes : [],
        },
        $unset: { mfaTempSecret: 1 },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Google Authenticator (2FA) has been successfully activated for your account!',
    });
  } catch (err) {
    console.error('POST /api/auth/mfa/enable error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
