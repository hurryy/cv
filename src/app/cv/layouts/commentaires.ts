import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { PeriodPipe } from '../period.pipe';
import { FormattedCvLayout } from './cv-layout';

/** Style A : une colonne, titres de section en commentaires de documentation. */
@Component({
  selector: 'app-layout-commentaires',
  imports: [PeriodPipe],
  templateUrl: './commentaires.html',
  styleUrl: './commentaires.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentairesLayout extends FormattedCvLayout {
  protected readonly skills = computed(() => [
    // Une compétence citée dans deux groupes ne s'affiche qu'une fois : `track skill` exige des clés uniques.
    ...new Set(this.cv.skills.flatMap((group) => group.items)),
  ]);
}
