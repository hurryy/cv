// Imprime en PDF chaque page prérendue du CV, par Chromium headless. À lancer après
// `npm run build` (`npm run pdf`) ; le Dockerfile le fait dans son étape `pdf`.
//
// Sans dépendance npm : un serveur `http` local sert `dist/cv/browser` comme le Caddyfile de
// l'image (un chemin de dossier rend son `index.html`), puis le binaire Chromium imprime chaque
// page. Le nom de chaque PDF est lu dans le lien « Télécharger le PDF » de la page prérendue
// (`pdfPath`, `src/app/cv/ui-text.ts`) : le fichier écrit est celui que le lien désigne.
//
// Variables : CHROMIUM_BIN (binaire, `/usr/bin/chromium` par défaut, celui du paquet Debian),
// PDF_NO_SANDBOX=1 (voir `chromiumArgs`).
//
// Code de sortie ≠ 0 si un PDF manque, est vide ou dépasse sa limite de pages (`MAX_PAGES`).

import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist/cv/browser');
/** Pages prérendues ; alignées sur `app.routes.ts`, chaque format ayant sa limite `MAX_PAGES`. */
const PAGES = ['/ch', '/ch/en', '/fr', '/fr/en'];
/**
 * Pages au plus, par format (premier segment de la route) : un CV français tient sur une page,
 * un CV suisse, plus détaillé, sur deux. Un dépassement fait échouer le build de l'image.
 */
const MAX_PAGES = { ch: 2, fr: 1 };
const CHROMIUM = process.env.CHROMIUM_BIN || '/usr/bin/chromium';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const isFile = async (path) => (await stat(path).catch(() => null))?.isFile() ?? false;

/** Fichier servi pour un chemin d'URL : le fichier, sinon `<chemin>/index.html`, sinon rien. */
const resolveFile = async (urlPath) => {
  const relative = normalize(decodeURIComponent(urlPath)).replace(/^[/\\]+/, '');
  const file = join(ROOT, relative);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    return null;
  }
  for (const candidate of [file, join(file, 'index.html')]) {
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  return null;
};

const serve = () =>
  new Promise((done) => {
    const server = createServer(async (request, response) => {
      // Une requête qui échoue (URL mal encodée, lecture impossible) répond une erreur sans
      // arrêter le lot : une promesse rejetée non traitée terminerait le processus.
      try {
        const file = await resolveFile(new URL(request.url ?? '/', 'http://localhost').pathname);
        if (!file) {
          response.writeHead(404).end();
          return;
        }
        const body = await readFile(file);
        response.writeHead(200, {
          'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
        });
        response.end(body);
      } catch {
        response.writeHead(500).end();
      }
    });
    server.listen(0, '127.0.0.1', () => done(server));
  });

/** Chemin public du PDF, lu dans le lien de téléchargement de la page prérendue. */
const pdfPathOf = async (page) => {
  const html = await readFile(join(ROOT, page, 'index.html'), 'utf8');
  const hrefs = [...html.matchAll(/href="(\/pdf\/[^"]+\.pdf)"/g)].map((match) => match[1]);
  if (hrefs.length !== 1) {
    throw new Error(`${page} : ${hrefs.length} lien(s) /pdf/…pdf trouvé(s), 1 attendu`);
  }
  return hrefs[0];
};

const chromiumArgs = (url, output) => [
  '--headless',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  // /dev/shm d'un conteneur de build fait 64 Mo : Chromium y manque de place.
  '--disable-dev-shm-usage',
  // Dans un conteneur Docker, le sandbox de Chromium ne démarre pas : refusé en root, et en
  // utilisateur faute d'espaces de noms utilisateur (« No usable sandbox »). La page imprimée
  // est le build de ce dépôt, servie en local, dans une étape de build jetable.
  ...(process.env.PDF_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
  '--no-pdf-header-footer',
  // Temps virtuel laissé au chargement et à l'hydratation avant l'impression.
  '--virtual-time-budget=10000',
  `--print-to-pdf=${output}`,
  url,
];

/** Pages d'un PDF de Chromium (Skia) : un objet `/Type /Page` par page, hors `/Pages`. */
const countPages = (pdf) =>
  (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;

const main = async () => {
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  let failed = false;
  try {
    for (const page of PAGES) {
      const pdfPath = await pdfPathOf(page);
      const output = join(ROOT, pdfPath);
      await mkdir(join(output, '..'), { recursive: true });
      await rm(output, { force: true });
      try {
        await run(CHROMIUM, chromiumArgs(origin + page, output), { timeout: 120_000 });
      } catch (error) {
        const cause = `${error.killed ? 'délai dépassé, ' : ''}${error.signal ?? error.code ?? ''}`;
        console.error(`${page} : Chromium a échoué (${cause})\n${error.stderr || error.message}`);
      }
      const pdf = await readFile(output).catch(() => null);
      if (!pdf?.length) {
        console.error(`ERREUR ${page} → ${pdfPath} : PDF absent ou vide`);
        failed = true;
        continue;
      }
      const pages = countPages(pdf);
      console.log(`${page} → ${pdfPath} : ${pages} page(s), ${pdf.length} octets`);
      const max = MAX_PAGES[page.split('/')[1]];
      if (max === undefined) {
        console.error(`ERREUR ${page} : format sans limite de pages dans MAX_PAGES`);
        failed = true;
      } else if (pages > max) {
        console.error(`ERREUR ${pdfPath} : ${pages} pages, ${max} au plus`);
        failed = true;
      }
    }
  } finally {
    server.close();
  }
  if (failed) {
    process.exitCode = 1;
  }
};

await main();
