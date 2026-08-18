import { NextResponse } from 'next/server';
import { findUserByEmail } from '../../../lib/users';

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { email, password } = body || {};

    // Simulate network latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);

    if (user && user.password === password) {
      if (user.status === 'Suspended') {
        return NextResponse.json(
          {
            success: false,
            message: 'Your account has been suspended by an Administrator. Please contact support.',
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Welcome back, ${user.name}! Authenticated as ${user.role}.`,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            title: user.title,
            status: user.status,
            joinedDate: user.joinedDate
          },
          token: 'session-jwt-token-' + Date.now(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid email or password. Please check your credentials and try again.',
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error: Unable to complete authentication.',
      },
      { status: 500 }
    );
  }
}
