import React from 'react';

export const AevionIntro: React.FC = () => {
  return (
    <section
      id="mission"
      className="relative z-10 px-4 md:px-8 py-20 border-b border-slate-200/80 dark:border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 mb-14 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">01</span>
            <span className="font-medium uppercase tracking-wider">Design Philosophy</span>
          </div>
          <span className="text-slate-400 dark:text-zinc-500">Built for Modern Businesses</span>
        </div>

        {/* 2-Column Split: Mission Statement vs Value Narrative */}
        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/70 shadow-sm">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.2]">
              Preventing accounting mistakes, tax non-compliance, and stock shortages before they impact your business.
            </h2>
          </div>

          <div className="col-span-12 lg:col-span-5 flex flex-col space-y-5 p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/70 shadow-sm text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            <p>
              Traditional enterprise ERPs are burdened by outdated interfaces, slow database synchronization, and fragile tax logic that breaks when regulations evolve.
            </p>
            <p>
              Smart ERP is designed as a cohesive operating system for your enterprise. Every invoice calculation, vendor credit, and store requisition happens in milliseconds with complete audit transparency.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-zinc-800">
              <div>
                <span className="block text-xs text-slate-400 dark:text-zinc-500 mb-1">Tax Accuracy</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Zero Ledger Leakage</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 dark:text-zinc-500 mb-1">Session Security</span>
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Timing-Resistant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
