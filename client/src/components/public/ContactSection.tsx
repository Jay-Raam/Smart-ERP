import React, { useState } from 'react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    tier: 'ENTERPRISE',
    inquiry: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <section className="w-full py-20 sm:py-32 px-4 sm:px-8 max-w-[1200px] mx-auto border-t geo-divider">
      {/* Eyebrow Label */}
      <span className="font-geo-mono text-[0.85rem] uppercase tracking-widest opacity-40 mb-4 block">
        (SYSTEM ACCESS & SPATIAL INQUIRIES)
      </span>

      {/* Header */}
      <h2 className="font-geo-sans text-[2.5rem] sm:text-[4rem] font-medium uppercase mb-6 tracking-tight">
        Request Architectural
        <br />
        Demonstration
      </h2>

      <p className="max-w-[720px] font-geo-sans text-[1.1rem] sm:text-[1.3rem] uppercase opacity-70 mb-16 leading-relaxed">
        Direct channel for enterprise CTOs, manufacturing executives, and technical architects seeking sovereign ERP deployments.
      </p>

      {isSubmitted ? (
        <div className="p-8 sm:p-12 border border-current bg-black/[0.04] dark:bg-white/[0.04] text-left">
          <div className="font-geo-mono text-[0.85rem] uppercase text-emerald-500 mb-2">
            [INQUIRY TRANSMITTED]
          </div>
          <h3 className="font-geo-sans text-[2rem] font-medium uppercase mb-4">
            Transmission Received
          </h3>
          <p className="font-geo-sans text-[1.1rem] opacity-80 uppercase max-w-[600px] mb-6">
            Our systems architecture team has logged your organization coordinates ({formData.organization || 'General Inquiry'}). We will initiate technical dispatch shortly.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="font-geo-mono text-[0.85rem] uppercase border border-current px-4 py-2 bg-transparent hover:bg-current hover:text-bg transition-colors"
          >
            [ New Transmission ]
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 font-geo-mono text-[0.85rem] uppercase">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="opacity-60 block">01 / Principal Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="E.G. JAYASRIBAAM S"
                className="w-full bg-transparent border-b border-current/30 focus:border-current py-3 px-1 font-geo-sans text-[1.1rem] uppercase tracking-wider outline-none transition-colors"
              />
            </div>

            {/* Organization */}
            <div className="space-y-2">
              <label className="opacity-60 block">02 / Organization / Entity *</label>
              <input
                required
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="E.G. SMART ENTERPRISE INDUSTRIES"
                className="w-full bg-transparent border-b border-current/30 focus:border-current py-3 px-1 font-geo-sans text-[1.1rem] uppercase tracking-wider outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email */}
            <div className="space-y-2">
              <label className="opacity-60 block">03 / Corporate Email *</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="NAME@ENTERPRISE.COM"
                className="w-full bg-transparent border-b border-current/30 focus:border-current py-3 px-1 font-geo-sans text-[1.1rem] uppercase tracking-wider outline-none transition-colors"
              />
            </div>

            {/* Deployment Tier */}
            <div className="space-y-2">
              <label className="opacity-60 block">04 / Deployment Model</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full bg-transparent border-b border-current/30 focus:border-current py-3 px-1 font-geo-sans text-[1.1rem] uppercase tracking-wider outline-none transition-colors cursor-pointer"
              >
                <option value="ENTERPRISE" className="bg-[#eceae5] dark:bg-[#0e0e0e] text-[#28282a] dark:text-[#eceae5]">
                  ENTERPRISE MULTI-TENANT (CLOUD HOSTED)
                </option>
                <option value="SOVEREIGN" className="bg-[#eceae5] dark:bg-[#0e0e0e] text-[#28282a] dark:text-[#eceae5]">
                  SOVEREIGN ON-PREM / AIR-GAPPED HARDWARE
                </option>
                <option value="CUSTOM" className="bg-[#eceae5] dark:bg-[#0e0e0e] text-[#28282a] dark:text-[#eceae5]">
                  CUSTOM INDUSTRIAL SCM SPECIFICATION
                </option>
              </select>
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="space-y-2">
            <label className="opacity-60 block">05 / Scope of Operations & Inquiries</label>
            <textarea
              rows={4}
              value={formData.inquiry}
              onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
              placeholder="SPECIFY TRANSACTION VOLUME, MULTI-STATE GST JURISDICTIONS, OR SPECIFIC STATE MACHINE REQUIREMENTS..."
              className="w-full bg-transparent border-b border-current/30 focus:border-current py-3 px-1 font-geo-sans text-[1.1rem] uppercase tracking-wider outline-none transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="border border-current px-8 py-4 bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors uppercase font-geo-mono text-[0.95rem] tracking-wider"
            >
              [ Transmit Operational Requisition → ]
            </button>
          </div>
        </form>
      )}

      {/* Direct Coordinates */}
      <div className="pt-20 mt-20 border-t geo-divider grid grid-cols-1 sm:grid-cols-3 gap-8 font-geo-mono text-[0.8rem] uppercase opacity-60">
        <div>
          <div className="opacity-40 mb-1">Direct Engineering Dispatch</div>
          <a href="mailto:jay.raam@smart.com" className="hover:underline font-bold">
            jay.raam@smart.com
          </a>
        </div>

        <div>
          <div className="opacity-40 mb-1">Source Repository</div>
          <a
            href="https://github.com/Jay-Raam/Smart-ERP"
            target="_blank"
            rel="noreferrer"
            className="hover:underline font-bold"
          >
            github.com/Jay-Raam/Smart-ERP
          </a>
        </div>

        <div>
          <div className="opacity-40 mb-1">Geographical Origin</div>
          <div>Greater Madurai Area, India (UTC+05:30)</div>
        </div>
      </div>
    </section>
  );
};
