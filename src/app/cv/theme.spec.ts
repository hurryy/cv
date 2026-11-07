import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme';

describe('ThemeService', () => {
  let html: HTMLElement;
  let window: Window;

  const create = (platform = 'browser') => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    html = document.documentElement;
    window = document.defaultView as Window;
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    html.removeAttribute('data-theme');
    window.localStorage.clear();
  });

  it('switches to dark, then back to light, and remembers the choice', () => {
    const theme = create();

    theme.toggle();
    expect(theme.theme()).toBe('dark');
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    theme.toggle();
    expect(theme.theme()).toBe('light');
    expect(html.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('still switches when storage throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const theme = create();

    expect(() => theme.toggle()).not.toThrow();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });

  it('still switches when storage is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const theme = create();

    expect(() => theme.toggle()).not.toThrow();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });

  it('syncs with the theme set by the inline script', () => {
    html.setAttribute('data-theme', 'dark');
    const theme = create();

    theme.sync();
    expect(theme.theme()).toBe('dark');
  });

  it('syncs with the system preference when nothing is stored', () => {
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
    try {
      const theme = create();
      theme.sync();
      expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(theme.theme()).toBe('dark');
    } finally {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('defaults to light without matchMedia', () => {
    const theme = create();
    theme.sync();
    expect(theme.theme()).toBe('light');
  });

  it('ignores the document while prerendering', () => {
    html.setAttribute('data-theme', 'dark');
    const theme = create('server');

    theme.sync();
    expect(theme.theme()).toBe('light');
  });
});
