import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import User from '../../../../../models/User';
import { verifyToken } from '../../../../../lib/auth';
import { generateBase32Secret, getOtpAuthUri, generateBackupCodes } from '../../../../../lib/totp';

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

export async function GET() {
  try {
    const caller = getCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(caller.id || caller._id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Generate fresh Base32 secret for setup
    const secret = generateBase32Secret(20);
    const otpAuthUri = getOtpAuthUri(user.email, secret, 'FreightProxy');
    const backupCodes = generateBackupCodes(8);

    // Save temporary setup secret
    await User.updateOne(
      { _id: user._id },
      { $set: { mfaTempSecret: secret } }
    );

    return NextResponse.json({
      success: true,
      mfaEnabled: user.mfaEnabled || false,
      secret,
      otpAuthUri,
      backupCodes,
    });
  } catch (err) {
    console.error('GET /api/auth/mfa/setup error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
