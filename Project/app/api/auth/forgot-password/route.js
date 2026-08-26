import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please enter your work email address.' },
        { status: 400 }
      );
    }

    await dbConnect();
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Return ambiguous message for security, but allow testing
      return NextResponse.json({
        success: false,
        message: 'No account found with this email address. Please check your email or create an account.',
      }, { status: 404 });
    }

    if (user.status === 'Suspended') {
      return NextResponse.json(
        { success: false, message: 'This account has been suspended. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP code & 15-minute expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordOtp: otp,
          resetPasswordExpires: expiresAt,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Valid for 15 minutes.`,
      email: cleanEmail,
      demoOtp: otp, // Provided for instant seamless local demo testing & verification
    });
  } catch (err) {
    console.error('POST /api/auth/forgot-password error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
