import { CardTemplate } from './card-template';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export class WorkCardTemplate extends CardTemplate {
  constructor(
    title: string,
    subTitle: string,
    text: string,
    technologies: IconDefinition[]
  ) {
    super();
    this.Title = title;
    this.SubTitle = subTitle;
    this.Text = text;
    this.IconName = 'code';
    this.IconPrefix = 'fas';
    this.Technologies = technologies;
  }
  Technologies!: IconDefinition[];
}
