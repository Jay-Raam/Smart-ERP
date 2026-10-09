import React, { useState } from 'react';

interface ReleaseItem {
  version: string;
  codename: string;
  date: string;
  status: 'CURRENT' | 'STABLE' | 'ARCHIVED';
  summary: string;
  highlights: string[];
  specs: { label: string; value: string }[];
}

const RELEASES: ReleaseItem[] = [
  {
    version: 'v1.2.0',
    codename: 'Perimeter Defense & Anti-Timing Hardening',
    date: 'OCTOBER 2026',
    status: 'CURRENT',
    summary:
      'Major security infrastructure overhaul: eliminated user enumeration side channels, added constant-time bcrypt verification, and introduced persistent 20-minute server-clock lockouts.',
    highlights: [
      'Universal generic authentication response ("These credentials could not be verified.") across all failure modes.',
      'Constant-time dummy bcrypt execution (~85ms) preventing account mapping via timing discrepancies.',
      'Server-side rate limiting and 20-minute lockout after >3 consecutive failures backed by MongoDB Atlas and in-memory cache.',
      'Zero sensitive information leakage in responses or audit logs.',
    ],
    specs: [
      { label: 'Security Model', value: 'Zero-Trust Timing Defense (CWE-208)' },
      { label: 'Lockout Storage', value: 'MongoDB Atlas + In-Memory RAM' },
      { label: 'Test Suite', value: '5/5 Automated Security Tests Passed' },
    ],
  },
  {
    version: 'v1.1.0',
    codename: 'Dual-Surface Print Engine & PO Locking',
    date: 'SEPTEMBER 2026',
    status: 'STABLE',
    summary:
      'Document reproduction overhaul: built isolated iframe A4 Web Sheet print engine, resolved React-PDF font worker crashes, and locked vendor credentials on approved purchase orders.',
    highlights: [
      'Pure CSS print media rules rendering pixel-perfect A4 physical sheets with zero horizontal overflow.',
      'Direct "$ Pay Advance" action modal in PO preview top bar.',
      'Resolved @react-pdf/renderer worker thread crash on Helvetica-Bold styling.',
      'Dynamic immutability guardrails locking vendor bindings on committed purchase orders.',
    ],
    specs: [
      { label: 'Print Engine', value: 'Isolated Iframe DOM + CSS Print Media' },
      { label: 'PDF Worker', value: '@react-pdf/renderer Vector Pipeline' },
      { label: 'State Model', value: 'Vendor-Locked Purchase Orders' },
    ],
  },
  {
    version: 'v1.0.0',
    codename: 'Multi-Tenant Core & Indian GST Engine',
    date: 'AUGUST 2026',
    status: 'ARCHIVED',
    summary:
      'Initial production architecture of SaaS-Core Multi-Tenant Orchestrator with Indian GST tax bifurcation and double-entry financial ledgering.',
    highlights: [
      'Automatic state-code detection from 15-character GSTIN with CGST/SGST vs IGST bifurcation.',
      'Multi-tenant workspace isolation with role-based access control (RBAC).',
      'Dual-database persistence with MongoDB Atlas and PostgreSQL Cloud DB.',
      'Real-time Operational Command Center with inventory reorder triggers.',
    ],
    specs: [
      { label: 'Architecture', value: 'Multi-Tenant Monorepo (Vite + Node.js)' },
      { label: 'Tax Engine', value: 'Statutory GSTN & CBIC HSN Standard' },
      { label: 'Ledger Engine', value: 'PostgreSQL Relational Ledger' },
    ],
  },
];

export const ReleasesSection: React.FC = () => {
  const [selectedVer, setSelectedVer] = useState<string>(RELEASES[0].version);

  return (
    <section className="w-full py-20 sm:py-32 px-4 sm:px-8 max-w-[1440px] mx-auto border-t geo-divider">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <span className="font-geo-mono text-[0.85rem] uppercase tracking-widest opacity-40">
            (VERSION LOGS & SYSTEM CHANGELOG)
          </span>
          <h2 className="font-geo-sans text-[2.5rem] sm:text-[4rem] font-medium uppercase mt-2 tracking-tight">
            Release History &
            <br />
            Deployment Cadence
          </h2>
        </div>

        <div className="font-geo-mono text-[0.8rem] uppercase opacity-60 text-right hidden sm:block">
          <div>[CURRENT PRODUCTION: v1.2.0]</div>
          <div>DEPLOYED & VERIFIED ON VERCEL</div>
        </div>
      </div>

      {/* Releases List */}
      <div className="space-y-6">
        {RELEASES.map((rel) => {
          const isSelected = selectedVer === rel.version;
          return (
            <div
              key={rel.version}
              onClick={() => setSelectedVer(rel.version)}
              className={`p-6 sm:p-8 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-current bg-black/[0.03] dark:bg-white/[0.03]'
                  : 'border-current/15 hover:border-current/50 bg-transparent'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <span className="font-geo-mono text-[1.4rem] sm:text-[1.8rem] font-bold tracking-tight">
                    {rel.version}
                  </span>
                  <span
                    className={`font-geo-mono text-[0.75rem] uppercase px-2 py-0.5 border ${
                      rel.status === 'CURRENT'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-current/20 opacity-60'
                    }`}
                  >
                    [{rel.status}]
                  </span>
                </div>

                <div className="font-geo-mono text-[0.85rem] opacity-50 tracking-wider">
                  {rel.date}
                </div>
              </div>

              {/* Codename */}
              <div className="font-geo-sans text-[1.2rem] sm:text-[1.4rem] font-medium uppercase tracking-wide mb-3 opacity-90">
                {rel.codename}
              </div>

              {/* Summary */}
              <p className="font-geo-sans text-[1rem] opacity-75 max-w-[1000px] mb-6 leading-relaxed">
                {rel.summary}
              </p>

              {/* Highlights & Specs (Expanded when selected) */}
              {isSelected && (
                <div className="pt-6 border-t geo-divider grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                  <div>
                    <div className="font-geo-mono text-[0.8rem] uppercase opacity-40 mb-3">
                      Key Engineering Improvements:
                    </div>
                    <ul className="space-y-2 font-geo-sans text-[0.95rem] opacity-80 list-disc list-inside">
                      {rel.highlights.map((h, idx) => (
                        <li key={idx} className="leading-snug">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="font-geo-mono text-[0.75rem] space-y-2 opacity-65 border-t lg:border-t-0 lg:border-l lg:pl-8 geo-divider pt-4 lg:pt-0">
                    <div className="opacity-40 uppercase mb-2">Technical Telemetry:</div>
                    {rel.specs.map((s, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="opacity-60">{s.label}:</span>
                        <span className="font-medium text-right">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
