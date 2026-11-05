import { IsoDate, Lang, Personal, SpokenLanguage } from './cv.model';
import { UiText } from './ui-text';

/** Une ligne « libellé : valeur » des données personnelles. */
export interface PersonalFact {
  label: string;
  value: string;
}

/** `1990-03-15` → `15.03.1990`, notation suisse. */
export const formatBirthDate = (date: IsoDate): string => {
  const [year, month, day] = date.split('-');
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
};

/** Données personnelles renseignées, dans l'ordre d'affichage ; la photo est à part. */
export const personalFacts = (
  personal: Personal | undefined,
  text: UiText,
  lang: Lang,
): PersonalFact[] => {
  if (!personal) {
    return [];
  }
  const facts: (PersonalFact | null)[] = [
    personal.birthDate
      ? { label: text.birthDate, value: formatBirthDate(personal.birthDate) }
      : null,
    personal.nationality ? { label: text.nationality, value: personal.nationality[lang] } : null,
    personal.permit ? { label: text.permit, value: personal.permit[lang] } : null,
    personal.availability ? { label: text.availability, value: personal.availability[lang] } : null,
    personal.workload ? { label: text.workload, value: personal.workload[lang] } : null,
  ];
  return facts.filter((fact): fact is PersonalFact => fact !== null && fact.value !== '');
};

export const languageLevel = (language: SpokenLanguage, text: UiText): string =>
  language.level === 'native' ? text.nativeLanguage : language.level;
