import { CV } from '../cv.data';
import { Cv } from '../cv.model';
import { UI_TEXT } from '../ui-text';
import { SourceLine, editorSource, quote } from './editor-source';

const toText = (lines: SourceLine[]) =>
  lines.map((line) => line.map((token) => token.text).join('')).join('\n');

describe('editorSource', () => {
  it('writes the CV as a TypeScript object, from the data', () => {
    const source = toText(editorSource(CV, 'fr', UI_TEXT.fr));
    expect(source.split('\n')[0]).toBe(`/** ${CV.name} — ${CV.headline.fr} */`);
    expect(source).toContain('export const cv: Cv = {');
    expect(source).toContain(`  /** ${UI_TEXT.fr.experiencesTitle} */`);
    expect(source).toContain(`      role: '${CV.experiences[0].role.fr}',`);
    expect(source).toContain(`      period: ['2024-04', null], // ${UI_TEXT.fr.present}`);
    expect(source).toContain("      period: ['2020-01', '2020-11'],");
    expect(source).toContain("    'Back-end': ['C#', '.NET', 'ASP.NET', 'REST API', 'SOAP'],");
    expect(source).toContain(
      "company: 'SQLI · Services Industriels de Genève', location: 'Vernier, Suisse',",
    );
    expect(source).toContain(`    'Français': '${UI_TEXT.fr.nativeLanguage}',`);
    expect(source.endsWith('};')).toBe(true);
  });

  it('escapes quotes so that every string stays a valid literal', () => {
    expect(quote("Master's").text).toBe("'Master\\'s'");
    expect(quote('a\\b').text).toBe("'a\\\\b'");
    expect(quote(`a\r\nb${String.fromCharCode(0x2028)}c`).text).toBe("'a\\r\\nb\\u2028c'");
    expect(toText(editorSource(CV, 'en', UI_TEXT.en))).toContain(
      "degree: 'Bachelor\\'s degree in MIAGE (IT for business)',",
    );
    expect(toText(editorSource(CV, 'en', UI_TEXT.en))).toContain("location: 'Linköping, Sweden',");
  });

  it('colours keywords, types, strings and comments', () => {
    const [first, second] = editorSource(CV, 'fr', UI_TEXT.fr);
    expect(first.map((token) => token.kind)).toEqual(['comment']);
    expect(second.filter((token) => token.kind !== 'plain').map((token) => token.kind)).toEqual([
      'keyword',
      'variable',
      'type',
    ]);
  });

  it('never writes personal data and skips empty sections', () => {
    const cv: Cv = {
      ...CV,
      skills: [],
      languages: [],
      personal: { permit: { fr: 'Permis G', en: 'G permit' } },
    };
    const source = toText(editorSource(cv, 'fr', UI_TEXT.fr));
    expect(source).not.toContain('Permis G');
    expect(source).not.toContain(UI_TEXT.fr.skillsTitle);
    expect(source).not.toContain(UI_TEXT.fr.languagesTitle);
  });
});
