import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CV } from './cv/cv.data';
import { Icon } from './cv/icon';
import { PeriodPipe } from './cv/period.pipe';

@Component({
  selector: 'app-root',
  imports: [Icon, PeriodPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly cv = CV;
}
