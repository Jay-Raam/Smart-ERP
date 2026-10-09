import React from 'react';

export const VisionSection: React.FC = () => {
  return (
    <section className="w-full py-24 sm:py-36 px-4 sm:px-8 max-w-[1200px] mx-auto text-left border-t geo-divider">
      {/* Eyebrow Label */}
      <span className="font-geo-mono text-[0.85rem] uppercase tracking-widest opacity-40 mb-6 block">
        (PHILOSOPHY & DOCTRINE)
      </span>

      {/* Manifesto Headline */}
      <h2 className="font-geo-sans text-[2.2rem] sm:text-[3.5rem] lg:text-[4.2rem] leading-[1.15] font-medium uppercase mb-12 tracking-tight">
        Enterprise systems should be permanent, sovereign, and auditable—not fragile subscription traps.
      </h2>

      {/* Core Doctrine Paragraphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 font-geo-sans text-[1.1rem] sm:text-[1.25rem] opacity-80 leading-relaxed uppercase">
        <div className="space-y-6">
          <p>
            Most modern business platforms are built as superficial CRUD tools layered on bloated third-party monoliths. When compliance laws shift, when tax authorities audit transactions, or when internet latency strikes, these systems reveal their fragility.
          </p>
          <p>
            We architected Smart-ERP on the belief that mission-critical business software must feel like carved stone: deterministic state transitions, microsecond mathematical guarantees, and zero ambiguity.
          </p>
        </div>

        <div className="space-y-6">
          <p>
            Every line of code serves physical operational reality. A warehouse worker printing a dispatch receipt on an office laser printer deserves the exact same level of reliability as an automated banking transfer or double-entry financial journal.
          </p>
          <p>
            By unifying multi-tenant isolation, statutory Indian taxation, and zero-trust timing defense under a cohesive system, Smart-ERP returns sovereignty and complete operational control to businesses.
          </p>
        </div>
      </div>

      {/* Architectural Axioms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 mt-16 border-t geo-divider font-geo-mono text-[0.8rem] uppercase tracking-wider">
        <div>
          <span className="opacity-40 block mb-1">Axiom 01</span>
          <span className="font-bold text-[1rem] block mb-2">Zero Floating-Point Error</span>
          <span className="opacity-60 text-[0.75rem] leading-normal block">
            Every currency figure and GST tax fraction is evaluated deterministically at the penny level before persistent commit.
          </span>
        </div>

        <div>
          <span className="opacity-40 block mb-1">Axiom 02</span>
          <span className="font-bold text-[1rem] block mb-2">Immutable Approved Contracts</span>
          <span className="opacity-60 text-[0.75rem] leading-normal block">
            Approved purchase orders are legally binding aggregates. Vendors and commercial terms are strictly immutable.
          </span>
        </div>

        <div>
          <span className="opacity-40 block mb-1">Axiom 03</span>
          <span className="font-bold text-[1rem] block mb-2">Constant-Time Perimeter</span>
          <span className="opacity-60 text-[0.75rem] leading-normal block">
            Authentication responses provide uniform execution latency, eliminating account enumeration timing leaks.
          </span>
        </div>
      </div>
    </section>
  );
};
