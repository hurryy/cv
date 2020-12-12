import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

export class LogoUrlTemplate {
  constructor(url: string, name: IconName, prefix: IconPrefix) {
    this.Url = url;
    this.IconName = name;
    this.IconPrefix = prefix;
  }
  public IconName!: IconName;
  public IconPrefix!: IconPrefix;
  public Url!: string;
}
