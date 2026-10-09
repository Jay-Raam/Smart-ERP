import React from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionFooter } from './AevionFooter';

interface ReleasesPageProps {
  onSignInClick: () => void;
  onNavigate: (path: string) => void;
}

export const ReleasesPage: React.FC<ReleasesPageProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  const releases = [
    {
      version: 'v1.2.0',
      title: 'Enhanced Authentication Security & Access Governance',
      date: 'September 2026',
      badge: 'LATEST RELEASE',
      summary:
        'This release strengthens user login protection against credential enumeration, introduces constant-time authentication delays, and adds strict server-enforced lockouts alongside granular module permissions.',
      highlights: [
        {
          label: 'Security',
          text: 'Constant-time verification prevents timing attacks across valid and invalid account lookups.',
        },
        {
          label: 'Governance',
          text: 'Fine-grained module permission gating prevents unauthorized access to customer and purchase ledgers.',
        },
        {
          label: 'Lockout Defense',
          text: 'Automatic 20-minute server-synced countdown timer after consecutive incorrect login attempts.',
        },
      ],
    },
    {
      version: 'v1.1.0',
      title: 'High-Resolution Vector Printing & Purchase Order Controls',
      date: 'August 2026',
      badge: 'STABLE',
      summary:
        'Major upgrade to document rendering with dedicated A4 web sheets, thermal receipt compatibility, and deterministic purchase order approval state locks.',
      highlights: [
        {
          label: 'Document Engine',
          text: 'Sub-second browser print previews with isolated styling for clean thermal and A4 PDF outputs.',
        },
        {
          label: 'Procurement',
          text: 'Locked purchase orders prevent post-approval price or quantity tampering.',
        },
        {
          label: 'Inventory',
          text: 'Automated reorder notifications when warehouse items drop below safety stock thresholds.',
        },
      ],
    },
    {
      version: 'v1.0.0',
      title: 'Official Launch of Smart ERP Engine',
      date: 'July 2026',
      badge: 'FOUNDATION',
      summary:
        'The foundational release introducing automated multi-state GST tax determination, double-entry banking ledgers, and multi-tenant customer directories.',
      highlights: [
        {
          label: 'Tax Matrix',
          text: 'Automated CGST + SGST vs IGST detection covering all 37 Indian states and Union Territories.',
        },
        {
          label: 'Banking',
          text: 'Multi-account bank ledger with automated deposit and withdrawal tracking.',
        },
        {
          label: 'Core Architecture',
          text: 'Isolated multi-tenant data partitioning on MongoDB Atlas with instant search.',
        },
      ],
    },
  ];

  return (
    <div className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors flex flex-col justify-between">
      <AevionNavbar
        onSignInClick={onSignInClick}
        currentPath="/releases"
        onNavigate={onNavigate}
      />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-4">
            Product Updates & Changelog
          </span>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Continuous improvement, <br />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">transparent progress.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 mt-4 max-w-xl">
            See everything we've shipped to make Smart ERP faster, safer, and more powerful for your daily business.
          </p>
        </div>

        {/* Release Timeline */}
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
          {releases.map((rel) => (
            <div key={rel.version} className="relative pl-10">
              {/* Dot */}
              <div className="absolute left-2 top-2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white dark:bg-zinc-950 shadow-sm" />

              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {rel.version}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 uppercase">
                    {rel.badge}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 ml-auto">
                    {rel.date}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white mb-3">
                  {rel.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-zinc-400 mb-6 leading-relaxed">
                  {rel.summary}
                </p>

                <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                  {rel.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[10px] shrink-0 font-medium">
                        {h.label}
                      </span>
                      <span className="text-slate-600 dark:text-zinc-400">
                        {h.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AevionFooter onSignInClick={onSignInClick} onNavigate={onNavigate} />
    </div>
  );
};
