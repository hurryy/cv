import { InjectionToken } from '@angular/core';
import { Cv } from './cv.model';

/**
 * Contenu du CV. Seule source à éditer pour mettre le CV à jour : l'affichage en dérive, dans
 * les deux langues. Listes en ordre anti-chronologique.
 *
 * PDF : déposer `yann-hurry-cv-fr.pdf` / `yann-hurry-cv-en.pdf` dans `public/pdf/`, puis
 * déclarer `pdf: { fr: '/pdf/yann-hurry-cv-fr.pdf', en: '/pdf/yann-hurry-cv-en.pdf' }`.
 *
 * Format suisse : `personal` (photo, date de naissance, nationalité, permis, disponibilité,
 * taux d'activité, références) n'apparaît que sous `/ch`, champ par champ, une fois renseigné.
 */
export const CV: Cv = {
  name: 'Yann HURRY',
  headline: { fr: 'Développeur .NET Full Stack', en: 'Full Stack .NET Developer' },
  description: {
    fr: 'CV de Yann HURRY, développeur .NET et Angular, Annecy – Genève.',
    en: 'CV of Yann HURRY, .NET and Angular developer, Annecy – Geneva.',
  },
  links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/yann-hurry', icon: 'linkedin' }],
  experiences: [
    {
      role: { fr: 'Développeur .NET Full Stack', en: 'Full Stack .NET Developer' },
      company: 'Nerim',
      location: 'Annecy, France',
      period: { start: '2020-11', end: null },
      summary: { fr: '.NET Core MVC', en: '.NET Core MVC' },
      stack: ['.NET Core', 'Vue.js'],
    },
    {
      role: { fr: 'Développeur .NET Full Stack', en: 'Full Stack .NET Developer' },
      company: 'Apollo SSC',
      location: 'Grenoble, France',
      period: { start: '2020-01', end: '2020-10' },
      summary: { fr: '.NET Core API', en: '.NET Core API' },
      stack: ['.NET Core', 'Angular'],
    },
    {
      role: {
        fr: 'Alternant développeur .NET Back-end',
        en: 'Back-end .NET Developer (work-study)',
      },
      company: 'Cognizant',
      location: 'Annecy, France',
      period: { start: '2018-09', end: '2019-09' },
      summary: { fr: 'ASP.NET API', en: 'ASP.NET API' },
      stack: ['ASP.NET'],
    },
  ],
  skills: [
    { name: { fr: 'Back', en: 'Back end' }, items: ['C#', '.NET Core', 'ASP.NET'] },
    { name: { fr: 'Front', en: 'Front end' }, items: ['TypeScript', 'Angular', 'Vue.js'] },
  ],
  education: [
    {
      degree: { fr: 'Master MIAGE', en: "Master's degree in MIAGE (IT for business)" },
      school: 'Université Grenoble Alpes',
      location: 'Grenoble, France',
      period: { start: '2016-09', end: '2019-09' },
    },
    {
      degree: { fr: 'Licence MIAGE', en: "Bachelor's degree in MIAGE (IT for business)" },
      school: 'Université Grenoble Alpes',
      location: 'Grenoble, France',
      period: { start: '2015-09', end: '2016-06' },
    },
    {
      degree: {
        fr: 'DUT Informatique',
        en: 'Two-year technical degree in Computer Science (DUT)',
      },
      school: 'Université Savoie Mont Blanc',
      location: 'Annecy, France',
      period: { start: '2013-09', end: '2015-06' },
    },
  ],
  languages: [{ name: { fr: 'Français', en: 'French' }, level: 'native' }],
};

/** Contenu injecté dans la page ; les tests le remplacent pour couvrir les cas sans données. */
export const CV_DATA = new InjectionToken<Cv>('CV_DATA', {
  providedIn: 'root',
  factory: () => CV,
});
