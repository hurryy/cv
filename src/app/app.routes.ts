import { Routes } from '@angular/router';
import { CvPage } from './cv/cv-page';
import { Lang } from './cv/cv.model';

/** Chemins repris par `LANG_PATH` (`cv/ui-text.ts`) ; `lang` est lié à l'input de `CvPage`. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: CvPage, data: { lang: 'fr' satisfies Lang } },
  { path: 'en', component: CvPage, data: { lang: 'en' satisfies Lang } },
  { path: '**', redirectTo: '' },
];
