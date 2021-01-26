import { Component, Input, OnInit } from '@angular/core';
import { LogoUrlTemplate } from 'src/app/shared/entities/logo-url-template';

@Component({
  selector: 'app-logo-url',
  templateUrl: './logo-url.component.html',
  styleUrls: ['./logo-url.component.scss']
})
export class LogoUrlComponent implements OnInit {

  constructor() { }
  @Input() content!: LogoUrlTemplate;
  ngOnInit(): void {
  }

}
