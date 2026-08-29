'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '../context/AuthContext';

export function useAuth({ requiredRole = null, redirectTo = '/' } = {}) {
  const { user, loading, logout, refreshUser } = useAuthContext();
  const router = useRouter();
  const [checkedFresh, setCheckedFresh] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (!checkedFresh) {
          setCheckedFresh(true);
          refreshUser().then((freshUser) => {
            if (!freshUser && redirectTo) {
              router.replace(redirectTo);
            }
          });
        }
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
  }, [user, loading, requiredRole, redirectTo, router, refreshUser, checkedFresh]);

  return { user, loading, logout, refreshUser };
}

export default useAuth;
