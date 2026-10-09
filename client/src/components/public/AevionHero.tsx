import React from 'react';

interface AevionHeroProps {
  onExplore: () => void;
  onSignIn: () => void;
  onGetStarted?: () => void;
}

export const AevionHero: React.FC<AevionHeroProps> = ({
  onExplore,
  onSignIn,
  onGetStarted,
}) => {
  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex flex-col justify-between pt-28 pb-12 px-4 md:px-8 border-b border-slate-200/80 dark:border-zinc-800/80 overflow-hidden"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <span className="text-[17vw] font-light tracking-[-0.08em] whitespace-nowrap opacity-[0.03] dark:opacity-[0.05] text-slate-900 dark:text-white">
          SMART—ERP
        </span>
      </div>

      {/* Top Value Badges Bar - Clean Apple Style */}
      <div className="relative z-10 grid grid-cols-12 gap-4 text-xs border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 text-slate-500 dark:text-zinc-400">
        <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-800 dark:text-zinc-200">
            Enterprise Cloud Engine
          </span>
        </div>
        <div className="col-span-6 sm:col-span-4 flex sm:justify-center items-center gap-2">
          <span>Indian Statutory GST Ready</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">37 States & UTs</span>
        </div>
        <div className="col-span-6 sm:col-span-4 flex justify-end items-center gap-2">
          <span>Continuous Ledger Protection</span>
        </div>
      </div>

      {/* Centerpiece 3D Visual Stage */}
      <div className="relative z-10 my-auto py-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Radar Rings & Aerodynamic Centerpiece Stage */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[540px] md:h-[540px] flex items-center justify-center">
          {/* Outer Dashed Orbit Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-slate-300/80 dark:border-zinc-700/80 animate-spin [animation-duration:60s]" />
          {/* Inner Precision Radar Ring */}
          <div className="absolute inset-10 rounded-full border border-slate-200/80 dark:border-zinc-800" />
          <div className="absolute inset-24 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 animate-pulse-ring" />

          {/* Crosshair Horizontal & Vertical Axes */}
          <div className="absolute inset-x-0 h-px bg-slate-300/40 dark:bg-zinc-700/40" />
          <div className="absolute inset-y-0 w-px bg-slate-300/40 dark:bg-zinc-700/40" />

          {/* Clean Floating Feature Pills - framing the centerpiece */}
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 absolute -left-8 md:-left-12 top-1/4 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-xs shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-800 dark:text-zinc-200">Automated Tax Calculation</span>
          </div>

          <div className="pointer-events-auto hidden sm:flex items-center gap-2 absolute -right-8 md:-right-12 bottom-1/4 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-xs shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-800 dark:text-zinc-200">Multi-Branch Inventory</span>
          </div>

          <div className="pointer-events-auto absolute bottom-2 px-4 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-xs shadow-sm flex items-center gap-2 text-slate-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Sub-Second Invoice Dispatch</span>
          </div>
        </div>
      </div>

      {/* Bottom Display Headline & Action Buttons */}
      <div className="relative z-10 grid grid-cols-12 gap-6 items-end pt-6 border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="col-span-12 md:col-span-8">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Intelligent business management. <br />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Engineered with clarity and precision.
            </span>
          </h1>
        </div>

        <div className="col-span-12 md:col-span-4 flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xs text-left md:text-right leading-relaxed">
            Eliminate tax calculation errors, coordinate multi-store warehouses, and issue instant compliant invoices with peace of mind.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onExplore}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Explore Platform</span>
              <span className="text-xs">↓</span>
            </button>
            <button
              onClick={onSignIn}
              className="px-5 py-2.5 rounded-full text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 shadow-sm transition-all"
            >
              Sign In to Portal →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
