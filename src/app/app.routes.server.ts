import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // En sortie statique, une redirection prérendue devient une page `en/index.html` à
  // meta refresh ; Caddy redirige `/en` en 301, cette page ne servirait jamais.
  {
    path: 'en',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
