import React, { useState, useEffect } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export const AevionPreloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('INITIALIZING AEROSPACE HUD');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const steps = [
      { at: 15, msg: 'LOADING MONUMENTAL TYPOGRAPHY' },
      { at: 35, msg: 'HYDRATING THREE.JS 3D MESH PIPELINE' },
      { at: 65, msg: 'PREFETCHING DRONE.GLB & ROTOR DYNAMICS' },
      { at: 85, msg: 'INITIALIZING 4K CAMERA GIMBAL & ROTOR SYNTH' },
      { at: 100, msg: 'SYSTEM READY — ENTERING FLIGHT CONSOLE' },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setStatusMessage('SYSTEM READY — ENTERING FLIGHT CONSOLE');
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 400);
        }, 250);
      } else {
        setProgress(current);
        const match = steps.slice().reverse().find((s) => current >= s.at);
        if (match) setStatusMessage(match.msg);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between p-8 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-mono-tech select-none transition-opacity duration-400 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs border-b border-ink-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-current rounded-full" />
          </div>
          <span className="font-sans font-bold tracking-wider">SMART—ERP</span>
          <span className="opacity-40">|</span>
          <span className="opacity-60">AUTONOMOUS ORCHESTRATOR</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] opacity-60">
          <span>FRAME: 000</span>
          <span>·</span>
          <span>BOOT SEQUENCE</span>
        </div>
      </div>

      {/* Center Stage Reticle & Progress Bar */}
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full my-auto text-center space-y-6">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-dashed border-ink-24 animate-spin [animation-duration:10s]" />
          <div className="absolute inset-3 rounded-full border border-ink-12" />
          <div className="w-3 h-3 bg-current rounded-full animate-ping" />
        </div>

        <div>
          <div className="text-4xl md:text-5xl font-light font-display tracking-tight mb-2">
            {progress}%
          </div>
          <div className="text-xs tracking-widest opacity-70">
            [ {statusMessage} ]
          </div>
        </div>

        {/* Hairline Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between w-full text-[10px] opacity-40">
          <span>STATUTORY GST ENCLAVE</span>
          <span>ZERO-TRUST SECURED</span>
        </div>
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="flex justify-between items-center text-[10px] border-t border-ink-12 pt-4 opacity-50">
        <span>ED25519 VERIFIED SESSION</span>
        <span>INITIALIZING PRODUCTION CLUSTER IN-SOUTH-1</span>
      </div>
    </div>
  );
};
