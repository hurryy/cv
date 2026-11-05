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
import { Lang } from './cv.model';
import { Icon } from './icon';
import { PageMeta } from './page-meta';
import { PeriodPipe } from './period.pipe';
import { ThemeService } from './theme';
import { LANG_PATH, OTHER_LANG, UI_TEXT } from './ui-text';

/** Le CV dans une langue ; `lang` vient des `data` de la route (`app.routes.ts`). */
@Component({
  selector: 'app-cv-page',
  imports: [Icon, PeriodPipe, RouterLink],
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvPage {
  readonly lang = input.required<Lang>();

  protected readonly cv = inject(CV_DATA);
  protected readonly theme = inject(ThemeService);
  protected readonly text = computed(() => UI_TEXT[this.lang()]);
  protected readonly otherLang = computed(() => OTHER_LANG[this.lang()]);
  protected readonly otherLangPath = computed(() => LANG_PATH[this.otherLang()]);
  protected readonly pdf = computed(() => this.cv.pdf?.[this.lang()]);
  private readonly langLink = viewChild.required<ElementRef<HTMLAnchorElement>>('langLink');

  constructor() {
    const pageMeta = inject(PageMeta);
    effect(() => pageMeta.apply(this.lang(), this.cv));

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
}
