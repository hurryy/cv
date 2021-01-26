import { Component, Input, OnInit } from '@angular/core';
import { CardTemplate } from 'src/app/shared/entities/card-template';
import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';
@Component({
  selector: 'app-card-template',
  templateUrl: './card-template.component.html',
  styleUrls: ['./card-template.component.scss', './card-template.component.responsive.scss'],
})
export class CardTemplateComponent implements OnInit {
  constructor() { }

  @Input() content!: CardTemplate;

  ngOnInit(): void { }
}
