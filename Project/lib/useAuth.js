'use client';

/**
 * useAuth — centralized React hook for session management.
 *
 * Calls GET /api/auth/me on every mount to validate the HTTP-only
 * JWT cookie. All protected pages use this hook instead of reading
 * localStorage directly.
 *
 * Returns:
 *   { user, loading, logout }
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth({ requiredRole = null, redirectTo = '/' } = {}) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (_) {}
    // Always clear local state and redirect, even if API call fails
    setUser(null);
    router.push('/');
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        let res = await fetch('/api/auth/me', { credentials: 'include' });

        // Handle WebKit/Mobile Safari localhost cookie synchronization latency
        if (!res.ok && res.status === 401) {
          await new Promise((r) => setTimeout(r, 200));
          if (cancelled) return;
          res = await fetch('/api/auth/me', { credentials: 'include' });
        }

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
            // Not logged in — redirect to login
            router.replace(redirectTo);
          }
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (!data.success || !data.user) {
          setUser(null);
          setLoading(false);
          router.replace(redirectTo);
          return;
        }

        const u = data.user;

        // Role-based guard
        if (requiredRole) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!roles.includes(u.role)) {
            setUser(u);
            setLoading(false);
            // Redirect unauthorized role to their own dashboard
            const roleDash = u.role === 'Admin' ? '/admin'
                           : u.role === 'Manager' ? '/manager'
                           : '/dashboard';
            router.replace(roleDash);
            return;
          }
        }

        setUser(u);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    verifySession();
    return () => { cancelled = true; };
  }, [requiredRole, redirectTo, router]);

  return { user, loading, logout };
}
