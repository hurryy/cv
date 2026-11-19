import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Sans restauration de position : elle passerait `history.scrollRestoration` en `manual`,
    // et un rechargement ne rendrait plus la position. Après un changement de langue, le focus
    // remis sur le lien de langue ramène la page en haut.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
  ],
};
