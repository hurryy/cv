import { PeriodPipe } from './period.pipe';

describe('PeriodPipe', () => {
  const pipe = new PeriodPipe();

  it('formats a closed period as MM/YYYY – MM/YYYY', () => {
    expect(pipe.transform({ start: '2020-01', end: '2020-10' })).toBe('01/2020 – 10/2020');
  });

  it('shows an open period as ongoing', () => {
    expect(pipe.transform({ start: '2020-11', end: null })).toBe("11/2020 – aujourd'hui");
  });
});
