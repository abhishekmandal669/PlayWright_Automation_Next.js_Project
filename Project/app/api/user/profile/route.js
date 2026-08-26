import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import { verifyToken, signToken, getCookieOptions } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
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
        { success: false, message: 'Session expired or invalid.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { name, department, title, phone, avatarUrl } = body || {};

    let user = null;
    if (decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id);
    }
    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.trim().toLowerCase() });
    }

    if (!user && decoded.email) {
      user = await User.create({
        name: name || decoded.name || 'System SuperAdmin',
        email: decoded.email.trim().toLowerCase(),
        role: decoded.role || 'Admin',
        department: department || decoded.department || 'Executive Operations',
        title: title || decoded.title || 'System Administrator',
        status: 'Active',
        avatarUrl: avatarUrl || '',
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found in database.' },
        { status: 404 }
      );
    }

    if (name && typeof name === 'string') user.name = name.trim();
    if (department && typeof department === 'string') user.department = department.trim();
    if (title && typeof title === 'string') user.title = title.trim();
    if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim();
    if (avatarUrl !== undefined && typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;

    // Permanently save to MongoDB
    await user.save();

    // Re-sign lightweight JWT token without base64 to prevent cookie truncation
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      department: user.department,
      title: user.title,
      status: user.status,
      joinedDate: user.joinedDate,
    };

    const newToken = signToken(tokenPayload);

    const res = NextResponse.json({
      success: true,
      message: 'Profile and photo permanently saved to database!',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        title: user.title,
        status: user.status,
        joinedDate: user.joinedDate,
        avatarUrl: user.avatarUrl || '',
        mfaEnabled: !!user.mfaEnabled,
      },
    });

    res.cookies.set('fp_session', newToken, getCookieOptions());
    return res;
  } catch (err) {
    console.error('[API /user/profile POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
