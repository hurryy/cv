import { Route, Routes } from '@angular/router';
import { CvPage } from './cv/cv-page';
import { CvFormat, Lang } from './cv/cv.model';

/** `format` et `lang` sont liés aux inputs de `CvPage`. */
const page = (path: string, format: CvFormat, lang: Lang): Route => ({
  path,
  component: CvPage,
  data: { format, lang },
});

/**
 * Chemins repris par `cvPath` (`cv/ui-text.ts`). En production, `/` et `/en` sont redirigés
 * (301) par le `Caddyfile` avant d'atteindre l'application ; les redirections ci-dessous
 * servent la navigation interne et `ng serve`.
 */
export const routes: Routes = [
  page('ch', 'ch', 'fr'),
  page('ch/en', 'ch', 'en'),
  page('fr', 'fr', 'fr'),
  page('fr/en', 'fr', 'en'),
  { path: 'en', redirectTo: 'ch/en' },
  { path: '**', redirectTo: 'ch' },
];
