import { Component, Input, OnInit } from '@angular/core';
import { WorkCardTemplate } from 'src/app/shared/entities/work-card-template';

@Component({
  selector: 'app-work-card',
  templateUrl: './work-card.component.html',
  styleUrls: ['./work-card.component.scss'],
})
export class WorkCardComponent implements OnInit {
  constructor() {}
  @Input() content!: WorkCardTemplate;
  ngOnInit(): void {}
}
