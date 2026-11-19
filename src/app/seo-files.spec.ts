/// <reference types="node" />
// Seul spec à lire un fichier : les types de Node restent hors de `tsconfig.spec.json`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLISHED_FORMATS } from './cv/cv-formats';
import { alternateLinks } from './cv/page-meta';
import { LANGS, canonicalUrl } from './cv/ui-text';

/** Les tests tournent depuis la racine du projet (`ng test`). */
const publicFile = (name: string): string =>
  readFileSync(join(process.cwd(), 'public', name), 'utf-8');

describe('public/sitemap.xml', () => {
  const sitemap = new DOMParser().parseFromString(publicFile('sitemap.xml'), 'application/xml');
  const urls = Array.from(sitemap.getElementsByTagNameNS('*', 'url'));

  it('is well-formed XML', () => {
    expect(sitemap.getElementsByTagName('parsererror').length).toBe(0);
  });

  it('lists exactly the published pages', () => {
    const locs = urls.map((url) => url.getElementsByTagNameNS('*', 'loc')[0]?.textContent);
    const expected = PUBLISHED_FORMATS.flatMap((format) =>
      LANGS.map((lang) => canonicalUrl(format, lang)),
    );
    expect(locs).toEqual(expected);
  });

  it('gives every page the hreflang alternates of the <head>', () => {
    for (const url of urls) {
      const links = Array.from(
        url.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'),
        (link) => [link.getAttribute('hreflang'), link.getAttribute('href')],
      );
      expect(links).toEqual(alternateLinks(PUBLISHED_FORMATS));
      expect(
        Array.from(url.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'), (link) =>
          link.getAttribute('rel'),
        ).every((rel) => rel === 'alternate'),
      ).toBe(true);
    }
  });

  it('invents no lastmod', () => {
    expect(sitemap.getElementsByTagNameNS('*', 'lastmod').length).toBe(0);
  });
});

describe('public/robots.txt', () => {
  it('allows everything and points to the sitemap', () => {
    const robots = publicFile('robots.txt');
    expect(robots).toContain('User-agent: *');
    expect(robots).not.toMatch(/^Disallow:\s*\S/m);
    expect(robots).toMatch(/^Sitemap: https:\/\/yannhurry\.fr\/sitemap\.xml$/m);
  });
});
