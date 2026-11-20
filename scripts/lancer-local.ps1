# Lance le CV en local et ouvre le navigateur.
#
#   powershell -ExecutionPolicy Bypass -File scripts\lancer-local.ps1           # ng serve, port 4201
#   powershell -ExecutionPolicy Bypass -File scripts\lancer-local.ps1 -Docker   # image de prod, port 8090
#
# ng serve : rechargement a chaud, mais ni PDF ni redirections Caddy (/ch, /fr).
# -Docker : construit l'image comme en production (prerendu, PDF, Caddy) ; Ctrl+C arrete.
# Texte en ASCII : Windows PowerShell 5.1 lit un .ps1 sans BOM dans la page de code ANSI.

param(
  [switch]$Docker,
  [int]$Port = 0
)

$ErrorActionPreference = 'Stop'
$racine = Split-Path -Parent $PSScriptRoot
Set-Location $racine

if ($Docker) {
  if (-not $Port) { $Port = 8090 }
  docker build -t cv:local .
  if ($LASTEXITCODE) { Write-Host 'Build de l image en echec.' -ForegroundColor Red; exit 1 }
  Write-Host "CV sur http://localhost:$Port (Ctrl+C pour arreter)." -ForegroundColor Green
  Start-Process "http://localhost:$Port"
  docker run --rm -p "${Port}:8080" cv:local
  exit $LASTEXITCODE
}

# 4201 et non 4200 : le front d'app-shop peut tourner en meme temps.
if (-not $Port) { $Port = 4201 }
# Un paquet npm global nomme `node` masque le vrai Node : le vrai passe devant dans le PATH.
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
if (-not (Test-Path node_modules)) {
  npm ci
  if ($LASTEXITCODE) { Write-Host 'npm ci en echec.' -ForegroundColor Red; exit 1 }
}
npx ng serve --port $Port --open
