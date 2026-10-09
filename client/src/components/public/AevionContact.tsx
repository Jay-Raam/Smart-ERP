import React, { useState } from 'react';

export const AevionContact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    tenantTier: 'ENTERPRISE',
    inquiry: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="dispatch"
      className="relative px-4 md:px-8 py-24 border-b border-ink-24"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-ink-12 pb-4 mb-16 text-xs font-mono-tech">
          <div className="flex items-center gap-2">
            <span className="opacity-40">[ 07 ]</span>
            <span>ENTERPRISE DISPATCH PROTOCOL</span>
          </div>
          <span className="opacity-40">[ SECURE TRANSMISSION ]</span>
        </div>

        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left Column: Direct Inquiries & Telemetry */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="tech-bracket mb-4">[ DIRECT REQUISITION ]</div>
              <h2 className="text-3xl sm:text-5xl font-light tracking-tight mb-6">
                Deploy Dedicated Cluster
              </h2>
              <p className="text-xs font-mono-tech opacity-70 leading-relaxed mb-8">
                Initiate onboarding for high-concurrency multi-tenant instances, custom statutory compliance engines, or on-premise zero-trust ledger deployments.
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-ink-12 font-mono-tech text-xs">
              <div>
                <span className="opacity-40 block mb-1">[ DIRECT TELEMETRY ]</span>
                <span className="font-semibold text-sm">dispatch@smart-erp.internal</span>
              </div>
              <div>
                <span className="opacity-40 block mb-1">[ ENCRYPTION KEY ]</span>
                <span className="opacity-75">ED25519-P256-SHA384-SECURE</span>
              </div>
              <div>
                <span className="opacity-40 block mb-1">[ COMPLIANCE OFFICE ]</span>
                <span className="opacity-75">TIDEL Park, Tharamani, Chennai, TN, India</span>
              </div>
            </div>
          </div>

          {/* Right Column: Industrial Minimalist Inquiry Form */}
          <div className="col-span-12 lg:col-span-7">
            {submitted ? (
              <div className="p-12 rounded-2xl border border-ink-24 bg-black/[0.02] dark:bg-white/[0.02] text-center font-mono-tech">
                <div className="w-12 h-12 rounded-full border border-emerald-500 text-emerald-500 mx-auto flex items-center justify-center text-xl mb-4">
                  ✓
                </div>
                <h3 className="text-lg font-bold mb-2">DISPATCH TRANSMISSION ACKNOWLEDGED</h3>
                <p className="text-xs opacity-60 max-w-md mx-auto mb-6">
                  Requisition ID #REQ-{Math.floor(100000 + Math.random() * 900000)} has been queued into the cluster orchestrator. Our enterprise engineering team will connect within 4 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-full border border-ink-24 text-xs font-mono-tech hover:bg-black/5 dark:hover:bg-white/10"
                >
                  TRANSMIT ANOTHER REQUISITION
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-8 sm:p-10 rounded-2xl border border-ink-24 bg-black/[0.01] dark:bg-white/[0.01] space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-mono-tech opacity-60 mb-2">
                      [ REPRESENTATIVE NAME ]
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Ramanathan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-ink-24 bg-transparent text-sm focus:outline-none focus:border-current transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech opacity-60 mb-2">
                      [ ENTERPRISE / ENTITY ]
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Logistics Ltd."
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-ink-24 bg-transparent text-sm focus:outline-none focus:border-current transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-mono-tech opacity-60 mb-2">
                      [ ENTERPRISE EMAIL ]
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. raman@apexlogistics.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-ink-24 bg-transparent text-sm focus:outline-none focus:border-current transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech opacity-60 mb-2">
                      [ CLUSTER DEPLOYMENT TIER ]
                    </label>
                    <select
                      value={formData.tenantTier}
                      onChange={(e) => setFormData({ ...formData, tenantTier: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-ink-24 bg-transparent text-sm focus:outline-none focus:border-current transition-colors"
                    >
                      <option value="COMMUNITY">Tier 01 : Cloud Multi-Tenant</option>
                      <option value="ENTERPRISE">Tier 02 : Dedicated VPC Instance</option>
                      <option value="SOVEREIGN">Tier 03 : Air-Gapped Sovereign Cluster</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-tech opacity-60 mb-2">
                    [ TECHNICAL SPECIFICATIONS / REQUISITION SCOPE ]
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Specify target monthly invoice volume, branch locations, and compliance needs..."
                    value={formData.inquiry}
                    onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-ink-24 bg-transparent text-sm focus:outline-none focus:border-current transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl text-center font-sans font-medium text-sm transition-all"
                    style={{
                      backgroundColor: 'var(--color-ink)',
                      color: '#ffffff',
                    }}
                  >
                    DISPATCH ENTERPRISE INQUIRY →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
