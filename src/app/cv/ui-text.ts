import { CvFormat, Lang } from './cv.model';

/** Cible d'un lien de la barre de raccourcis, sur mobile. */
export type ShortcutSection = 'experiences' | 'skills' | 'education';

export interface UiText {
  experiencesTitle: string;
  educationTitle: string;
  skillsTitle: string;
  languagesTitle: string;
  /** Titre du bloc des technologies clés, sur mobile. */
  highlightsTitle: string;
  /** `aria-label` de la barre de raccourcis. */
  shortcutsLabel: string;
  shortcuts: Record<ShortcutSection, string>;
  /** Bouton qui déplie le contexte et les réalisations d'une expérience. */
  details: string;
  /** Précède le mois et l'année de mise à jour du contenu. */
  updated: string;
  /** De janvier à décembre, tels qu'écrits après `updated`. */
  months: readonly string[];
  /** Fin d'une période en cours. */
  present: string;
  /** Niveau d'une langue maternelle. */
  nativeLanguage: string;
  birthYear: string;
  nationality: string;
  permit: string;
  availability: string;
  workload: string;
  referencesOnRequest: string;
  /** Libellé visible du lien vers l'autre langue. */
  otherLanguage: string;
  /** Les `aria-label` commencent par le libellé visible (WCAG 2.5.3). */
  otherLanguageLabel: string;
  darkThemeLabel: string;
  downloadPdf: string;
  /** Suivi du nom du titulaire : sujet du courriel et titre du partage. */
  cvOf: string;
  share: string;
  /** Nom du fichier affiché dans l'onglet du style Éditeur. */
  editorFile: string;
}

/** Libellés d'interface ; le contenu du CV vit dans `cv.data.ts`. */
export const UI_TEXT: Record<Lang, UiText> = {
  fr: {
    experiencesTitle: 'Expérience professionnelle',
    educationTitle: 'Formation',
    skillsTitle: 'Compétences',
    languagesTitle: 'Langues',
    highlightsTitle: 'En bref',
    shortcutsLabel: 'Sections du CV',
    shortcuts: { experiences: 'Expériences', skills: 'Compétences', education: 'Formation' },
    details: 'Détails',
    updated: 'Mis à jour en',
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    present: "aujourd'hui",
    nativeLanguage: 'langue maternelle',
    birthYear: 'Année de naissance',
    nationality: 'Nationalité',
    permit: 'Permis',
    availability: 'Disponibilité',
    workload: "Taux d'activité",
    referencesOnRequest: 'Références sur demande',
    otherLanguage: 'EN',
    otherLanguageLabel: 'EN, version anglaise du CV',
    darkThemeLabel: 'Thème sombre',
    downloadPdf: 'Télécharger le PDF',
    cvOf: 'CV de',
    share: 'Partager',
    editorFile: 'cv.ts',
  },
  en: {
    experiencesTitle: 'Work experience',
    educationTitle: 'Education',
    skillsTitle: 'Skills',
    languagesTitle: 'Languages',
    highlightsTitle: 'At a glance',
    shortcutsLabel: 'CV sections',
    shortcuts: { experiences: 'Experience', skills: 'Skills', education: 'Education' },
    details: 'Details',
    updated: 'Updated',
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    present: 'present',
    nativeLanguage: 'native',
    birthYear: 'Year of birth',
    nationality: 'Nationality',
    permit: 'Permit',
    availability: 'Availability',
    workload: 'Workload',
    referencesOnRequest: 'References available on request',
    otherLanguage: 'FR',
    otherLanguageLabel: 'FR, French version of the CV',
    darkThemeLabel: 'Dark theme',
    downloadPdf: 'Download PDF',
    cvOf: 'CV of',
    share: 'Share',
    editorFile: 'cv.en.ts',
  },
};

export const OTHER_LANG: Record<Lang, Lang> = { fr: 'en', en: 'fr' };

/** Chemin d'une page du CV ; doit rester aligné sur `app.routes.ts` et le `Caddyfile`. */
export const cvPath = (format: CvFormat, lang: Lang): string =>
  lang === 'fr' ? `/${format}` : `/${format}/${lang}`;

/** Origine publique, pour les liens `hreflang` et canonical qui doivent être absolus. */
export const SITE_ORIGIN = 'https://yannhurry.fr';

/** Adresse publique d'une page du CV : canonical, `hreflang`, lien partagé. */
export const canonicalUrl = (format: CvFormat, lang: Lang): string =>
  SITE_ORIGIN + cvPath(format, lang);

/**
 * Chemin public du PDF d'une page. Le fichier n'existe que dans l'image Docker (ou après
 * `npm run pdf`) : `scripts/generate-pdf.mjs` imprime chaque page prérendue sous le chemin que
 * désigne son lien de téléchargement. Sous `ng serve`, le lien rend 404.
 */
export const pdfPath = (format: CvFormat, lang: Lang): string =>
  `/pdf/yann-hurry-cv-${format}-${lang}.pdf`;

/** Nom proposé à l'enregistrement du PDF (attribut `download`). */
export const pdfFileName = (name: string, lang: Lang): string =>
  `${name.trim().replace(/\s+/g, '-')}-CV-${lang.toUpperCase()}.pdf`;
