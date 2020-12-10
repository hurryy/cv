import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';

export class CardTemplate {
  constructor() {}
  public Title!: string;
  public SubTitle!: string;
  public Text!: string;
  public IconName!: IconName;
  public IconPrefix!: IconPrefix;
}
