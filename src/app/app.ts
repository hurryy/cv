import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CV } from './cv/cv.data';
import { PeriodPipe } from './cv/period.pipe';

@Component({
  selector: 'app-root',
  imports: [PeriodPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly cv = CV;
}
