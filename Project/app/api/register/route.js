import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { findUserByEmail, addUser } from '../../../lib/users';

export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { name, email, password } = body || {};

    // Simulate network latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: 'Full Name is required.' },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { success: false, message: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check memory store fallback
    const memUser = findUserByEmail(cleanEmail);
    if (memUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Try MongoDB connection & persistence
    try {
      await dbConnect();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists in MongoDB. Please sign in instead.' },
          { status: 409 }
        );
      }

      const newUser = await User.create({
        name: String(name).trim(),
        email: cleanEmail,
        password: String(password),
        role: 'Senior QA Specialist',
      });

      // Also add to memory store for fast secondary lookups
      addUser({ name, email: cleanEmail, password });

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully! You can now log in.',
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.warn('MongoDB store error, falling back to memory store:', dbErr.message);
      // Fallback registration in memory store
      const newUser = addUser({ name: String(name).trim(), email: cleanEmail, password: String(password) });
      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully! You can now log in.',
          user: {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('API Registration Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error during registration.' },
      { status: 500 }
    );
  }
}
