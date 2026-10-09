import React, { useState } from 'react';

interface ModulePillar {
  code: string;
  category: string;
  title: string;
  headline: string;
  description: string;
  specs: { label: string; value: string }[];
  tag: string;
}

const MODULE_PILLARS: ModulePillar[] = [
  {
    code: 'M_001',
    category: 'STATUTORY COMPLIANCE',
    title: 'Indian GST & Tax Bifurcation Engine',
    headline: 'Deterministic state-code extraction from 15-character GSTIN with zero manual dropdown error.',
    description:
      'Extracts state jurisdiction from the initial 2 digits of the counterparty GSTIN. Automatically routes transactions to IGST (Inter-State) or evenly split CGST + SGST (Intra-State) at the schema level. Eliminates 1-paisa rounding discrepancies across high-volume line items before committing to ledger records.',
    specs: [
      { label: 'Statutory Regime', value: 'Indian GST Act / CBIC HSN Master' },
      { label: 'Bifurcation Model', value: 'Dual-tier CGST/SGST vs IGST' },
      { label: 'Validation Level', value: 'Zod & Mongoose Pre-save Hook' },
    ],
    tag: 'Statutory Core',
  },
  {
    code: 'M_002',
    category: 'CYBERSECURITY & AUDITING',
    title: 'Zero-Trust Anti-Timing Authentication',
    headline: 'Elimination of user enumeration and millisecond-level timing side channels.',
    description:
      'Implements constant-time dummy bcrypt executions for non-existent users so response latency is virtually indistinguishable (~85ms) from valid accounts. Replaces specific error messages with a single universal response: "These credentials could not be verified." Enforces 20-minute server-side lockouts after >3 consecutive failures.',
    specs: [
      { label: 'Side-Channel Defense', value: 'CWE-208 Constant-Time Bcrypt' },
      { label: 'Lockout Enforcement', value: 'Server Date.now() / Persistent DB' },
      { label: 'Audit Logging', value: 'Masked Identifiers / Zero Plaintext' },
    ],
    tag: 'Perimeter Defense',
  },
  {
    code: 'M_003',
    category: 'DOCUMENT REPRODUCTION',
    title: 'Dual-Surface Web Sheet & PDF Engine',
    headline: 'Pixel-accurate physical A4 browser printsheets paired with tamper-resistant vector PDFs.',
    description:
      'Solves the printing paradox where warehouse shop floors require instantaneous thermal and laser printer outputs while suppliers require archivable digital records. Spawns an isolated headless iframe with pure CSS print media rules for zero-overflow A4 sheets, alongside an isolated Web Worker for high-fidelity vector PDF generation.',
    specs: [
      { label: 'Physical Standard', value: 'ISO 216 A4 / Pure CSS Media Rules' },
      { label: 'Print Isolation', value: 'Headless Sandboxed Iframe' },
      { label: 'Vector Generator', value: 'Web Worker Thread Font Subsetting' },
    ],
    tag: 'Document Engine',
  },
  {
    code: 'M_004',
    category: 'SUPPLY CHAIN & LOGISTICS',
    title: 'Deterministic Procurement State Machine',
    headline: 'Cryptographic state immutability guarding approved commercial contracts.',
    description:
      'Guarantees that once a Purchase Order is approved, critical commercial bindings—such as vendor assignment and unit rates—are permanently locked with visual state badges. Allows contextual mutability for warehouse dispatch instructions and QA criteria without violating financial and legal invariants.',
    specs: [
      { label: 'State Locking', value: 'Dynamic Immutability Guardrails' },
      { label: 'Audit Trail', value: 'Immutable Revision History Record' },
      { label: 'Context Separation', value: 'Operational vs Commercial Decoupling' },
    ],
    tag: 'State Machine',
  },
  {
    code: 'M_005',
    category: 'DATABASE ARCHITECTURE',
    title: 'Hybrid Polyglot Persistence',
    headline: 'Document flexibility for supply chains combined with ACID rigor for double-entry financials.',
    description:
      'Leverages MongoDB Atlas for deeply nested, semi-structured operational records (multi-line purchase orders, delivery challans, item specifications) alongside PostgreSQL Cloud DB for double-entry financial journals and audit ledgers. Synchronized with sub-millisecond in-memory cache layers.',
    specs: [
      { label: 'Document Store', value: 'MongoDB Atlas Replica Set' },
      { label: 'Relational Ledger', value: 'PostgreSQL Cloud Transactional Pool' },
      { label: 'Caching & Lockout', value: 'In-Memory RAM / Redis Fallback' },
    ],
    tag: 'Polyglot Core',
  },
  {
    code: 'M_006',
    category: 'WAREHOUSE & OPERATIONS',
    title: 'Real-Time Inventory Reorder Command Center',
    headline: 'Automated minimum reorder alerts with one-click purchase requisition synthesis.',
    description:
      'Continuously tracks warehouse stock balances, in-transit challans, and committed orders against minimum safety levels. Displays urgent stock warnings right in the Operational Command Center and enables procurement officers to generate purchase requisitions with a single interaction.',
    specs: [
      { label: 'Telemetry Update', value: 'Sub-second Reactive Recalculation' },
      { label: 'Threshold Logic', value: 'Dynamic Safety Stock Min/Max' },
      { label: 'Action Pipeline', value: '1-Click Requisition Synthesis' },
    ],
    tag: 'Warehouse Core',
  },
];

