export type ThemeMode = 'dark' | 'light';

type ThemeListener = (theme: ThemeMode) => void;

class PublicThemeManager {
  private theme: ThemeMode = 'light';
  private listeners: Set<ThemeListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart_erp_public_theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        this.theme = saved;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme = prefersDark ? 'dark' : 'light';
      }
      this.applyToDOM();
    }
  }

  private applyToDOM() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (this.theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('smart_erp_public_theme', this.theme);
  }

  public getTheme(): ThemeMode {
    return this.theme;
  }

  public setTheme(newTheme: ThemeMode) {
    this.theme = newTheme;
    this.applyToDOM();
    this.listeners.forEach((fn) => fn(this.theme));
  }

  public toggle(): ThemeMode {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  public subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const publicThemeManager = new PublicThemeManager();
