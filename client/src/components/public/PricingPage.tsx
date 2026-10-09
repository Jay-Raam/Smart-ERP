import React, { useState } from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionFooter } from './AevionFooter';

interface PricingPageProps {
  onSignInClick: () => void;
  onNavigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Starter',
      badge: 'FOR SMALL BUSINESSES',
      priceMonthly: 2499,
      priceAnnual: 1999,
      description: 'Everything essential to issue compliant GST invoices and manage a single store.',
      features: [
        'Up to 3 Team Members',
        'Single Store / Branch',
        'Unlimited GST Invoices & Bills',
        'Automatic State Tax Calculation (CGST/SGST/IGST)',
        'Standard A4 & Thermal Print Engine',
        'Customer & Vendor Directory',
        'Email Support',
      ],
      cta: 'Start with Starter',
      highlighted: false,
    },
    {
      name: 'Professional',
      badge: 'MOST POPULAR',
      priceMonthly: 5999,
      priceAnnual: 4799,
      description: 'Ideal for growing organizations managing multiple locations and inventory warehouses.',
      features: [
        'Up to 15 Team Members',
        'Up to 5 Branches / Warehouses',
        'Everything in Starter, plus:',
        'Real-time Multi-Branch Inventory & Stock Transfers',
        'Delivery Challan & Purchase Order Approvals',
        'Automated GSTR-1 & GSTR-3B Tax Summaries',
        'Role-Based Access Control (RBAC)',
        'Priority Phone & WhatsApp Support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      badge: 'CUSTOM SCALE',
      priceMonthly: 14999,
      priceAnnual: 11999,
      description: 'Tailored architecture with dedicated database instances, custom integrations, and SLA.',
      features: [
        'Unlimited Team Members',
        'Unlimited Branches & Organizations',
        'Everything in Professional, plus:',
        'Dedicated Private Cloud / On-Premise Clustering',
        'Custom REST API & ERP Webhooks',
        'Automated Hourly Database Backups',
        'Dedicated Solutions Architect & 99.99% SLA',
        '24/7 Enterprise Support Hotline',
      ],
      cta: 'Contact Enterprise Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors flex flex-col justify-between">
      <AevionNavbar
        onSignInClick={onSignInClick}
        currentPath="/pricing"
        onNavigate={onNavigate}
      />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-4">
            Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Simple, predictable pricing <br />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">for every stage.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 mt-4 max-w-xl mx-auto">
            Choose the plan that fits your business. No hidden setup fees, no per-invoice penalties.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-200/80 dark:bg-zinc-800 mt-8 border border-slate-300/60 dark:border-zinc-700">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-stretch">
          {plans.map((plan) => {
            const price = billingPeriod === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`p-8 rounded-3xl flex flex-col justify-between transition-all ${
                  plan.highlighted
                    ? 'bg-white dark:bg-zinc-900 border-2 border-emerald-500 shadow-xl relative'
                    : 'bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500">
                      {plan.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-slate-500">₹</span>
                      <span className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                        {price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">/ month</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {billingPeriod === 'annual' ? 'Billed annually' : 'Billed monthly'}
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-600 dark:text-zinc-300 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <button
                    onClick={() => onNavigate('/contact')}
                    className={`w-full py-3 rounded-xl text-xs font-medium transition-all ${
                      plan.highlighted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200'
                    }`}
                  >
                    {plan.cta} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Preview */}
        <div className="max-w-3xl mx-auto py-12 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                Can I switch plans later?
              </h4>
              <p>Yes, upgrade or downgrade anytime. Pro-rated differences are applied seamlessly to your billing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                Is our financial data safe?
              </h4>
              <p>All records are isolated per tenant with bcrypt encryption, anti-timing protection, and daily cloud snapshots.</p>
            </div>
          </div>
        </div>
      </main>

      <AevionFooter onSignInClick={onSignInClick} onNavigate={onNavigate} />
    </div>
  );
};
