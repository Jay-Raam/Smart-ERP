import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useErpStore } from '../../store/erpStore';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials } = useAuthStore();
  const { organisation, fetchBootstrap } = useErpStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    const result = await loginWithCredentials(cleanInput, password);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your email/mobile and password.');
      setIsLoading(false);
    } else {
      // Successfully authenticated against database! Fetch initial bootstrap
      await fetchBootstrap();
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden selection:bg-blue-600 selection:text-white transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}
    >
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Minimalist Container */}
      <div className="w-full max-w-[440px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-bold text-2xl shadow-lg mb-4 ring-4 ring-blue-500/10 transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            S
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-3 shadow-2xs backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--text-main)' }}>Smart Enterprise ERP</span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span style={{ color: 'var(--color-primary)' }} className="font-mono">v2.4.0</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Sign in to your account
          </h1>
          <p
            className="text-xs sm:text-sm mt-1.5 max-w-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Welcome back! Enter your verified organization credentials to access your operational modules.
          </p>
        </div>

        {/* Minimalist Card */}
        <div
          className="rounded-2xl border p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all duration-200"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in zoom-in-95 duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Field: Identifier */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold tracking-wide"
                style={{ color: 'var(--text-main)' }}
              >
                Email address or Mobile number
              </label>
              <div
                className="relative rounded-xl border transition focus-within:ring-2 focus-within:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com or 9840199882"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  style={{ color: 'var(--text-main)' }}
                  className="w-full bg-transparent pl-10 pr-3.5 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden disabled:opacity-60"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold tracking-wide"
                  style={{ color: 'var(--text-main)' }}
                >
                  Password
                </label>
              </div>
              <div
                className="relative rounded-xl border transition focus-within:ring-2 focus-within:ring-blue-500/20"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  style={{ color: 'var(--text-main)' }}
                  className="w-full bg-transparent pl-10 pr-10 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden disabled:opacity-60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-100 transition cursor-pointer"
                  style={{ color: 'var(--text-subtle)' }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help Links */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Remember session
                </span>
              </label>

              <span
                className="text-xs transition hover:underline cursor-pointer"
                style={{ color: 'var(--text-subtle)' }}
              >
                Need access? Contact admin
              </span>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl text-white py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 hover:opacity-95 active:scale-[0.99]"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Enterprise</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Enterprise Trust Indicators (Minimalist Micro-Pills) */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          <div
            className="flex flex-col items-center justify-center p-2 rounded-xl border backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-main)' }}>256-Bit SSL</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Encrypted</span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-2 rounded-xl border backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-main)' }}>Multi-Tenant</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Strict Isolated</span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-2 rounded-xl border backdrop-blur-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1" />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-main)' }}>RBAC Guard</span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Role Governed</span>
          </div>
        </div>

        {/* Copyright & Organization Identity */}
        <div
          className="mt-6 text-center text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          &copy; {new Date().getFullYear()} {organisation?.name || 'Smart Enterprise Industries Ltd.'}. All rights reserved.
        </div>
      </div>
    </div>
  );
};
