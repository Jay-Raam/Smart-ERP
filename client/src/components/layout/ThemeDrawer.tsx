import React from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Palette,
  Layers,
  RotateCcw,
  Check,
  Sparkles,
  Contrast,
} from 'lucide-react';
import {
  useThemeStore,
  ThemeMode,
  PrimaryColor,
  DarkColorScheme,
  LightColorScheme,
  CardSkin,
} from '../../store/themeStore';

const PRIMARY_COLORS: { id: PrimaryColor; name: string; hex: string; bgClass: string }[] = [
  { id: 'blue', name: 'Blue', hex: '#2563eb', bgClass: 'bg-blue-600' },
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5', bgClass: 'bg-indigo-600' },
  { id: 'green', name: 'Green', hex: '#16a34a', bgClass: 'bg-emerald-600' },
  { id: 'amber', name: 'Amber', hex: '#d97706', bgClass: 'bg-amber-500' },
  { id: 'purple', name: 'Purple', hex: '#9333ea', bgClass: 'bg-purple-600' },
  { id: 'rose', name: 'Rose', hex: '#e11d48', bgClass: 'bg-rose-600' },
];

const DARK_SCHEMES: { id: DarkColorScheme; name: string; desc: string; bgHex: string; borderHex: string }[] = [
  { id: 'cinder', name: 'Cinder (Default)', desc: 'Balanced deep carbon tone', bgHex: '#0e0f11', borderHex: '#2a2c32' },
  { id: 'navy', name: 'Navy', desc: 'Sophisticated industrial blue-slate', bgHex: '#182030', borderHex: '#384766' },
  { id: 'mirage', name: 'Mirage', desc: 'Midnight ultra-deep abyss', bgHex: '#050a16', borderHex: '#1e2b47' },
  { id: 'black', name: 'Pitch Black', desc: 'OLED pure high-contrast black', bgHex: '#000000', borderHex: '#242428' },
  { id: 'mint', name: 'Mint Dark', desc: 'Slight cool cyan undertone', bgHex: '#0a1014', borderHex: '#2a3942' },
];

const LIGHT_SCHEMES: { id: LightColorScheme; name: string; desc: string; bgHex: string }[] = [
  { id: 'slate', name: 'Slate', desc: 'Modern cool engineering tone', bgHex: '#f8fafc' },
  { id: 'gray', name: 'Gray', desc: 'Classic balanced neutral tone', bgHex: '#f9fafb' },
  { id: 'neutral', name: 'Neutral', desc: 'Clean warm modern surface', bgHex: '#fafafa' },
];

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const {
    themeMode,
    primaryColor,
    darkColorScheme,
    lightColorScheme,
    cardSkin,
    isMonochrome,
    isDark,
    setThemeMode,
    setPrimaryColor,
    setDarkColorScheme,
    setLightColorScheme,
    setCardSkin,
    toggleMonochrome,
    resetTheme,
  } = useThemeStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-slate-900 shadow-2xl transition ease-in-out duration-300 flex flex-col text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Appearance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tailor your workspace styling and color palette
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Theme Mode (System / Light / Dark) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Theme Mode
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Active: <strong className="capitalize text-slate-700 dark:text-slate-200">{themeMode}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* System */}
                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer ${
                    themeMode === 'system'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <span className="text-xs">System</span>
                </button>

                {/* Light */}
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Sun className="h-4 w-4" />
                  </div>
                  <span className="text-xs">Light</span>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer ${
                    themeMode === 'dark'
                      ? 'border-blue-600 bg-blue-950/40 text-blue-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 text-indigo-300">
                    <Moon className="h-4 w-4" />
                  </div>
                  <span className="text-xs">Dark</span>
                </button>
              </div>
            </div>

            {/* 2. Primary Accent Palette */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Primary Accent Color
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize">
                  {primaryColor}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {PRIMARY_COLORS.map((c) => {
                  const isSelected = primaryColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPrimaryColor(c.id)}
                      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-400 bg-slate-50 dark:bg-slate-800 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                      title={c.name}
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-white shadow-xs transition transform group-hover:scale-110"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-semibold truncate text-slate-600 dark:text-slate-300">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Dark Tone Palette (Active in Dark Mode) */}
            <div className={isDark ? 'opacity-100' : 'opacity-60'}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dark Palette Shade {isDark ? '' : '(Preview in Dark Mode)'}
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize">
                  {darkColorScheme}
                </span>
              </div>

              <div className="space-y-1.5">
                {DARK_SCHEMES.map((d) => {
                  const isSelected = darkColorScheme === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDarkColorScheme(d.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded-lg border shadow-xs shrink-0"
                          style={{ backgroundColor: d.bgHex, borderColor: d.borderHex }}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</div>
                          <div className="text-[11px] text-slate-400">{d.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Light Tone Palette (Active in Light Mode) */}
            <div className={!isDark ? 'opacity-100' : 'opacity-60'}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Light Palette Shade {!isDark ? '' : '(Preview in Light Mode)'}
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize">
                  {lightColorScheme}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {LIGHT_SCHEMES.map((l) => {
                  const isSelected = lightColorScheme === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLightColorScheme(l.id)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition text-center cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className="h-5 w-full rounded-md border border-slate-300 shadow-xs"
                        style={{ backgroundColor: l.bgHex }}
                      />
                      <span className="text-xs font-semibold capitalize">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Card Skin & Layout Style */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Card Skin & Elevation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCardSkin('bordered')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                    cardSkin === 'bordered'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Bordered</div>
                    <div className="text-[10px] text-slate-400 font-normal">Clean crisp borders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardSkin('shadow-sm')}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                    cardSkin === 'shadow-sm'
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Soft Shadow</div>
                    <div className="text-[10px] text-slate-400 font-normal">Subtle elevation depth</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 6. Monochrome Filter Toggle */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Contrast className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Monochrome Mode</div>
                  <div className="text-[11px] text-slate-400">High-focus grayscale aesthetic</div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMonochrome}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer ${
                  isMonochrome ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    isMonochrome ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Reset */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
            <button
              type="button"
              onClick={resetTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Default</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
