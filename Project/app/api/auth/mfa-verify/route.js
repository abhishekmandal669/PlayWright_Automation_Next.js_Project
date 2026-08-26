import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import { verifyToken, signToken, getCookieOptions } from '../../../../lib/auth';
import { verifyTotpCode } from '../../../../lib/totp';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { tempToken, code } = body || {};

    if (!tempToken || !code) {
      return NextResponse.json(
        { success: false, message: 'Missing temporary token or 6-digit verification code.' },
        { status: 400 }
      );
    }

    const decoded = verifyToken(tempToken);
    if (!decoded || !decoded.userId || !decoded.pendingMfa) {
      return NextResponse.json(
        { success: false, message: 'Session challenge expired. Please sign in again.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(decoded.userId).select('+mfaSecret +mfaBackupCodes');

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { success: false, message: 'Two-Factor Authentication is not configured for this account.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let isVerified = false;

    // Check TOTP code
    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
      isVerified = verifyTotpCode(cleanCode, user.mfaSecret);
    }

    // Check Backup Recovery Codes (e.g. XXXX-XXXX)
    if (!isVerified && user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
      const backupIndex = user.mfaBackupCodes.findIndex(
        (bc) => bc.toUpperCase().replace(/\s|-/g, '') === cleanCode.toUpperCase().replace(/\s|-/g, '')
      );
      if (backupIndex !== -1) {
        isVerified = true;
        // Consume backup code
        user.mfaBackupCodes.splice(backupIndex, 1);
        await User.updateOne({ _id: user._id }, { $set: { mfaBackupCodes: user.mfaBackupCodes } });
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication code. Please check your Google Authenticator app and try again.' },
        { status: 400 }
      );
    }

    // Update lastLoginAt
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // Build JWT payload
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
        message: `Authentication successful! Welcome back, ${user.name}.`,
        user: tokenPayload,
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set('fp_session', token, getCookieOptions());

    return response;
  } catch (err) {
    console.error('POST /api/auth/mfa-verify error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
