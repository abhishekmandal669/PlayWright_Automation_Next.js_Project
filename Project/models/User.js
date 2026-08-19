/**
 * User Model — MongoDB Schema
 * 
 * Professional design with full role hierarchy,
 * bcrypt-hashed passwords, and audit timestamps.
 */

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // Core Identity
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries by default
    },

    // Role & Access
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'User'],
      default: 'User',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    // Profile Info
    department: {
      type: String,
      default: 'Operations',
      trim: true,
    },
    title: {
      type: String,
      default: 'Shipping Associate',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    avatarInitials: {
      type: String,
      default: '',
    },

    // Account Status
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Pending'],
      default: 'Active',
    },

    // Audit
    lastLoginAt: {
      type: Date,
      default: null,
    },
    joinedDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    collection: 'users',
  }
);

// Indexes for fast lookup
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
