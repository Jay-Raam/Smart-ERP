import React, { useState, useEffect } from 'react';
import { droneFlightState } from '../../utils/droneFlightState';

interface AevionFooterProps {
  onSignInClick: () => void;
  onNavigate: (sectionId: string) => void;
}

export const AevionFooter: React.FC<AevionFooterProps> = ({
  onSignInClick,
  onNavigate,
}) => {
  const [flightState, setFlightState] = useState(droneFlightState.getSnapshot());

  useEffect(() => {
    return droneFlightState.subscribe(() => {
      setFlightState(droneFlightState.getSnapshot());
    });
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="relative z-10 px-4 md:px-8 py-16 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Top Callout Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-12 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Transform Your Business Operations
            </span>
            <h3 className="text-2xl sm:text-3xl font-light tracking-tight mt-1 text-slate-900 dark:text-zinc-100">
              Ready to experience modern enterprise ERP?
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-xl">
              Start with effortless invoicing, automated GST tax filing, and smart inventory management today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/contact')}
              className="px-5 py-2.5 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Contact Our Team →
            </button>
            <button
              onClick={onSignInClick}
              className="px-5 py-2.5 rounded-full text-xs font-medium border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-all"
            >
              Sign In to Portal
            </button>
          </div>
        </div>

        {/* Directory Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-slate-200 dark:border-zinc-800 text-xs">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-zinc-200 mb-4 tracking-wide uppercase">
              Product
            </h4>
            <ul className="space-y-2.5 text-slate-600 dark:text-zinc-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/services')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Services & Modules
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/pricing')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/releases')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Product Updates
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-zinc-200 mb-4 tracking-wide uppercase">
              Capabilities
            </h4>
            <ul className="space-y-2.5 text-slate-600 dark:text-zinc-400">
              <li>Indian GST Compliance</li>
              <li>Smart Invoicing & E-Way Bills</li>
              <li>Inventory & Multi-Store</li>
              <li>Automated Bank Reconciliation</li>
              <li>Multi-Branch Architecture</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-zinc-200 mb-4 tracking-wide uppercase">
              Security & Trust
            </h4>
            <ul className="space-y-2.5 text-slate-600 dark:text-zinc-400">
              <li>Role-Based Access Control</li>
              <li>Anti-Timing Protection</li>
              <li>Encrypted Session Cookies</li>
              <li>Audit Trail History</li>
              <li>Automated Cloud Backups</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-zinc-200 mb-4 tracking-wide uppercase">
              Company
            </h4>
            <ul className="space-y-2.5 text-slate-600 dark:text-zinc-400">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  About Smart ERP
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Contact Sales & Support
                </button>
              </li>
              <li>
                <a href="mailto:support@smarterp.io" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  support@smarterp.io
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-zinc-500">Chennai & Bangalore, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Audio / Camera Controls and Credits Toolbar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Smart ERP Inc. All rights reserved.</span>
          </div>

          {/* Interactive Audio and Camera Rec controls directly in Footer */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Camera Recording Status */}
            <button
              onClick={() => droneFlightState.toggleRecording()}
              title={flightState.isRecording ? 'Pause Camera Feed' : 'Resume Camera Feed'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] shadow-sm hover:border-slate-400 dark:hover:border-zinc-600 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  flightState.isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className={`font-semibold ${flightState.isRecording ? 'text-red-500' : 'text-slate-500'}`}>
                {flightState.isRecording ? 'REC' : 'PAUSED'}
              </span>
              <span>{formatTime(flightState.recordSeconds)}</span>
              <span className="opacity-40">|</span>
              <span className="opacity-75">4K 60FPS</span>
            </button>

            {/* Drone Rotor Sound ON/OFF Toggle */}
            <button
              onClick={() => droneFlightState.toggleAudio()}
              title={flightState.isAudioActive ? 'Turn Drone Sound Off' : 'Turn Drone Sound On'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] transition-all shadow-sm ${
                flightState.isAudioActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  flightState.isAudioActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                }`}
              />
              <span>Sound: {flightState.isAudioActive ? 'ON' : 'OFF'}</span>
              <span>{flightState.isAudioActive ? '🔊' : '🔇'}</span>
            </button>

            {/* System Status Indicator */}
            <div className="flex items-center gap-1.5 pl-2 text-[11px] opacity-75">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
