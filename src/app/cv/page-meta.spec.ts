import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CV_FORMATS } from './cv-formats';
import { CV } from './cv.data';
import { Cv, CvFormat, Lang } from './cv.model';
import { PageMeta, serializeJsonLd } from './page-meta';

const SWISS_ONLY: readonly CvFormat[] = ['ch'];
const WITH_FRANCE: readonly CvFormat[] = ['ch', 'fr'];

const head = () => TestBed.inject(DOCUMENT).head;

const apply = (
  format: CvFormat,
  lang: Lang,
  cv: Cv = CV,
  formats: readonly CvFormat[] = SWISS_ONLY,
): PageMeta => {
  TestBed.configureTestingModule({ providers: [{ provide: CV_FORMATS, useValue: formats }] });
  const pageMeta = TestBed.inject(PageMeta);
  pageMeta.apply(format, lang, cv);
  return pageMeta;
};

const jsonLdScripts = () => head().querySelectorAll('script[type="application/ld+json"]');
const jsonLd = () => JSON.parse(jsonLdScripts()[0]?.textContent ?? 'null');

const og = (property: string) =>
  Array.from(head().querySelectorAll(`meta[property="${property}"]`), (meta) =>
    meta.getAttribute('content'),
  );

describe('PageMeta', () => {
  afterEach(() => {
    head()
      .querySelectorAll(
        'link[rel="alternate"], link[rel="canonical"], meta[property], meta[name], script[type="application/ld+json"]',
      )
      .forEach((element) => element.remove());
  });

  describe('JSON-LD', () => {
    it.each([
      ['fr', 'https://yannhurry.fr/'],
      ['en', 'https://yannhurry.fr/en'],
    ] as const)('describes the person once, in %s', (lang, url) => {
      apply('ch', lang);
      expect(jsonLdScripts().length).toBe(1);
      expect(jsonLd()).toEqual({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: CV.name,
        jobTitle: CV.headline[lang],
        description: CV.description[lang],
        url,
        image: `https://yannhurry.fr${CV.personal?.photo}`,
        sameAs: CV.links.map((link) => link.url),
        knowsAbout: CV.highlights,
        knowsLanguage: CV.languages.map((language) => language.name[lang]),
        alumniOf: [
          'Université Grenoble Alpes',
          'Linköping University',
          "IUT d'Annecy, Université Savoie Mont Blanc",
        ].map((name) => ({ '@type': 'EducationalOrganization', name })),
      });
    });

    it('keeps the personal data out, apart from the photo', () => {
      apply('ch', 'fr');
      const person = jsonLd();
      for (const key of ['birthDate', 'nationality', 'address', 'gender', 'telephone', 'email']) {
        expect(person).not.toHaveProperty(key);
      }
      expect(jsonLdScripts()[0].textContent).not.toContain(String(CV.personal?.birthYear));
    });

    it('drops the photo in the France format', () => {
      apply('fr', 'en', CV, WITH_FRANCE);
      expect(jsonLd().url).toBe('https://yannhurry.fr/fr/en');
      expect(jsonLd()).not.toHaveProperty('image');
    });

    it('omits the lists the CV leaves empty', () => {
      apply('ch', 'fr', { ...CV, links: [], highlights: undefined, personal: undefined });
      const person = jsonLd();
      expect(person).not.toHaveProperty('sameAs');
      expect(person).not.toHaveProperty('knowsAbout');
      expect(person).not.toHaveProperty('image');
    });

    it('escapes < so that no data closes the script element', () => {
      const name = '</script><script>alert(1)</script><!--';
      apply('ch', 'fr', { ...CV, name });
      const text = jsonLdScripts()[0].textContent ?? '';
      expect(text).not.toContain('<');
      expect(text).toContain('\\u003c/script>');
      expect(jsonLd().name).toBe(name);
      expect(serializeJsonLd({ a: '<b>' })).toBe('{"a":"\\u003cb>"}');
    });
  });

  describe('Open Graph', () => {
    it.each([
      ['fr', 'https://yannhurry.fr/', 'fr_CH', ['en_CH']],
      ['en', 'https://yannhurry.fr/en', 'en_CH', ['fr_CH']],
    ] as const)('describes the %s page', (lang, url, locale, alternates) => {
      apply('ch', lang);
      expect(og('og:type')).toEqual(['profile']);
      expect(og('og:title')).toEqual([`${CV.name} - ${CV.headline[lang]}`]);
      expect(og('og:description')).toEqual([CV.description[lang]]);
      expect(og('og:url')).toEqual([url]);
      expect(og('og:site_name')).toEqual([CV.name]);
      expect(og('og:locale')).toEqual([locale]);
      expect(og('og:locale:alternate')).toEqual(alternates);
      expect(og('og:image')).toEqual([`https://yannhurry.fr${CV.personal?.photo}`]);
      expect(
        head().querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      ).toBe('summary');
      expect(head().querySelector('meta[property^="profile:"]')).toBeNull();
    });

    it('uses the French locales and no photo in the France format', () => {
      apply('fr', 'fr', CV, WITH_FRANCE);
      expect(og('og:locale')).toEqual(['fr_FR']);
      expect(og('og:locale:alternate')).toEqual(['fr_CH', 'en_CH', 'en_FR']);
      expect(og('og:image')).toEqual([]);
    });
  });

  it('replaces the tags of the previous page instead of adding to them', () => {
    const pageMeta = apply('ch', 'fr', CV, WITH_FRANCE);
    pageMeta.apply('ch', 'en', CV);
    pageMeta.apply('fr', 'en', CV);

    expect(jsonLdScripts().length).toBe(1);
    expect(jsonLd().jobTitle).toBe(CV.headline.en);
    expect(jsonLd().url).toBe('https://yannhurry.fr/fr/en');
    for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:locale']) {
      expect(og(property).length).toBe(1);
    }
    expect(og('og:url')).toEqual(['https://yannhurry.fr/fr/en']);
    expect(og('og:locale:alternate')).toEqual(['fr_CH', 'en_CH', 'fr_FR']);
    expect(og('og:image')).toEqual([]);
    expect(head().querySelectorAll('meta[name="twitter:card"]').length).toBe(1);
  });
});
