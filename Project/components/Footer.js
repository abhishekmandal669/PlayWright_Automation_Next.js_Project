'use client';

export default function Footer() {
  return (
    <footer className="w-full py-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <p>© {new Date().getFullYear()} FreightProxy.io Target App | All Rights Reserved</p>
    </footer>
  );
}
