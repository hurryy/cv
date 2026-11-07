import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Cv, CvFormat, Lang } from './cv.model';
import { SITE_ORIGIN, cvPath } from './ui-text';

const ALTERNATES: readonly [hreflang: string, format: CvFormat, lang: Lang][] = [
  ['fr-CH', 'ch', 'fr'],
  ['en-CH', 'ch', 'en'],
  ['fr-FR', 'fr', 'fr'],
  ['en-FR', 'fr', 'en'],
  ['x-default', 'ch', 'fr'],
];

/** En-tête du document propre à chaque page ; écrit au prérendu, donc dans le HTML servi. */
@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(format: CvFormat, lang: Lang, cv: Cv): void {
    this.document.documentElement.setAttribute('lang', lang);
    this.title.setTitle(`${cv.name} — ${cv.headline[lang]}`);
    this.meta.updateTag({ name: 'description', content: cv.description[lang] });

    this.link('link[rel="canonical"]', { rel: 'canonical' }).setAttribute(
      'href',
      SITE_ORIGIN + cvPath(format, lang),
    );
    for (const [hreflang, targetFormat, targetLang] of ALTERNATES) {
      this.link(`link[rel="alternate"][hreflang="${hreflang}"]`, {
        rel: 'alternate',
        hreflang,
      }).setAttribute('href', SITE_ORIGIN + cvPath(targetFormat, targetLang));
    }
  }

  private link(selector: string, attributes: Record<string, string>): HTMLLinkElement {
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      for (const [name, value] of Object.entries(attributes)) {
        link.setAttribute(name, value);
      }
      this.document.head.appendChild(link);
    }
    return link;
  }
}
