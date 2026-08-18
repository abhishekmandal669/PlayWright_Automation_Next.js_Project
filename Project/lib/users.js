// In-memory user store for demo application

const users = [
  {
    name: 'Demo Admin',
    email: 'user@example.com',
    password: 'password123',
    role: 'Senior QA Specialist'
  },
  {
    name: 'Tom Smith',
    email: 'tomsmith',
    password: 'SuperSecretPassword!',
    role: 'Test Engineer'
  }
];

export function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
}

export function addUser(newUser) {
  const user = {
    name: newUser.name.trim(),
    email: newUser.email.trim().toLowerCase(),
    password: newUser.password,
    role: newUser.role || 'Member Specialist'
  };
  users.push(user);
  return user;
}
