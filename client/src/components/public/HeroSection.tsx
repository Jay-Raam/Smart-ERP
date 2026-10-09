import React from 'react';

interface HeroSectionProps {
  onExploreFeatures: () => void;
  onSignIn: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreFeatures, onSignIn }) => {
  return (
    <section className="w-full pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-8 max-w-[1440px] mx-auto flex flex-col items-start">
      {/* Eyebrow Label */}
      <div className="flex items-center gap-3 font-geo-mono text-[0.85rem] uppercase tracking-widest opacity-60 mb-6">
        <span>(SYSTEM SPECIFICATION — v1.2.0)</span>
        <span>•</span>
        <span>AUTONOMOUS ENTERPRISE ENGINE</span>
      </div>

      {/* Monumental Headline */}
      <h1 className="font-geo-sans text-[3.2rem] sm:text-[5.5rem] lg:text-[7.2rem] leading-[0.95] font-medium uppercase tracking-tight mb-8">
        Enterprise
        <br />
        Software as
        <br />
        <span className="opacity-40">Monolithic</span>
        <br />
        Infrastructure.
      </h1>

      {/* Subtitle / Philosophy Statement */}
      <p className="max-w-[840px] font-geo-sans text-[1.25rem] sm:text-[1.85rem] leading-[1.35] uppercase font-normal opacity-80 mb-12">
        A multi-tenant ERP platform engineered for deterministic Indian GST compliance,
        zero-trust timing attack defense, isolated dual-surface print generation, and real-time inventory reorder autonomy.
      </p>

      {/* Action CTA Bar */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 font-geo-mono text-[0.9rem] uppercase tracking-wider">
        <button
          onClick={onExploreFeatures}
          className="border border-current px-6 py-3.5 bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          [ Explore Engine Matrix → ]
        </button>

        <button
          onClick={onSignIn}
          className="px-6 py-3.5 border border-current/20 opacity-70 hover:opacity-100 transition-opacity bg-transparent"
        >
          [ Access Live Workspace ]
        </button>
      </div>

      {/* Telemetry Status Bar Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 pt-20 sm:pt-28 border-t geo-divider mt-20 sm:mt-28 font-geo-mono text-[0.8rem] uppercase tracking-wider">
        <div>
          <div className="opacity-40 mb-1">State Transition Engine</div>
          <div className="text-[1.1rem] font-bold">100% Deterministic</div>
          <div className="opacity-50 text-[0.7rem] mt-0.5">Immutable PO Ledger</div>
        </div>

        <div>
          <div className="opacity-40 mb-1">Timing Attack Resistance</div>
          <div className="text-[1.1rem] font-bold">~85ms Uniform</div>
          <div className="opacity-50 text-[0.7rem] mt-0.5">Constant-Time Bcrypt</div>
        </div>

        <div>
          <div className="opacity-40 mb-1">GST Statutory Mapping</div>
          <div className="text-[1.1rem] font-bold">Automatic Inter/Intra</div>
          <div className="opacity-50 text-[0.7rem] mt-0.5">HSN & State Code Decoupled</div>
        </div>

        <div>
          <div className="opacity-40 mb-1">Server Lockout Guard</div>
          <div className="text-[1.1rem] font-bold">20-Min Server Clock</div>
          <div className="opacity-50 text-[0.7rem] mt-0.5">&gt;3 Failures Persistent Block</div>
        </div>
      </div>
    </section>
  );
};
