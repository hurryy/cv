import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** Clé lue aussi par le script inline de `src/index.html` : les deux doivent rester égales. */
export const THEME_STORAGE_KEY = 'cv-theme';

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark';

/**
 * Thème affiché. Sans choix mémorisé, `data-theme` est absent de `<html>` et la feuille de
 * style suit `prefers-color-scheme` ; un choix pose `data-theme`, qui l'emporte.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<Theme>('light');

  readonly theme = this.current.asReadonly();

  /**
   * Aligne l'état sur ce que la page affiche déjà (attribut posé par le script inline, sinon
   * préférence système). À appeler après le rendu : au prérendu, ni l'un ni l'autre n'existe.
   */
  sync(): void {
    if (!this.isBrowser) {
      return;
    }
    const forced = this.document.documentElement.getAttribute('data-theme');
    if (isTheme(forced)) {
      this.current.set(forced);
      return;
    }
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    this.current.set(prefersDark?.matches ? 'dark' : 'light');
  }

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.current.set(next);
    this.document.documentElement.setAttribute('data-theme', next);
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage refusé (navigation privée, cookies bloqués) : le choix vaut pour la page.
    }
  }
}
