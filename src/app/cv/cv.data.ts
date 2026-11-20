import { InjectionToken } from '@angular/core';
import { Cv } from './cv.model';

/**
 * Contenu du CV. Seule source à éditer pour mettre le CV à jour : l'affichage en dérive, dans
 * les deux langues. Listes en ordre anti-chronologique.
 *
 * PDF : le build de l'image imprime chaque page prérendue (`/`, `/en`, et `/fr`, `/fr/en` si
 * le format France est publié, `cv-formats.ts`) par Chromium (`npm run pdf`,
 * `scripts/generate-pdf.mjs`) : le PDF suit ce fichier, dans le format et la langue de la page.
 *
 * Format suisse : `personal` (photo, année de naissance, nationalité, permis, disponibilité,
 * taux d'activité, références) et les détails des expériences (`context`, `achievements`)
 * n'apparaissent que dans ce format, champ par champ, une fois renseignés.
 * Le dépôt est public : ni adresse, ni téléphone, ni date de naissance complète, ni permis de
 * conduire.
 */
export const CV: Cv = {
  name: 'Yann HURRY',
  headline: { fr: 'Développeur .NET et Angular', en: '.NET and Angular developer' },
  profile: {
    fr: "J'ai commencé côté back-end, là où vivent les règles métier. J'ai ensuite pris Angular en main pour suivre une fonctionnalité de la base de données jusqu'à l'écran. Aujourd'hui, j'aime porter un produit de bout en bout.",
    en: 'I started on the back end, where the business rules live. I then learned Angular to follow a feature from the database to the user interface. Today, I enjoy working on a product end to end.',
  },
  location: { fr: 'Annecy - Genève', en: 'Annecy - Geneva' },
  description: {
    fr: 'CV de Yann HURRY, développeur .NET et Angular, Annecy - Genève.',
    en: 'CV of Yann HURRY, .NET and Angular developer, Annecy - Geneva.',
  },
  personal: {
    photo: '/img/yann-hurry.jpg',
    birthYear: 1994,
    nationality: { fr: 'française', en: 'French' },
    permit: { fr: 'G', en: 'G' },
    drivingLicence: { fr: 'A et B', en: 'A and B' },
  },
  links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/yann-hurry', icon: 'linkedin' }],
  experiences: [
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular developer' },
      company: 'SQLI · Services Industriels de Genève',
      location: { fr: 'Vernier, Suisse', en: 'Vernier, Switzerland' },
      period: { start: '2024-04', end: null },
      domains: [
        { fr: 'Énergie', en: 'Energy' },
        { fr: 'Espace client', en: 'Customer portal' },
      ],
      summary: {
        fr: "Développement et maintenance de l'Espace Client de SIG : API REST en .NET, interfaces en Angular et Material, intégration des API REST et SOAP internes de SIG.",
        en: "Development and maintenance of SIG's customer portal: REST APIs in .NET, user interfaces in Angular and Material, integration of SIG's internal REST and SOAP APIs.",
      },
      context: {
        fr: "Mission pour SQLI aux Services Industriels de Genève, dans une équipe Scrum. Je développe et maintiens l'Espace Client, le portail des clients de SIG.",
        en: "Assignment for SQLI at Services Industriels de Genève (SIG), within a Scrum team. I develop and maintain the Espace Client, SIG's customer portal.",
      },
      achievements: [
        {
          fr: 'Conception et maintenance des API REST en .NET Core',
          en: 'Design and maintenance of the REST APIs in .NET Core',
        },
        {
          fr: "Développement des interfaces de l'Espace Client en Angular et Material",
          en: 'Development of the customer portal user interfaces with Angular and Material',
        },
        {
          fr: "Intégration des API REST et SOAP des équipes Core et SAP de SIG, qui fournissent les données de l'Espace Client",
          en: "Integration of the REST and SOAP APIs from SIG's Core and SAP teams, which provide the data of the customer portal",
        },
        { fr: 'Revues de code et mises à jour techniques', en: 'Code reviews and technical updates' },
        {
          fr: 'Conseil aux Product Owners sur la conception des fonctionnalités',
          en: 'Advice to Product Owners on feature design',
        },
      ],
      stack: ['.NET', 'C#', 'Angular', 'Angular Material', 'REST API', 'SOAP', 'Azure DevOps'],
    },
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular developer' },
      company: 'N2JSoft',
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2022-03', end: '2024-03' },
      domains: [
        { fr: 'RH', en: 'HR' },
        { fr: 'Gestion des temps et des absences', en: 'Time and leave management' },
      ],
      summary: {
        fr: 'Développement et maintenance de Keeple, un logiciel RH (absences, temps de travail, télétravail), et de son application mobile. Poste en télétravail.',
        en: 'Development and maintenance of Keeple, an HR solution (leave, working time, remote work), and of its mobile application. Remote position.',
      },
      context: {
        fr: "Keeple est un logiciel RH en ligne qui gère les absences et le temps de travail des salariés. J'ai travaillé sur l'ensemble du projet : architecture, base de données, interface web et application mobile.",
        en: 'Keeple is a web-based HR solution for managing employee absences and working time. I worked on the entire project: architecture, database, web interface and mobile application.',
      },
      achievements: [
        {
          fr: 'Déclaration du télétravail : règles, pose des jours et lien avec le planning',
          en: 'Implementation of remote work: rules, declaration of remote days and interactions with the scheduling system',
        },
        {
          fr: "Service d'envoi de courriels, développé en équipe : Keeple et N2F lui confient leurs courriels, qu'il envoie par une ou plusieurs API d'envoi, dont celle d'Amazon, selon leur disponibilité",
          en: "Email sending service, developed as a team: Keeple and N2F send their emails through it, and it uses one or more sending APIs, including Amazon's, depending on their availability",
        },
        {
          fr: 'Module de gestion des temps : saisie par activité ou par jour, vues semaine et mois',
          en: 'Time management module: input by activity or by day, weekly and monthly views',
        },
        {
          fr: 'Gestion des temps sur mobile : saisie, déclarations et rubrique « Mes déclarations »',
          en: 'Time management on mobile: time entry, declarations and a "My declarations" section',
        },
      ],
      stack: ['.NET Core', 'Angular', 'SQL Server', 'Flutter'],
    },
    {
      role: { fr: 'Développeur .NET', en: '.NET developer' },
      company: 'OnCloud',
      location: { fr: 'Annecy, France', en: 'Annecy, France' },
      period: { start: '2020-11', end: '2022-02' },
      domains: [
        { fr: 'Sécurité incendie', en: 'Fire safety' },
        { fr: 'Finance participative', en: 'Crowdfunding' },
      ],
      summary: {
        fr: "Applications web pour des clients : un outil de devis pour des équipements de détection de fumée et de sécurité incendie, et une application de financement participatif.",
        en: 'Web applications for clients: a quotation tool for smoke detection and fire safety devices, and a crowdfunding application.',
      },
      context: {
        fr: 'Dans une équipe de cinq développeurs, je développais et maintenais des applications web pour des clients.',
        en: 'Within a team of five developers, I developed and maintained web applications for clients.',
      },
      achievements: [
        {
          fr: 'Application de devis, développée en équipe : module de calcul, paramétrage et génération du devis final en PDF',
          en: 'Quotation application, developed as a team: calculation module, configuration and generation of the final quotation in PDF',
        },
        {
          fr: "Application de financement participatif : calcul des intérêts, échéancier, interface d'administration des projets",
          en: 'Crowdfunding application: interest calculation, payment schedule, administrator interface for project management',
        },
      ],
      stack: ['.NET Core', '.NET Framework', 'Vue.js', 'Razor', 'SQL Server'],
    },
    {
      role: { fr: 'Développeur .NET et Angular', en: '.NET and Angular developer' },
      company: 'Apollo',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2020-01', end: '2020-11' },
      domains: [{ fr: 'Recrutement', en: 'Recruitment' }],
      summary: {
        fr: 'Plateforme de tests techniques pour le recrutement : questionnaires paramétrables et coding games supervisés en direct.',
        en: 'Technical test platform for recruitment: configurable questionnaires and coding games with live supervision.',
      },
      context: {
        fr: "Projet interne d'une société de services informatiques : l'outil qui fait passer les tests techniques aux candidats.",
        en: 'Internal project of an IT services company: an application for conducting technical tests with candidates.',
      },
      achievements: [
        {
          fr: 'Questionnaires paramétrables à faire passer aux candidats',
          en: 'Configurable questionnaires for candidates to complete',
        },
        {
          fr: "Création et modification des questionnaires depuis une interface d'administration",
          en: 'Creation and editing of questionnaires via an administrator interface',
        },
        {
          fr: "Coding game « Deezer » : une page HTML à reconstruire en JavaScript, avec des appels d'API",
          en: '"Deezer" coding game: an HTML page to rebuild in JavaScript, with API calls',
        },
        {
          fr: "Suivi en direct d'un ou plusieurs candidats (WebSockets)",
          en: 'Live supervision of one or more candidates (WebSockets)',
        },
      ],
      stack: ['.NET Core', 'Angular', 'SQL Server', 'WebSockets'],
    },
    {
      role: {
        fr: 'Stage puis alternance, développeur .NET',
        en: '.NET developer, internship then apprenticeship',
      },
      company: 'Cognizant',
      location: { fr: 'Grenoble, France', en: 'Grenoble, France' },
      period: { start: '2018-03', end: '2019-09' },
      domains: [{ fr: 'Gestion de flotte', en: 'Fleet management' }],
      summary: {
        fr: "Maintenance corrective et évolutive d'un outil de gestion de flotte de véhicules.",
        en: 'Bug fixes and new features on a vehicle fleet management application.',
      },
      context: {
        fr: "Société de services informatiques : stage de six mois suivi d'une année d'alternance, sur un outil de gestion de flotte de véhicules.",
        en: 'IT services company where I completed a six-month internship followed by a one-year apprenticeship, on a vehicle fleet management application.',
      },
      achievements: [
        {
          fr: 'Bus de données pour échanger avec une application partenaire',
          en: 'Development of a data bus for communication with a partner application',
        },
        {
          fr: 'Script batch de migration des données et du schéma de la base de production',
          en: 'Batch script for the migration of the production data and database schema',
        },
        {
          fr: 'Application de centralisation des données du personnel (React)',
          en: 'Application for the centralization of personnel data (React)',
        },
      ],
      stack: ['ASP.NET', 'C#', 'SSIS', 'Azure Service Bus', 'SQL Server'],
    },
  ],
  skills: [
    {
      name: { fr: 'Back-end', en: 'Back-end' },
      items: ['C#', '.NET', 'ASP.NET', 'REST API', 'SOAP'],
    },
    {
      name: { fr: 'Front-end', en: 'Front-end' },
      items: ['TypeScript', 'Angular', 'Angular Material', 'Vue.js'],
    },
    { name: { fr: 'Données', en: 'Data' }, items: ['SQL Server', 'T-SQL'] },
    {
      name: { fr: 'Outils et méthodes', en: 'Tools and methods' },
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
};

/** Contenu injecté dans la page ; les tests le remplacent pour couvrir les cas sans données. */
export const CV_DATA = new InjectionToken<Cv>('CV_DATA', {
  providedIn: 'root',
  factory: () => CV,
});
