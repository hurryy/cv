import { Pipe, PipeTransform } from '@angular/core';
import { Period, YearMonth } from './cv.model';

const toDisplay = (value: YearMonth): string => {
  const [year, month] = value.split('-');
  return `${month.padStart(2, '0')}/${year}`;
};

/** `{ start: '2020-01', end: null }` → `01/2020 – aujourd'hui`. */
@Pipe({ name: 'period' })
export class PeriodPipe implements PipeTransform {
  transform(period: Period): string {
    const end = period.end ? toDisplay(period.end) : "aujourd'hui";
    return `${toDisplay(period.start)} – ${end}`;
  }
}
