import RegisterForm from '../../components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="w-full min-h-[calc(100vh-65px)] flex flex-col lg:flex-row items-stretch font-['IBM_Plex_Sans'] bg-[#F6F4EE]">
      {/* Left Column: Full-Coverage Edge-to-Edge Hero Illustration & Showcase */}
      <div className="w-full lg:w-[56%] xl:w-[58%] min-h-[480px] lg:min-h-[calc(100vh-65px)] relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[var(--line)] overflow-hidden bg-[#F6F4EE]">
        {/* Full-bleed Edge-to-Edge Background Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage: "url('/freight-hero.jpg')",
          }}
        />

        {/* Top/Bottom Soft Vignette for crystal-clear readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F6F4EE]/95 via-transparent to-[#F6F4EE]/40 pointer-events-none" />

        {/* Top Floating Badge */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-[var(--line)] text-[var(--blue)] text-xs font-semibold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
            <span>Smart Freight Logistics &amp; Proxy Network</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[var(--line)] text-xs font-bold text-[var(--ink)] shadow-sm">
            <span>⚡ Instant Onboarding</span>
          </div>
        </div>

        {/* Bottom Headline & Live Feature Highlights */}
        <div className="relative z-10 space-y-3 pt-24 pb-2">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[var(--line)] shadow-md">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight mb-1">
              Join the Enterprise Logistics Proxy Network
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              Create an account to manage shipments, dispatch fleet vehicles, inspect global tracking manifests, and access real-time volumetric pricing rates.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-[var(--line)] text-xs font-semibold text-[var(--blue)] shadow-sm">
              ✨ Free Standard Tier
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-[var(--line)] text-xs font-semibold text-[var(--green)] shadow-sm">
              🛡️ Role-Based Access
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-[var(--line)] text-xs font-semibold text-[var(--amber)] shadow-sm">
              ⚡ Multi-Hub Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Centered Register Form */}
      <div className="w-full lg:w-[44%] xl:w-[42%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#F6F4EE]">
        <RegisterForm />
      </div>
    </div>
  );
}
