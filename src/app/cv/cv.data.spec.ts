import { CV } from './cv.data';
import { LANGS } from './ui-text';

describe('CV data', () => {
  it('takes every highlight from the skills', () => {
    const skills = CV.skills.flatMap((group) => group.items);
    expect(CV.highlights?.length).toBeGreaterThan(0);
    for (const highlight of CV.highlights ?? []) {
      expect(skills).toContain(highlight);
    }
  });

  it('gives the work permit and the driving licence as bare values, the label names them', () => {
    for (const lang of LANGS) {
      for (const value of [CV.personal?.permit?.[lang], CV.personal?.drivingLicence?.[lang]]) {
        expect(value).not.toMatch(/permis|permit|licen[cs]e/i);
      }
    }
  });
});
