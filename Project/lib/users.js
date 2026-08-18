// In-memory user store for demo application

const users = [
  {
    id: 'USR-1001',
    name: 'System SuperAdmin',
    email: 'admin@system.com',
    password: 'AdminPass123!',
    role: 'Admin',
    department: 'Executive Operations',
    title: 'Chief Technology Director',
    status: 'Active',
    joinedDate: '2024-01-15'
  },
  {
    id: 'USR-1002',
    name: 'Sarah Jenkins',
    email: 'manager@system.com',
    password: 'ManagerPass123!',
    role: 'Manager',
    department: 'Logistics & Dispatch Operations',
    title: 'Senior Freight Manager',
    status: 'Active',
    joinedDate: '2024-03-10'
  },
  {
    id: 'USR-1003',
    name: 'Demo User',
    email: 'user@example.com',
    password: 'password123',
    role: 'User',
    department: 'Quality Assurance',
    title: 'Senior QA Specialist',
    status: 'Active',
    joinedDate: '2024-05-20'
  },
  {
    id: 'USR-1004',
    name: 'Tom Smith',
    email: 'tomsmith',
    password: 'SuperSecretPassword!',
    role: 'User',
    department: 'Engineering',
    title: 'Test Engineer',
    status: 'Active',
    joinedDate: '2024-06-01'
  }
];

export function getUsers() {
  return users;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
}

export function addUser(newUser) {
  const user = {
    id: `USR-${1000 + users.length + 1}`,
    name: newUser.name.trim(),
    email: newUser.email.trim().toLowerCase(),
    password: newUser.password,
    role: newUser.role || 'User',
    department: newUser.department || 'Operations',
    title: newUser.title || 'Shipping Associate',
    status: 'Active',
    joinedDate: new Date().toISOString().split('T')[0]
  };
  users.push(user);
  return user;
}

export function updateUserRole(email, newRole) {
  const user = findUserByEmail(email);
  if (user) {
    user.role = newRole;
    return true;
  }
  return false;
}

export function toggleUserStatus(email) {
  const user = findUserByEmail(email);
  if (user) {
    user.status = user.status === 'Active' ? 'Suspended' : 'Active';
    return user.status;
  }
  return null;
}
