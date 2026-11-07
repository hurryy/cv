import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { DEFAULT_STYLE } from './cv/cv.config';
import { CV, CV_DATA } from './cv/cv.data';
import { Cv, CvFormat, Lang } from './cv/cv.model';
import { STYLE_STORAGE_KEY } from './cv/cv-style';
import { UI_TEXT } from './cv/ui-text';

const setup = async (url: string, cv: Cv = CV): Promise<RouterTestingHarness> => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: CV_DATA, useValue: cv },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  harness.detectChanges();
  await harness.fixture.whenStable();
  return harness;
};

const render = async (url: string, cv: Cv = CV): Promise<HTMLElement> =>
  (await setup(url, cv)).routeNativeElement as HTMLElement;

const html = () => document.documentElement;
const sobre = (page: HTMLElement) => page.querySelector('app-layout-sobre') as HTMLElement;
const commentaires = (page: HTMLElement) =>
  page.querySelector('app-layout-commentaires') as HTMLElement;
const editeur = (page: HTMLElement) => page.querySelector('app-layout-editeur') as HTMLElement;
const styleSelect = (page: HTMLElement) =>
  page.querySelector<HTMLSelectElement>('select') as HTMLSelectElement;

const personalCv: Cv = {
  ...CV,
  personal: {
    photo: '/img/photo.jpg',
    birthYear: 1990,
    nationality: { fr: 'Française', en: 'French' },
    permit: { fr: 'Permis G', en: 'G permit' },
    availability: { fr: 'Immédiate', en: 'Immediately' },
    workload: { fr: '80–100 %', en: '80–100%' },
    referencesOnRequest: true,
  },
};

