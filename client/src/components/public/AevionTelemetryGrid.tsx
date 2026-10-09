import React from 'react';

export const AevionTelemetryGrid: React.FC = () => {
  return (
    <section
      id="telemetry"
      className="relative z-10 px-4 md:px-8 py-20 border-b border-slate-200/80 dark:border-zinc-800/80 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 mb-12 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">02</span>
            <span className="font-medium uppercase tracking-wider">Performance & Security Benchmarks</span>
          </div>
          <span className="text-slate-400 dark:text-zinc-500">Measurable Reliability</span>
        </div>

        {/* Curved Precision Reticle Dome */}
        <div className="relative flex flex-col items-center justify-center pt-6 pb-2">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
            Engineered for Exact Precision
          </span>

          {/* SVG Semi-Circle Dome with Ticks */}
          <div className="relative w-full max-w-4xl flex items-center justify-center">
            <svg
              className="w-full max-w-3xl h-auto"
              viewBox="0 0 954 477"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main Semi-Circle Arc */}
              <path
                d="M1 476C1 213.666 213.666 1 476 1C738.334 1 951 213.666 951 476"
                stroke="currentColor"
                strokeOpacity="0.15"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Inner Arc */}
              <path
                d="M140 476C140 290.432 290.432 140 476 140C661.568 140 812 290.432 812 476"
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              {/* Center Crosshair Marker */}
              <circle cx="476" cy="1" r="5" fill="currentColor" opacity="0.6" />
              <line x1="476" y1="1" x2="476" y2="476" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2 2" />
            </svg>

            {/* Center Reticle Badge */}
            <div className="absolute top-0 transform -translate-y-1/2 px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium shadow-sm text-slate-800 dark:text-zinc-200">
              <span className="w-1.5 h-1.5 inline-block rounded-full bg-emerald-500 mr-1.5" />
              Tax Precision: 100.00% Zero Leakage
            </div>
          </div>
        </div>

        {/* 3-Column Statistical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-slate-200 dark:border-zinc-800 mt-8 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-800">
          {/* Metric 1 */}
          <div className="p-8 flex flex-col justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-6">
              Calculation Engine
            </div>
            <div>
              <div className="text-4xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight mb-2">
                &lt; 15 ms
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Sub-second GST Split Determination across intra-state (CGST+SGST) and inter-state (IGST) sales.
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-8 flex flex-col justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-6">
              Authentication Defense
            </div>
            <div>
              <div className="text-4xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight mb-2">
                ~85 ms
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Constant-time Bcrypt cryptographic equalization preventing login username and timing enumeration attacks.
              </div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-8 flex flex-col justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-6">
              Audit Transparency
            </div>
            <div>
              <div className="text-4xl lg:text-6xl font-light text-slate-900 dark:text-white tracking-tight mb-2">
                100%
              </div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Deterministic purchase order state transitions ensuring approved orders cannot be altered without audit traces.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs text-slate-500 dark:text-zinc-400">
          <div>Multi-Tenant Database Isolation</div>
          <div className="sm:text-center">Cloud Database Replication on MongoDB Atlas</div>
          <div className="sm:text-right">Enforced 20-Minute Server Security Lockout</div>
        </div>
      </div>
    </section>
  );
};
