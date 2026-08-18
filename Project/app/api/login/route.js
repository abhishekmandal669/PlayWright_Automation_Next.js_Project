import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { email, password } = body || {};

    // Simulate network latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check pre-seeded fallback demo credentials first
    if (
      (cleanEmail === 'user@example.com' && password === 'password123') ||
      (cleanEmail === 'tomsmith' && password === 'SuperSecretPassword!')
    ) {
      return NextResponse.json(
        {
          success: true,
          message: 'Authentication successful! Redirecting to workspace...',
          user: {
            name: 'Demo Admin',
            email: cleanEmail,
            role: 'Senior QA Specialist',
          },
          token: 'session-jwt-token-' + Date.now(),
        },
        { status: 200 }
      );
    }

    // Connect to MongoDB & query user
    try {
      await dbConnect();
      const user = await User.findOne({ email: cleanEmail });

      if (user && user.password === password) {
        return NextResponse.json(
          {
            success: true,
            message: 'Authentication successful! Redirecting to workspace...',
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
            token: 'session-jwt-token-' + Date.now(),
          },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn('MongoDB query warning, using fallback logic:', dbErr.message);
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
