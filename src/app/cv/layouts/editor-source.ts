import { Cv, Lang, Period } from '../cv.model';
import { languageLevel } from '../cv-view';
import { UiText } from '../ui-text';

export type TokenKind = 'plain' | 'keyword' | 'variable' | 'type' | 'string' | 'comment';

export interface Token {
  kind: TokenKind;
  text: string;
}

export type SourceLine = Token[];

const plain = (text: string): Token => ({ kind: 'plain', text });
const keyword = (text: string): Token => ({ kind: 'keyword', text });
const comment = (text: string): Token => ({ kind: 'comment', text });
// Un « */ » dans le texte fermerait le commentaire affiché : il est neutralisé.
const docComment = (text: string): Token =>
  comment(`/** ${text.replace(/\*\//g, '*\\/')} */`);

/** Littéral TypeScript entre apostrophes, valide quel que soit le texte, sur une seule ligne. */
export const quote = (value: string): Token => ({
  kind: 'string',
  text: `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/[\p{Zl}\p{Zp}]/gu, (c) => `\\u${c.charCodeAt(0).toString(16)}`)}'`,
});

const indent = (level: number): Token => plain('  '.repeat(level));

const list = (values: readonly string[]): Token[] => [
  plain('['),
  ...values.flatMap((value, index) => (index ? [plain(', '), quote(value)] : [quote(value)])),
  plain(']'),
];

const period = ({ start, end }: Period, text: UiText): Token[] => [
  plain('period: ['),
  quote(start),
  plain(', '),
  end ? quote(end) : keyword('null'),
  plain('],'),
  ...(end ? [] : [plain(' '), comment(`// ${text.present}`)]),
];

/**
 * Le CV écrit comme un fichier `cv.ts`, ligne par ligne. Généré depuis les données : aucune
 * valeur n'y est saisie à la main. Les données personnelles n'y figurent jamais.
 */
export const editorSource = (cv: Cv, lang: Lang, text: UiText): SourceLine[] => {
  const lines: SourceLine[] = [
    [docComment(`${cv.name} — ${cv.headline[lang]}`)],
    [
      keyword('export const'),
      plain(' '),
      { kind: 'variable', text: 'cv' },
      plain(': '),
      { kind: 'type', text: 'Cv' },
      plain(' = {'),
    ],
    [indent(1), plain('name: '), quote(cv.name), plain(',')],
    [indent(1), plain('links: '), ...list(cv.links.map((link) => link.url)), plain(',')],
    [],
    [indent(1), docComment(`${text.experiencesTitle}`)],
    [indent(1), plain('experiences: [')],
  ];

  for (const experience of cv.experiences) {
    lines.push(
      [indent(2), plain('{')],
      [indent(3), plain('role: '), quote(experience.role[lang]), plain(',')],
      [
        indent(3),
        plain('company: '),
        quote(experience.company),
        plain(', location: '),
        quote(experience.location[lang]),
        plain(','),
      ],
      [indent(3), ...period(experience.period, text)],
      [indent(3), plain('summary: '), quote(experience.summary[lang]), plain(',')],
      [indent(3), plain('stack: '), ...list(experience.stack), plain(',')],
      [indent(2), plain('},')],
    );
  }
  lines.push([indent(1), plain('],')]);

  if (cv.skills.length) {
    lines.push(
      [],
      [indent(1), docComment(`${text.skillsTitle}`)],
      [indent(1), plain('skills: {')],
    );
    for (const group of cv.skills) {
      lines.push([
        indent(2),
        quote(group.name[lang]),
        plain(': '),
        ...list(group.items),
        plain(','),
      ]);
    }
    lines.push([indent(1), plain('},')]);
  }

  lines.push(
    [],
    [indent(1), docComment(`${text.educationTitle}`)],
    [indent(1), plain('education: [')],
  );
  for (const education of cv.education) {
    lines.push(
      [indent(2), plain('{')],
      [indent(3), plain('degree: '), quote(education.degree[lang]), plain(',')],
      [
        indent(3),
        plain('school: '),
        quote(education.school),
        plain(', location: '),
        quote(education.location[lang]),
        plain(','),
      ],
      [indent(3), ...period(education.period, text)],
      [indent(2), plain('},')],
    );
  }
  lines.push([indent(1), plain('],')]);

  if (cv.languages.length) {
    lines.push(
      [],
      [indent(1), docComment(`${text.languagesTitle}`)],
      [indent(1), plain('languages: {')],
    );
    for (const language of cv.languages) {
      lines.push([
        indent(2),
        quote(language.name[lang]),
        plain(': '),
        quote(languageLevel(language, text)),
        plain(','),
      ]);
    }
    lines.push([indent(1), plain('},')]);
  }

  lines.push([plain('};')]);
  return lines;
};
