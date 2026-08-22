/**
 * lib/users.js
 *
 * NOTE: All primary user operations now go through MongoDB via /models/User.js
 *
 * This file retains the in-memory fallback ONLY for the ENV-based SuperAdmin
 * bootstrap during startup (before MongoDB is confirmed available).
 *
 * The global._userRegistry is used by the in-memory auth fallback path
 * in case MongoDB is temporarily unavailable.
 */

import bcrypt from 'bcryptjs';

function buildInitialUsers() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'jrqaengineer06@gmail.com';
  const adminName  = process.env.SUPER_ADMIN_NAME  || 'System SuperAdmin';

  return [
    {
      id: 'USR-0001',
      name: adminName,
      email: adminEmail.trim().toLowerCase(),
      role: 'Admin',
      department: 'Executive Operations',
      title: 'System Administrator',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      isAdmin: true,
    },
  ];
}

if (!global._userRegistry) {
  global._userRegistry = buildInitialUsers();
}
const users = global._userRegistry;

export function getUsers()                   { return users.map(sanitize); }
export function findUserByEmail(email)       { if (!email) return null; const c = email.trim().toLowerCase(); return users.find(u => u.email === c) || null; }
export function findUserById(id)             { return users.find(u => u.id === id) || null; }
export function addUser({ name, email, passwordHash, role = 'User', department = 'Operations', title = 'Shipping Associate' }) {
  const clean = email.trim().toLowerCase();
  if (findUserByEmail(clean)) return null;
  const user = { id: `USR-${String(1000 + users.length + 1).padStart(4, '0')}`, name: name.trim(), email: clean, passwordHash, role, department, title, status: 'Active', joinedDate: new Date().toISOString().split('T')[0], isAdmin: false };
  users.push(user);
  return sanitize(user);
}
export function updateUserRole(email, newRole) { const u = findUserByEmail(email); if (!u || u.isAdmin) return false; u.role = newRole; return true; }
export function toggleUserStatus(email)        { const u = findUserByEmail(email); if (!u || u.isAdmin) return null; u.status = u.status === 'Active' ? 'Suspended' : 'Active'; return u.status; }
export function sanitize({ passwordHash, ...clean }) { return clean; }
