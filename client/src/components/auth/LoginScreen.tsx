import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useErpStore } from '../../store/erpStore';

export const LoginScreen: React.FC = () => {
  const { loginWithCredentials } = useAuthStore();
  const { fetchBootstrap } = useErpStore();

  const [identifier, setIdentifier] = useState('jay.raam@smart.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    const result = await loginWithCredentials(cleanInput, password);

    if (!result.success) {
      setErrorMessage(result.error || 'These credentials could not be verified.');
      setIsLoading(false);
    } else {
      await fetchBootstrap();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans bg-[#f3f4f6] dark:bg-[#000000] text-slate-900 dark:text-slate-100 transition-colors duration-300 select-none">
      {/* Outer Floating Card Container */}
      <div className="w-full max-w-[1020px] rounded-[28px] border border-slate-200/80 dark:border-[#222225] bg-white dark:bg-[#0c0c0e] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] p-3 sm:p-3.5 transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-h-[580px] lg:min-h-[640px]">

          {/* ==============================================================
              LEFT COLUMN: Minimalist Landscape Poster (Webpixels Style)
              ============================================================== */}
          <div className="relative rounded-[22px] overflow-hidden flex flex-col justify-between p-7 sm:p-10 min-h-[300px] sm:min-h-[360px] lg:min-h-full bg-[#0a0a0c]">
            {/* Atmospheric Monochrome Dune Landscape Visual (High-Fidelity Vectors) */}
            <div className="absolute inset-0 pointer-events-none">
              <svg
                className="absolute inset-0 w-full h-full object-cover opacity-90"
                viewBox="0 0 600 800"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Sky & Distant Horizon */}
                <rect width="600" height="800" fill="#070709" />
                <radialGradient id="skyGlow" cx="50%" cy="10%" r="70%">
                  <stop offset="0%" stopColor="#252730" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#0a0b0e" stopOpacity="1" />
                  <stop offset="100%" stopColor="#050506" stopOpacity="1" />
                </radialGradient>
                <rect width="600" height="400" fill="url(#skyGlow)" />

                {/* Layer 1: Background Dunes */}
                <path
                  d="M0 320 Q 150 260 320 310 T 600 290 L 600 800 L 0 800 Z"
                  fill="#121317"
                />
                <path
                  d="M0 320 Q 150 260 320 310 T 600 290"
                  stroke="#323540"
                  strokeWidth="1.5"
                  opacity="0.4"
                />

                {/* Layer 2: Midground Sculpted Ridge */}
                <path
                  d="M0 420 C 140 370 240 450 420 380 C 510 345 560 360 600 380 L 600 800 L 0 800 Z"
                  fill="#181a20"
                />
                <path
                  d="M0 420 C 140 370 240 450 420 380 C 510 345 560 360 600 380"
                  stroke="#4a4f5f"
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* Layer 3: Dynamic Curved Dune Shadow Face */}
                <path
                  d="M0 480 C 180 430 300 580 600 460 L 600 800 L 0 800 Z"
                  fill="#0c0d10"
                />
                <path
                  d="M0 480 C 180 430 300 580 600 460"
                  stroke="#2c2e38"
                  strokeWidth="1.5"
                  opacity="0.6"
                />

                {/* Layer 4: Foreground Sweeping Contour */}
                <path
                  d="M0 590 C 220 540 380 720 600 570 L 600 800 L 0 800 Z"
                  fill="#15171d"
                />
                <path
                  d="M0 590 C 220 540 380 720 600 570"
                  stroke="#565c6e"
                  strokeWidth="2"
                  opacity="0.45"
                />

                {/* Foreground Dark Shadow Basin */}
                <path
                  d="M0 680 Q 280 640 600 710 L 600 800 L 0 800 Z"
                  fill="#08080a"
                />
              </svg>

              {/* Subtle ambient lighting vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Top-Left Brand Mark Pill */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-white text-slate-900 font-bold text-[11px]">
                  <Sparkles className="h-3 w-3 fill-slate-900" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-white/95">
                  LOVE
                </span>
              </div>
            </div>

            {/* Bottom Display Typography */}
            <div className="relative z-10 mt-auto pt-16">
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-[1.15]">
                Manage your business.<br />
                All in one place.
              </h2>

              <p className="text-xs sm:text-sm text-white/65 mt-3 max-w-sm font-normal leading-relaxed">
                Streamline sales, purchases, inventory, finance, and operations with one powerful ERP system.
              </p>
            </div>
          </div>

          {/* ==============================================================
              RIGHT COLUMN: Webpixels Minimalist Sign-in Form
              ============================================================== */}
          <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 w-full max-w-md mx-auto">
            {/* Header */}
            <div className="mb-7 text-left">
              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Welcome back! Enter your details below.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Your email address"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-300 transition shadow-2xs"
                />
              </div>

              {/* Password Field with Header Row & Forgot Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password-input"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrorMessage('Please contact your enterprise system administrator to reset credentials.');
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:underline transition"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-slate-300 transition shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-slate-300 dark:border-[#333338] text-slate-900 dark:text-white focus:ring-0 cursor-pointer accent-slate-900 dark:accent-white"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Keep me logged in
                  </span>
                </label>
              </div>

              {/* Submit Button (Webpixels Dark Minimalist CTA) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0c0d12] hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2.5 px-4 text-xs sm:text-sm font-semibold shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
