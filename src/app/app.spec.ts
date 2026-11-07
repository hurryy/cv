import { DOCUMENT, ViewportScroller } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { CV, CV_DATA } from './cv/cv.data';
import { Cv, CvFormat, Lang } from './cv/cv.model';
import { UI_TEXT } from './cv/ui-text';

const setup = async (url: string, cv: Cv = CV): Promise<RouterTestingHarness> => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        routes,
        withComponentInputBinding(),
        withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      ),
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
const layout = (page: HTMLElement) => page.querySelector('app-layout-sobre') as HTMLElement;
const entries = (page: HTMLElement) => Array.from(page.querySelectorAll<HTMLElement>('.entry'));
const shortcutLinks = (page: HTMLElement) =>
  Array.from(page.querySelectorAll<HTMLAnchorElement>('nav.shortcuts a'));

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

/**
 * Remplace l'`IntersectionObserver` absent de jsdom ; `fire` simule un défilement, une cible
 * étant désignée par son `id` ou, à défaut, sa classe.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly targets: Element[] = [];
  disconnected = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  /** Premier observateur qui suit `target`. */
  static of(target: string): FakeIntersectionObserver {
    const observer = FakeIntersectionObserver.instances.find((instance) =>
      instance.targets.some((element) => element.id === target || element.className === target),
    );
    if (!observer) {
      throw new Error(`Aucun observateur ne suit ${target}`);
    }
    return observer;
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  disconnect(): void {
    this.disconnected = true;
  }

  fire(changes: Record<string, boolean>): void {
    const entries = Object.entries(changes).map(
      ([id, isIntersecting]) =>
        ({
          target: this.targets.find((target) => target.id === id || target.className === id),
          isIntersecting,
        }) as IntersectionObserverEntry,
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

describe('App', () => {
  afterEach(() => {
    const document = TestBed.inject(DOCUMENT);
    document.head
      .querySelectorAll('link[rel="alternate"], link[rel="canonical"]')
      .forEach((link) => link.remove());
    document.documentElement.removeAttribute('data-theme');
    document.defaultView?.localStorage.clear();
    vi.restoreAllMocks();
  });

  const pages: { url: string; format: CvFormat; lang: Lang; other: string }[] = [
    { url: '/ch', format: 'ch', lang: 'fr', other: '/ch/en' },
    { url: '/ch/en', format: 'ch', lang: 'en', other: '/ch' },
    { url: '/fr', format: 'fr', lang: 'fr', other: '/fr/en' },
    { url: '/fr/en', format: 'fr', lang: 'en', other: '/fr' },
  ];

  for (const { url, format, lang, other } of pages) {
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

      it('renders the banner, the timeline and the side column in its language', () => {
        const cv = layout(page);
        expect(cv.querySelector('h1')?.textContent).toContain(CV.name);
        expect(cv.querySelector('.headline')?.textContent).toBe(CV.headline[lang]);
        expect(cv.querySelector('.profile')?.textContent).toBe(CV.profile[lang]);
        expect(cv.textContent).toContain(UI_TEXT[lang].experiencesTitle);
        expect(entries(page).length).toBe(CV.experiences.length);
        expect(entries(page)[0].querySelector('h3')?.textContent).toBe(
          CV.experiences[0].role[lang],
        );
        expect(entries(page)[0].querySelector('.domains')?.textContent).toBe(
          CV.experiences[0].domains?.map((domain) => domain[lang]).join(', '),
        );
        expect(Array.from(cv.querySelectorAll('.side h2'), (h2) => h2.textContent)).toEqual([
          UI_TEXT[lang].skillsTitle,
          UI_TEXT[lang].educationTitle,
        ]);
        expect(cv.querySelectorAll('.degree').length).toBe(CV.education.length);
        expect(page.textContent).toContain(UI_TEXT[lang].present);
      });

      it('lists the highlights under the profile', () => {
        const highlights = layout(page).querySelector('.highlights');
        expect(highlights?.querySelector('h2')?.textContent).toBe(UI_TEXT[lang].highlightsTitle);
        expect(Array.from(highlights?.querySelectorAll('li') ?? [], (li) => li.textContent)).toEqual(
          CV.highlights,
        );
      });

      it('offers three shortcuts to sections of the page', () => {
        const nav = page.querySelector('nav.shortcuts');
        expect(nav?.getAttribute('aria-label')).toBe(UI_TEXT[lang].shortcutsLabel);
        const links = shortcutLinks(page);
        expect(links.map((link) => link.textContent?.trim())).toEqual([
          UI_TEXT[lang].shortcuts.experiences,
          UI_TEXT[lang].shortcuts.skills,
          UI_TEXT[lang].shortcuts.education,
        ]);
        for (const link of links) {
          const [path, id] = (link.getAttribute('href') ?? '').split('#');
          expect(path).toBe(url);
          expect(page.querySelector(`section#${id}`)?.getAttribute('tabindex')).toBe('-1');
          expect(link.hasAttribute('aria-current')).toBe(false);
        }
      });

      it(`${format === 'ch' ? 'shows' : 'hides'} the experience details`, () => {
        expect(page.querySelectorAll('details').length).toBe(
          format === 'ch' ? CV.experiences.length : 0,
        );
      });

      it('switches language and keeps the format', () => {
        const link = page.querySelector<HTMLAnchorElement>('a[hreflang]');
        expect(link?.getAttribute('href')).toBe(other);
        expect(link?.textContent?.trim()).toBe(UI_TEXT[lang].otherLanguage);
        expect(link?.getAttribute('aria-label')).toBe(UI_TEXT[lang].otherLanguageLabel);
      });
    });
  }

  describe('content update date', () => {
    it.each([
      ['/ch', 'Mis à jour en mars 2025'],
      ['/ch/en', 'Updated March 2025'],
    ])('is written below the sheet at %s', async (url, label) => {
      const page = await render(url, { ...CV, updated: '2025-03' });
      expect(layout(page).querySelector('.updated')?.textContent).toBe(label);
    });
  });

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

  describe('experience details', () => {
    it('unfold the context, then the achievements, closed by default', async () => {
      const page = await render('/ch');
      const details = entries(page)[0].querySelector('details') as HTMLDetailsElement;
      expect(details.open).toBe(false);
      const [first] = CV.experiences;
      expect(details.querySelector('summary')?.textContent).toBe(
        `${UI_TEXT.fr.details}, ${first.role.fr}, ${first.company}`,
      );
      expect(details.querySelector('.context')?.textContent).toBe(CV.experiences[0].context?.fr);
      expect(Array.from(details.querySelectorAll('.achievements li'), (li) => li.textContent)).toEqual(
        CV.experiences[0].achievements?.map((achievement) => achievement.fr),
      );
    });

    it('are translated in English', async () => {
      const page = await render('/ch/en');
      const details = entries(page)[0].querySelector('details');
      expect(details?.querySelector('summary')?.textContent).toBe(
        `${UI_TEXT.en.details}, ${CV.experiences[0].role.en}, ${CV.experiences[0].company}`,
      );
      expect(details?.querySelector('.context')?.textContent).toBe(CV.experiences[0].context?.en);
      expect(details?.querySelector('.achievements li')?.textContent).toBe(
        CV.experiences[0].achievements?.[0].en,
      );
    });

    it('name each button after its experience, for screen readers only', async () => {
      const page = await render('/ch');
      const summaries = Array.from(page.querySelectorAll('summary'));
      const names = summaries.map((summary) => summary.textContent);
      expect(new Set(names).size).toBe(summaries.length);
      for (const summary of summaries) {
        const hidden = summary.querySelector('.visually-hidden');
        expect(summary.textContent?.startsWith(UI_TEXT.fr.details)).toBe(true);
        expect(hidden?.textContent?.startsWith(', ')).toBe(true);
        expect(summary.textContent?.replace(hidden?.textContent ?? '', '')).toBe(UI_TEXT.fr.details);
      }
    });

    it('are left out for an experience without context nor achievements', async () => {
      const [first, ...others] = CV.experiences;
      const page = await render('/ch', {
        ...CV,
        experiences: [{ ...first, context: undefined, achievements: [] }, ...others],
      });
      expect(entries(page)[0].querySelector('details')).toBeNull();
      expect(entries(page)[1].querySelector('details')).not.toBeNull();
    });

    it('stay out of the French format', async () => {
      const page = await render('/fr');
      expect(page.querySelector('details')).toBeNull();
      expect(page.textContent).not.toContain(CV.experiences[0].context?.fr);
    });
  });

  describe('printing', () => {
    it('opens every closed <details> before printing and restores them afterwards', async () => {
      const page = await render('/ch');
      const all = Array.from(page.querySelectorAll('details'));
      all[1].open = true;

      window.dispatchEvent(new Event('beforeprint'));
      expect(all.every((details) => details.open)).toBe(true);

      window.dispatchEvent(new Event('afterprint'));
      expect(all.map((details) => details.open)).toEqual(all.map((_, index) => index === 1));
    });

    it('stops listening once the page is destroyed', async () => {
      const harness = await setup('/ch');
      const details = (harness.routeNativeElement as HTMLElement).querySelector('details');
      harness.fixture.destroy();

      window.dispatchEvent(new Event('beforeprint'));
      expect(details?.open).toBe(false);
    });
  });

  /** `scroll-padding-top` de <html>, que jsdom ne calcule pas. */
  const clearance = (px: number) => {
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
      element === document.documentElement
        ? ({ scrollPaddingTop: `${px}px` } as CSSStyleDeclaration)
        : getComputedStyle(element),
    );
  };

  describe('shortcut bar', () => {
    const defaultView = () => document.defaultView as Window & typeof globalThis;
    let original: typeof IntersectionObserver;

    beforeEach(() => {
      original = defaultView().IntersectionObserver;
      FakeIntersectionObserver.instances = [];
      defaultView().IntersectionObserver =
        FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
      defaultView().IntersectionObserver = original;
    });

    const current = (page: HTMLElement) =>
      shortcutLinks(page)
        .filter((link) => link.getAttribute('aria-current') === 'true')
        .map((link) => link.getAttribute('href'));

    it('marks the last section crossing the top of the screen as current', async () => {
      const harness = await setup('/ch/en');
      const page = harness.routeNativeElement as HTMLElement;
      const observer = FakeIntersectionObserver.of('experiences');
      expect(observer.targets.map((target) => target.id)).toEqual([
        'experiences',
        'skills',
        'education',
      ]);

      observer.fire({ experiences: true });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch/en#experiences']);

      observer.fire({ skills: true });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch/en#skills']);

      observer.fire({ experiences: false });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch/en#skills']);

      observer.fire({ skills: false });
      harness.detectChanges();
      expect(current(page)).toEqual([]);
    });

    it('marks the last section when it shares the band with the previous one', async () => {
      const harness = await setup('/ch');
      const page = harness.routeNativeElement as HTMLElement;

      FakeIntersectionObserver.of('skills').fire({ skills: true, education: true });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch#education']);
    });

    it('marks the last section once the bottom of the page is reached', async () => {
      const harness = await setup('/ch');
      const page = harness.routeNativeElement as HTMLElement;
      FakeIntersectionObserver.of('skills').fire({ skills: true });

      FakeIntersectionObserver.of('updated').fire({ updated: true });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch#education']);

      FakeIntersectionObserver.of('updated').fire({ updated: false });
      harness.detectChanges();
      expect(current(page)).toEqual(['/ch#skills']);
    });

    it('starts the band below the sticky bar', async () => {
      clearance(56);
      await setup('/ch');
      expect(FakeIntersectionObserver.of('skills').options?.rootMargin).toBe(
        '-56px 0px -50% 0px',
      );
    });

    it('stops observing once the page is destroyed', async () => {
      const harness = await setup('/ch');
      harness.fixture.destroy();
      expect(FakeIntersectionObserver.instances.length).toBe(2);
      expect(FakeIntersectionObserver.instances.every((observer) => observer.disconnected)).toBe(
        true,
      );
    });
  });

  describe('shortcut links', () => {
    it('keep the query string', async () => {
      const page = await render('/ch?utm_source=test');
      expect(shortcutLinks(page).map((link) => link.getAttribute('href'))).toEqual([
        '/ch?utm_source=test#experiences',
        '/ch?utm_source=test#skills',
        '/ch?utm_source=test#education',
      ]);
    });

    it('navigate to the section within the page', async () => {
      const harness = await setup('/ch?utm_source=test');
      const page = harness.routeNativeElement as HTMLElement;

      shortcutLinks(page)[1].click();
      await harness.fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/ch?utm_source=test#skills');
      expect(harness.routeNativeElement).toBe(page);
    });

    it('leave the anchors the router scrolls to below the sticky bar', async () => {
      const page = (await setup('/ch')).routeNativeElement as HTMLElement;
      clearance(56);
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
      const skills = page.querySelector('#skills') as HTMLElement;
      vi.spyOn(skills, 'getBoundingClientRect').mockReturnValue({ top: 500, left: 0 } as DOMRect);

      TestBed.inject(ViewportScroller).scrollToAnchor('skills');

      expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 500 - 56 }));
      expect(document.activeElement).toBe(skills);
    });

    it('drop the sticky bar offset once the page is destroyed', async () => {
      const harness = await setup('/ch');
      clearance(56);
      const skills = (harness.routeNativeElement as HTMLElement).querySelector('#skills');
      document.body.appendChild(skills as HTMLElement);
      vi.spyOn(skills as HTMLElement, 'getBoundingClientRect').mockReturnValue({
        top: 500,
        left: 0,
      } as DOMRect);
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

      try {
        harness.fixture.destroy();
        TestBed.inject(ViewportScroller).scrollToAnchor('skills');

        expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 500 }));
      } finally {
        skills?.remove();
      }
    });
  });

  describe('single layout', () => {
    it('has no style picker and ignores ?style=', async () => {
      const page = await render('/ch?style=commentaires');
      expect(page.querySelector('select')).toBeNull();
      expect(page.querySelector('app-layout-commentaires')).toBeNull();
      expect(page.querySelector('app-layout-editeur')).toBeNull();
      expect(page.querySelectorAll('app-layout-sobre').length).toBe(1);
      expect(html().hasAttribute('data-style')).toBe(false);
      expect(page.textContent).not.toContain('Commentaires');
    });
  });

  describe('personal data', () => {
    it('is shown in the Swiss format when filled in', async () => {
      const cv = layout(await render('/ch', personalCv));
      expect(cv.querySelector('img')?.getAttribute('src')).toBe('/img/photo.jpg');
      expect(cv.querySelector('img')?.getAttribute('alt')).toBe(CV.name);
      const facts = Array.from(cv.querySelectorAll('.personal dt'), (dt) => dt.textContent);
      expect(facts).toEqual([
        UI_TEXT.fr.birthYear,
        UI_TEXT.fr.nationality,
        UI_TEXT.fr.permit,
        UI_TEXT.fr.availability,
        UI_TEXT.fr.workload,
      ]);
      expect(cv.querySelector('.personal dd')?.textContent).toBe('1990');
      expect(cv.textContent).toContain('Permis G');
      expect(cv.textContent).toContain(UI_TEXT.fr.referencesOnRequest);
    });

    it('keeps the label of a self-explanatory value for screen readers only', async () => {
      const cv = layout(await render('/ch', personalCv));
      const hidden = Array.from(
        cv.querySelectorAll('.personal dt.visually-hidden'),
        (dt) => dt.textContent,
      );
      expect(hidden).toEqual([UI_TEXT.fr.nationality, UI_TEXT.fr.permit]);
    });

    it('is translated in English', async () => {
      const cv = layout(await render('/ch/en', personalCv));
      expect(cv.textContent).toContain('G permit');
      expect(cv.textContent).toContain(UI_TEXT.en.referencesOnRequest);
    });

    it('is hidden in the French format', async () => {
      const cv = layout(await render('/fr', personalCv));
      expect(cv.querySelector('img')).toBeNull();
      expect(cv.querySelector('.personal')).toBeNull();
      expect(cv.textContent).not.toContain('1990');
      expect(cv.textContent).not.toContain('Permis G');
      expect(cv.textContent).not.toContain(UI_TEXT.fr.referencesOnRequest);
    });

    it('shows only the fields filled in', async () => {
      const cv = layout(
        await render('/ch', {
          ...CV,
          personal: { permit: { fr: 'Permis G', en: 'G permit' }, nationality: { fr: '', en: '' } },
        }),
      );
      const facts = Array.from(cv.querySelectorAll('.personal dt'), (dt) => dt.textContent);
      expect(facts).toContain(UI_TEXT.fr.permit);
      expect(facts).not.toContain(UI_TEXT.fr.nationality);
      expect(cv.querySelector('img')).toBeNull();
      expect(cv.textContent).not.toContain(UI_TEXT.fr.referencesOnRequest);
    });

    it('is published with the year of birth only', async () => {
      const swiss = layout(await render('/ch'));
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
      expect(page.textContent).not.toContain(UI_TEXT.fr.referencesOnRequest);
    });
  });

  it('translates locations and sectors into English', async () => {
    const cv = layout(await render('/ch/en'));
    expect(cv.textContent).toContain('Vernier, Switzerland');
    expect(cv.textContent).toContain('Linköping, Sweden');
    expect(cv.textContent).toContain('Annecy – Geneva');
    expect(cv.textContent).toContain('Energy, Customer portal');
    expect(cv.textContent).not.toContain('Suisse');
    expect(cv.textContent).not.toContain('Suède');
    expect(cv.textContent).not.toContain('Énergie');
  });

  it('keeps locations and sectors in French', async () => {
    const cv = layout(await render('/ch'));
    expect(cv.textContent).toContain('Vernier, Suisse');
    expect(cv.textContent).toContain('Annecy – Genève');
    expect(cv.textContent).toContain('Énergie, Espace client');
    expect(cv.textContent).not.toContain('Switzerland');
  });

  it('shows languages with their level', async () => {
    const page = await render('/ch/en', {
      ...CV,
      languages: [
        { name: { fr: 'Français', en: 'French' }, level: 'native' },
        { name: { fr: 'Anglais', en: 'English' }, level: 'B2' },
      ],
    });
    const items = Array.from(layout(page).querySelectorAll('.languages li'), (li) =>
      li.textContent?.trim(),
    );
    expect(items).toEqual([`French — ${UI_TEXT.en.nativeLanguage}`, 'English — B2']);
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
    const cases: { url: string; href: string; name: string; label: string }[] = [
      {
        url: '/ch',
        href: '/pdf/yann-hurry-cv-ch-fr.pdf',
        name: 'Yann-HURRY-CV-FR.pdf',
        label: 'Télécharger le PDF',
      },
      {
        url: '/ch/en',
        href: '/pdf/yann-hurry-cv-ch-en.pdf',
        name: 'Yann-HURRY-CV-EN.pdf',
        label: 'Download PDF',
      },
      {
        url: '/fr',
        href: '/pdf/yann-hurry-cv-fr-fr.pdf',
        name: 'Yann-HURRY-CV-FR.pdf',
        label: 'Télécharger le PDF',
      },
      {
        url: '/fr/en',
        href: '/pdf/yann-hurry-cv-fr-en.pdf',
        name: 'Yann-HURRY-CV-EN.pdf',
        label: 'Download PDF',
      },
    ];

    for (const { url, href, name, label } of cases) {
      it(`points at ${url} to the PDF of that format and language`, async () => {
        const page = await render(url);
        const links = page.querySelectorAll<HTMLAnchorElement>('a[download]');
        expect(links.length).toBe(1);
        expect(links[0].getAttribute('href')).toBe(href);
        expect(links[0].getAttribute('download')).toBe(name);
        expect(links[0].textContent?.trim()).toBe(label);
      });
    }

    it('derives the file name from the name in the data', async () => {
      const page = await render('/ch', { ...CV, name: ' Jean  DUPONT ' });
      expect(page.querySelector('a[download]')?.getAttribute('download')).toBe(
        'Jean-DUPONT-CV-FR.pdf',
      );
    });
  });

  describe('share link', () => {
    const shareLink = (page: HTMLElement) =>
      page.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');

    /** Pose ou retire `navigator.share`, absent de jsdom. */
    const stubShare = (share?: (data: ShareData) => Promise<void>) => {
      Object.defineProperty(window.navigator, 'share', { value: share, configurable: true });
    };

    /** Laisse la promesse de `navigator.share` se régler. */
    const settle = () => new Promise((resolve) => setTimeout(resolve));

    afterEach(() => {
      delete (window.navigator as { share?: unknown }).share;
    });

    it('is a mailto: link to the canonical URL of /ch, encoded', async () => {
      const page = await render('/ch');
      const link = shareLink(page);
      expect(link?.getAttribute('href')).toBe(
        'mailto:?subject=CV%20de%20Yann%20HURRY&body=https%3A%2F%2Fyannhurry.fr%2Fch',
      );
      expect(link?.textContent?.trim()).toBe('Partager');
    });

    it('is a mailto: link to the canonical URL of /fr/en, encoded', async () => {
      const page = await render('/fr/en');
      const link = shareLink(page);
      expect(link?.getAttribute('href')).toBe(
        'mailto:?subject=CV%20of%20Yann%20HURRY&body=https%3A%2F%2Fyannhurry.fr%2Ffr%2Fen',
      );
      expect(link?.textContent?.trim()).toBe('Share');
    });

    it('follows its mailto: link when the browser cannot share', async () => {
      const page = await render('/ch');
      let prevented: boolean | undefined;
      // Écouteur posé après celui de la page : il voit son verdict, puis annule la navigation
      // vers le mailto:, que jsdom ne sait pas suivre.
      shareLink(page)?.addEventListener('click', (click) => {
        prevented = click.defaultPrevented;
        click.preventDefault();
      });

      shareLink(page)?.click();

      expect(prevented).toBe(false);
    });

    it('opens the native share sheet instead, when there is one', async () => {
      const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined);
      stubShare(share);
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      const page = await render('/fr/en');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      shareLink(page)?.dispatchEvent(event);
      await settle();

      expect(event.defaultPrevented).toBe(true);
      expect(share).toHaveBeenCalledWith({
        title: 'CV of Yann HURRY',
        text: CV.description.en,
        url: 'https://yannhurry.fr/fr/en',
      });
      expect(open).not.toHaveBeenCalled();
    });

    it('does nothing more when the user cancels the share sheet', async () => {
      stubShare(() => Promise.reject(new DOMException('Share canceled', 'AbortError')));
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      const page = await render('/ch');

      shareLink(page)?.click();
      await settle();

      expect(open).not.toHaveBeenCalled();
    });

    it('falls back to the mailto: link when sharing fails otherwise', async () => {
      stubShare(() => Promise.reject(new DOMException('Not allowed', 'NotAllowedError')));
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      const page = await render('/ch');

      shareLink(page)?.click();
      await settle();

      expect(open).toHaveBeenCalledWith(shareLink(page)?.getAttribute('href'), '_self');
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
    const link = layout(page).querySelector<HTMLAnchorElement>(`a[href="${CV.links[0].url}"]`);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
    expect(link?.textContent?.trim()).toBe(CV.links[0].label);
  });
});
