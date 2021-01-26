import { CardTemplate } from './card-template';

import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';

export class StudyCardTemplate extends CardTemplate {
  constructor(title: string, subTitle: string, text: string) {
    super();
    this.Title = title;
    this.SubTitle = subTitle;
    this.Text = text;
    this.IconName = 'graduation-cap';
    this.IconPrefix = 'fas';
  }
}
