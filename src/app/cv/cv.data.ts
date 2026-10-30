import { Cv } from './cv.model';

/**
 * Contenu du CV. Seule source à éditer pour mettre le CV à jour : l'affichage et le PDF en
 * dérivent. Listes en ordre anti-chronologique.
 */
export const CV: Cv = {
  name: 'Yann HURRY',
  headline: 'Développeur .NET Full Stack',
  links: [{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/yann-hurry' }],
  experiences: [
    {
      role: 'Développeur .NET Full Stack',
      company: 'Nerim',
      location: 'Annecy, France',
      period: { start: '2020-11', end: null },
      summary: '.NET Core MVC',
      stack: ['.NET Core', 'Vue.js'],
    },
    {
      role: 'Développeur .NET Full Stack',
      company: 'Apollo SSC',
      location: 'Grenoble, France',
      period: { start: '2020-01', end: '2020-10' },
      summary: '.NET Core API',
      stack: ['.NET Core', 'Angular'],
    },
    {
      role: 'Alternant développeur .NET Back-end',
      company: 'Cognizant',
      location: 'Annecy, France',
      period: { start: '2018-09', end: '2019-09' },
      summary: 'ASP.NET API',
      stack: ['ASP.NET'],
    },
  ],
  education: [
    {
      degree: 'Master MIAGE',
      school: 'Université Grenoble Alpes',
      location: 'Grenoble, France',
      period: { start: '2016-09', end: '2019-09' },
    },
    {
      degree: 'Licence MIAGE',
      school: 'Université Grenoble Alpes',
      location: 'Grenoble, France',
      period: { start: '2015-09', end: '2016-06' },
    },
    {
      degree: 'DUT Informatique',
      school: 'Université Savoie Mont Blanc',
      location: 'Annecy, France',
      period: { start: '2013-09', end: '2015-06' },
    },
  ],
};
