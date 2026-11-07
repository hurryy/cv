import { Pipe, PipeTransform } from '@angular/core';
import { Lang, Period, YearMonth } from './cv.model';
import { UI_TEXT } from './ui-text';

/** `numeric` : `01/2020 – 10/2020` ; `iso` : `2020-01 → 2020-10`. */
export type PeriodNotation = 'numeric' | 'iso';

const toDisplay = (value: YearMonth, notation: PeriodNotation): string => {
  const [year, month] = value.split('-');
  const paddedMonth = month.padStart(2, '0');
  return notation === 'iso' ? `${year}-${paddedMonth}` : `${paddedMonth}/${year}`;
};

/** `{ start: '2020-01', end: null }` → `01/2020 – aujourd'hui` (fr) ou `01/2020 – present` (en). */
@Pipe({ name: 'period' })
export class PeriodPipe implements PipeTransform {
  transform(period: Period, lang: Lang, notation: PeriodNotation = 'numeric'): string {
    const end = period.end ? toDisplay(period.end, notation) : UI_TEXT[lang].present;
    const separator = notation === 'iso' ? '→' : '–';
    return `${toDisplay(period.start, notation)} ${separator} ${end}`;
  }
}
