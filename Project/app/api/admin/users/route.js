import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import { verifyToken, hashPassword } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function getStaffCaller() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('fp_session')?.value || cookieStore.get('session_token')?.value;
    if (!token) return null;
    const caller = verifyToken(token);
    if (!caller || (caller.role !== 'Admin' && caller.role !== 'Manager')) return null;
    return caller;
  } catch {
    return null;
  }
}

// GET /api/admin/users - List all registered users
export async function GET() {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Staff access required' }, { status: 403 });
    }

    const users = await User.find({}, '-passwordHash -mfaSecret -mfaTempSecret -mfaBackupCodes -resetPasswordOtp')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user account
export async function POST(request) {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Staff access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, department, title, phone, status } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Full name, email address, and temporary password are required.' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));
    const newUser = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: ['Admin', 'Manager', 'User'].includes(role) ? role : 'User',
      department: department ? String(department).trim() : 'Operations',
      title: title ? String(title).trim() : 'Logistics Associate',
      phone: phone ? String(phone).trim() : '',
      status: ['Active', 'Suspended', 'Pending'].includes(status) ? status : 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({
      success: true,
      message: `User account for ${newUser.name} created successfully!`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        title: newUser.title,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Edit user details, role, status or reset password
export async function PATCH(request) {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Staff access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, name, email, role, department, title, phone, status, newPassword } = body || {};

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required.' }, { status: 400 });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // Only Admin can modify another Admin or elevate to Admin
    if (role === 'Admin' && caller.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Only SuperAdmin can assign Admin role.' }, { status: 403 });
    }

    const updates = {};
    if (name && String(name).trim()) updates.name = String(name).trim();
    if (email && String(email).trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail !== userToUpdate.email) {
        const emailConflict = await User.findOne({ email: cleanEmail });
        if (emailConflict) {
          return NextResponse.json({ success: false, message: 'Another account already uses this email.' }, { status: 409 });
        }
        updates.email = cleanEmail;
      }
    }
    if (role && ['Admin', 'Manager', 'User'].includes(role)) updates.role = role;
    if (department !== undefined) updates.department = String(department).trim();
    if (title !== undefined) updates.title = String(title).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (status && ['Active', 'Suspended', 'Pending'].includes(status)) updates.status = status;
    if (newPassword && String(newPassword).length >= 6) {
      updates.passwordHash = await hashPassword(String(newPassword));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select('-passwordHash -mfaSecret -mfaTempSecret')
      .lean();

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully!`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('PATCH /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Remove user account
export async function DELETE(request) {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller || caller.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized: Only SuperAdmin can delete users.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || (await request.json().catch(() => ({})))?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required.' }, { status: 400 });
    }

    // Safety check: Cannot delete own account
    if (caller.id === userId || caller._id === userId) {
      return NextResponse.json({ success: false, message: 'You cannot delete your own logged-in admin account.' }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User account ${deleted.name} (${deleted.email}) deleted successfully.`,
    });
  } catch (err) {
    console.error('DELETE /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
