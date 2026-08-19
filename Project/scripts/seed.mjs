/**
 * Database Seed Script — SuperAdmin Only
 *
 * Run: npm run seed
 *
 * Creates ONLY the SuperAdmin account.
 * - Users: Admin creates from Admin Panel
 * - Orders: Users create themselves from Dashboard
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/playwright_portal';

// ── Inline schema (standalone script — no Next.js module resolution) ──────────

const UserSchema = new mongoose.Schema(
  {
    name:        { type: String, trim: true },
    email:       { type: String, unique: true, lowercase: true, trim: true },
    passwordHash:{ type: String, select: false },
    role:        { type: String, enum: ['Admin', 'Manager', 'User'], default: 'User' },
    isAdmin:     { type: Boolean, default: false },
    department:  { type: String, default: 'Operations' },
    title:       { type: String, default: 'Shipping Associate' },
    phone:       { type: String, default: '' },
    status:      { type: String, default: 'Active' },
    lastLoginAt: { type: Date, default: null },
    joinedDate:  { type: String },
  },
  { timestamps: true, collection: 'users' }
);

const OrderSchema = new mongoose.Schema({}, { collection: 'orders' });

const User  = mongoose.models.User  || mongoose.model('User',  UserSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 FreightProxy.io — Seed Script');
  console.log('=================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected:', MONGODB_URI);

  // ── 1. Clear ALL collections (fresh start) ──
  console.log('\n🗑️  Clearing all data...');
  const deletedOrders = await Order.deleteMany({});
  const deletedUsers  = await User.deleteMany({});
  console.log(`   Orders removed : ${deletedOrders.deletedCount}`);
  console.log(`   Users  removed : ${deletedUsers.deletedCount}`);

  // ── 2. Create ONLY SuperAdmin ──────────────────
  console.log('\n👑 Creating SuperAdmin...');

  const adminEmail = process.env.SUPER_ADMIN_EMAIL    || 'jrqaengineer06@gmail.com';
  const adminPass  = process.env.SUPER_ADMIN_PASSWORD || 'Password@123';
  const adminName  = process.env.SUPER_ADMIN_NAME     || 'System SuperAdmin';

  const passwordHash = await bcrypt.hash(adminPass, 12);

  await User.create({
    name:        adminName,
    email:       adminEmail.toLowerCase(),
    passwordHash,
    role:        'Admin',
    isAdmin:     true,
    department:  'Executive Operations',
    title:       'System Administrator',
    phone:       '',
    joinedDate:  new Date().toISOString().split('T')[0],
    status:      'Active',
  });

  console.log(`   ✅ Name  : ${adminName}`);
  console.log(`   ✅ Email : ${adminEmail}`);
  console.log(`   ✅ Role  : Admin (SuperAdmin)`);

  // ── 3. Summary ────────────────────────────────
  console.log('\n=================================');
  console.log('🎉 Done! Database is clean.');
  console.log('\n🔐 Login Credentials:');
  console.log(`   Email    : ${adminEmail}`);
  console.log(`   Password : ${adminPass}`);
  console.log('\n📌 What to do next:');
  console.log('   • Login as Admin → create Managers & Users from Admin Panel');
  console.log('   • Users login → create orders from their Dashboard');
  console.log('=================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
