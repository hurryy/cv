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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CV_DATA } from './cv.data';
import { CvFormat, Lang } from './cv.model';
import { CV_STYLES, STYLE_QUERY_PARAM, StyleService, isCvStyle } from './cv-style';
import { Icon } from './icon';
import { CommentairesLayout } from './layouts/commentaires';
import { EditeurLayout } from './layouts/editeur';
import { SobreLayout } from './layouts/sobre';
import { PageMeta } from './page-meta';
import { ThemeService } from './theme';
import { OTHER_LANG, UI_TEXT, cvPath } from './ui-text';

/**
 * Le CV dans une langue et un format ; `format` et `lang` viennent des `data` de la route
 * (`app.routes.ts`). Les trois mises en page sont rendues, le CSS n'en montre qu'une
 * (`StyleService`).
 */
@Component({
  selector: 'app-cv-page',
  imports: [Icon, RouterLink, CommentairesLayout, EditeurLayout, SobreLayout],
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvPage {
  readonly format = input.required<CvFormat>();
  readonly lang = input.required<Lang>();

  protected readonly cv = inject(CV_DATA);
  protected readonly theme = inject(ThemeService);
  protected readonly styles = inject(StyleService);
  protected readonly styleOptions = CV_STYLES;
  protected readonly text = computed(() => UI_TEXT[this.lang()]);
  protected readonly otherLang = computed(() => OTHER_LANG[this.lang()]);
  protected readonly otherLangPath = computed(() => cvPath(this.format(), this.otherLang()));
  protected readonly pdf = computed(() => this.cv.pdf?.[this.lang()]);
  private readonly langLink = viewChild.required<ElementRef<HTMLAnchorElement>>('langLink');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const pageMeta = inject(PageMeta);
    effect(() => pageMeta.apply(this.format(), this.lang(), this.cv));

    // Changer de langue recrée la page, ce qui renvoie le focus sur <body> : il revient au lien
    // de langue. Lu pendant l'activation de la route ; au premier chargement, sans navigation
    // précédente, le focus reste où le navigateur le place.
    const navigatedInApp = this.router.currentNavigation()?.previousNavigation != null;
    afterNextRender(() => {
      this.theme.sync();
      this.styles.sync(this.route.snapshot.queryParamMap.get(STYLE_QUERY_PARAM));
      if (navigatedInApp) {
        this.langLink().nativeElement.focus();
      }
    });
  }

  protected selectStyle(value: string): void {
    if (!isCvStyle(value)) {
      return;
    }
    this.styles.select(value);
    // Un `?style=` resté dans l'URL l'emporterait sur le choix au rechargement.
    if (this.route.snapshot.queryParamMap.has(STYLE_QUERY_PARAM)) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [STYLE_QUERY_PARAM]: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
}
