import { InjectionToken } from '@angular/core';
import { CvFormat } from './cv.model';

/**
 * Publie le format France (`/fr`, `/fr/en`) à côté du format suisse, servi à la racine. Seul
 * réglage à changer pour le rouvrir : à `true`, le build prérend ses pages, les `hreflang` les
 * citent, `npm run pdf` imprime leurs PDF, et le `Caddyfile` cesse de rediriger `/fr` (il ne
 * redirige que les chemins sans page prérendue). Seul `public/sitemap.xml` se met à jour à la
 * main : `seo-files.spec.ts` échoue tant qu'il ne suit pas ce réglage.
 */
export const FRANCE_FORMAT_PUBLISHED = false;

export const PUBLISHED_FORMATS: readonly CvFormat[] = FRANCE_FORMAT_PUBLISHED
  ? ['ch', 'fr']
  : ['ch'];

/** Formats publiés ; les tests le remplacent pour couvrir les deux états du réglage. */
export const CV_FORMATS = new InjectionToken<readonly CvFormat[]>('CV_FORMATS', {
  providedIn: 'root',
  factory: () => PUBLISHED_FORMATS,
});
