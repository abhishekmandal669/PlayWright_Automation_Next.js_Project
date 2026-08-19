import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-12 py-6">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-1/2 flex justify-center">
        <LoginForm />
      </div>

      {/* Right Column: Platform Hero Showcase Card */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-white rounded-3xl p-8 lg:p-10 shadow-2xl border border-slate-700/60 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
        {/* Background Decorative Glow Orb */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-6">
            <span>⚡ Freight Logistics Platform v2.0</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold font-heading text-white tracking-tight mb-4 leading-tight">
            Next-Gen Proxy Freight & Volumetric Dispatch
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Manage global proxy shipping orders with live volumetric price calculation, multi-stage warehouse tracking, and role-scoped operational hubs for Admins, Managers, and Customers.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-2">⚖️</div>
              <h3 className="font-extrabold text-sm text-white mb-1">Volumetric Engine</h3>
              <p className="text-xs text-slate-400">Live (L x W x H)/5000 price calculation formula</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-2">🚚</div>
              <h3 className="font-extrabold text-sm text-white mb-1">7-Stage Pipeline</h3>
              <p className="text-xs text-slate-400">Pickup → Warehouse → Scheduled Dispatch tracking</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-2">👑</div>
              <h3 className="font-extrabold text-sm text-white mb-1">Role Hierarchy</h3>
              <p className="text-xs text-slate-400">Admin Control, Manager Hub, and Customer Console</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-extrabold text-sm text-white mb-1">Enterprise Guard</h3>
              <p className="text-xs text-slate-400">Route security guards with real-time audit trail logs</p>
            </div>
          </div>
        </div>

        {/* Live Network Banner */}
        <div className="relative z-10 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-bold text-slate-300">Global Hubs Online:</span>
            <span>London • New York • Delhi • Singapore</span>
          </div>
          <span className="font-bold text-blue-400">99.9% Uptime</span>
        </div>
      </div>
    </div>
  );
}
