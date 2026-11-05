import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { CV, CV_DATA } from './cv/cv.data';
import { Cv } from './cv/cv.model';
import { UI_TEXT } from './cv/ui-text';

const render = async (url: string, cv: Cv = CV): Promise<HTMLElement> => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      { provide: CV_DATA, useValue: cv },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  harness.detectChanges();
  await harness.fixture.whenStable();
  return harness.routeNativeElement as HTMLElement;
};

const headings = (page: HTMLElement) =>
  Array.from(page.querySelectorAll('h2'), (h2) => h2.textContent?.trim());

describe('App', () => {
  afterEach(() => {
    const document = TestBed.inject(DOCUMENT);
    document.head.querySelectorAll('link[rel="alternate"]').forEach((link) => link.remove());
    document.documentElement.removeAttribute('data-theme');
  });

  describe('in French, at /', () => {
    let page: HTMLElement;

    beforeEach(async () => {
      page = await render('/');
    });

    it('renders the name as the page heading', () => {
      expect(page.querySelector('h1')?.textContent).toContain(CV.name);
    });

    it('renders French content and labels', () => {
      expect(page.querySelector('.headline')?.textContent).toBe(CV.headline.fr);
      expect(headings(page)).toEqual([UI_TEXT.fr.experiencesTitle, UI_TEXT.fr.educationTitle]);
      expect(page.querySelector('.entry h3')?.textContent).toBe(CV.experiences[0].role.fr);
      expect(page.querySelector('.period')?.textContent).toContain("aujourd'hui");
    });

    it('renders one entry per experience and per education item', () => {
      const sections = page.querySelectorAll('section');
      expect(sections[0].querySelectorAll('.entry').length).toBe(CV.experiences.length);
      expect(sections[1].querySelectorAll('.entry').length).toBe(CV.education.length);
    });

    it('keeps icons out of the accessible name of links and headings', () => {
      const icons = page.querySelectorAll('app-icon svg');
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
      expect(page.querySelector('.links a')?.textContent?.trim()).toBe(CV.links[0].label);
    });

    it('opens external links in a new tab without leaking the opener', () => {
      const link = page.querySelector<HTMLAnchorElement>('.links a');
      expect(link?.target).toBe('_blank');
      expect(link?.rel).toContain('noopener');
    });

    it('links to the English version with a label in French', () => {
      const link = page.querySelector<HTMLAnchorElement>('a[hreflang]');
      expect(link?.getAttribute('href')).toBe('/en');
      expect(link?.getAttribute('hreflang')).toBe('en');
      expect(link?.textContent?.trim()).toBe('EN');
      expect(link?.getAttribute('aria-label')).toBe(UI_TEXT.fr.otherLanguageLabel);
    });

    it('sets the document language, title, description and hreflang alternates', () => {
      const document = TestBed.inject(DOCUMENT);
      expect(document.documentElement.getAttribute('lang')).toBe('fr');
      expect(TestBed.inject(Title).getTitle()).toBe(`${CV.name} — ${CV.headline.fr}`);
      expect(
        document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
      ).toBe(CV.description.fr);
      const alternates = Array.from(
        document.head.querySelectorAll('link[rel="alternate"]'),
        (link) => [link.getAttribute('hreflang'), link.getAttribute('href')],
      );
      expect(alternates).toEqual([
        ['fr', 'https://yannhurry.fr/'],
        ['en', 'https://yannhurry.fr/en'],
        ['x-default', 'https://yannhurry.fr/'],
      ]);
    });

    it('shows no PDF link when none is declared', () => {
      expect(page.querySelector('a[download]')).toBeNull();
    });
  });

  describe('in English, at /en', () => {
    let page: HTMLElement;

    beforeEach(async () => {
      page = await render('/en');
    });

    it('renders English content and labels', () => {
      expect(page.querySelector('.headline')?.textContent).toBe(CV.headline.en);
      expect(headings(page)).toEqual([UI_TEXT.en.experiencesTitle, UI_TEXT.en.educationTitle]);
      expect(page.querySelector('.entry h3')?.textContent).toBe(CV.experiences[0].role.en);
      expect(page.querySelector('.period')?.textContent).toContain('present');
      const degrees = Array.from(page.querySelectorAll('section')[1].querySelectorAll('h3'));
      expect(degrees.map((h3) => h3.textContent)).toEqual(CV.education.map((e) => e.degree.en));
    });

    it('links back to the French version with a label in English', () => {
      const link = page.querySelector<HTMLAnchorElement>('a[hreflang]');
      expect(link?.getAttribute('href')).toBe('/');
      expect(link?.textContent?.trim()).toBe('FR');
      expect(link?.getAttribute('aria-label')).toBe(UI_TEXT.en.otherLanguageLabel);
    });

    it('sets the document language and title in English', () => {
      expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('lang')).toBe('en');
      expect(TestBed.inject(Title).getTitle()).toBe(`${CV.name} — ${CV.headline.en}`);
    });
  });

  it('falls back to the French CV on an unknown URL', async () => {
    const page = await render('/nope');
    expect(page.querySelector('.headline')?.textContent).toBe(CV.headline.fr);
  });

  describe('language switch', () => {
    it('leaves the focus alone on first load', async () => {
      const page = await render('/');
      const document = TestBed.inject(DOCUMENT);
      expect(document.activeElement).not.toBe(page.querySelector('a[hreflang]'));
    });

    it('moves the focus back to the language link of the new page', async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter(routes, withComponentInputBinding())],
      });
      const harness = await RouterTestingHarness.create('/');
      await harness.navigateByUrl('/en');
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
      const page = await render('/', withFrenchPdf);
      const link = page.querySelector<HTMLAnchorElement>('a[download]');
      expect(link?.getAttribute('href')).toBe('/pdf/yann-hurry-cv-fr.pdf');
      expect(link?.getAttribute('aria-label')).toBe(UI_TEXT.fr.downloadPdfLabel);
    });

    it('is hidden for a language without one', async () => {
      const page = await render('/en', withFrenchPdf);
      expect(page.querySelector('a[download]')).toBeNull();
    });
  });

  describe('theme button', () => {
    it('toggles dark mode and reports its state', async () => {
      const page = await render('/');
      const button = page.querySelector<HTMLButtonElement>('button.tool');
      expect(button?.getAttribute('aria-label')).toBe(UI_TEXT.fr.darkThemeLabel);
      expect(button?.getAttribute('aria-pressed')).toBe('false');

      button?.click();
      TestBed.tick();

      expect(button?.getAttribute('aria-pressed')).toBe('true');
      expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