export const FeaturesSection: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState<string>(MODULE_PILLARS[0].code);

  return (
    <section className="w-full py-20 sm:py-32 px-4 sm:px-8 max-w-[1440px] mx-auto border-t geo-divider">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 sm:mb-24 gap-6">
        <div>
          <span className="font-geo-mono text-[0.85rem] uppercase tracking-widest opacity-40">
            (ENGINE ARCHITECTURE & MODULE MATRIX)
          </span>
          <h2 className="font-geo-sans text-[2.5rem] sm:text-[4rem] font-medium uppercase mt-2 tracking-tight">
            Six Pillars of
            <br />
            Deterministic Operations
          </h2>
        </div>

        <div className="font-geo-mono text-[0.8rem] uppercase opacity-60 text-right hidden sm:block">
          <div>[6 CORE SUBSYSTEMS ONLINE]</div>
          <div>STANDARDIZED TO ENTERPRISE SCALE</div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {MODULE_PILLARS.map((pillar) => {
          const isSelected = selectedPillar === pillar.code;
          return (
            <div
              key={pillar.code}
              onClick={() => setSelectedPillar(pillar.code)}
              className={`p-6 sm:p-8 border transition-all cursor-pointer flex flex-col justify-between min-h-[380px] ${
                isSelected
                  ? 'border-current bg-black/[0.04] dark:bg-white/[0.04]'
                  : 'border-current/15 hover:border-current/50 bg-transparent'
              }`}
            >
              <div>
                {/* Module Code + Tag */}
                <div className="flex items-center justify-between font-geo-mono text-[0.85rem] uppercase tracking-wider mb-6">
                  <span className="font-bold opacity-90">[{pillar.code}]</span>
                  <span className="text-[0.75rem] opacity-50 px-2 py-0.5 border border-current/20">
                    {pillar.tag}
                  </span>
                </div>

                <div className="font-geo-mono text-[0.75rem] uppercase opacity-50 mb-2">
                  {pillar.category}
                </div>

                <h3 className="font-geo-sans text-[1.4rem] sm:text-[1.6rem] font-medium uppercase leading-[1.2] mb-4">
                  {pillar.title}
                </h3>

                <p className="font-geo-sans text-[0.95rem] opacity-70 leading-relaxed mb-6">
                  {pillar.description}
                </p>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="pt-6 border-t geo-divider font-geo-mono text-[0.75rem] space-y-1.5 opacity-60">
                {pillar.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="opacity-70">{spec.label}:</span>
                    <span className="font-medium text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
