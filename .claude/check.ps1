# Contrôle complet du CV : build, lint, tests. Rend un tableau court ; le détail de chaque
# commande va dans un journal de %TEMP%, à ne lire que pour une ligne en échec.
#
#   powershell -NoProfile -File .claude/check.ps1
#
# Code de sortie : 0 si tout passe, 1 sinon.

param(
  [switch]$SansBuild,
  [switch]$SansTests
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# Un paquet npm global `node` masque le vrai Node sur ce poste.
$env:Path = 'C:\nvm4w\nodejs;' + $env:Path
$racine = Split-Path -Parent $PSScriptRoot
$resultats = New-Object System.Collections.Generic.List[object]

function Invoke-Controle([string]$nom, [string]$commande, [scriptblock]$resume) {
  $journal = Join-Path $env:TEMP "check-cv-$nom.log"
  Push-Location $racine
  try {
    cmd /c "$commande > `"$journal`" 2>&1"
    $code = $LASTEXITCODE
  } finally {
    Pop-Location
  }
  $texte = Get-Content -LiteralPath $journal -Raw -Encoding UTF8
  if ($null -eq $texte) { $texte = '' }
  # Vitest colore sa sortie même redirigée.
  $texte = $texte -replace "\x1b\[[0-9;]*m", ''
  $detail = & $resume $texte
  $resultats.Add([pscustomobject]@{ Controle = $nom; Code = $code; Detail = $detail; Journal = $journal })
}

$rien = { param($t) '' }

if (-not $SansBuild) { Invoke-Controle 'build' 'npm run build' $rien }
Invoke-Controle 'lint' 'npm run lint' { param($t) if ($t -match 'All files pass linting') { 'All files pass linting' } else { 'voir le journal' } }
# ng lint sort en 0 malgré des warnings ; la règle du projet est 0 warning.
$lint = $resultats[$resultats.Count - 1]
if ($lint.Code -eq 0 -and $lint.Detail -ne 'All files pass linting') { $lint.Code = 1 }
if (-not $SansTests) {
  Invoke-Controle 'test' 'npm test -- --watch=false' { param($t) ([regex]::Matches($t, '(?m)^\s*(Test Files|Tests)\s+.*$') | ForEach-Object { ($_.Value -replace '\s+', ' ').Trim() }) -join ' | ' }
}

$resultats | Format-Table Controle, Code, Detail -AutoSize -Wrap | Out-String -Width 160 | Write-Output
$echecs = @($resultats | Where-Object { $_.Code -ne 0 })
if ($echecs.Count) {
  Write-Output "KO : $($echecs.Count) contrôle(s) en échec. Journaux :"
  $echecs | ForEach-Object { Write-Output "  $($_.Journal)" }
  exit 1
}
Write-Output 'OK : tous les contrôles passent.'
exit 0
