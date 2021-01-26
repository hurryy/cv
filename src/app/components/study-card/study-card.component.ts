import { Component, Input, OnInit } from '@angular/core';
import { StudyCardTemplate } from 'src/app/shared/entities/study-card-template';

@Component({
  selector: 'app-study-card',
  templateUrl: './study-card.component.html',
  styleUrls: ['./study-card.component.scss'],
})
export class StudyCardComponent implements OnInit {
  constructor() {}
  @Input() content!: StudyCardTemplate;
  ngOnInit(): void {}
}
