import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '../../../../../lib/dbConnect';
import User from '../../../../../models/User';
import { verifyToken, hashPassword } from '../../../../../lib/auth';

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

// GET /api/admin/users/[id] - Get single user with audit logs
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Staff access required' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await User.findById(id, '-passwordHash -mfaSecret -mfaTempSecret -mfaBackupCodes -resetPasswordOtp').lean();
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Sort audit logs newest first
    if (Array.isArray(targetUser.auditLogs)) {
      targetUser.auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    return NextResponse.json({ success: true, user: targetUser });
  } catch (err) {
    console.error('GET /api/admin/users/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Edit user details & record audit trail
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const caller = getStaffCaller();
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Staff access required' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, role, department, title, phone, status, newPassword, auditRemark } = body || {};

    // Only Admin can assign Admin role
    if (role === 'Admin' && caller.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Only SuperAdmin can assign Admin role.' }, { status: 403 });
    }

    const changes = {};
    const changeDescriptions = [];

    // Track Name Change
    if (name && String(name).trim() && String(name).trim() !== targetUser.name) {
      changes.name = { from: targetUser.name, to: String(name).trim() };
      changeDescriptions.push(`Name changed from "${targetUser.name}" to "${String(name).trim()}"`);
      targetUser.name = String(name).trim();
    }

    // Track Email Change
    if (email && String(email).trim() && String(email).trim().toLowerCase() !== targetUser.email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: targetUser._id } });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Another account already uses this email address.' }, { status: 409 });
      }
      changes.email = { from: targetUser.email, to: cleanEmail };
      changeDescriptions.push(`Email changed from "${targetUser.email}" to "${cleanEmail}"`);
      targetUser.email = cleanEmail;
    }

    // Track Role Change
    if (role && ['Admin', 'Manager', 'User'].includes(role) && role !== targetUser.role) {
      changes.role = { from: targetUser.role, to: role };
      changeDescriptions.push(`Role changed from "${targetUser.role}" to "${role}"`);
      targetUser.role = role;
    }

    // Track Department Change
    if (department !== undefined && String(department).trim() !== (targetUser.department || '')) {
      changes.department = { from: targetUser.department || 'None', to: String(department).trim() };
      changeDescriptions.push(`Department changed from "${targetUser.department || 'None'}" to "${String(department).trim()}"`);
      targetUser.department = String(department).trim();
    }

    // Track Title Change
    if (title !== undefined && String(title).trim() !== (targetUser.title || '')) {
      changes.title = { from: targetUser.title || 'None', to: String(title).trim() };
      changeDescriptions.push(`Job Title changed from "${targetUser.title || 'None'}" to "${String(title).trim()}"`);
      targetUser.title = String(title).trim();
    }

    // Track Phone Change
    if (phone !== undefined && String(phone).trim() !== (targetUser.phone || '')) {
      changes.phone = { from: targetUser.phone || 'None', to: String(phone).trim() };
      changeDescriptions.push(`Phone changed from "${targetUser.phone || 'None'}" to "${String(phone).trim()}"`);
      targetUser.phone = String(phone).trim();
    }

    // Track Status Change
    if (status && ['Active', 'Suspended', 'Pending'].includes(status) && status !== (targetUser.status || 'Active')) {
      changes.status = { from: targetUser.status || 'Active', to: status };
      changeDescriptions.push(`Status changed from "${targetUser.status || 'Active'}" to "${status}"`);
      targetUser.status = status;
    }

    // Track Password Reset
    if (newPassword && String(newPassword).length >= 6) {
      targetUser.passwordHash = await hashPassword(String(newPassword));
      changes.password = { updated: true };
      changeDescriptions.push(`Password reset by administrator`);
    }

    // If changes were made, append to auditLogs
    if (changeDescriptions.length > 0 || auditRemark) {
      const summaryText = changeDescriptions.length > 0 
        ? changeDescriptions.join('; ') 
        : (auditRemark || 'User account updated');

      if (!Array.isArray(targetUser.auditLogs)) {
        targetUser.auditLogs = [];
      }

      targetUser.auditLogs.push({
        action: changes.role ? 'ROLE_CHANGED' : changes.status ? 'STATUS_CHANGED' : changes.password ? 'PASSWORD_RESET' : 'PROFILE_UPDATED',
        description: auditRemark ? `${summaryText} (Remark: ${auditRemark})` : summaryText,
        performedBy: {
          name: caller.name || 'Staff User',
          email: caller.email || '',
          role: caller.role || 'Manager',
        },
        changes,
        timestamp: new Date(),
      });
    }

    await targetUser.save();

    const sanitized = targetUser.toObject();
    delete sanitized.passwordHash;
    delete sanitized.mfaSecret;
    delete sanitized.mfaTempSecret;
    delete sanitized.mfaBackupCodes;
    delete sanitized.resetPasswordOtp;

    if (Array.isArray(sanitized.auditLogs)) {
      sanitized.auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    return NextResponse.json({
      success: true,
      message: `User ${sanitized.name} updated successfully!`,
      user: sanitized,
    });
  } catch (err) {
    console.error('PATCH /api/admin/users/[id] error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
