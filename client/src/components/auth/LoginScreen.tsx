import React, { useState } from 'react';
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useErpStore } from '../../store/erpStore';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials } = useAuthStore();
  const { organisation, fetchBootstrap } = useErpStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    const result = await loginWithCredentials(cleanInput, password);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your email or mobile.');
      setIsLoading(false);
    } else {
      // Successfully authenticated against MongoDB Atlas! Fetch bootstrap data
      await fetchBootstrap();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Column: Visual Brand Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 border-r border-slate-800 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-xl text-white shadow-lg shadow-blue-500/30">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Smart Enterprise ERP
            </h1>
            <p className="text-xs text-blue-400 font-medium">
              Next-Gen Cloud Manufacturing, Sourcing & GST Billing
            </p>
          </div>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Secure Role-Based ERP Portal</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Seamless multi-branch operations, real-time stock & GST billing.
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Standardized with JWT cookie authentication, automatic user profile resolution,
            multi-tenant isolation, and real-time inventory telemetry across your enterprise.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
              <div className="text-xl font-bold text-white">9 Modules</div>
              <div className="text-xs text-slate-400 mt-0.5">Sales, Billing, Store, Logistics</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
              <div className="text-xl font-bold text-emerald-400">100% Isolated</div>
              <div className="text-xs text-slate-400 mt-0.5">Postgres Row & Schema Security</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ERP Cluster Online (v2.4.0)</span>
          </div>
          <span>&copy; {new Date().getFullYear()} {organisation.name}</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email or mobile number to access your workspace.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email or Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="e.g. name@company.com or 9840199882"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 pl-9 text-xs text-slate-200 placeholder-slate-500 outline-none hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Your role, branch, and organization are verified and loaded automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 pl-9 text-xs text-slate-200 placeholder-slate-500 outline-none hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span>Remember session in cookies</span>
              </label>
              <a href="#reset" className="text-blue-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating & Loading Workspace...</span>
              ) : (
                <>
                  <span>Sign In to ERP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

