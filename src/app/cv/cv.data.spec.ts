import { CV } from './cv.data';

describe('CV data', () => {
  it('takes every highlight from the skills', () => {
    const skills = CV.skills.flatMap((group) => group.items);
    expect(CV.highlights?.length).toBeGreaterThan(0);
    for (const highlight of CV.highlights ?? []) {
      expect(skills).toContain(highlight);
    }
  });

  it('dates the content with a real month', () => {
    const [year, month] = CV.updated.split('-').map(Number);
    expect(year).toBeGreaterThanOrEqual(2026);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});
