import { PeriodPipe } from './period.pipe';

describe('PeriodPipe', () => {
  const pipe = new PeriodPipe();

  it('formats a closed period as MM/YYYY – MM/YYYY', () => {
    expect(pipe.transform({ start: '2020-01', end: '2020-10' }, 'fr')).toBe('01/2020 – 10/2020');
  });

  it('shows an open period as ongoing, in French', () => {
    expect(pipe.transform({ start: '2020-11', end: null }, 'fr')).toBe("11/2020 – aujourd'hui");
  });

  it('shows an open period as ongoing, in English', () => {
    expect(pipe.transform({ start: '2020-11', end: null }, 'en')).toBe('11/2020 – present');
  });

  it('formats a closed period in ISO notation', () => {
    expect(pipe.transform({ start: '2020-1', end: '2020-10' }, 'fr', 'iso')).toBe(
      '2020-01 → 2020-10',
    );
  });

  it('shows an open period as ongoing in ISO notation', () => {
    expect(pipe.transform({ start: '2020-11', end: null }, 'en', 'iso')).toBe('2020-11 → present');
  });
});
