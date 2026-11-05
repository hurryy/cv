import { IconName } from './icon';

/** Texte affiché dans les deux langues du CV. */
export interface Localized {
  fr: string;
  en: string;
}

export type Lang = keyof Localized;

/** Mois au format `AAAA-MM`. */
export type YearMonth = `${number}-${number}`;

export interface Period {
  start: YearMonth;
  /** `null` : poste ou formation en cours. */
  end: YearMonth | null;
}

export interface Experience {
  role: Localized;
  company: string;
  location: string;
  period: Period;
  summary: Localized;
  stack: string[];
}

export interface Education {
  degree: Localized;
  school: string;
  location: string;
  period: Period;
}

export interface ProfileLink {
  label: string;
  url: string;
  icon: IconName;
}

export interface Cv {
  name: string;
  headline: Localized;
  /** Meta description de la page. */
  description: Localized;
  /**
   * Chemin public du PDF par langue (`/pdf/…`), fichier déposé dans `public/pdf/`. Une langue
   * sans PDF déclaré n'affiche pas de lien.
   */
  pdf?: Partial<Localized>;
  links: ProfileLink[];
  experiences: Experience[];
  education: Education[];
}
