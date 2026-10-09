import React, { useState } from 'react';

interface CapabilitySpec {
  id: string;
  name: string;
  badge: string;
  headline: string;
  description: string;
  specs: { label: string; value: string }[];
  diagramType: 'gst' | 'auth' | 'document';
}

export const AevionCapabilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const capabilities: CapabilitySpec[] = [
    {
      id: 'gst-engine',
      name: 'Statutory GST Matrix',
      badge: 'INDIAN TAXATION ENGINE',
      headline: 'Automated Inter-State & Intra-State Tax Calculation',
      description:
        'Eliminates manual accounting errors by cross-referencing your branch GSTIN against the customer or vendor state. Automatically chooses between IGST and CGST+SGST while binding statutory HSN codes and cess surcharges.',
      specs: [
        { label: 'Calculation Speed', value: '< 12ms' },
        { label: 'State Coverage', value: '37 Jurisdictions' },
        { label: 'HSN Binding', value: 'Auto-Matched' },
        { label: 'Audit Trail', value: '100% Immutable' },
      ],
      diagramType: 'gst',
    },
    {
      id: 'zero-trust',
      name: 'Authentication Security',
      badge: 'ZERO-TRUST DEFENSE',
      headline: 'Timing-Resistant Bcrypt Cryptography & Session Lockouts',
      description:
        'Guarantees constant-time verification (~85ms) regardless of whether an email address exists or not, defeating timing-enumeration attacks. Features an enforced 20-minute server-synced lockout and scoped role permissions.',
      specs: [
        { label: 'Timing Defense', value: '~85ms Fixed' },
        { label: 'Lockout Timer', value: '20-Min Enforced' },
        { label: 'Cookie Privacy', value: 'HttpOnly SameSite' },
        { label: 'Error Policy', value: 'Blinded Security' },
      ],
      diagramType: 'auth',
    },
    {
      id: 'print-engine',
      name: 'Document Engine',
      badge: 'HIGH-PRECISION PRINTING',
      headline: 'Instant A4 Web Sheets & Pixel-Perfect PDF Generation',
      description:
        'Ensures beautiful, professional invoices, purchase orders, and delivery challans across both thermal receipt printers and high-resolution corporate vector PDFs through an isolated rendering pipeline.',
      specs: [
        { label: 'Preview Speed', value: 'Sub-Second' },
        { label: 'Print Resolution', value: 'Native Vector' },
        { label: 'Paper Sizes', value: 'A4 & Thermal 80mm' },
        { label: 'Thread Safety', value: 'Non-Blocking' },
      ],
      diagramType: 'document',
    },
  ];

  const current = capabilities[activeTab];

  return (
    <section
      id="capabilities"
      className="relative z-10 px-4 md:px-8 py-20 border-b border-slate-200/80 dark:border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 mb-14 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">03</span>
            <span className="font-medium uppercase tracking-wider">Core Capabilities</span>
          </div>
          <span className="text-slate-400 dark:text-zinc-500">Interactive Architecture</span>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Tab Selectors & Descriptions */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-6">
              Select Architecture Module
            </div>

            {/* Tab Buttons */}
            <div className="flex flex-col space-y-3 mb-8">
              {capabilities.map((cap, idx) => (
                <button
                  key={cap.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    activeTab === idx
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-slate-400 dark:text-zinc-500">0{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{cap.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${activeTab === idx ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {activeTab === idx ? 'Active View' : 'Inspect →'}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Capability Summary */}
            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-zinc-800">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 uppercase">
                {current.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-light tracking-tight text-slate-900 dark:text-white leading-snug">
                {current.headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Right Column: Visual Telemetry Card & Specs Matrix */}
          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between min-h-[440px]">
              {/* Header */}
              <div className="flex items-center justify-between text-xs pb-4 border-b border-slate-100 dark:border-zinc-800">
                <span className="font-medium text-slate-700 dark:text-zinc-300">Live Engine Demonstration</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Verified Stable
                </span>
              </div>

              {/* Dynamic Diagram Visual */}
              <div className="my-8 flex flex-col items-center justify-center">
                {current.diagramType === 'gst' && (
                  <div className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-4">
                    <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                      <span>Branch Origin: Tamil Nadu (33)</span>
                      <span>Customer: Karnataka (29)</span>
                    </div>
                    <div className="p-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/30 text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block">
                        Inter-State Transaction Resolved
                      </span>
                      <div className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                        Applied IGST @ 18% (CGST: 0%, SGST: 0%)
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400">
                      <div>HSN 8471: Verified</div>
                      <div className="text-right">Rounding: Exact to 2 decimals</div>
                    </div>
                  </div>
                )}

                {current.diagramType === 'auth' && (
                  <div className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-4">
                    <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                      <span>Inbound Authentication</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Bcrypt Equalized</span>
                    </div>
                    <div className="relative h-10 flex items-center justify-center border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded mx-4">
                        <div className="bg-emerald-500 h-full w-4/5 animate-pulse rounded" />
                      </div>
                      <span className="absolute text-[11px] font-mono bg-white dark:bg-zinc-900 px-2 text-slate-700 dark:text-zinc-300">
                        Equalized Duration: ~85ms
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 text-center">
                      Identical response latency prevents user account enumeration.
                    </div>
                  </div>
                )}

                {current.diagramType === 'document' && (
                  <div className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-700">
                      <span className="font-semibold text-slate-900 dark:text-white">Tax Invoice — INV-2026-0042</span>
                      <span className="text-emerald-600 dark:text-emerald-400">A4 Standard</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                      <div className="flex justify-between">
                        <span>Aero Precision Unit (Qty: 2)</span>
                        <span>₹1,20,000.00</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                        <span>IGST @ 18.00%</span>
                        <span>₹21,600.00</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white">
                        <span>Total Payable</span>
                        <span className="text-emerald-600 dark:text-emerald-400">₹1,41,600.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4-Column Technical Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs">
                {current.specs.map((s, idx) => (
                  <div key={idx}>
                    <span className="block text-slate-400 dark:text-zinc-500 text-[11px] mb-0.5">{s.label}</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
