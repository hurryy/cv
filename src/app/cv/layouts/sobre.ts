import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PeriodPipe } from '../period.pipe';
import { FormattedCvLayout } from './cv-layout';

/** Style D : deux colonnes, contact et compétences à gauche. Seul style imprimé. */
@Component({
  selector: 'app-layout-sobre',
  imports: [PeriodPipe],
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SobreLayout extends FormattedCvLayout {}
