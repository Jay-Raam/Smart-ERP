import React, { useState, useEffect } from 'react';
import { publicThemeManager, ThemeMode } from '../../utils/publicTheme';

interface AevionNavbarProps {
  onSignInClick: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const AevionNavbar: React.FC<AevionNavbarProps> = ({
  onSignInClick,
  currentPath = '/',
  onNavigate,
}) => {
  const [theme, setTheme] = useState<ThemeMode>(publicThemeManager.getTheme());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localTimeInfo, setLocalTimeInfo] = useState<{
    timeStr: string;
    zoneAbbr: string;
    locationName: string;
  }>({
    timeStr: '',
    zoneAbbr: 'UTC',
    locationName: '',
  });

  // Subscribe to theme updates
  useEffect(() => {
    return publicThemeManager.subscribe((newTheme) => {
      setTheme(newTheme);
    });
  }, []);

  // Live auto-detected user local time based on browser timezone and location
  useEffect(() => {
    const updateLocalTime = () => {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const now = new Date();

        // Format 12-hour local time with AM/PM
        const timeStr = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // Determine friendly timezone abbreviation (e.g. IST for India, Canada / EST for Canada, etc.)
        let zoneLabel = 'LOCAL';
        if (timeZone === 'Asia/Calcutta' || timeZone === 'Asia/Kolkata') {
          zoneLabel = 'IST';
        } else if (timeZone.includes('Toronto') || timeZone.includes('Montreal')) {
          zoneLabel = 'Canada (EST)';
        } else if (timeZone.includes('Vancouver')) {
          zoneLabel = 'Canada (PST)';
        } else if (timeZone.includes('Edmonton') || timeZone.includes('Calgary')) {
          zoneLabel = 'Canada (MST)';
        } else if (timeZone.includes('Winnipeg')) {
          zoneLabel = 'Canada (CST)';
        } else if (timeZone.includes('Halifax')) {
          zoneLabel = 'Canada (AST)';
        } else if (timeZone.includes('New_York')) {
          zoneLabel = 'EST';
        } else if (timeZone.includes('Chicago')) {
          zoneLabel = 'CST';
        } else if (timeZone.includes('Denver')) {
          zoneLabel = 'MST';
        } else if (timeZone.includes('Los_Angeles')) {
          zoneLabel = 'PST';
        } else if (timeZone.includes('London')) {
          zoneLabel = 'GMT';
        } else if (timeZone.includes('Paris') || timeZone.includes('Berlin')) {
          zoneLabel = 'CET';
        } else if (timeZone.includes('Dubai')) {
          zoneLabel = 'GST';
        } else if (timeZone.includes('Singapore')) {
          zoneLabel = 'SGT';
        } else if (timeZone.includes('Tokyo')) {
          zoneLabel = 'JST';
        } else if (timeZone.includes('Sydney')) {
          zoneLabel = 'AEST';
        } else {
          const parts = new Intl.DateTimeFormat([], { timeZoneName: 'short' }).formatToParts(now);
          const abbrPart = parts.find((p) => p.type === 'timeZoneName')?.value;
          zoneLabel = abbrPart || timeZone.split('/')[1]?.replace(/_/g, ' ') || 'LOCAL';
        }

        const city = timeZone.split('/')[1]?.replace(/_/g, ' ') || timeZone;

        setLocalTimeInfo({
          timeStr,
          zoneAbbr: zoneLabel,
          locationName: city,
        });
      } catch {
        const now = new Date();
        setLocalTimeInfo({
          timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          zoneAbbr: 'LOCAL',
          locationName: '',
        });
      }
    };

    updateLocalTime();
    const interval = setInterval(updateLocalTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Releases', path: '/releases' },
    { label: 'Contact', path: '/contact' },
  ];

  const isCurrentActive = (path: string) => {
    if (path === '/' && (currentPath === '/' || currentPath === '')) return true;
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Project Name with Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-3 px-3.5 py-2 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
            >
              {/* Modern Minimal Logo Symbol */}
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tight shadow-sm group-hover:scale-105 transition-transform">
                <span>S</span>
              </div>
              <div className="flex items-center gap-1.5 pr-1">
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                  Smart ERP
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium">
                  v1.2
                </span>
              </div>
            </button>
          </div>

          {/* Center: Clean Nav Links (About, Services, Pricing, Releases, Contact) */}
          <nav className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm">
            {navLinks.map((link) => {
              const active = isCurrentActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Local Time, Theme Switcher, Login, Interest CTA, Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Auto-Detected User Local Time Badge */}
            <div
              title={`Auto-detected from your timezone (${localTimeInfo.locationName || localTimeInfo.zoneAbbr})`}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-xs font-mono text-slate-600 dark:text-zinc-400 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {localTimeInfo.zoneAbbr}
              </span>
              <span>{localTimeInfo.timeStr}</span>
            </div>

            {/* Dark / Light Mode Toggle Icon */}
            <button
              onClick={() => publicThemeManager.toggle()}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-sm transition-all active:scale-95"
            >
              {theme === 'dark' ? (
                <span className="text-sm">☀</span>
              ) : (
                <span className="text-sm">☾</span>
              )}
            </button>

            {/* Login Button */}
            <button
              onClick={onSignInClick}
              className="hidden sm:flex items-center px-4 py-1.5 rounded-full text-xs font-medium border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-sm transition-all active:scale-95"
            >
              Login
            </button>

            {/* Interest Button (Get Started / Request Walkthrough) */}
            <button
              onClick={() => handleNavClick('/contact')}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <span className="text-[10px] opacity-75">→</span>
            </button>

            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-sm transition-colors"
              title="Open Navigation Menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Responsive Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col justify-between pt-24 pb-8 px-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl transition-all duration-300">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="pb-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
              <span>NAVIGATION DIRECTORY</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{localTimeInfo.zoneAbbr} {localTimeInfo.timeStr}</span>
              </div>
            </div>

            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const active = isCurrentActive(link.path);
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-950'
                        : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-xs opacity-50">→</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-zinc-700 text-sm font-medium text-slate-900 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In to Enterprise Workspace
              </button>

              <button
                onClick={() => handleNavClick('/contact')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                Get Started with Smart ERP →
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 dark:text-zinc-600">
            Smart ERP Enterprise Edition · Local Time: {localTimeInfo.zoneAbbr} {localTimeInfo.timeStr}
          </div>
        </div>
      )}
    </>
  );
};
