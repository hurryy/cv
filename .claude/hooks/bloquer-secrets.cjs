// Hook PreToolUse (Bash, PowerShell) : refuse toute commande shell qui cite un fichier
// pouvant contenir des secrets, ou qui affiche les variables d'environnement.
// settings.json refuse déjà Read et Edit sur ces fichiers ; ce hook ferme la porte du shell,
// que permissions.deny ne couvre pas.
// C'est un garde-fou contre la fuite accidentelle, pas une barrière : un shell reste
// contournable (globs comme `.e*`, recherche récursive qui imprime le contenu sans nommer le
// fichier, concaténation). Les limites connues sont dans CLAUDE.md, « Secrets ».
// Code de sortie 2 = commande refusée, le message part à Claude. Toute autre sortie laisse
// passer la commande : d'où l'échec fermé sur une entrée illisible, et le chemin absolu de
// Node dans settings.json (le `node` du PATH de Git Bash est un faux paquet npm).

// Gabarits versionnés, sans secret : on les retire de la commande avant le contrôle pour
// que `.env.prod.example` ou `nestjs/example._env` restent éditables.
const GABARITS = [/\.env\.[\w.-]*\.example\b/gi, /\bexample\._env\b/gi];

const ENVIRONNEMENT = "affichage des variables d'environnement";

const MOTIFS = [
  [/(?<![\w.-])\.env(?![\w-])/i, '.env*'],
  [/\.pem\b/i, '*.pem'],
  [/\bdeploy_cv/i, 'clé de déploiement deploy_cv'],
  [/\bid_(rsa|ed25519|ecdsa|dsa)\b/i, 'clé SSH privée'],
  [/(^|[\s"'/\\~])\.ssh([/\\]|["'\s]|$)/i, '.ssh/'],
  [/\.git-credentials/i, '.git-credentials'],
  [/\.npmrc/i, '.npmrc'],
  [/secrets\.json/i, 'secrets.json'],
  [/\.vscode[/\\]settings\.json/i, '.vscode/settings.json'],
  [/Code[/\\]User[/\\]/i, 'réglages utilisateur de VS Code'],
  // `config -q` valide le fichier sans rien afficher : il reste permis.
  [/\bdocker[ -]compose\b[^;&|\n"']*\sconfig(?!\S)(?![^;&|\n]*\s(-q|--quiet)\b)/i, 'docker compose config (affiche les secrets interpolés)'],
  [/\bdocker\s+(container\s+)?inspect\b(?![^;&|\n]*\s(-f|--format)\b)/i, 'docker inspect sans --format (affiche Env)'],
  [/\bprintenv\b/i, ENVIRONNEMENT],
  [/(^|[;&|]\s*|\bexec\s+(-\S+\s+)*\S+\s+)(env|set)\s*($|[;&|])/i, ENVIRONNEMENT],
  [/\b(Get-ChildItem|gci|ls|dir|Get-Item|gi)\s+(-Path\s+)?env:/i, ENVIRONNEMENT],
  [/GetEnvironmentVariables?\s*\(/i, ENVIRONNEMENT],
  [/\b(process\.env|os\.environ)\s*($|[)\];,}])/, ENVIRONNEMENT],
  [/[/\\]environ\b/i, ENVIRONNEMENT],
];

function motifsTrouves(commande) {
  const nettoyee = GABARITS.reduce((texte, gabarit) => texte.replace(gabarit, ''), commande);
  return [...new Set(MOTIFS.filter(([motif]) => motif.test(nettoyee)).map(([, nom]) => nom))];
}

function refuser(raison) {
  process.stderr.write(
    `Commande refusée par .claude/hooks/bloquer-secrets.cjs : ${raison}. ` +
      'Ces fichiers peuvent contenir des secrets et ne se lisent pas (CLAUDE.md, « Secrets »). ' +
      "Ne pas contourner ce blocage. Si l'accès est nécessaire, s'arrêter et demander à l'utilisateur.",
  );
  process.exit(2);
}

module.exports = { motifsTrouves };

if (require.main === module) {
  let entree = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (morceau) => (entree += morceau));
  process.stdin.on('end', () => {
    let saisie;
    try {
      saisie = JSON.parse(entree).tool_input;
    } catch {
      refuser("entrée du hook illisible, le contrôle n'a pas pu se faire");
    }
    const commande = typeof saisie?.command === 'string' ? saisie.command : JSON.stringify(saisie ?? '');
    const trouves = motifsTrouves(commande);
    if (trouves.length) {
      refuser(`elle cite ${trouves.join(', ')}`);
    }
    process.exit(0);
  });
}
