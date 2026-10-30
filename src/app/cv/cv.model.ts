import { IconName } from './icon';

/** Mois au format `AAAA-MM`. */
export type YearMonth = `${number}-${number}`;

export interface Period {
  start: YearMonth;
  /** `null` : poste ou formation en cours. */
  end: YearMonth | null;
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  period: Period;
  summary: string;
  stack: string[];
}

export interface Education {
  degree: string;
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
  headline: string;
  links: ProfileLink[];
  experiences: Experience[];
  education: Education[];
}
