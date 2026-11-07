import { CvFormat, Lang } from './cv.model';
import { CvStyle } from './cv-style';

export interface UiText {
  experiencesTitle: string;
  educationTitle: string;
  skillsTitle: string;
  languagesTitle: string;
  contactTitle: string;
  /** Fin d'une période en cours. */
  present: string;
  /** Niveau d'une langue maternelle. */
  nativeLanguage: string;
  birthDate: string;
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
  downloadPdfLabel: string;
  styleLabel: string;
  styleNames: Record<CvStyle, string>;
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
    contactTitle: 'Contact',
    present: "aujourd'hui",
    nativeLanguage: 'langue maternelle',
    birthDate: 'Date de naissance',
    nationality: 'Nationalité',
    permit: 'Permis',
    availability: 'Disponibilité',
    workload: "Taux d'activité",
    referencesOnRequest: 'Références sur demande',
    otherLanguage: 'EN',
    otherLanguageLabel: 'EN, version anglaise du CV',
    darkThemeLabel: 'Thème sombre',
    downloadPdf: 'PDF',
    downloadPdfLabel: 'PDF, télécharger le CV',
    styleLabel: 'Style',
    styleNames: { sobre: 'Sobre', commentaires: 'Commentaires', editeur: 'Éditeur' },
    editorFile: 'cv.ts',
  },
  en: {
    experiencesTitle: 'Work experience',
    educationTitle: 'Education',
    skillsTitle: 'Skills',
    languagesTitle: 'Languages',
    contactTitle: 'Contact',
    present: 'present',
    nativeLanguage: 'native',
    birthDate: 'Date of birth',
    nationality: 'Nationality',
    permit: 'Permit',
    availability: 'Availability',
    workload: 'Workload',
    referencesOnRequest: 'References available on request',
    otherLanguage: 'FR',
    otherLanguageLabel: 'FR, French version of the CV',
    darkThemeLabel: 'Dark theme',
    downloadPdf: 'PDF',
    downloadPdfLabel: 'PDF, download the CV',
    styleLabel: 'Style',
    styleNames: { sobre: 'Plain', commentaires: 'Comments', editeur: 'Editor' },
    editorFile: 'cv.en.ts',
  },
};

export const OTHER_LANG: Record<Lang, Lang> = { fr: 'en', en: 'fr' };

/** Chemin d'une page du CV ; doit rester aligné sur `app.routes.ts` et le `Caddyfile`. */
export const cvPath = (format: CvFormat, lang: Lang): string =>
  lang === 'fr' ? `/${format}` : `/${format}/${lang}`;

/** Origine publique, pour les liens `hreflang` et canonical qui doivent être absolus. */
export const SITE_ORIGIN = 'https://yannhurry.fr';
