import React from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionFooter } from './AevionFooter';

interface ServicesPageProps {
  onSignInClick: () => void;
  onNavigate: (path: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  const services = [
    {
      id: 'invoicing',
      title: 'Smart Invoicing & GST Engine',
      summary: 'Effortless compliant tax invoices with zero calculation mistakes.',
      features: [
        'Automatic CGST + SGST vs IGST detection based on customer state',
        'Built-in HSN code library with statutory tax rate lookup',
        'Instant A4 PDF download and direct thermal receipt printing',
        'Customer credit balance tracking and automated payment receipts',
      ],
      badge: 'TAX COMPLIANT',
    },
    {
      id: 'purchases',
      title: 'Procurement & Purchase Orders',
      summary: 'Strict vendor order controls with immutable state transitions.',
      features: [
        'Complete procurement lifecycle: Draft → Approved → Billed',
        'Vendor GSTIN verification and automated purchase bill generation',
        'Three-way matching between PO, delivery challan, and vendor invoice',
        'Real-time vendor outstanding ledger and payment scheduling',
      ],
      badge: 'PROCUREMENT',
    },
    {
      id: 'inventory',
      title: 'Multi-Store Inventory & Warehousing',
      summary: 'Always know what is in stock across every warehouse and branch.',
      features: [
        'Real-time multi-branch inventory tracking with batch numbers',
        'Automated safety stock alerts and low-stock reorder warnings',
        'Delivery Challan management for seamless stock transfers',
        'Accurate FIFO inventory valuation and profit margin reporting',
      ],
      badge: 'SUPPLY CHAIN',
    },
    {
      id: 'banking',
      title: 'Banking & Financial Accounting',
      summary: 'Double-entry precision with continuous bank reconciliation.',
      features: [
        'Multi-account banking ledger with automated deposit & withdrawal tracking',
        'Hassle-free journal entries and inter-account transfers',
        'Instant GSTR-1 and GSTR-3B tax summary generation',
        'Comprehensive Profit & Loss and Balance Sheet statements',
      ],
      badge: 'FINANCIAL LEDGER',
    },
    {
      id: 'branches',
      title: 'Multi-Branch & Multi-Tenant Control',
      summary: 'Scale from a single store to nationwide retail operations.',
      features: [
        'Isolated branch databases with unified executive rollups',
        'Financial year roll-over and historical record locking',
        'Customizable invoice prefixes and branch-specific branding',
        'Granular branch-level employee assignment and store oversight',
      ],
      badge: 'ENTERPRISE ARCHITECTURE',
    },
    {
      id: 'security',
      title: 'Role-Based Access & Security Defense',
      summary: 'Protect your enterprise financial records with zero-trust permissions.',
      features: [
        'Fine-grained module permissions (View, Create, Edit, Delete)',
        'Anti-timing authentication delay protection against credential guessing',
        'Enforced 20-minute server-synced lockout on failed attempts',
        'Immutable audit logs tracking every critical fiscal transaction',
      ],
      badge: 'SECURITY VAULT',
    },
  ];

  return (
    <div className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors flex flex-col justify-between">
      <AevionNavbar
        onSignInClick={onSignInClick}
        currentPath="/services"
        onNavigate={onNavigate}
      />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-4">
            Platform Capabilities & Services
          </span>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Everything your enterprise needs to <span className="font-semibold text-emerald-600 dark:text-emerald-400">run seamlessly.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 mt-6 leading-relaxed">
            Smart ERP connects every corner of your business—from point-of-sale invoices to multi-store warehouses and GST tax filings—in one beautifully integrated platform.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-md"
            >
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 block mb-3">
                  {svc.badge}
                </span>
                <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">
                  {svc.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                  {svc.summary}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
                  {svc.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  onClick={() => onNavigate('/contact')}
                  className="text-xs font-medium text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>Request Module Demo</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-emerald-600 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-2xl font-light">Need a custom feature or workflow?</h3>
            <p className="text-sm text-emerald-100 mt-1 max-w-xl">
              Our engineering team builds dedicated integrations for high-volume enterprises, custom inventory scanners, and legacy ERP migrations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/contact')}
            className="px-6 py-3 rounded-full text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shrink-0"
          >
            Talk to Solutions Architect →
          </button>
        </div>
      </main>

      <AevionFooter onSignInClick={onSignInClick} onNavigate={onNavigate} />
    </div>
  );
};
