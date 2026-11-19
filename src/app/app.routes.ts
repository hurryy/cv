import { Route, Routes } from '@angular/router';
import { CvPage } from './cv/cv-page';
import { PUBLISHED_FORMATS } from './cv/cv-formats';
import { CvFormat, Lang } from './cv/cv.model';
import { LANGS, cvPath } from './cv/ui-text';

/** `format` et `lang` sont liés aux inputs de `CvPage`. */
const page = (format: CvFormat, lang: Lang): Route => ({
  path: cvPath(format, lang).slice(1),
  pathMatch: 'full',
  component: CvPage,
  data: { format, lang },
});

/**
 * Une page par format publié et par langue. En production, `/ch` et `/fr` (format masqué) sont
 * redirigés (`/ch` en 301, `/fr` en 302) par le `Caddyfile` avant d'atteindre l'application, en gardant la langue ;
 * la redirection ci-dessous sert la navigation interne et `ng serve`.
 */
export const cvRoutes = (formats: readonly CvFormat[]): Routes => [
  ...formats.flatMap((format) => LANGS.map((lang) => page(format, lang))),
  { path: '**', redirectTo: '' },
];

export const routes: Routes = cvRoutes(PUBLISHED_FORMATS);
