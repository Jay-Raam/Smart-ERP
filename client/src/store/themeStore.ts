import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrimaryColor = 'blue' | 'indigo' | 'green' | 'amber' | 'purple' | 'rose';
export type DarkColorScheme = 'cinder' | 'black' | 'zinc' | 'graphite' | 'ash';
export type LightColorScheme = 'slate' | 'gray' | 'neutral';
export type CardSkin = 'bordered' | 'shadow-sm';

export interface ThemeSettings {
  themeMode: ThemeMode;
  primaryColor: PrimaryColor;
  darkColorScheme: DarkColorScheme;
  lightColorScheme: LightColorScheme;
  cardSkin: CardSkin;
  isMonochrome: boolean;
}

interface ThemeState extends ThemeSettings {
  isDark: boolean;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
  setDarkColorScheme: (scheme: DarkColorScheme) => void;
  setLightColorScheme: (scheme: LightColorScheme) => void;
  setCardSkin: (skin: CardSkin) => void;
  toggleMonochrome: () => void;
  resetTheme: () => void;
  applyDOMTheme: () => void;
  initTheme: () => void;
}

const DEFAULT_THEME: ThemeSettings = {
  themeMode: 'light',
  primaryColor: 'blue',
  darkColorScheme: 'cinder',
  lightColorScheme: 'slate',
  cardSkin: 'bordered',
  isMonochrome: false,
};

function getStoredTheme(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem('erp_theme_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean up legacy dark schemes if present
      if (['navy', 'mirage', 'mint'].includes(parsed.darkColorScheme)) {
        parsed.darkColorScheme = 'cinder';
      }
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_THEME;
}

function computeIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

const initialSettings = getStoredTheme();
const initialIsDark = computeIsDark(initialSettings.themeMode);

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...initialSettings,
  isDark: initialIsDark,
  isCustomizerOpen: false,

  setIsCustomizerOpen: (open: boolean) => set({ isCustomizerOpen: open }),

  setThemeMode: (mode: ThemeMode) => {
    const isDark = computeIsDark(mode);
    set({ themeMode: mode, isDark });
    get().applyDOMTheme();
  },

  setPrimaryColor: (primaryColor: PrimaryColor) => {
    set({ primaryColor });
    get().applyDOMTheme();
  },

  setDarkColorScheme: (darkColorScheme: DarkColorScheme) => {
    set({ darkColorScheme });
    get().applyDOMTheme();
  },

  setLightColorScheme: (lightColorScheme: LightColorScheme) => {
    set({ lightColorScheme });
    get().applyDOMTheme();
  },

  setCardSkin: (cardSkin: CardSkin) => {
    set({ cardSkin });
    get().applyDOMTheme();
  },

  toggleMonochrome: () => {
    const next = !get().isMonochrome;
    set({ isMonochrome: next });
    get().applyDOMTheme();
  },

  resetTheme: () => {
    const isDark = computeIsDark(DEFAULT_THEME.themeMode);
    set({ ...DEFAULT_THEME, isDark });
    get().applyDOMTheme();
  },

  initTheme: () => {
    get().applyDOMTheme();
  },

  applyDOMTheme: () => {
    if (typeof window === 'undefined') return;
    const { themeMode, primaryColor, darkColorScheme, lightColorScheme, cardSkin, isMonochrome } = get();
    const isDark = computeIsDark(themeMode);
    set({ isDark });

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    root.dataset.themePrimary = primaryColor;
    root.dataset.themeDark = darkColorScheme;
    root.dataset.themeLight = lightColorScheme;
    root.dataset.cardSkin = cardSkin;

    if (isMonochrome) {
      root.classList.add('is-monochrome');
      document.body.classList.add('is-monochrome');
    } else {
      root.classList.remove('is-monochrome');
      document.body.classList.remove('is-monochrome');
    }

    try {
      localStorage.setItem(
        'erp_theme_settings',
        JSON.stringify({
          themeMode,
          primaryColor,
          darkColorScheme,
          lightColorScheme,
          cardSkin,
          isMonochrome,
        })
      );
    } catch (e) {}
  },
}));

// Setup OS color scheme media query listener
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.themeMode === 'system') {
      state.applyDOMTheme();
    }
  });

  // Apply on initial script load
  useThemeStore.getState().applyDOMTheme();
}
