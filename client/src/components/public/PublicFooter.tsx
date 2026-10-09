import React from 'react';

interface PublicFooterProps {
  onSignIn: () => void;
  onNavigateTab: (tab: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onSignIn, onNavigateTab }) => {
  return (
    <footer className="w-full border-t geo-divider px-4 sm:px-8 py-16 sm:py-24 max-w-[1440px] mx-auto font-geo-mono text-[0.85rem] uppercase">
      {/* Colossal Brand Display */}
      <div className="w-full mb-16 select-none opacity-90 overflow-hidden">
        <div className="font-geo-sans font-medium text-[4.5rem] sm:text-[9rem] lg:text-[12rem] leading-none tracking-tight -ml-1 sm:-ml-3">
          SMART—ERP
        </div>
      </div>

      {/* Structured Footer Rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b geo-divider">
        {/* Navigation */}
        <div className="space-y-3">
          <div className="opacity-40 font-bold mb-4">[ Index ]</div>
          <div>
            <button
              onClick={() => onNavigateTab('hero')}
              className="bg-transparent border-none p-0 opacity-70 hover:opacity-100 transition-opacity uppercase font-geo-mono"
            >
              01. Overview
            </button>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('features')}
              className="bg-transparent border-none p-0 opacity-70 hover:opacity-100 transition-opacity uppercase font-geo-mono"
            >
              02. Engine Matrix
            </button>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('vision')}
              className="bg-transparent border-none p-0 opacity-70 hover:opacity-100 transition-opacity uppercase font-geo-mono"
            >
              03. Doctrine
            </button>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('releases')}
              className="bg-transparent border-none p-0 opacity-70 hover:opacity-100 transition-opacity uppercase font-geo-mono"
            >
              04. Changelog
            </button>
          </div>
          <div>
            <button
              onClick={() => onNavigateTab('contact')}
              className="bg-transparent border-none p-0 opacity-70 hover:opacity-100 transition-opacity uppercase font-geo-mono"
            >
              05. Inquiries
            </button>
          </div>
        </div>

        {/* System Coordinates */}
        <div className="space-y-3">
          <div className="opacity-40 font-bold mb-4">[ Architecture ]</div>
          <div className="opacity-70">Vite 6 SPA + React 19</div>
          <div className="opacity-70">Express 4 + TypeScript</div>
          <div className="opacity-70">MongoDB Atlas Cluster</div>
          <div className="opacity-70">PostgreSQL Cloud Pool</div>
          <div className="opacity-70">Vercel Edge Deployment</div>
        </div>

        {/* Security Specifications */}
        <div className="space-y-3">
          <div className="opacity-40 font-bold mb-4">[ Security ]</div>
          <div className="opacity-70">Zero-Trust Perimeter</div>
          <div className="opacity-70">CWE-208 Equalized</div>
          <div className="opacity-70">20-Min Lockout Enforced</div>
          <div className="opacity-70">HttpOnly Secure JWT</div>
          <div className="opacity-70">Audit Log Trail</div>
        </div>

        {/* Direct Authentication Entry */}
        <div className="space-y-4">
          <div className="opacity-40 font-bold mb-4">[ Access Portal ]</div>
          <p className="opacity-70 text-[0.8rem] normal-case font-geo-sans">
            Authorized personnel can access the operational command center:
          </p>
          <button
            onClick={onSignIn}
            className="border border-current px-4 py-2.5 bg-transparent hover:bg-current hover:text-bg transition-colors font-geo-mono text-[0.8rem] uppercase"
          >
            [ Launch ERP Workspace → ]
          </button>
        </div>
      </div>

      {/* Bottom Attribution */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-8 gap-4 opacity-50 text-[0.75rem]">
        <div>SMART ENTERPRISE INDUSTRIES © 2026. ALL RIGHTS RESERVED.</div>
        <div className="tracking-widest">WITH LOVE BY JAYASRIBAAM S</div>
      </div>
    </footer>
  );
};
