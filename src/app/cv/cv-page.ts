import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CV_DATA } from './cv.data';
import { CvFormat, Lang } from './cv.model';
import { Icon } from './icon';
import { SobreLayout } from './layouts/sobre';
import { PageMeta } from './page-meta';
import { ThemeService } from './theme';
import {
  OTHER_LANG,
  UI_TEXT,
  canonicalUrl,
  cvPath,
  pdfFileName,
  pdfPath,
} from './ui-text';

/**
 * Le CV dans une langue et un format, rendu par `SobreLayout` ; `format` et `lang` viennent des
 * `data` de la route (`app.routes.ts`).
 */
@Component({
  selector: 'app-cv-page',
  imports: [Icon, RouterLink, SobreLayout],
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvPage {
  readonly format = input.required<CvFormat>();
  readonly lang = input.required<Lang>();

  protected readonly cv = inject(CV_DATA);
  protected readonly theme = inject(ThemeService);
  protected readonly text = computed(() => UI_TEXT[this.lang()]);
  protected readonly otherLang = computed(() => OTHER_LANG[this.lang()]);
  protected readonly otherLangPath = computed(() => cvPath(this.format(), this.otherLang()));
  protected readonly pdf = computed(() => pdfPath(this.format(), this.lang()));
  protected readonly pdfName = computed(() => pdfFileName(this.cv.name, this.lang()));
  private readonly shared = computed(() => ({
    title: `${this.text().cvOf} ${this.cv.name}`,
    text: this.cv.description[this.lang()],
    url: canonicalUrl(this.format(), this.lang()),
  }));
  /** Partage sans script, et repli quand le partage natif échoue. */
  protected readonly mailto = computed(() => {
    const { title, url } = this.shared();
    return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
  });
  private readonly document = inject(DOCUMENT);
  private readonly langLink = viewChild.required<ElementRef<HTMLAnchorElement>>('langLink');

  constructor() {
    const pageMeta = inject(PageMeta);
    effect(() => pageMeta.apply(this.format(), this.lang(), this.cv));

    // Changer de langue recrée la page, ce qui renvoie le focus sur <body> : il revient au lien
    // de langue. Lu pendant l'activation de la route ; au premier chargement, sans navigation
    // précédente, le focus reste où le navigateur le place.
    const navigatedInApp = inject(Router).currentNavigation()?.previousNavigation != null;
    afterNextRender(() => {
      this.theme.sync();
      if (navigatedInApp) {
        this.langLink().nativeElement.focus();
      }
    });
  }

  /**
   * Ouvre la feuille de partage du système quand elle existe ; sinon le lien suit son
   * `mailto:`. Un refus de l'utilisateur (`AbortError`) ne déclenche rien.
   */
  protected share(event: MouseEvent): void {
    const window = this.document.defaultView;
    if (typeof window?.navigator.share !== 'function') {
      return;
    }
    event.preventDefault();
    window.navigator.share(this.shared()).catch((error: unknown) => {
      if ((error as { name?: unknown } | null)?.name !== 'AbortError') {
        window.open(this.mailto(), '_self');
      }
    });
  }
}
