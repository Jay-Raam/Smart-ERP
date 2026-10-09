import React, { useState, useEffect } from 'react';
import { AevionNavbar } from './AevionNavbar';
import { AevionHero } from './AevionHero';
import { AevionIntro } from './AevionIntro';
import { AevionTelemetryGrid } from './AevionTelemetryGrid';
import { AevionCapabilities } from './AevionCapabilities';
import { AevionSolutions } from './AevionSolutions';
import { AevionReleases } from './AevionReleases';
import { AevionFooter } from './AevionFooter';
import { AevionDroneCanvas } from './AevionDroneCanvas';
import { AevionPreloader } from './AevionPreloader';
import { publicThemeManager, ThemeMode } from '../../utils/publicTheme';
import '../../styles/aevionTheme.css';

interface PublicShowcaseProps {
  onSignInClick: () => void;
  onNavigate?: (path: string) => void;
  initialTab?: string;
}

export const PublicShowcase: React.FC<PublicShowcaseProps> = ({
  onSignInClick,
  onNavigate,
  initialTab = 'hero',
}) => {
  // Preloader state: ensures full 3D drone mesh and assets load smoothly
  const [isLoading, setIsLoading] = useState(true);

  // Theme state synced with global publicThemeManager
  const [theme, setTheme] = useState<ThemeMode>(publicThemeManager.getTheme());

  useEffect(() => {
    return publicThemeManager.subscribe((newTheme) => {
      setTheme(newTheme);
    });
  }, []);

  const handleSectionScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGlobalNavigate = (pathOrId: string) => {
    if (pathOrId.startsWith('/')) {
      if (onNavigate) {
        onNavigate(pathOrId);
      } else {
        window.history.pushState({}, '', pathOrId);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      handleSectionScroll(pathOrId);
    }
  };

  return (
    <div
      data-theme={theme}
      className="aevion-scope min-h-screen w-full relative bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300"
    >
      {/* Site Entering Preloader: loads all assets and drone animation before reveal */}
      {isLoading && (
        <AevionPreloader onComplete={() => setIsLoading(false)} />
      )}

      {/* 3D Drone Travel Canvas - Fixed across showcase, updates with scrolling, pointer-events strictly none */}
      <AevionDroneCanvas mode="scroll" />

      {/* Top Universal Navbar - Only rendered after initial loading screen finishes */}
      {!isLoading && (
        <AevionNavbar
          onSignInClick={onSignInClick}
          currentPath="/"
          onNavigate={handleGlobalNavigate}
        />
      )}

      <main className={`w-full relative z-10 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Section 01: Hero Centerpiece */}
        <AevionHero
          onExplore={() => handleSectionScroll('mission')}
          onSignIn={onSignInClick}
        />

        {/* Section 02: Philosophy & Mission */}
        <AevionIntro />

        {/* Section 03: Telemetry Benchmarks & Reticle Dome */}
        <AevionTelemetryGrid />

        {/* Section 04: Interactive Capabilities Specifications */}
        <AevionCapabilities />

        {/* Section 05: Enterprise Operational Domains */}
        <AevionSolutions />

        {/* Section 06: Version Releases & Changelog */}
        <AevionReleases />
      </main>

      {/* Industrial Footer with embedded audio/recording controls */}
      {!isLoading && (
        <AevionFooter
          onSignInClick={onSignInClick}
          onNavigate={handleGlobalNavigate}
        />
      )}
    </div>
  );
};
