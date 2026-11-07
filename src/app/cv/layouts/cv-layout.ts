import { Directive, computed, inject, input } from '@angular/core';
import { CV_DATA } from '../cv.data';
import { CvFormat, Lang } from '../cv.model';
import { languageLevel, personalFacts } from '../cv-view';
import { UI_TEXT } from '../ui-text';

/** Socle des mises en page : toutes lisent les mêmes données, dans la langue de la route. */
@Directive()
export abstract class CvLayout {
  readonly lang = input.required<Lang>();

  protected readonly cv = inject(CV_DATA);
  protected readonly text = computed(() => UI_TEXT[this.lang()]);
  protected readonly languages = computed(() =>
    this.cv.languages.map((language) => ({
      name: language.name[this.lang()],
      level: languageLevel(language, this.text()),
    })),
  );
}

/** Mise en page qui suit le format de la route : données personnelles en `ch` seulement. */
@Directive()
export abstract class FormattedCvLayout extends CvLayout {
  readonly format = input.required<CvFormat>();

  private readonly personal = computed(() =>
    this.format() === 'ch' ? this.cv.personal : undefined,
  );
  protected readonly photo = computed(() => this.personal()?.photo || null);
  protected readonly facts = computed(() =>
    personalFacts(this.personal(), this.text(), this.lang()),
  );
  protected readonly referencesOnRequest = computed(
    () => this.personal()?.referencesOnRequest === true,
  );
}
