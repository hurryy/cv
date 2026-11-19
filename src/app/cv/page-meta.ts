import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CV_FORMATS } from './cv-formats';
import { shownPersonal } from './cv-view';
import { Cv, CvFormat, Lang } from './cv.model';
import { SITE_ORIGIN, canonicalUrl } from './ui-text';

const ALTERNATES: readonly [hreflang: string, format: CvFormat, lang: Lang][] = [
  ['fr-CH', 'ch', 'fr'],
  ['en-CH', 'ch', 'en'],
  ['fr-FR', 'fr', 'fr'],
  ['en-FR', 'fr', 'en'],
  ['x-default', 'ch', 'fr'],
];

/**
 * Liens `hreflang` des pages publiées, `[hreflang, URL]`. Un format masqué n'a pas de page : un
 * `hreflang` vers lui mènerait à une redirection. `public/sitemap.xml` reprend cette liste.
 */
export const alternateLinks = (formats: readonly CvFormat[]): [string, string][] =>
  ALTERNATES.filter(([, format]) => formats.includes(format)).map(([hreflang, format, lang]) => [
    hreflang,
    canonicalUrl(format, lang),
  ]);

/** Locale Open Graph d'une page : la langue, puis le pays du format (`fr_CH`, `en_FR`). */
export const ogLocale = (format: CvFormat, lang: Lang): string =>
  `${lang}_${format.toUpperCase()}`;

/**
 * Locales Open Graph des autres pages publiées. `x-default` est écarté : il désigne une page déjà
 * listée sous sa propre langue.
 */
export const ogLocaleAlternates = (
  formats: readonly CvFormat[],
  format: CvFormat,
  lang: Lang,
): string[] =>
  ALTERNATES.filter(
    ([hreflang, otherFormat, otherLang]) =>
      hreflang !== 'x-default' &&
      formats.includes(otherFormat) &&
      (otherFormat !== format || otherLang !== lang),
  ).map(([, otherFormat, otherLang]) => ogLocale(otherFormat, otherLang));

/**
 * Données structurées schema.org de la page. N'expose que ce que la page affiche, et rien des
 * données personnelles hormis la photo du format qui la montre. `location` (« Annecy - Genève »)
 * nomme deux villes : aucune `address` ne s'en déduit sans choisir l'une d'elles.
 */
export const personJsonLd = (format: CvFormat, lang: Lang, cv: Cv): Record<string, unknown> => {
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: cv.name,
    jobTitle: cv.headline[lang],
    description: cv.description[lang],
    url: canonicalUrl(format, lang),
  };
  const photo = shownPersonal(cv, format)?.photo;
  if (photo) {
    person['image'] = SITE_ORIGIN + photo;
  }
  const lists: Record<string, unknown[]> = {
    sameAs: cv.links.map((link) => link.url),
    knowsAbout: cv.highlights ?? [],
    knowsLanguage: cv.languages.map((language) => language.name[lang]),
    alumniOf: [...new Set(cv.education.map((education) => education.school))].map((name) => ({
      '@type': 'EducationalOrganization',
      name,
    })),
  };
  for (const [key, values] of Object.entries(lists)) {
    if (values.length > 0) {
      person[key] = values;
    }
  }
  return person;
};

/**
 * Contenu d'un `<script type="application/ld+json">`. `<` devient `\u003c`, équivalent en
 * JSON : aucune donnée ne peut alors fermer la balise (`</script>`) ni ouvrir un commentaire.
 */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');

/** En-tête du document propre à chaque page ; écrit au prérendu, donc dans le HTML servi. */
@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly formats = inject(CV_FORMATS);

  apply(format: CvFormat, lang: Lang, cv: Cv): void {
    const title = `${cv.name} - ${cv.headline[lang]}`;
    const url = canonicalUrl(format, lang);

    this.document.documentElement.setAttribute('lang', lang);
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: cv.description[lang] });

    this.link('link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', url);
    for (const [hreflang, href] of alternateLinks(this.formats)) {
      this.link(`link[rel="alternate"][hreflang="${hreflang}"]`, {
        rel: 'alternate',
        hreflang,
      }).setAttribute('href', href);
    }

    this.openGraph(format, lang, cv, title, url);
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });

    this.jsonLd().textContent = serializeJsonLd(personJsonLd(format, lang, cv));
  }

  private openGraph(format: CvFormat, lang: Lang, cv: Cv, title: string, url: string): void {
    this.meta.updateTag({ property: 'og:type', content: 'profile' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: cv.description[lang] });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: cv.name });
    this.meta.updateTag({ property: 'og:locale', content: ogLocale(format, lang) });
    // Balise répétée : `updateTag` n'en tiendrait qu'une, la page précédente laisserait les autres.
    for (const alternate of this.meta.getTags('property="og:locale:alternate"')) {
      this.meta.removeTagElement(alternate);
    }
    for (const locale of ogLocaleAlternates(this.formats, format, lang)) {
      this.meta.addTag({ property: 'og:locale:alternate', content: locale }, true);
    }
    const photo = shownPersonal(cv, format)?.photo;
    if (photo) {
      this.meta.updateTag({ property: 'og:image', content: SITE_ORIGIN + photo });
    } else {
      this.meta.removeTag('property="og:image"');
    }
  }

  private jsonLd(): HTMLScriptElement {
    let script = this.document.head.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    return script;
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
