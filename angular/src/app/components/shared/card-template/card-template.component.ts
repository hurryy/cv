import { Component, Input, OnInit } from '@angular/core';
import { CardTemplate } from 'src/app/shared/entities/card-template';

@Component({
  selector: 'app-card-template',
  templateUrl: './card-template.component.html',
  styleUrls: ['./card-template.component.scss'],
})
export class CardTemplateComponent implements OnInit {
  constructor() {}

  @Input() content!: CardTemplate;

  ngOnInit(): void {}
}
