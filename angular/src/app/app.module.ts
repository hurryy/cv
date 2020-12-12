import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import '@angular/material/prebuilt-themes/deeppurple-amber.css';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CardTemplateComponent } from './components/shared/card-template/card-template.component';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { LogoUrlComponent } from './components/shared/logo-url/logo-url.component';
import { fab } from '@fortawesome/free-brands-svg-icons';

const modules = [
  BrowserModule,
  AppRoutingModule,
  BrowserAnimationsModule,
  MatSliderModule,
  MatCardModule,
  MatIconModule,
  FontAwesomeModule,
];

@NgModule({
  declarations: [AppComponent, CardTemplateComponent, LogoUrlComponent],
  imports: [modules, BrowserAnimationsModule],
  exports: [modules],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fab);
  }
}
