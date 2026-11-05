import { Pipe, PipeTransform } from '@angular/core';
import { Lang, Period, YearMonth } from './cv.model';
import { UI_TEXT } from './ui-text';

const toDisplay = (value: YearMonth): string => {
  const [year, month] = value.split('-');
  return `${month.padStart(2, '0')}/${year}`;
};

/** `{ start: '2020-01', end: null }` → `01/2020 – aujourd'hui` (fr) ou `01/2020 – present` (en). */
@Pipe({ name: 'period' })
export class PeriodPipe implements PipeTransform {
  transform(period: Period, lang: Lang): string {
    const end = period.end ? toDisplay(period.end) : UI_TEXT[lang].present;
    return `${toDisplay(period.start)} – ${end}`;
  }
}
