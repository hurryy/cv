import { Component } from '@angular/core';
import { master, licence, dut } from './helpers/formations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'website';
  master = master;
  licence = licence;
  dut = dut;
}
