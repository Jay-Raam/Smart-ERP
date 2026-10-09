import React, { useState } from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionDroneCanvas } from './AevionDroneCanvas';
import { AevionFooter } from './AevionFooter';
import { publicThemeManager } from '../../utils/publicTheme';

interface ContactPageProps {
  onSignInClick: () => void;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: 'Enterprise ERP Consultation',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors flex flex-col justify-between">
      {/* Top Universal Modern Navbar */}
      <AevionNavbar
        onSignInClick={onSignInClick}
        currentPath="/contact"
        onNavigate={onNavigate}
      />

      {/* Main Split Screen Area: Left Drone, Right Contact Form */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-220px)]">
          {/* Left Column: 3D Flying Drone Centerpiece & Direct Contact Details */}
          <div className="lg:col-span-6 flex flex-col justify-between relative order-2 lg:order-1">
            {/* Header Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Engineering & Support
              </span>
              <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-slate-900 dark:text-zinc-100 mt-3 leading-tight">
                Designed to support <br />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">your business growth.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3 max-w-lg leading-relaxed">
                Connect directly with our engineering team for personalized demonstrations, GST tax architecture reviews, or custom integrations.
              </p>
            </div>

            {/* Human Direct Contact Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-zinc-800 mt-6 text-xs">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block mb-1">Direct Inquiries</span>
                <a
                  href="mailto:contact@smarterp.io"
                  className="font-medium text-slate-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  contact@smarterp.io
                </a>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block mb-1">Support Hotline</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  +91 (044) 2254-0000
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block mb-1">Headquarters</span>
                <span className="text-slate-600 dark:text-zinc-400">
                  TIDEL Park, Tharamani, Chennai
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block mb-1">Response Time</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Within 2 business hours
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Apple-Grade Contact Form */}
          <div className="lg:col-span-6 relative z-20 order-1 lg:order-2">
            <div className="p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xl backdrop-blur-sm">
              {isSubmitted ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
                    ✓
                  </div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                    Thank you, {formData.name || 'there'}!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                    We've received your inquiry. One of our solution architects will reach out to{' '}
                    <strong className="text-slate-900 dark:text-white font-medium">{formData.email}</strong>{' '}
                    shortly to discuss your requirements.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        company: '',
                        phone: '',
                        subject: 'Enterprise ERP Consultation',
                        message: '',
                      });
                    }}
                    className="mt-8 px-5 py-2.5 rounded-full text-xs font-medium border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-2xl font-light tracking-tight text-slate-900 dark:text-white">
                      Let's talk about your business
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                      Fill out the form below and we'll prepare a custom demo tailored to your workflow.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Work Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="anand@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Industries"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      How can we help you?
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all text-slate-800 dark:text-zinc-200"
                    >
                      <option value="Enterprise ERP Consultation">Enterprise ERP Consultation</option>
                      <option value="GST Invoicing & Taxation Engine">GST Invoicing & Taxation Engine</option>
                      <option value="Multi-Branch Inventory & Warehousing">Multi-Branch Inventory & Warehousing</option>
                      <option value="Custom API & Database Integration">Custom API & Database Integration</option>
                      <option value="General Question or Demo Request">General Question or Demo Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Message / Project Details
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your current workflow, number of users, branches, or any specific compliance questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-800 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-400 dark:text-zinc-500 mt-3">
                      We respect your privacy. No spam or unsolicited marketing.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <AevionFooter onSignInClick={onSignInClick} onNavigate={onNavigate} />
    </div>
  );
};
