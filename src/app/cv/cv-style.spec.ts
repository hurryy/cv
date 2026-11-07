import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_STYLE } from './cv.config';
import { CV_STYLES, STYLE_STORAGE_KEY, StyleService, isCvStyle } from './cv-style';

describe('StyleService', () => {
  let html: HTMLElement;
  let window: Window;
  const other = CV_STYLES.find((style) => style !== DEFAULT_STYLE) ?? DEFAULT_STYLE;

  const create = (platform = 'browser') => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    return TestBed.inject(StyleService);
  };

  beforeEach(() => {
    html = document.documentElement;
    window = document.defaultView as Window;
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    html.removeAttribute('data-style');
    window.localStorage.clear();
  });

  it('knows the three styles only', () => {
    expect(CV_STYLES).toEqual(['sobre', 'commentaires', 'editeur']);
    expect(isCvStyle(DEFAULT_STYLE)).toBe(true);
    expect(isCvStyle('terminal')).toBe(false);
    expect(isCvStyle(null)).toBe(false);
  });

  it('writes the default style into the prerendered page', () => {
    const styles = create('server');
    expect(html.getAttribute('data-style')).toBe(DEFAULT_STYLE);
    styles.sync(other);
    expect(styles.style()).toBe(DEFAULT_STYLE);
  });

  it('selects a style and remembers it', () => {
    const styles = create();
    styles.select(other);
    expect(styles.style()).toBe(other);
    expect(html.getAttribute('data-style')).toBe(other);
    expect(window.localStorage.getItem(STYLE_STORAGE_KEY)).toBe(other);
  });

  it('still selects when storage is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const styles = create();
    expect(() => styles.select(other)).not.toThrow();
    expect(html.getAttribute('data-style')).toBe(other);
  });

  it('syncs with a known ?style=, over the attribute', () => {
    html.setAttribute('data-style', DEFAULT_STYLE);
    const styles = create();
    styles.sync(other);
    expect(styles.style()).toBe(other);
    expect(html.getAttribute('data-style')).toBe(other);
  });

  it('falls back to the default on an unknown ?style=', () => {
    html.setAttribute('data-style', other);
    const styles = create();
    styles.sync('bogus');
    expect(styles.style()).toBe(DEFAULT_STYLE);
    expect(html.getAttribute('data-style')).toBe(DEFAULT_STYLE);
  });

  it('syncs with the attribute set by the inline script, or the default', () => {
    const styles = create();
    styles.sync(null);
    expect(styles.style()).toBe(DEFAULT_STYLE);

    html.setAttribute('data-style', other);
    styles.sync(null);
    expect(styles.style()).toBe(other);
  });
});
