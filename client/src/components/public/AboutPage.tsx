import React from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionFooter } from './AevionFooter';

interface AboutPageProps {
  onSignInClick: () => void;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  return (
    <div className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors flex flex-col justify-between">
      <AevionNavbar
        onSignInClick={onSignInClick}
        currentPath="/about"
        onNavigate={onNavigate}
      />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero Headline */}
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-4">
            Our Purpose & Vision
          </span>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Enterprise software designed for humans, <span className="font-semibold text-emerald-600 dark:text-emerald-400">built for accuracy.</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 mt-6 leading-relaxed">
            Most ERP systems are clunky, slow, and needlessly complex. We created Smart ERP to give modern businesses effortless billing, airtight statutory compliance, and total clarity across their entire supply chain.
          </p>
        </div>

        {/* 3 Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y border-slate-200 dark:border-zinc-800">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
            <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-light">01</span>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mt-4 mb-2">
              Statutory Accuracy
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Every invoice and bill automatically computes exact CGST, SGST, IGST, and cess across all 37 Indian states and Union Territories without manual guesswork.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
            <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-light">02</span>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mt-4 mb-2">
              Uncompromising Speed
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Generate A4 tax invoices and thermal receipts in milliseconds. Search across tens of thousands of customer ledgers with instant sub-second response times.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/80 shadow-sm">
            <span className="text-emerald-600 dark:text-emerald-400 text-2xl font-light">03</span>
            <h3 className="text-xl font-medium text-slate-900 dark:text-white mt-4 mb-2">
              Bank-Grade Security
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Multi-tenant data isolation, role-based access permissions, anti-timing authentication defense, and immutable audit logs ensure your fiscal records remain confidential.
            </p>
          </div>
        </div>

        {/* Numbers That Matter */}
        <div className="py-16">
          <h2 className="text-2xl font-light text-slate-900 dark:text-white mb-8">
            Built for enterprise scale
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
              <div className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">100%</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">GST Statutory Compliance</div>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
              <div className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">&lt; 15ms</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Average Invoice Calculation</div>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
              <div className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">37</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">State Tax Jurisdictions</div>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
              <div className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">99.99%</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Uptime SLA Reliability</div>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 dark:bg-zinc-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-light">Experience the difference for yourself</h3>
            <p className="text-sm text-slate-400 mt-1">
              Join leading organizations that manage their day-to-day operations with Smart ERP.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/contact')}
              className="px-6 py-3 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
            >
              Get in Touch →
            </button>
            <button
              onClick={onSignInClick}
              className="px-6 py-3 rounded-full text-xs font-medium border border-zinc-700 hover:bg-zinc-800 text-zinc-200 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      <AevionFooter onSignInClick={onSignInClick} onNavigate={onNavigate} />
    </div>
  );
};
