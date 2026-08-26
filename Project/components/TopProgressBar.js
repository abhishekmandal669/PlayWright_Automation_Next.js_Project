'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress on route change
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || target.getAttribute('target') === '_blank') {
        return;
      }

      // If internal link to a different page, trigger loader
      if (href.startsWith('/') && href !== window.location.pathname) {
        setLoading(true);
        setProgress(30);

        setTimeout(() => {
          setProgress((prev) => (prev < 80 ? prev + 35 : prev));
        }, 150);
      }
    };

    const handleCustomStart = () => {
      setLoading(true);
      setProgress(40);
      setTimeout(() => {
        setProgress((prev) => (prev < 85 ? prev + 30 : prev));
      }, 200);
    };

    const handleCustomStop = () => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    window.addEventListener('app-loading-start', handleCustomStart);
    window.addEventListener('app-loading-stop', handleCustomStop);

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      window.removeEventListener('app-loading-start', handleCustomStart);
      window.removeEventListener('app-loading-stop', handleCustomStop);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      id="top-progress-bar"
      className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #4F46E5 0%, #3B82F6 50%, #06B6D4 100%)',
        boxShadow: '0 0 10px rgba(79, 70, 229, 0.7), 0 0 5px rgba(6, 182, 212, 0.5)',
      }}
    >
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-white/40 blur-[2px] animate-pulse" />
    </div>
  );
}
