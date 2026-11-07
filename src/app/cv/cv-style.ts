import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DEFAULT_STYLE } from './cv.config';

/** Ordre de la liste déroulante. */
export const CV_STYLES = ['sobre', 'commentaires', 'editeur'] as const;

export type CvStyle = (typeof CV_STYLES)[number];

/** Clé et paramètre lus aussi par le script inline de `src/index.html` : à garder égaux. */
export const STYLE_STORAGE_KEY = 'cv-style';
export const STYLE_QUERY_PARAM = 'style';

export const isCvStyle = (value: unknown): value is CvStyle =>
  (CV_STYLES as readonly unknown[]).includes(value);

/**
 * Style de mise en page. Les trois mises en page sont toujours rendues ; l'attribut
 * `data-style` de `<html>` choisit, en CSS, celle qui s'affiche (`src/styles.scss`).
 *
 * Le prérendu écrit `DEFAULT_STYLE` dans l'attribut ; avant le premier rendu, le script inline
 * de `index.html` le remplace par un `?style=` valide ou, sans `?style=`, par le choix mémorisé.
 */
@Injectable({ providedIn: 'root' })
export class StyleService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<CvStyle>(DEFAULT_STYLE);

  readonly style = this.current.asReadonly();

  constructor() {
    if (!this.isBrowser) {
      this.document.documentElement.setAttribute('data-style', DEFAULT_STYLE);
    }
  }

  /**
   * Aligne l'état sur l'URL et sur ce que la page affiche déjà. Un `?style=` présent l'emporte,
   * et une valeur inconnue y vaut le défaut ; sinon l'attribut posé par le script inline.
   */
  sync(queryValue: string | null): void {
    if (!this.isBrowser) {
      return;
    }
    const source = queryValue ?? this.document.documentElement.getAttribute('data-style');
    this.apply(isCvStyle(source) ? source : DEFAULT_STYLE);
  }

  select(style: CvStyle): void {
    this.apply(style);
    try {
      this.document.defaultView?.localStorage.setItem(STYLE_STORAGE_KEY, style);
    } catch {
      // Stockage refusé (navigation privée, cookies bloqués) : le choix vaut pour la page.
    }
  }

  private apply(style: CvStyle): void {
    this.current.set(style);
    this.document.documentElement.setAttribute('data-style', style);
  }
}
