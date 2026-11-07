import { IconName } from './icon';

/** Texte affiché dans les deux langues du CV. */
export interface Localized {
  fr: string;
  en: string;
}

export type Lang = keyof Localized;

/**
 * Format du CV, porté par la route : `ch` (suisse) affiche les données personnelles, `fr`
 * (France) les tait.
 */
export type CvFormat = 'ch' | 'fr';

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
  location: Localized;
  period: Period;
  summary: Localized;
  stack: string[];
  /** Cadre du poste, en tête des détails ; format `ch` seulement. */
  context?: Localized;
  /** Réalisations, sous le contexte ; format `ch` seulement. */
  achievements?: Localized[];
  /** Secteurs d'activité ; en régie, ceux du client final. */
  domains?: Localized[];
}

export interface Education {
  degree: Localized;
  school: string;
  location: Localized;
  period: Period;
}

export interface ProfileLink {
  label: string;
  url: string;
  icon: IconName;
}

export interface SkillGroup {
  name: Localized;
  items: string[];
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface SpokenLanguage {
  name: Localized;
  /** Niveau CECR pour une langue étrangère. */
  level: CefrLevel | 'native';
}

/**
 * Mentions d'usage sur un CV suisse, absentes d'un CV français : affichées en format `ch`
 * seulement, et chacune seulement si elle est renseignée.
 */
export interface Personal {
  /** Chemin public de la photo (`/img/…`), fichier déposé dans `public/`. */
  photo?: string;
  /**
   * Année seule : un âge calculé au prérendu vieillirait entre deux builds, une date complète
   * en dirait trop.
   */
  birthYear?: number;
  nationality?: Localized;
  /** Permis de séjour ou de travail (ex. permis G). */
  permit?: Localized;
  availability?: Localized;
  /** Taux d'activité recherché (ex. 80–100 %). */
  workload?: Localized;
  /** Affiche « Références sur demande ». */
  referencesOnRequest?: boolean;
}

export interface Cv {
  name: string;
  headline: Localized;
  /** Quelques phrases de présentation, sous le titre. */
  profile: Localized;
  /** Zone de travail, sur la ligne d'infos du bandeau. */
  location?: Localized;
  /** Meta description de la page. */
  description: Localized;
  /**
   * Chemin public du PDF par langue (`/pdf/…`), fichier déposé dans `public/pdf/`. Une langue
   * sans PDF déclaré n'affiche pas de lien.
   */
  pdf?: Partial<Localized>;
  personal?: Personal;
  links: ProfileLink[];
  experiences: Experience[];
  skills: SkillGroup[];
  /** Technologies clés du bloc « En bref » ; chacune figure dans `skills`. */
  highlights?: string[];
  education: Education[];
  languages: SpokenLanguage[];
  /**
   * Mois de la dernière mise à jour du contenu, affiché sous le CV. Écrit à la main : une date
   * de build pourrait différer entre le prérendu et l'hydratation.
   */
  updated: YearMonth;
}
