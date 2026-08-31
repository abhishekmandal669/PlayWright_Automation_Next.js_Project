'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();
  const pathname              = usePathname();

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const userKey = `fp_avatar_${data.user.email?.toLowerCase()}`;
          const localAvatar = typeof window !== 'undefined' ? (localStorage.getItem(userKey) || '') : '';
          const finalUser = {
            ...data.user,
            avatarUrl: data.user.avatarUrl || localAvatar || '',
          };
          setUser(finalUser);
          if (data.user.avatarUrl && typeof window !== 'undefined') {
            localStorage.setItem(userKey, data.user.avatarUrl);
          }
          setLoading(false);
          return finalUser;
        }
      }
      setUser(null);
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // Initial session load once on application mount
  useEffect(() => {
    fetchSession();

    const handleProfileUpdate = () => {
      fetchSession();
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app-loading-start'));
      }
      await fetch('/api/logout', { method: 'POST' });
    } catch (_) {}
    setUser(null);
    router.push('/');
  }, [router]);

  const updateAuthUser = useCallback((newUser) => {
    setUser(newUser);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchSession, setUser: updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
