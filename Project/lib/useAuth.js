'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';

export function useAuth({ requiredRole = null, redirectTo = '/' } = {}) {
  const { user, loading, logout, refreshUser } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user && redirectTo) {
        router.replace(redirectTo);
        return;
      }

      if (user && requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) {
          const roleDash = user.role === 'Admin' ? '/admin'
                         : user.role === 'Manager' ? '/manager'
                         : '/dashboard';
          router.replace(roleDash);
        }
      }
    }
  }, [user, loading, requiredRole, redirectTo, router]);

  return { user, loading, logout, refreshUser };
}

export default useAuth;
