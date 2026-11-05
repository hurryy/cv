import { Lang } from './cv.model';

export interface UiText {
  experiencesTitle: string;
  educationTitle: string;
  /** Fin d'une période en cours. */
  present: string;
  /** Libellé visible du lien vers l'autre langue. */
  otherLanguage: string;
  /** Les `aria-label` commencent par le libellé visible (WCAG 2.5.3). */
  otherLanguageLabel: string;
  darkThemeLabel: string;
  downloadPdf: string;
  downloadPdfLabel: string;
}

/** Libellés d'interface ; le contenu du CV vit dans `cv.data.ts`. */
export const UI_TEXT: Record<Lang, UiText> = {
  fr: {
    experiencesTitle: 'Expérience professionnelle',
    educationTitle: 'Formation',
    present: "aujourd'hui",
    otherLanguage: 'EN',
    otherLanguageLabel: 'EN, version anglaise du CV',
    darkThemeLabel: 'Thème sombre',
    downloadPdf: 'PDF',
    downloadPdfLabel: 'PDF, télécharger le CV',
  },
  en: {
    experiencesTitle: 'Work experience',
    educationTitle: 'Education',
    present: 'present',
    otherLanguage: 'FR',
    otherLanguageLabel: 'FR, French version of the CV',
    darkThemeLabel: 'Dark theme',
    downloadPdf: 'PDF',
    downloadPdfLabel: 'PDF, download the CV',
  },
};

export const OTHER_LANG: Record<Lang, Lang> = { fr: 'en', en: 'fr' };

/** Route de chaque langue ; doit rester alignée sur `app.routes.ts`. */
export const LANG_PATH: Record<Lang, string> = { fr: '/', en: '/en' };

/** Origine publique, pour les liens `hreflang` qui doivent être absolus. */
export const SITE_ORIGIN = 'https://yannhurry.fr';
