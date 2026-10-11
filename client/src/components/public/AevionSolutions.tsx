import React, { useState } from 'react';

interface DomainSolution {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  metrics: { label: string; value: string }[];
}

export const AevionSolutions: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('FINANCE');

  const categories = [
    { id: 'FINANCE', label: 'Financial Accounting' },
    { id: 'PROCUREMENT', label: 'Procurement & Purchasing' },
    { id: 'INVENTORY', label: 'Warehouse & Stores' },
    { id: 'MULTI-TENANT', label: 'Enterprise & Branches' },
  ];

  const solutions: Record<string, DomainSolution> = {
    FINANCE: {
      id: 'fin',
      category: 'FINANCE',
      title: 'Real-Time Financial Ledgers & Automated GST',
      subtitle: 'Double-entry precision paired with statutory Indian tax compliance.',
      description:
        'Keep banking, tax returns, and general ledgers aligned without manual reconciliations. Smart ERP automatically breaks down CGST, SGST, and IGST for error-free monthly filings.',
      tags: ['Statutory GST Compliance', 'Bank Reconciliation', 'Instant GSTR Summaries', 'Double-Entry Accounting'],
      metrics: [
        { label: 'Calculation Speed', value: '< 5ms' },
        { label: 'Accuracy Rating', value: '100.00%' },
        { label: 'Ledger Sync', value: 'Instant' },
        { label: 'Export Support', value: 'Excel / PDF / JSON' },
      ],
    },
    PROCUREMENT: {
      id: 'proc',
      category: 'PROCUREMENT',
      title: 'Structured Purchase Order Approvals',
      subtitle: 'Prevent duplicate vendor billing and unauthorized price modifications.',
      description:
        'Purchase orders flow systematically through review and approval stages before vendor bills can be created. Enforce vendor GST verification and match goods receipts with precision.',
      tags: ['Approval Workflow', 'Price Locking', 'Vendor Audit', 'Challan Matching'],
      metrics: [
        { label: 'Order State Locks', value: 'Enforced' },
        { label: 'Audit Trail', value: 'Complete' },
        { label: 'Bill Matching', value: '3-Way Verified' },
        { label: 'Vendor Directory', value: 'Centralized' },
      ],
    },
    INVENTORY: {
      id: 'inv',
      category: 'INVENTORY',
      title: 'Multi-Store Inventory & Real-Time Stocking',
      subtitle: 'Accurate stock valuation, batch management, and automatic low-stock alerts.',
      description:
        'Maintain clear visibility of inventory across all branches and stores. Generate delivery challans for inter-branch transfers and monitor FIFO valuation in real time.',
      tags: ['Barcode Scanning', 'Safety Stock Alerts', 'FIFO Ledger', 'Branch Transfers'],
      metrics: [
        { label: 'Inventory Updates', value: 'Instantaneous' },
        { label: 'Tracking Level', value: 'Per Unit / Batch' },
        { label: 'Reorder Signals', value: 'Automated' },
        { label: 'Transfer Logs', value: '100% Tracked' },
      ],
    },
    'MULTI-TENANT': {
      id: 'tenant',
      category: 'MULTI-TENANT',
      title: 'Multi-Branch & Role-Based Governance',
      subtitle: 'Strict account isolation with centralized organizational oversight.',
      description:
        'Empower branch managers to run their operations independently while giving executives real-time consolidated reports. Protect sensitive records with granular access permissions.',
      tags: ['Data Sovereignty', 'Role Permissions', 'Custom Branding', 'Executive Dashboards'],
      metrics: [
        { label: 'Tenant Isolation', value: '100% Scoped' },
        { label: 'Permission Depth', value: 'Per Module / Action' },
        { label: 'Session Security', value: 'HttpOnly Cookies' },
        { label: 'Cloud Uptime', value: '99.99%' },
      ],
    },
  };

  const current = solutions[activeCategory];

  return (
    <section
      id="solutions"
      className="relative z-10 px-4 md:px-8 py-20 border-b border-slate-200/80 dark:border-zinc-800/80"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-4 mb-12 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">04</span>
            <span className="font-medium uppercase tracking-wider">Enterprise Operational Domains</span>
          </div>
          <span className="text-slate-400 dark:text-zinc-500">Unified Workflow Engine</span>
        </div>

        {/* Category Pill Switcher */}
        <div className="flex flex-wrap gap-2 mb-12 border-b border-slate-200/60 dark:border-zinc-800/60 pb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Split Layout: Narrative & Metrics Grid vs Visual Showcase */}
        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200/70 dark:border-zinc-800/70 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 block">
                Domain Architecture
              </span>
              <h3 className="text-2xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                {current.title}
              </h3>
              <p className="text-base text-slate-700 dark:text-zinc-300 mb-3">
                {current.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {current.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs">
              {current.metrics.map((m, idx) => (
                <div key={idx}>
                  <span className="block text-slate-400 dark:text-zinc-500 text-[11px] mb-1">{m.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Feature Representation */}
          <div className="col-span-12 lg:col-span-6">
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800 text-xs">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {current.title}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Production Ready</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-800 dark:text-zinc-200">System Integration Status</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Synced</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                    Direct connection to enterprise database clusters with continuous transaction journaling.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-800 dark:text-zinc-200">Compliance & Validation</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px]">
                    Strict statutory checks applied prior to invoice or payment ledger confirmation.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Explore this module in a personalized consultation</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
