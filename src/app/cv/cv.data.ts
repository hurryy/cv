import { InjectionToken } from '@angular/core';
import { Cv } from './cv.model';

/**
 * Contenu du CV. Seule source à éditer pour mettre le CV à jour : l'affichage en dérive, dans
 * les deux langues. Listes en ordre anti-chronologique. Changer le contenu, c'est aussi avancer
 * `updated`.
 *
 * PDF : déposer `yann-hurry-cv-fr.pdf` / `yann-hurry-cv-en.pdf` dans `public/pdf/`, puis
 * déclarer `pdf: { fr: '/pdf/yann-hurry-cv-fr.pdf', en: '/pdf/yann-hurry-cv-en.pdf' }`.
 *
 * Format suisse : `personal` (photo, année de naissance, nationalité, permis, disponibilité,
 * taux d'activité, références) et les détails des expériences (`context`, `achievements`)
 * n'apparaissent que sous `/ch`, champ par champ, une fois renseignés.
 * Le dépôt est public : ni adresse, ni téléphone, ni date de naissance complète, ni permis de
 * conduire.
 */
export const CV: Cv = {
  name: 'Yann HURRY',
  headline: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
  profile: {
    fr: "J'ai commencé côté back-end, là où vivent les règles métier. J'ai ensuite pris Angular en main pour suivre une fonctionnalité de la base de données jusqu'à l'écran. Aujourd'hui, j'aime porter un produit de bout en bout.",
    en: 'I started on the back end, where the business rules live. I then took up Angular to follow a feature from the database all the way to the screen. Today, I enjoy owning a product end to end.',
  },
  location: { fr: 'Annecy – Genève', en: 'Annecy – Geneva' },
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
      domains: [
        { fr: 'Énergie', en: 'Energy' },
        { fr: 'Espace client', en: 'Customer portal' },
      ],
      summary: {
        fr: "Développement et maintenance de l'Espace Client SIG : API REST .NET, interfaces Angular et Material, intégration d'API REST et SOAP.",
        en: 'Development and maintenance of the SIG customer portal: .NET REST APIs, Angular and Angular Material front end, REST and SOAP API integration.',
      },
      context: {
        fr: "En mission pour SQLI, développement et maintenance de l'Espace Client des Services Industriels de Genève, avec l'objectif d'améliorer l'expérience utilisateur et la performance des applications, en équipe Scrum.",
        en: 'On assignment for SQLI, development and maintenance of the Services Industriels de Genève customer portal, aiming to improve user experience and application performance, in a Scrum team.',
      },
      achievements: [
        {
          fr: "Conception et maintenance d'API REST .NET Core, pour la performance et la sécurité des transactions",
          en: 'Design and maintenance of .NET Core REST APIs for transaction performance and security',
        },
        {
          fr: "Interfaces de l'espace client en Angular et Material",
          en: 'Customer portal user interfaces in Angular and Material',
        },
        {
          fr: "Intégration d'API REST et SOAP de partenaires (ADAL, MSAL)",
          en: 'Integration of partner REST and SOAP APIs (ADAL, MSAL)',
        },
        { fr: 'Revues de code et mises à jour techniques', en: 'Code reviews and technical upgrades' },
        {
          fr: 'Conseil aux Product Owners sur la conception des fonctionnalités',
          en: 'Advising Product Owners on feature design',
        },
      ],
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
      domains: [
        { fr: 'RH', en: 'HR' },
        { fr: 'Gestion des temps et des absences', en: 'Time and leave management' },
      ],
      summary: {
        fr: 'En télétravail, développement et maintenance de Keeple, solution RH (absences, gestion des temps, télétravail), et de son application mobile.',
        en: 'Remote position: development and maintenance of Keeple, an HR software product (leave management, time tracking, remote work), and its mobile app.',
      },
      context: {
        fr: "Keeple est une solution RH web de gestion des absences et du temps des collaborateurs. Développeur full stack et mobile, je suis intervenu sur l'ensemble du projet, de l'architecture et de la base de données jusqu'à l'interface.",
        en: 'Keeple is a web-based HR solution for managing employee absences and working time. As a full-stack and mobile developer, I worked across the whole project, from architecture and database to the user interface.',
      },
      achievements: [
        {
          fr: 'Déclaration du télétravail : gestion des règles, pose et interactions avec le planning',
          en: 'Remote-work declaration: rule management, requests and scheduling interactions',
        },
        {
          fr: "Co-développement d'une application d'envoi de courriels via Amazon, à l'interface entre Keeple, N2F et les API d'Amazon",
          en: 'Co-developed an email dispatch application via Amazon, linking Keeple, N2F and the Amazon APIs',
        },
        {
          fr: 'Nouveau module de gestion des temps : saisie par activité ou par jour, vues semaine et mois',
          en: 'New time-tracking module: entry by activity or by day, weekly and monthly views',
        },
        {
          fr: 'Module de gestion des temps sur mobile : saisie, déclarations et section « mes déclarations »',
          en: 'Mobile time-tracking module: time entry, declarations and a “my declarations” section',
        },
      ],
      stack: ['.NET Core', 'Angular', 'SQL Server', 'Flutter'],
    },
    {
      role: { fr: 'Développeur .NET', en: '.NET Developer' },
      company: 'OnCloud',
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2020-11', end: '2022-02' },
      domains: [
        { fr: 'Sécurité incendie', en: 'Fire safety' },
        { fr: 'Finance participative', en: 'Crowdfunding' },
      ],
      summary: {
        fr: "Applications web pour des clients : outil de devis d'équipements de détection de fumée et de sécurité incendie, application de crowdfunding.",
        en: 'Web applications for clients: a quotation tool for smoke detection and fire safety equipment, and a crowdfunding application.',
      },
      context: {
        fr: "Au sein d'une équipe de cinq développeurs, développement et maintenance d'applications web pour des clients.",
        en: 'In a five-developer team, development and maintenance of web applications for clients.',
      },
      achievements: [
        {
          fr: 'Application de devis, en équipe : module de calcul, paramétrage, édition finale en PDF',
          en: 'Quotation application, built as a team: calculation module, configuration, final PDF quote',
        },
        {
          fr: "Application de crowdfunding : calcul des intérêts, planning des échéances, interface d'administration des projets",
          en: 'Crowdfunding application: interest calculation, payment schedule, project administration interface',
        },
      ],
      stack: ['.NET Core', '.NET Framework', 'Vue.js', 'Razor', 'SQL Server'],
    },
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular Developer' },
      company: 'Apollo',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2020-01', end: '2020-11' },
      domains: [{ fr: 'Recrutement', en: 'Recruitment' }],
      summary: {
        fr: 'Plateforme de tests techniques pour le recrutement : questionnaires paramétrables et coding games supervisés en direct.',
        en: 'Technical assessment platform for recruiting: configurable questionnaires and live-proctored coding challenges.',
      },
      context: {
        fr: "Société de services informatiques ; projet interne de création d'une application de tests techniques pour le recrutement.",
        en: 'IT services company; internal project building an application for technical recruitment tests.',
      },
      achievements: [
        {
          fr: 'Questionnaires paramétrables à faire passer aux candidats',
          en: 'Configurable questionnaires for candidates',
        },
        {
          fr: "Édition des questionnaires depuis une interface d'administration",
          en: 'Questionnaire editing from an administration interface',
        },
        {
          fr: "Coding game « Deezer » : page HTML à reconstruire en JavaScript, avec appels d'API",
          en: '“Deezer” coding game: an HTML page to rebuild in JavaScript, with API calls',
        },
        {
          fr: "Supervision en direct d'un ou plusieurs candidats (WebSockets)",
          en: 'Live supervision of one or more candidates (WebSockets)',
        },
      ],
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
      domains: [{ fr: 'Gestion de flotte', en: 'Fleet management' }],
      summary: {
        fr: "Maintenance corrective et évolutive d'un outil de gestion de flotte de véhicules.",
        en: 'Maintenance and enhancement of a vehicle fleet management application.',
      },
      context: {
        fr: "Société de services informatiques : stage de six mois suivi d'une année d'alternance, sur un outil de gestion de flotte de véhicules.",
        en: 'IT services company: six-month internship followed by a one-year apprenticeship, on a vehicle fleet management tool.',
      },
      achievements: [
        {
          fr: 'Bus de données pour communiquer avec une application partenaire',
          en: 'Data bus for communication with a partner application',
        },
        {
          fr: 'Script batch de migration des données et du schéma de base en production',
          en: 'Batch script for production data and database schema migrations',
        },
        {
          fr: 'Application de centralisation des données du personnel (React)',
          en: 'Personnel data centralization application (React)',
        },
      ],
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
  highlights: ['C#', '.NET', 'Angular', 'TypeScript', 'SQL Server', 'Azure DevOps'],
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
  updated: '2026-11',
};

/** Contenu injecté dans la page ; les tests le remplacent pour couvrir les cas sans données. */
export const CV_DATA = new InjectionToken<Cv>('CV_DATA', {
  providedIn: 'root',
  factory: () => CV,
});
