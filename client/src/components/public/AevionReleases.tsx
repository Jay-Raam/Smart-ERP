import React from 'react';

interface ReleaseItem {
  version: string;
  title: string;
  date: string;
  status: 'LATEST RELEASE' | 'STABLE' | 'FOUNDATION';
  summary: string;
  changes: { category: string; description: string }[];
}

export const AevionReleases: React.FC = () => {
  const releases: ReleaseItem[] = [
    {
      version: 'v1.2.0',
      title: 'Authentication Hardening & RBAC Permissions',
      date: 'September 2026',
      status: 'LATEST RELEASE',
      summary:
        'Strengthened user login security against credential attacks, implemented constant-time Bcrypt execution to defeat timing enumeration, and introduced an automated 20-minute server-clock lockout.',
      changes: [
        {
          category: 'Security',
          description:
            'Anti-timing attack mitigation with ~85ms constant response equalization across all email account checks.',
        },
        {
          category: 'Session Protection',
          description:
            'Server-side 20-minute lockout enforcement with automated countdown synchronization and blinded error messages.',
        },
        {
          category: 'Access Control',
          description:
            'Real-time module permission gating and fallback routing for restricted tenant users.',
        },
      ],
    },
    {
      version: 'v1.1.0',
      title: 'Dual Document Pipeline & Purchase State Locks',
      date: 'August 2026',
      status: 'STABLE',
      summary:
        'Introduced dual document generation: instant web sheets for live browser printing and isolated React-PDF workers for high-resolution vector archives.',
      changes: [
        {
          category: 'Print Engine',
          description:
            'Thermal and A4 iframe print modal isolating printing styles from main application bundle.',
        },
        {
          category: 'Procurement',
          description:
            'Immutable state lock prohibiting modifications on approved vendor purchase orders.',
        },
        {
          category: 'Inventory',
          description:
            'Real-time safety stock threshold alerts and automated store requisition generation.',
        },
      ],
    },
    {
      version: 'v1.0.0',
      title: 'Foundational Release of Smart ERP Engine',
      date: 'July 2026',
      status: 'FOUNDATION',
      summary:
        'Initial deployment featuring automated multi-state Indian GST calculation, isolated multi-tenant database partitioning, and double-entry accounting ledgers.',
      changes: [
        {
          category: 'Tax Engine',
          description:
            'Autonomous intra-state and inter-state GST split resolution across 37 jurisdictions.',
        },
        {
          category: 'Architecture',
          description:
            'Multi-tenant workspace isolation with scoped database indexes on MongoDB Atlas.',
        },
      ],
    },
  ];

  return (
    <section
      id="releases"
      className="relative z-10 px-4 md:px-8 py-20 border-b border-slate-200/80 dark:border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 mb-12 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">05</span>
            <span className="font-medium uppercase tracking-wider">Product Releases</span>
          </div>
          <span className="text-slate-400 dark:text-zinc-500">Changelog & History</span>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Heading */}
          <div className="col-span-12 lg:col-span-5">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 block">
              Continuous Progress
            </span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
              Designed to evolve with statutory standards.
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">
              Our engineering releases ensure your business stays ahead of changing GST compliance, tax laws, and enterprise security requirements without unexpected disruptions.
            </p>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm text-xs">
              <span className="text-slate-400 dark:text-zinc-500 block mb-1">Release Philosophy</span>
              <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                Zero breaking migrations. All ledger entries, journal vouchers, and historical invoices remain cryptographically preserved.
              </p>
            </div>
          </div>

          {/* Right Column: Timeline Cards */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {releases.map((rel) => (
              <div
                key={rel.version}
                className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {rel.version}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 uppercase">
                      {rel.status}
                    </span>
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                    {rel.date}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {rel.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
                  {rel.summary}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs">
                  {rel.changes.map((c, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-500 font-bold shrink-0">→</span>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-zinc-200 mr-1.5">
                          {c.category}:
                        </span>
                        <span className="text-slate-500 dark:text-zinc-400">
                          {c.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
