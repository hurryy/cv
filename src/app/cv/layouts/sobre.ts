import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { updatedLabel } from '../cv-view';
import { Icon } from '../icon';
import { PeriodPipe } from '../period.pipe';
import { ShortcutSection, cvPath } from '../ui-text';
import { FormattedCvLayout } from './cv-layout';

/** Ordre de la barre de raccourcis, qui est aussi celui des sections sur mobile. */
export const SHORTCUT_SECTIONS: readonly ShortcutSection[] = ['experiences', 'skills', 'education'];

/**
 * Bandeau et frise : seule mise en page affichée et imprimée. Bandeau d'identité, puis les
 * expériences en frise à gauche et une colonne de compétences et de formation à droite ; sur
 * mobile, une seule colonne sous une barre de raccourcis collante.
 */
@Component({
  selector: 'app-layout-sobre',
  imports: [Icon, PeriodPipe, RouterLink],
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SobreLayout extends FormattedCvLayout {
  protected readonly shortcuts = SHORTCUT_SECTIONS;
  /**
   * Chemin de la page, devant l'ancre des raccourcis : avec `<base href="/">`, un `#id` seul
   * mènerait à la racine du site. Le prérendu en tire un `href` complet, utilisable sans script.
   */
  protected readonly path = computed(() => cvPath(this.format(), this.lang()));
  protected readonly showDetails = computed(() => this.format() === 'ch');
  protected readonly experiences = computed(() => {
    const lang = this.lang();
    return this.cv.experiences.map((experience) => ({
      ...experience,
      role: experience.role[lang],
      location: experience.location[lang],
      domains: (experience.domains ?? []).map((domain) => domain[lang]).join(', '),
      summary: experience.summary[lang],
      context: experience.context?.[lang] ?? '',
      achievements: (experience.achievements ?? []).map((achievement) => achievement[lang]),
    }));
  });
  protected readonly updated = computed(() => updatedLabel(this.cv.updated, this.text()));
  /** Section que la barre de raccourcis souligne ; jamais posée au prérendu. */
  protected readonly activeSection = signal<ShortcutSection | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportScroller = inject(ViewportScroller);

  constructor() {
    super();
    afterNextRender(() => {
      const stopPrint = this.openDetailsForPrint();
      const stopTracking = this.trackActiveSection();
      // Le routeur défile vers une ancre par `window.scrollTo`, que `scroll-padding-top`
      // n'atteint pas : il reçoit le même dégagement sous la barre collante.
      this.viewportScroller.setOffset(() => [0, this.shortcutsClearance()]);
      this.destroyRef.onDestroy(() => {
        stopPrint();
        stopTracking();
        this.viewportScroller.setOffset([0, 0]);
      });
    });
  }

  /**
   * Dégagement sous la barre de raccourcis, en px : le `scroll-padding-top` de `<html>`
   * (`$shortcuts-clearance`), nul quand la barre n'est pas affichée.
   */
  private shortcutsClearance(): number {
    const style = this.document.defaultView?.getComputedStyle(this.document.documentElement);
    return Number.parseFloat(style?.scrollPaddingTop ?? '') || 0;
  }

  /**
   * Un `<details>` fermé n'imprime que son `<summary>`. Chromium l'ouvre par le CSS
   * (`::details-content`, `sobre.scss`) ; pour les autres navigateurs, ceux que le visiteur a
   * laissés fermés s'ouvrent pour l'impression, puis se referment.
   */
  private openDetailsForPrint(): () => void {
    const window = this.document.defaultView;
    if (!window) {
      return () => undefined;
    }
    let opened: HTMLDetailsElement[] = [];
    const beforePrint = () => {
      opened = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('details:not([open])'),
      );
      for (const details of opened) {
        details.open = true;
      }
    };
    const afterPrint = () => {
      for (const details of opened) {
        details.open = false;
      }
      opened = [];
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }

  /**
   * Souligne la dernière section, dans l'ordre de la page, qui croise une bande haute de
   * l'écran, sous la barre de raccourcis ; aucune hors du contenu (bandeau à l'écran). En bas
   * de page, la dernière section l'emporte : trop courte, elle n'atteindrait pas la bande.
   */
  private trackActiveSection(): () => void {
    const Observer = this.document.defaultView?.IntersectionObserver;
    if (!Observer) {
      return () => undefined;
    }
    const host = this.host.nativeElement;
    const last = this.shortcuts[this.shortcuts.length - 1];
    const visible = new Set<string>();
    let atEnd = false;
    const update = () =>
      this.activeSection.set(
        atEnd ? last : (this.shortcuts.filter((id) => visible.has(id)).at(-1) ?? null),
      );

    const sections = new Observer(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        update();
      },
      // Haut : la bande commence sous la barre, mesurée une fois ; bas : la moitié basse de
      // l'écran ne compte pas.
      { rootMargin: `-${this.shortcutsClearance()}px 0px -50% 0px` },
    );
    for (const id of this.shortcuts) {
      const section = host.querySelector(`#${id}`);
      if (section) {
        sections.observe(section);
      }
    }

    // La date de mise à jour clôt la page : visible, le bas de page est atteint.
    const end = new Observer((entries) => {
      atEnd = entries.some((entry) => entry.isIntersecting);
      update();
    });
    const updated = host.querySelector('.updated');
    if (updated) {
      end.observe(updated);
    }

    return () => {
      sections.disconnect();
      end.disconnect();
    };
  }
}
