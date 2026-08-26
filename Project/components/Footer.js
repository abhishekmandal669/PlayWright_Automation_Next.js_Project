'use client';

export default function Footer() {
  return (
    <footer className="w-full mt-12 py-6 text-center text-xs font-semibold text-slate-500 border-t border-[var(--line)] bg-[var(--card)] font-['IBM_Plex_Sans']">
      <p>© {new Date().getFullYear()} FreightProxy.io Target App | All Rights Reserved</p>
    </footer>
  );
}
