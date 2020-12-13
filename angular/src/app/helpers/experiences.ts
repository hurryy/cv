import { faAngular, faVuejs } from '@fortawesome/free-brands-svg-icons';
import { WorkCardTemplate } from '../shared/entities/work-card-template';

export const Nerim: WorkCardTemplate = new WorkCardTemplate(
  'Développeur .Net FullStack',
  'Nerim<br/>Annecy, France',
  '11/2020 - Now',
  [faVuejs]
);
export const Apollo: WorkCardTemplate = new WorkCardTemplate(
  'Développeur .Net Full Stack',
  'Apollo SSC<br/>Grenoble, France',
  '01/2020 - 10/2020',
  [faAngular]
);

export const Cognizant: WorkCardTemplate = new WorkCardTemplate(
  'Alternant développeur .Net Back-end',
  'Cognizant<br/>Annecy, France',
  '09/2018 - 09/2019',
  []
);
