import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Cv, Lang } from './cv.model';
import { LANG_PATH, SITE_ORIGIN } from './ui-text';

const ALTERNATES: readonly [hreflang: string, lang: Lang][] = [
  ['fr', 'fr'],
  ['en', 'en'],
  ['x-default', 'fr'],
];

/** En-tête du document propre à chaque langue ; écrit au prérendu, donc dans le HTML servi. */
@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  apply(lang: Lang, cv: Cv): void {
    this.document.documentElement.setAttribute('lang', lang);
    this.title.setTitle(`${cv.name} — ${cv.headline[lang]}`);
    this.meta.updateTag({ name: 'description', content: cv.description[lang] });

    for (const [hreflang, target] of ALTERNATES) {
      let link = this.document.head.querySelector<HTMLLinkElement>(
        `link[rel="alternate"][hreflang="${hreflang}"]`,
      );
      if (!link) {
        link = this.document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        this.document.head.appendChild(link);
      }
      link.setAttribute('href', SITE_ORIGIN + LANG_PATH[target]);
    }
  }
}
