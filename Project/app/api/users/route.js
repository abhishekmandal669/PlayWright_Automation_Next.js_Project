import { NextResponse } from 'next/server';
import { getUsers, updateUserRole, toggleUserStatus, addUser } from '../../../lib/users';

export async function GET() {
  return NextResponse.json({ success: true, users: getUsers() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ success: false, message: 'Missing user details.' }, { status: 400 });
    }
    const newUser = addUser(body);
    return NextResponse.json({ success: true, message: 'New user added successfully!', user: newUser }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { action, email, role } = body;

    if (action === 'updateRole') {
      const ok = updateUserRole(email, role);
      if (ok) {
        return NextResponse.json({ success: true, message: `User role updated to ${role}.` });
      }
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (action === 'toggleStatus') {
      const newStatus = toggleUserStatus(email);
      if (newStatus) {
        return NextResponse.json({ success: true, message: `User status changed to ${newStatus}.`, newStatus });
      }
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
