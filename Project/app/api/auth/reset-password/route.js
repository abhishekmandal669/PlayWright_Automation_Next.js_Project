import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import { hashPassword } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body || {};

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Please provide email, verification code, and new password.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = await User.findOne({ email: cleanEmail })
      .select('+resetPasswordOtp +resetPasswordExpires');

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      return NextResponse.json(
        { success: false, message: 'No active password reset request found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (user.resetPasswordOtp !== cleanOtp) {
      return NextResponse.json(
        { success: false, message: 'Invalid 6-digit verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset OTP fields
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        $unset: { resetPasswordOtp: 1, resetPasswordExpires: 1 },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset! You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('POST /api/auth/reset-password error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
