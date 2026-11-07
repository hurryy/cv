import { InjectionToken } from '@angular/core';
import { Cv } from './cv.model';

/**
 * Contenu du CV. Seule source à éditer pour mettre le CV à jour : l'affichage en dérive, dans
 * les deux langues. Listes en ordre anti-chronologique.
 *
 * PDF : déposer `yann-hurry-cv-fr.pdf` / `yann-hurry-cv-en.pdf` dans `public/pdf/`, puis
 * déclarer `pdf: { fr: '/pdf/yann-hurry-cv-fr.pdf', en: '/pdf/yann-hurry-cv-en.pdf' }`.
 *
 * Format suisse : `personal` (photo, année de naissance, nationalité, permis, disponibilité,
 * taux d'activité, références) n'apparaît que sous `/ch`, champ par champ, une fois renseigné.
 * Le dépôt est public : ni adresse, ni téléphone, ni date de naissance complète, ni permis de
 * conduire.
 */
export const CV: Cv = {
  name: 'Yann HURRY',
  headline: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
  description: {
    fr: 'CV de Yann HURRY, développeur .NET et Angular, Annecy – Genève.',
    en: 'CV of Yann HURRY, .NET and Angular developer, Annecy – Geneva.',
  },
  personal: {
    photo: '/img/yann-hurry.jpg',
    birthYear: 1994,
    nationality: { fr: 'Française', en: 'French' },
    permit: { fr: 'Permis G', en: 'G permit' },
    referencesOnRequest: true,
  },
  links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/yann-hurry', icon: 'linkedin' }],
  experiences: [
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
      company: 'SQLI · Services Industriels de Genève',
      location: { fr: 'Vernier, Suisse', en: 'Vernier, Switzerland' },
      period: { start: '2024-04', end: null },
      summary: {
        fr: "Développement et maintenance de l'Espace Client SIG : API REST .NET, interfaces Angular et Material, intégration d'API REST et SOAP.",
        en: 'Development and maintenance of the SIG customer portal: .NET REST APIs, Angular and Angular Material front end, REST and SOAP API integration.',
      },
      stack: [
        '.NET',
        'C#',
        'Angular',
        'Angular Material',
        'REST API',
        'SOAP',
        'Azure DevOps',
        'MSAL',
      ],
    },
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
      company: 'N2JSoft',
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2022-03', end: '2024-03' },
      summary: {
        fr: 'En télétravail, développement et maintenance de Keeple, solution RH (absences, gestion des temps, télétravail), et de son application mobile.',
        en: 'Remote position: development and maintenance of Keeple, an HR software product (leave management, time tracking, remote work), and its mobile app.',
      },
      stack: ['.NET Core', 'Angular', 'SQL Server', 'Flutter'],
    },
    {
      role: { fr: 'Développeur .NET', en: '.NET Developer' },
      company: 'OnCloud',
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2020-11', end: '2022-02' },
      summary: {
        fr: "Applications web pour des clients : outil de devis d'équipements de détection de fumée et de sécurité incendie, application de crowdfunding.",
        en: 'Web applications for clients: a quotation tool for smoke detection and fire safety equipment, and a crowdfunding application.',
      },
      stack: ['.NET Core', '.NET Framework', 'Vue.js', 'Razor', 'SQL Server'],
    },
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
      company: 'Apollo',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2020-01', end: '2020-11' },
      summary: {
        fr: 'Plateforme de tests techniques pour le recrutement : questionnaires paramétrables et coding games supervisés en direct.',
        en: 'Technical assessment platform for recruiting: configurable questionnaires and live-proctored coding challenges.',
      },
      stack: ['.NET Core', 'Angular', 'SQL Server', 'WebSockets'],
    },
    {
      role: {
        fr: 'Stage puis alternance, développeur .NET',
        en: '.NET Developer, internship then apprenticeship',
      },
      company: 'Cognizant',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2018-03', end: '2019-09' },
      summary: {
        fr: "Maintenance corrective et évolutive d'un outil de gestion de flotte de véhicules.",
        en: 'Maintenance and enhancement of a vehicle fleet management application.',
      },
      stack: ['ASP.NET', 'C#', 'SSIS', 'Azure Service Bus', 'SQL Server'],
    },
  ],
  skills: [
    {
      name: { fr: 'Back-end', en: 'Back end' },
      items: ['C#', '.NET', 'ASP.NET', 'REST API', 'SOAP'],
    },
    {
      name: { fr: 'Front-end', en: 'Front end' },
      items: ['TypeScript', 'Angular', 'Angular Material', 'Vue.js'],
    },
    { name: { fr: 'Mobile', en: 'Mobile' }, items: ['Flutter'] },
    { name: { fr: 'Données', en: 'Data' }, items: ['SQL Server', 'T-SQL'] },
    {
      name: { fr: 'Outils et méthodes', en: 'Tools and practices' },
      items: ['Git', 'Azure DevOps', 'CI/CD', 'Scrum'],
    },
  ],
  education: [
    {
      degree: { fr: 'Master 2 MIAGE', en: "Master's degree (M2) in MIAGE (IT for business)" },
      school: 'Université Grenoble Alpes',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2018-09', end: '2019-09' },
    },
    {
      degree: {
        fr: 'Semestre ERASMUS, master en informatique',
        en: "ERASMUS semester, Master's in Computer Science",
      },
      school: 'Linköping University',
      location: { fr: 'Linköping, Suède', en: 'Linköping, Sweden' },
      period: { start: '2016-09', end: '2017-01' },
    },
    {
      degree: { fr: 'Licence MIAGE', en: "Bachelor's degree in MIAGE (IT for business)" },
      school: 'Université Grenoble Alpes',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2015-09', end: '2016-06' },
    },
    {
      degree: {
        fr: 'DUT Informatique',
        en: 'Two-year technical degree in Computer Science (DUT)',
      },
      school: "IUT d'Annecy, Université Savoie Mont Blanc",
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2013-09', end: '2015-06' },
    },
  ],
  languages: [
    { name: { fr: 'Français', en: 'French' }, level: 'native' },
    { name: { fr: 'Anglais', en: 'English' }, level: 'B2' },
  ],
};

/** Contenu injecté dans la page ; les tests le remplacent pour couvrir les cas sans données. */
export const CV_DATA = new InjectionToken<Cv>('CV_DATA', {
  providedIn: 'root',
  factory: () => CV,
});
