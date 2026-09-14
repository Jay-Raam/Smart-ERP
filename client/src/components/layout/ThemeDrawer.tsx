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

const PRIMARY_COLORS: { id: PrimaryColor; name: string; hex: string }[] = [
  { id: 'blue', name: 'Blue', hex: '#2563eb' },
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5' },
  { id: 'green', name: 'Green', hex: '#16a34a' },
  { id: 'amber', name: 'Amber', hex: '#d97706' },
  { id: 'purple', name: 'Purple', hex: '#9333ea' },
  { id: 'rose', name: 'Rose', hex: '#e11d48' },
];

const DARK_SCHEMES: { id: DarkColorScheme; name: string; desc: string; bgHex: string; borderHex: string }[] = [
  { id: 'cinder', name: 'Cinder Carbon', desc: 'Balanced deep carbon dark', bgHex: '#0e0f11', borderHex: '#26282e' },
  { id: 'black', name: 'Pitch Black', desc: 'Pure OLED zero-light black', bgHex: '#000000', borderHex: '#222225' },
  { id: 'zinc', name: 'Charcoal Zinc', desc: 'Modern studio neutral charcoal', bgHex: '#09090b', borderHex: '#27272a' },
  { id: 'graphite', name: 'Graphite Dark', desc: 'Refined smooth matte carbon', bgHex: '#121316', borderHex: '#2c303a' },
  { id: 'ash', name: 'Smoky Ash', desc: 'Neutral smooth obsidian tone', bgHex: '#111111', borderHex: '#2e2e2e' },
];

const LIGHT_SCHEMES: { id: LightColorScheme; name: string; desc: string; bgHex: string }[] = [
  { id: 'slate', name: 'Pure Slate', desc: 'Crisp light engineering slate', bgHex: '#f8fafc' },
  { id: 'gray', name: 'Studio Gray', desc: 'Clean balanced neutral gray', bgHex: '#f9fafb' },
  { id: 'neutral', name: 'Warm Ivory', desc: 'Smooth minimalist off-white', bgHex: '#fafafa' },
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
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className="w-screen max-w-md transform shadow-2xl transition ease-in-out duration-300 flex flex-col border-l"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-main)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-xs"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                  Theme & Appearance
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Tailor your workspace styling and color palette
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 opacity-60 hover:opacity-100 transition cursor-pointer"
              style={{ color: 'var(--text-main)' }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Theme Mode (System / Light / Dark) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Theme Mode
                </span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-subtle)' }}>
                  Active: <strong className="capitalize" style={{ color: 'var(--text-main)' }}>{themeMode}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* System */}
                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer"
                  style={{
                    backgroundColor: themeMode === 'system' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: themeMode === 'system' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    color: themeMode === 'system' ? 'var(--color-primary)' : 'var(--text-main)',
                    fontWeight: themeMode === 'system' ? 700 : 500,
                  }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
                  >
                    <Monitor className="h-4 w-4" />
                  </div>
                  <span className="text-xs">System</span>
                </button>

                {/* Light */}
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer"
                  style={{
                    backgroundColor: themeMode === 'light' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: themeMode === 'light' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    color: themeMode === 'light' ? 'var(--color-primary)' : 'var(--text-main)',
                    fontWeight: themeMode === 'light' ? 700 : 500,
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Sun className="h-4 w-4" />
                  </div>
                  <span className="text-xs">Light</span>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition text-center cursor-pointer"
                  style={{
                    backgroundColor: themeMode === 'dark' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: themeMode === 'dark' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    color: themeMode === 'dark' ? 'var(--color-primary)' : 'var(--text-main)',
                    fontWeight: themeMode === 'dark' ? 700 : 500,
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200">
                    <Moon className="h-4 w-4" />
                  </div>
                  <span className="text-xs">Dark</span>
                </button>
              </div>
            </div>

            {/* 2. Primary Accent Palette */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Primary Accent Color
                </span>
                <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-subtle)' }}>
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
                      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition cursor-pointer"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      }}
                      title={c.name}
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-white shadow-xs transition transform group-hover:scale-110"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span
                        className="text-[10px] font-semibold truncate"
                        style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Dark Tone Palette (Active in Dark Mode — Strictly Black/Carbon shades, NO Blue) */}
            <div className={isDark ? 'opacity-100' : 'opacity-60'}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Dark Palette Shade {isDark ? '' : '(Preview in Dark Mode)'}
                </span>
                <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-subtle)' }}>
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
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded-lg border shadow-xs shrink-0"
                          style={{ backgroundColor: d.bgHex, borderColor: d.borderHex }}
                        />
                        <div>
                          <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                            {d.name}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {d.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Light Tone Palette (Active in Light Mode — Strictly White & Neutral Grays) */}
            <div className={!isDark ? 'opacity-100' : 'opacity-60'}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Light Palette Shade {!isDark ? '' : '(Preview in Light Mode)'}
                </span>
                <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-subtle)' }}>
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
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition text-center cursor-pointer"
                      style={{
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      }}
                    >
                      <div
                        className="h-5 w-full rounded-md border shadow-xs"
                        style={{ backgroundColor: l.bgHex, borderColor: 'var(--border-subtle)' }}
                      />
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-main)' }}
                      >
                        {l.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Card Skin & Elevation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Card Skin & Elevation
                </span>
                <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-subtle)' }}>
                  {cardSkin === 'bordered' ? 'Bordered' : 'Soft Shadow'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCardSkin('bordered')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer"
                  style={{
                    borderColor: cardSkin === 'bordered' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: cardSkin === 'bordered' ? 'var(--color-primary-light)' : 'transparent',
                    color: cardSkin === 'bordered' ? 'var(--color-primary)' : 'var(--text-main)',
                  }}
                >
                  <Layers className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Bordered</div>
                    <div className="text-[10px] opacity-70 font-normal">Clean crisp borders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCardSkin('shadow-sm')}
                  className="flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer"
                  style={{
                    borderColor: cardSkin === 'shadow-sm' ? 'var(--color-primary)' : 'var(--border-subtle)',
                    backgroundColor: cardSkin === 'shadow-sm' ? 'var(--color-primary-light)' : 'transparent',
                    color: cardSkin === 'shadow-sm' ? 'var(--color-primary)' : 'var(--text-main)',
                  }}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-bold">Soft Shadow</div>
                    <div className="text-[10px] opacity-70 font-normal">Subtle elevation depth</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 6. Monochrome Filter Toggle */}
            <div
              className="rounded-xl border p-3.5 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Contrast className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                    Monochrome Mode
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    High-focus minimalist grayscale
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMonochrome}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer"
                style={{
                  backgroundColor: isMonochrome ? 'var(--color-primary)' : 'var(--border-strong)',
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-xs ${
                    isMonochrome ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Reset */}
          <div
            className="border-t p-4 flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={resetTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold opacity-70 hover:opacity-100 transition cursor-pointer"
              style={{ color: 'var(--text-main)' }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Default</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white transition shadow-xs cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
