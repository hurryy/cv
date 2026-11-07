import { updatedLabel } from './cv-view';
import { UI_TEXT } from './ui-text';

describe('updatedLabel', () => {
  it.each([
    ['2025-01', 'fr', 'Mis à jour en janvier 2025'],
    ['2025-12', 'fr', 'Mis à jour en décembre 2025'],
    ['2025-01', 'en', 'Updated January 2025'],
    ['2025-12', 'en', 'Updated December 2025'],
  ] as const)('writes %s in %s as « %s »', (updated, lang, label) => {
    expect(updatedLabel(updated, UI_TEXT[lang])).toBe(label);
  });
});