describe('App', () => {
  afterEach(() => {
    const document = TestBed.inject(DOCUMENT);
    document.head
      .querySelectorAll('link[rel="alternate"], link[rel="canonical"]')
      .forEach((link) => link.remove());
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-style');
    document.defaultView?.localStorage.clear();
    vi.restoreAllMocks();
  });

  const pages: { url: string; format: CvFormat; lang: Lang; other: string }[] = [
    { url: '/ch', format: 'ch', lang: 'fr', other: '/ch/en' },
    { url: '/ch/en', format: 'ch', lang: 'en', other: '/ch' },
    { url: '/fr', format: 'fr', lang: 'fr', other: '/fr/en' },
    { url: '/fr/en', format: 'fr', lang: 'en', other: '/fr' },
  ];

  for (const { url, lang, other } of pages) {
    describe(`at ${url}`, () => {
      let page: HTMLElement;

      beforeEach(async () => {
        page = await render(url);
      });

      it(`sets <html lang="${lang}">, the title and the description`, () => {
        const document = TestBed.inject(DOCUMENT);
        expect(html().getAttribute('lang')).toBe(lang);
        expect(TestBed.inject(Title).getTitle()).toBe(`${CV.name} — ${CV.headline[lang]}`);
        expect(
          document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
        ).toBe(CV.description[lang]);
      });

      it('declares its canonical URL and the four alternates', () => {
        const head = TestBed.inject(DOCUMENT).head;
        expect(head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
        expect(head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
          `https://yannhurry.fr${url}`,
        );
        const alternates = Array.from(head.querySelectorAll('link[rel="alternate"]'), (link) => [
          link.getAttribute('hreflang'),
          link.getAttribute('href'),
        ]);
        expect(alternates).toEqual([
          ['fr-CH', 'https://yannhurry.fr/ch'],
          ['en-CH', 'https://yannhurry.fr/ch/en'],
          ['fr-FR', 'https://yannhurry.fr/fr'],
          ['en-FR', 'https://yannhurry.fr/fr/en'],
          ['x-default', 'https://yannhurry.fr/ch'],
        ]);
      });

      it('renders the content and labels in its language, in every layout', () => {
        for (const layout of [sobre(page), commentaires(page)]) {
          expect(layout.querySelector('h1')?.textContent).toContain(CV.name);
          expect(layout.textContent).toContain(CV.headline[lang]);
          expect(layout.textContent).toContain(UI_TEXT[lang].experiencesTitle);
          expect(layout.querySelector('.entry h3')?.textContent).toBe(CV.experiences[0].role[lang]);
          expect(layout.querySelectorAll('section .entry').length).toBe(
            CV.experiences.length + CV.education.length,
          );
        }
        expect(editeur(page).textContent).toContain(`'${CV.experiences[0].role[lang]}'`);
        expect(page.textContent).toContain(UI_TEXT[lang].present);
      });

      it('switches language and keeps the format', () => {
        const link = page.querySelector<HTMLAnchorElement>('a[hreflang]');
        expect(link?.getAttribute('href')).toBe(other);
        expect(link?.textContent?.trim()).toBe(UI_TEXT[lang].otherLanguage);
        expect(link?.getAttribute('aria-label')).toBe(UI_TEXT[lang].otherLanguageLabel);
      });
    });
  }

  describe('redirections', () => {
    it.each([
      ['/', '/ch'],
      ['/en', '/ch/en'],
      ['/nope', '/ch'],
    ])('sends %s to %s', async (from, to) => {
      await setup(from);
      expect(TestBed.inject(Router).url).toBe(to);
    });
  });

  describe('personal data', () => {
    it('is shown in the Swiss format when filled in, except by the editor layout', async () => {
      const page = await render('/ch', personalCv);
      for (const layout of [sobre(page), commentaires(page)]) {
        expect(layout.querySelector('img')?.getAttribute('src')).toBe('/img/photo.jpg');
        expect(layout.querySelector('img')?.getAttribute('alt')).toBe(CV.name);
        const facts = Array.from(layout.querySelectorAll('.personal dt'), (dt) => dt.textContent);
        expect(facts).toEqual([
          UI_TEXT.fr.birthYear,
          UI_TEXT.fr.nationality,
          UI_TEXT.fr.permit,
          UI_TEXT.fr.availability,
          UI_TEXT.fr.workload,
        ]);
        expect(layout.querySelector('.personal dd')?.textContent).toBe('1990');
        expect(layout.textContent).toContain('Permis G');
        expect(layout.textContent).toContain(UI_TEXT.fr.referencesOnRequest);
      }
      expect(editeur(page).textContent).not.toContain('Permis G');
      expect(editeur(page).querySelector('img')).toBeNull();
    });

    it('is translated in English', async () => {
      const page = await render('/ch/en', personalCv);
      expect(sobre(page).textContent).toContain('G permit');
      expect(sobre(page).textContent).toContain(UI_TEXT.en.referencesOnRequest);
    });

    it('is hidden in the French format', async () => {
      const page = await render('/fr', personalCv);
      for (const layout of [sobre(page), commentaires(page), editeur(page)]) {
        expect(layout.querySelector('img')).toBeNull();
        expect(layout.querySelector('.personal')).toBeNull();
        expect(layout.textContent).not.toContain('1990');
        expect(layout.textContent).not.toContain('Permis G');
        expect(layout.textContent).not.toContain(UI_TEXT.fr.referencesOnRequest);
      }
    });

    it('shows only the fields filled in', async () => {
      const page = await render('/ch', {
        ...CV,
        personal: { permit: { fr: 'Permis G', en: 'G permit' }, nationality: { fr: '', en: '' } },
      });
      const facts = Array.from(
        sobre(page).querySelectorAll('.personal dt'),
        (dt) => dt.textContent,
      );
      expect(facts).toContain(UI_TEXT.fr.permit);
      expect(facts).not.toContain(UI_TEXT.fr.nationality);
      expect(sobre(page).querySelector('img')).toBeNull();
      expect(sobre(page).textContent).not.toContain(UI_TEXT.fr.referencesOnRequest);
    });

    it('is published with the year of birth only', async () => {
      const swiss = sobre(await render('/ch'));
      expect(swiss.querySelector('img')?.getAttribute('src')).toBe('/img/yann-hurry.jpg');
      expect(swiss.querySelector('.personal dd')?.textContent).toBe('1994');
      expect(swiss.textContent).toContain('Permis G');
      expect(swiss.textContent).toContain(UI_TEXT.fr.referencesOnRequest);
    });

    it('stays out of the published French format', async () => {
      const page = await render('/fr');
      expect(page.querySelector('img')).toBeNull();
      expect(page.textContent).not.toContain('1994');
      expect(page.textContent).not.toContain('Permis G');
    });
  });

  it('translates locations into English in every layout', async () => {
    const page = await render('/ch/en');
    for (const layout of [sobre(page), commentaires(page), editeur(page)]) {
      expect(layout.textContent).toContain('Vernier, Switzerland');
      expect(layout.textContent).not.toContain('Suisse');
      expect(layout.textContent).not.toContain('Suède');
    }
    // Le style « commentaires » n'affiche pas le lieu des formations.
    for (const layout of [sobre(page), editeur(page)]) {
      expect(layout.textContent).toContain('Linköping, Sweden');
    }
  });

  it('keeps locations in French in every layout', async () => {
    const page = await render('/ch');
    for (const layout of [sobre(page), commentaires(page), editeur(page)]) {
      expect(layout.textContent).toContain('Vernier, Suisse');
      expect(layout.textContent).not.toContain('Switzerland');
    }
  });

  it('shows languages with their level', async () => {
    const page = await render('/ch/en', {
      ...CV,
      languages: [
        { name: { fr: 'Français', en: 'French' }, level: 'native' },
        { name: { fr: 'Anglais', en: 'English' }, level: 'B2' },
      ],
    });
    const items = Array.from(sobre(page).querySelectorAll('.languages li'), (li) =>
      li.textContent?.trim(),
    );
    expect(items).toEqual([`French — ${UI_TEXT.en.nativeLanguage}`, 'English — B2']);
  });

  describe('style picker', () => {
    it('lists the styles with labels in the page language, the default first selected', async () => {
      const page = await render('/ch/en');
      const select = styleSelect(page);
      expect(select.closest('label')?.textContent).toContain(UI_TEXT.en.styleLabel);
      expect(Array.from(select.options, (option) => option.textContent?.trim())).toEqual([
        UI_TEXT.en.styleNames.sobre,
        UI_TEXT.en.styleNames.commentaires,
        UI_TEXT.en.styleNames.editeur,
      ]);
      expect(select.value).toBe(DEFAULT_STYLE);
      expect(html().getAttribute('data-style')).toBe(DEFAULT_STYLE);
    });

    it('switches style and remembers the choice', async () => {
      const page = await render('/ch');
      const select = styleSelect(page);
      select.value = 'editeur';
      select.dispatchEvent(new Event('change'));
      TestBed.tick();

      expect(html().getAttribute('data-style')).toBe('editeur');
      expect(localStorage.getItem(STYLE_STORAGE_KEY)).toBe('editeur');
      expect(select.value).toBe('editeur');
    });

    it('keeps the style when the language changes', async () => {
      const harness = await setup('/ch');
      const page = harness.routeNativeElement as HTMLElement;
      const select = styleSelect(page);
      select.value = 'commentaires';
      select.dispatchEvent(new Event('change'));
      await harness.navigateByUrl('/ch/en');
      await harness.fixture.whenStable();

      expect(html().getAttribute('data-style')).toBe('commentaires');
      expect(styleSelect(harness.routeNativeElement as HTMLElement).value).toBe('commentaires');
    });

    it('still switches when storage throws', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
      const page = await render('/ch');
      const select = styleSelect(page);
      select.value = 'commentaires';
      expect(() => select.dispatchEvent(new Event('change'))).not.toThrow();
      expect(html().getAttribute('data-style')).toBe('commentaires');
    });

    it('applies a known ?style= and drops it from the URL once the visitor picks a style', async () => {
      const page = await render('/fr?style=editeur');
      const select = styleSelect(page);
      expect(select.value).toBe('editeur');
      expect(html().getAttribute('data-style')).toBe('editeur');

      select.value = 'commentaires';
      select.dispatchEvent(new Event('change'));
      await TestBed.inject(Router).navigated;
      await new Promise((resolve) => setTimeout(resolve));
      expect(TestBed.inject(Router).url).toBe('/fr');
      expect(html().getAttribute('data-style')).toBe('commentaires');
    });

    it('falls back to the default on an unknown ?style=, even over the style already applied', async () => {
      html().setAttribute('data-style', 'editeur');
      const page = await render('/ch?style=bogus');
      expect(styleSelect(page).value).toBe(DEFAULT_STYLE);
      expect(html().getAttribute('data-style')).toBe(DEFAULT_STYLE);
    });

    it('keeps the style set by the inline script', async () => {
      html().setAttribute('data-style', 'commentaires');
      const page = await render('/ch');
      expect(styleSelect(page).value).toBe('commentaires');
    });

    it('carries ?style= over to the other language', async () => {
      const page = await render('/ch?style=editeur');
      expect(page.querySelector('a[hreflang]')?.getAttribute('href')).toBe('/ch/en?style=editeur');
    });
  });

  describe('language switch', () => {
    it('leaves the focus alone on first load', async () => {
      const page = await render('/ch');
      expect(TestBed.inject(DOCUMENT).activeElement).not.toBe(page.querySelector('a[hreflang]'));
    });

    it('moves the focus back to the language link of the new page', async () => {
      const harness = await setup('/ch');
      await harness.navigateByUrl('/ch/en');
      await harness.fixture.whenStable();

      const page = harness.routeNativeElement as HTMLElement;
      const link = page.querySelector('a[hreflang]');
      expect(link?.textContent?.trim()).toBe('FR');
      expect(TestBed.inject(DOCUMENT).activeElement).toBe(link);
    });
  });

  describe('PDF link', () => {
    const withFrenchPdf: Cv = { ...CV, pdf: { fr: '/pdf/yann-hurry-cv-fr.pdf' } };

    it('is shown, as a download, for the language that declares one', async () => {
      const page = await render('/fr', withFrenchPdf);
      const link = page.querySelector<HTMLAnchorElement>('a[download]');
      expect(link?.getAttribute('href')).toBe('/pdf/yann-hurry-cv-fr.pdf');
      expect(link?.getAttribute('aria-label')).toBe(UI_TEXT.fr.downloadPdfLabel);
    });

    it('is hidden for a language without one', async () => {
      const page = await render('/ch/en', withFrenchPdf);
      expect(page.querySelector('a[download]')).toBeNull();
    });
  });

  describe('theme button', () => {
    it('toggles dark mode and reports its state', async () => {
      const page = await render('/ch');
      const button = page.querySelector<HTMLButtonElement>('button.tool');
      expect(button?.getAttribute('aria-label')).toBe(UI_TEXT.fr.darkThemeLabel);
      expect(button?.getAttribute('aria-pressed')).toBe('false');

      button?.click();
      TestBed.tick();

      expect(button?.getAttribute('aria-pressed')).toBe('true');
      expect(html().getAttribute('data-theme')).toBe('dark');
    });
  });

  it('opens external links in a new tab without leaking the opener', async () => {
    const page = await render('/ch');
    const link = sobre(page).querySelector<HTMLAnchorElement>(`a[href="${CV.links[0].url}"]`);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
    expect(link?.textContent?.trim()).toBe(CV.links[0].label);
  });
});
