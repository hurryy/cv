import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import '@angular/material/prebuilt-themes/deeppurple-amber.css';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

const modules = [
  BrowserModule,
  AppRoutingModule,
  BrowserAnimationsModule,
  MatSliderModule,
  MatCardModule,
  MatIconModule,
];

@NgModule({
  declarations: [AppComponent],
  imports: [modules, BrowserAnimationsModule],
  exports: [modules],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
