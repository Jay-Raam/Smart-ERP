import React from 'react';

interface PublicNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scrollPercent: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSignInClick: () => void;
  currentTime: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activeTab,
  setActiveTab,
  scrollPercent,
  theme,
  toggleTheme,
  onSignInClick,
  currentTime,
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 pointer-events-none px-4 sm:px-8 py-4 sm:py-6">
      <nav
        className="flex items-center justify-between w-full font-geo-sans font-medium text-[1.1rem] sm:text-[1.3rem] uppercase tracking-wider pointer-events-auto mix-blend-difference text-white"
        style={{ color: '#ffffff' }}
      >
        {/* Left: Brand + Telemetry */}
        <div className="flex items-center gap-6 sm:gap-10">
          <button
            onClick={() => setActiveTab('hero')}
            className="font-bold tracking-widest text-[1.3rem] sm:text-[1.5rem] hover:opacity-70 transition-opacity bg-transparent border-none p-0 text-white font-geo-sans"
          >
            SMART—ERP
          </button>

          <div className="hidden lg:flex items-center gap-2 font-geo-mono text-[0.85rem] opacity-60 lowercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{currentTime}</span>
            <span className="opacity-40">/</span>
            <span>utc+05:30</span>
          </div>

          <div className="font-geo-mono text-[0.85rem] opacity-75 geo-tabular">
            [{String(scrollPercent).padStart(2, '0')}%]
          </div>
        </div>

        {/* Center: Public Section Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 font-geo-sans text-[0.95rem] tracking-widest">
          {[
            { id: 'hero', label: 'Overview', num: '01' },
            { id: 'features', label: 'Engine Matrix', num: '02' },
            { id: 'vision', label: 'Doctrine', num: '03' },
            { id: 'releases', label: 'Changelog', num: '04' },
            { id: 'contact', label: 'Inquiries', num: '05' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 bg-transparent border-none p-0 transition-opacity uppercase font-geo-sans ${
                activeTab === item.id ? 'opacity-100 font-bold' : 'opacity-50 hover:opacity-90'
              }`}
            >
              <span className="font-geo-mono text-[0.75rem] opacity-60">[{item.num}]</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Theme Toggle & Sign In Access */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Circular Theme Toggle with pulse ring */}
          <button
            onClick={toggleTheme}
            aria-label={`Toggle theme (currently ${theme})`}
            title={`Toggle geological theme (${theme})`}
            className="relative w-4 h-4 rounded-full bg-white border-none cursor-pointer p-0 hover:scale-125 transition-transform"
          >
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-25"></span>
          </button>

          {/* Direct Sign In to Protected ERP Workspace */}
          <button
            onClick={onSignInClick}
            className="flex items-center gap-1.5 border border-white/40 hover:border-white px-3 sm:px-4 py-1.5 sm:py-2 text-[0.8rem] sm:text-[0.9rem] font-geo-mono uppercase tracking-widest bg-transparent hover:bg-white hover:text-black transition-colors rounded-none"
          >
            <span>[ Sign In</span>
            <span className="text-[1rem] leading-none">→</span>
            <span>]</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
