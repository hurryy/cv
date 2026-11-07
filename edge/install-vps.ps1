<#
Installation d'un VPS Ubuntu neuf pour le CV, pilotée depuis le PC (Windows PowerShell 5.1).

Usage, depuis la racine du dépôt cv :
  powershell -NoProfile -File edge\install-vps.ps1 -Ip 51.83.79.249
      [-Domain yannhurry.fr]
      [-PersonalKey $env:USERPROFILE\.ssh\id_rsa.pub]
      [-DeployKey $env:USERPROFILE\.ssh\deploy_cv]
      [-From <n>]

Étapes (reprise au milieu par -From <n>) :
   1. prérequis du PC (ssh, scp, ssh-keygen, curl.exe, fichiers) ;
   2. clé de déploiement deploy_cv, créée si absente ;
   3. connexion `ubuntu` par clé, sinon première connexion interactive et envoi de la clé perso ;
   4. envoi de bootstrap-vps.sh et lancement dans une session tmux « bootstrap » du VPS ;
   5. contrôle des accès `ubuntu` et `deploy`, du durcissement SSH, du redémarrage ;
   6. DNS (A de la racine et de www, interrogés chez 8.8.8.8) : arrêt tant qu'il ne pointe pas ;
   7. /srv/edge : compose, Caddyfile, .env (mot de passe demandé, jamais écrit sur le PC),
      démarrage de Caddy, attente des certificats ; avec -From 7, contrôle DNS d'abord ;
   8. /srv/cv/.env s'il manque ;
   9. vérifications HTTP (401, HSTS, noindex, www 301, http 308) ;
  10. rappel des réglages GitHub, clé d'hôte et son empreinte.

Ne fait pas : les réglages GitHub (secrets, environment, ruleset, DEPLOY_ENABLED), le DNS chez
OVH, la publication ni le déploiement. Voir docs/VPS.md.

Le mot de passe de pré-ouverture voyage dans l'entrée standard de ssh, encodé en base64 dans
le script envoyé au VPS : jamais en argument (visible dans la liste des processus), jamais
dans un fichier du PC. Seul son hash bcrypt est écrit, dans /srv/edge/.env, en 600.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Ip,

    [string]$Domain = 'yannhurry.fr',

    [string]$PersonalKey = (Join-Path $env:USERPROFILE '.ssh\id_rsa.pub'),

    [string]$DeployKey = (Join-Path $env:USERPROFILE '.ssh\deploy_cv'),

    [ValidateRange(1, 10)]
    [int]$From = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$LastStep = 10
$EdgeDir = $PSScriptRoot
$Bootstrap = Join-Path $EdgeDir 'bootstrap-vps.sh'
$EdgeCompose = Join-Path $EdgeDir 'docker-compose.yml'
$EdgeCaddyfile = Join-Path $EdgeDir 'conf\Caddyfile'
$DocPath = 'docs\VPS.md'
$script:CurrentStep = $From
$script:Failures = 0

# Une clé publique passe en argument de ssh, entre apostrophes elles-mêmes prises dans des
# guillemets que lit le shell du VPS : `$`, accent grave et antislash y seraient interprétés.
# Le commentaire de la clé est donc limité à des caractères sans effet pour le shell.
$PublicKeyPattern = '^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)) [A-Za-z0-9+/]+=*( [A-Za-z0-9@._+:-]+)?$'

# --- affichage et contrôle --------------------------------------------------------------

function Write-Step([int]$Number, [string]$Title) {
    $script:CurrentStep = $Number
    Write-Host ''
    Write-Host ("=== Étape {0}/{1} : {2} ===" -f $Number, $LastStep, $Title) -ForegroundColor Cyan
}

function Write-Info([string]$Message) { Write-Host "  $Message" }
function Write-Ok([string]$Message) { Write-Host "  OK   $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "  !!   $Message" -ForegroundColor Yellow }
function Write-Ko([string]$Message) {
    $script:Failures++
    Write-Host "  KO   $Message" -ForegroundColor Red
}

function Confirm-Continue([string]$Prompt = 'Entrée pour continuer, Q pour quitter') {
    $answer = Read-Host "  $Prompt"
    if ($answer -match '^\s*[qQ]') {
        throw (New-Object System.OperationCanceledException 'Arrêt demandé.')
    }
}

function Read-YesNo([string]$Question) {
    $answer = Read-Host "  $Question (O/n, Q pour quitter)"
    if ($answer -match '^\s*[qQ]') {
        throw (New-Object System.OperationCanceledException 'Arrêt demandé.')
    }
    return ($answer -notmatch '^\s*[nN]')
}

function Assert-ExitCode([string]$What) {
    if ($LASTEXITCODE -ne 0) {
        throw "$What : code de sortie $LASTEXITCODE."
    }
}

# Sous Windows PowerShell 5.1, rediriger la sortie d'erreur d'un exécutable natif avec
# $ErrorActionPreference = 'Stop' lève une exception à la première ligne écrite : la capture
# se fait donc en 'Continue'.
function Invoke-Capture([scriptblock]$Command) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $lines = & $Command 2>&1 | ForEach-Object { "$_" }
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previous
    }
    return [pscustomobject]@{ Code = $code; Text = (@($lines) -join "`n") }
}

function ConvertTo-Base64([string]$Value) {
    return [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Value))
}

function ConvertFrom-SecureToPlain([Security.SecureString]$Secure) {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

# --- ssh ------------------------------------------------------------------------------

$UbuntuTarget = "ubuntu@$Ip"
$DeployTarget = "deploy@$Ip"

function Get-UbuntuOptions {
    $options = @('-o', 'ConnectTimeout=15')
    $private = $PersonalKey -replace '\.pub$', ''
    if ($private -ne $PersonalKey -and (Test-Path -LiteralPath $private -PathType Leaf)) {
        $options += @('-i', $private)
    }
    return $options
}

function Get-DeployOptions {
    return @('-o', 'ConnectTimeout=15', '-o', 'IdentitiesOnly=yes', '-i', $DeployKey)
}

# Le script part par l'entrée standard. PowerShell 5.1 y ajoute des fins de ligne CRLF :
# le VPS les retire avant de l'exécuter. Le texte envoyé doit rester en ASCII
# ($OutputEncoding de PowerShell 5.1).
function Invoke-RemoteScript([string]$Target, [string[]]$Options, [string]$Body) {
    $Body | & ssh @Options -o BatchMode=yes $Target "tr -d '\r' | bash -s"
}

# Guillemet double à placer dans un argument d'exécutable natif. Windows PowerShell 5.1 le
# transmet sans l'échapper, et ssh.exe le retirerait : il faut l'écrire \". PowerShell 7.3 et
# plus l'échappent eux-mêmes, sauf en mode Legacy.
function Get-NativeQuote {
    $passing = Get-Variable -Name PSNativeCommandArgumentPassing -ValueOnly -ErrorAction SilentlyContinue
    if ($null -ne $passing -and "$passing" -ne 'Legacy') {
        return '"'
    }
    return '\"'
}

function Get-DeployPublicKey {
    $pubPath = "$DeployKey.pub"
    if (-not (Test-Path -LiteralPath $pubPath -PathType Leaf)) {
        throw "Clé publique de déploiement absente : $pubPath. Reprendre à l'étape 2."
    }
    $pub = (Get-Content -LiteralPath $pubPath -Raw).Trim()
    if ($pub -notmatch $PublicKeyPattern) {
        throw "Clé publique de déploiement illisible : $pubPath (attendu 'type base64 commentaire')."
    }
    return $pub
}

# --- étapes ---------------------------------------------------------------------------

function Invoke-Step1 {
    Write-Step 1 'Prérequis du PC'

    $parsed = $null
    if (-not [System.Net.IPAddress]::TryParse($Ip, [ref]$parsed) -or
        $parsed.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
        throw "Adresse IPv4 invalide : '$Ip' (sans chevrons, par exemple 51.83.79.249)."
    }
    if ($Domain -notmatch '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$') {
        throw "Domaine invalide : '$Domain' (sans www, sans https://)."
    }
    Write-Ok "VPS $Ip, domaine $Domain"

    foreach ($tool in 'ssh', 'scp', 'ssh-keygen', 'ssh-keyscan', 'curl.exe') {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "$tool introuvable. Installer le client OpenSSH de Windows (Paramètres > Applications > Fonctionnalités facultatives)."
        }
    }
    Write-Ok 'ssh, scp, ssh-keygen, ssh-keyscan, curl.exe'

    foreach ($file in $Bootstrap, $EdgeCompose, $EdgeCaddyfile) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
            throw "Fichier du dépôt absent : $file"
        }
    }
    Write-Ok 'bootstrap-vps.sh, docker-compose.yml, conf\Caddyfile'

    if (-not (Test-Path -LiteralPath $PersonalKey -PathType Leaf)) {
        throw "Clé publique perso absente : $PersonalKey. La créer (ssh-keygen) ou passer -PersonalKey."
    }
    Write-Ok "clé perso : $PersonalKey"

    if (Test-Path -LiteralPath $DeployKey -PathType Leaf) {
        Write-Ok "clé de déploiement : $DeployKey"
    } else {
        Write-Info "Clé de déploiement absente ($DeployKey) : l'étape 2 la crée."
    }
}

function Invoke-Step2 {
    Write-Step 2 'Clé de déploiement'

    $hasPrivate = Test-Path -LiteralPath $DeployKey -PathType Leaf
    $hasPublic = Test-Path -LiteralPath "$DeployKey.pub" -PathType Leaf
    if ($hasPrivate -and $hasPublic) {
        Write-Ok 'déjà présente, conservée.'
    } elseif ($hasPrivate -or $hasPublic) {
        throw "Paire incomplète : $DeployKey et $DeployKey.pub doivent exister ensemble. Supprimer celui qui reste, puis reprendre à l'étape 2."
    } else {
        Write-Info 'Création de la clé ed25519. Passphrase : Entrée deux fois (GitHub Actions ne peut pas en saisir).'
        $dir = Split-Path -Parent $DeployKey
        if (-not (Test-Path -LiteralPath $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }
        & ssh-keygen -t ed25519 -f $DeployKey -C deploy@github
        Assert-ExitCode 'ssh-keygen'
        Write-Warn 'Nouvelle clé : mettre à jour le secret GitHub SSH_KEY (docs/VPS.md § 3.3).'
    }

    $null = Get-DeployPublicKey
    Write-Ok "$DeployKey.pub lisible"
}

function Invoke-Step3 {
    Write-Step 3 "Connexion par clé en ubuntu"
    $options = Get-UbuntuOptions

    while ($true) {
        $probe = Invoke-Capture { & ssh @options -o BatchMode=yes $UbuntuTarget true }
        if ($probe.Code -eq 0) {
            Write-Ok "ssh $UbuntuTarget sans mot de passe."
            return
        }

        $text = $probe.Text
        if ($text -match 'IDENTIFICATION HAS CHANGED') {
            Write-Warn "La clé d'hôte du VPS a changé (réinstallation ?)."
            Write-Info "Vérifier ensuite l'empreinte dans la console KVM d'OVH, connecté en ubuntu :"
            Write-Info '  ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub'
            if (Read-YesNo "Retirer l'ancienne clé ($Ip) du known_hosts du PC ?") {
                & ssh-keygen -R $Ip
                Assert-ExitCode 'ssh-keygen -R'
            }
            continue
        }

        if ($text -match 'Host key verification failed') {
            Write-Info "Le PC ne connaît pas encore ce VPS. La connexion interactive va afficher son empreinte et demander yes/no."
            Write-Info "Comparer avec la console KVM d'OVH : ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub"
        } elseif ($text -match 'Permission denied|Password change required') {
            Write-Info 'Le VPS refuse la clé perso : première connexion, ou clé pas encore envoyée.'
        } else {
            Write-Warn 'Connexion impossible :'
            Write-Info $text
            Write-Info 'Vérifier l''IP, que le VPS a fini de s''installer chez OVH, puis réessayer.'
            Confirm-Continue 'Entrée pour réessayer, Q pour quitter'
            continue
        }

        Write-Info 'Première connexion interactive : saisir le mot de passe du mail OVH ; si Ubuntu exige'
        Write-Info 'de le changer, redonner l''ancien puis le nouveau deux fois. La session se ferme'
        Write-Info 'ensuite d''elle-même ; si un shell s''ouvre, taper exit.'
        if (Read-YesNo "Lancer ssh $UbuntuTarget maintenant ?") {
            & ssh @options $UbuntuTarget
            # Le code de sortie d'une session interactive ne dit rien d'utile : le changement de
            # mot de passe ferme la session avec un code non nul.
        }

        # La clé peut être déjà autorisée (refus dû au seul changement de mot de passe exigé) :
        # la renvoyer la dupliquerait dans authorized_keys.
        $again = Invoke-Capture { & ssh @options -o BatchMode=yes $UbuntuTarget true }
        if ($again.Code -eq 0) {
            Write-Ok "ssh $UbuntuTarget sans mot de passe : clé perso déjà autorisée, rien à envoyer."
            return
        }

        Write-Info "Envoi de la clé perso ($PersonalKey) dans ~/.ssh/authorized_keys de ubuntu."
        Write-Info 'Le mot de passe (nouveau) est demandé une dernière fois.'
        if (Read-YesNo 'Envoyer la clé perso maintenant ?') {
            Get-Content -LiteralPath $PersonalKey -Raw |
                & ssh @options $UbuntuTarget "mkdir -p ~/.ssh && chmod 700 ~/.ssh && tr -d '\r' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
            Assert-ExitCode 'Envoi de la clé perso'
        }
    }
}

function Invoke-Step4 {
    Write-Step 4 'bootstrap-vps.sh'
    $options = Get-UbuntuOptions
    $pub = Get-DeployPublicKey

    Write-Info 'Le script installe Docker, ufw, fail2ban, crée deploy, /srv/edge, /srv/cv, et coupe'
    Write-Info 'root et les mots de passe SSH. Il dure plusieurs minutes (apt-get upgrade).'
    Write-Warn "Ouvrir MAINTENANT un second terminal PowerShell et y laisser une session ouverte :"
    Write-Info "  ssh $UbuntuTarget"
    Write-Info "Elle permet de corriger si l'accès par clé échoue après le durcissement. La fermer"
    Write-Info "seulement quand l'étape 5 est passée."
    Write-Info 'Le script tourne dans une session tmux « bootstrap » du VPS : une coupure réseau ne'
    Write-Info 'l''interrompt pas. Après une coupure :'
    Write-Info "  ssh -t $UbuntuTarget `"tmux attach -t bootstrap`""
    Write-Info 'Si une ancienne session « bootstrap » existe, tmux s''y rattache au lieu de relancer le'
    Write-Info 'script : la fermer (exit) puis reprendre avec -From 4.'
    Confirm-Continue

    & scp @options $Bootstrap "${UbuntuTarget}:"
    Assert-ExitCode 'scp de bootstrap-vps.sh'
    Write-Ok 'bootstrap-vps.sh envoyé dans /home/ubuntu.'

    # La session tmux se ferme avec le script : la pause finale garde sa sortie lisible.
    $inner = "sudo bash bootstrap-vps.sh '$pub'; printf '\nFin de bootstrap-vps.sh. Entree pour fermer tmux. '; read -r _"
    & ssh -t @options $UbuntuTarget ("tmux new -A -s bootstrap {0}{1}{0}" -f (Get-NativeQuote), $inner)
    $code = $LASTEXITCODE
    # Le code de sortie de tmux n'est pas celui de bootstrap-vps.sh : l'étape 5 tranche, par
    # sshd -T et les connexions par clé.
    if ($code -eq 127) {
        throw 'tmux absent du VPS : sudo apt-get install -y tmux en ubuntu, puis reprendre avec -From 4.'
    }
    if ($code -ne 0) {
        Write-Warn "ssh a rendu le code $code (coupure ?). Le script continue peut-être dans tmux :"
        Write-Info "  ssh -t $UbuntuTarget `"tmux attach -t bootstrap`""
        Write-Info 'S''il n''y tourne plus et qu''apt signale dpkg interrompu : sudo dpkg --configure -a'
        Write-Info 'en ubuntu, puis reprendre avec -From 4. Voir docs/VPS.md § 8.'
        Confirm-Continue 'Entrée quand bootstrap-vps.sh est terminé, Q pour quitter'
    }

    Write-Info 'Attendu en fin de sortie : « SSH durci : root et mots de passe refusés ». Sinon le'
    Write-Info 'script a dit pourquoi ; corriger puis reprendre avec -From 4. L''étape 5 le contrôle.'
    # Un détachement de tmux (Ctrl+B d) rend aussi 0 alors que le script tourne encore.
    Confirm-Continue 'Entrée quand bootstrap-vps.sh est terminé et la session tmux fermée, Q pour quitter'
}

function Get-BootId([string[]]$Options) {
    $result = Invoke-Capture { & ssh @Options -o BatchMode=yes $UbuntuTarget 'cat /proc/sys/kernel/random/boot_id' }
    if ($result.Code -eq 0 -and $result.Text -match '(?m)^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*$') {
        return $Matches[1]
    }
    return $null
}

# Code de sortie distinctif d'un échec d'apt-get : reboot qui coupe la session fait rendre à
# ssh 255 (ou 0), jamais celui-ci.
$AptFailedCode = 42
$RebootWaitSeconds = 240

function Restart-Vps([string[]]$Options) {
    $before = Get-BootId $Options
    if (-not $before) {
        throw 'Lecture de /proc/sys/kernel/random/boot_id impossible : redémarrage non lancé.'
    }

    & ssh -t @Options $UbuntuTarget "sudo apt-get update && sudo apt-get upgrade -y || exit $AptFailedCode; sudo reboot"
    if ($LASTEXITCODE -eq $AptFailedCode) {
        throw 'apt-get update ou upgrade a échoué : VPS non redémarré. Lire la sortie ci-dessus, corriger, reprendre avec -From 5.'
    }

    $limit = $RebootWaitSeconds
    Write-Info "Attente du retour du VPS ($limit secondes au plus)..."
    $clock = [Diagnostics.Stopwatch]::StartNew()
    Start-Sleep -Seconds 20
    $after = $null
    while ($clock.Elapsed.TotalSeconds -lt $limit) {
        $after = Get-BootId $Options
        if ($after -and $after -ne $before) { break }
        Start-Sleep -Seconds 10
    }
    if (-not $after) {
        throw "Le VPS ne répond pas $limit secondes après la demande de redémarrage. Vérifier dans la console KVM d'OVH, puis reprendre avec -From 5."
    }
    if ($after -eq $before) {
        throw "Le VPS répond mais n'a pas redémarré (boot_id inchangé). Lire la sortie de sudo reboot ci-dessus, redémarrer à la main, puis reprendre avec -From 5."
    }
    Write-Ok "VPS redémarré (boot_id $before -> $after)."
}

function Invoke-Step5 {
    Write-Step 5 'Contrôle des accès'
    $ubuntu = Get-UbuntuOptions
    $deploy = Get-DeployOptions

    $echo = Invoke-Capture { & ssh @ubuntu -o BatchMode=yes $UbuntuTarget 'echo ok' }
    if ($echo.Code -ne 0 -or $echo.Text -notmatch '(^|\n)ok$') {
        throw "ssh $UbuntuTarget échoue ($($echo.Text)). Ne pas fermer la session du second terminal ; voir docs/VPS.md § 8."
    }
    Write-Ok "ubuntu : connexion par clé."

    $docker = Invoke-Capture { & ssh @deploy -o BatchMode=yes $DeployTarget 'docker ps' }
    if ($docker.Code -ne 0) {
        throw "ssh $DeployTarget 'docker ps' échoue ($($docker.Text)). Ne pas fermer la session du second terminal."
    }
    Write-Ok 'deploy : connexion par la clé de déploiement, docker accessible.'

    $sshd = Invoke-Capture {
        & ssh @ubuntu -o BatchMode=yes $UbuntuTarget "sudo -n sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication) '"
    }
    if ($sshd.Text -match '(?im)^permitrootlogin no$' -and $sshd.Text -match '(?im)^passwordauthentication no$') {
        Write-Ok 'SSH durci : root et mots de passe refusés.'
    } else {
        Write-Ko "SSH non durci, ou état illisible : $($sshd.Text)"
        Write-Info 'Relire la fin de la sortie de bootstrap-vps.sh, corriger, reprendre avec -From 4.'
        Confirm-Continue 'Entrée pour continuer quand même, Q pour quitter'
    }

    # test -f rend 1 quand le fichier manque ; tout autre code (255 : ssh) est une erreur.
    $reboot = Invoke-Capture { & ssh @ubuntu -o BatchMode=yes $UbuntuTarget 'test -f /var/run/reboot-required' }
    if ($reboot.Code -eq 1) {
        Write-Ok 'Aucun redémarrage en attente.'
    } elseif ($reboot.Code -ne 0) {
        throw "Test de /var/run/reboot-required impossible (code $($reboot.Code)) : $($reboot.Text)"
    } else {
        Write-Warn 'Le VPS demande un redémarrage (System restart required).'
        if (Read-YesNo 'Mettre à jour et redémarrer maintenant ?') {
            Restart-Vps $ubuntu
        }
    }

    Write-Info 'La session du second terminal peut être fermée.'
}

$script:DnsServer = @{ Server = '8.8.8.8' }

function Get-DnsAddresses([string]$Name, [string]$Type) {
    $server = $script:DnsServer
    try {
        $records = Resolve-DnsName -Name $Name -Type $Type -DnsOnly -ErrorAction Stop @server
    } catch {
        return @()
    }
    return @($records | Where-Object { $_.Type -eq $Type } | ForEach-Object { $_.IPAddress })
}

# Certains réseaux (entreprise) bloquent les résolveurs publics : le résolveur du système
# prend alors le relais, au prix de son cache.
function Select-DnsServer {
    try {
        $null = Resolve-DnsName -Name 'dns.google' -Type A -Server 8.8.8.8 -DnsOnly -QuickTimeout -ErrorAction Stop
        $script:DnsServer = @{ Server = '8.8.8.8' }
        Write-Info 'Résolveur interrogé : 8.8.8.8.'
    } catch {
        $script:DnsServer = @{}
        Write-Warn '8.8.8.8 injoignable depuis ce réseau : résolveur du système, dont le cache peut retarder la mise à jour.'
    }
}

# Vrai si la racine et www ne répondent, en A, que l'IP du VPS. L'AAAA n'est pas exigée.
function Test-DnsPointsToVps {
    $ok = $true
    foreach ($name in $Domain, "www.$Domain") {
        $found = @(Get-DnsAddresses $name 'A')
        if ($found.Count -gt 0 -and @($found | Where-Object { $_ -ne $Ip }).Count -eq 0) {
            Write-Ok "$name -> $($found -join ', ')"
        } else {
            $shown = if ($found.Count -gt 0) { $found -join ', ' } else { 'aucune réponse' }
            Write-Warn "$name -> $shown (attendu $Ip)"
            $ok = $false
        }
    }
    return $ok
}

function Invoke-Step6 {
    Write-Step 6 'DNS'
    Write-Info "Zone DNS OVH attendue : A de la racine sur $Ip, www en CNAME vers $Domain."
    Write-Info "(supprimer le TXT '3|welcome' de www, ne pas toucher MX/SRV/autoconfig/autodiscover)."
    Write-Info "Caddy ne doit pas démarrer avant : Let's Encrypt n'accepte que 5 échecs par heure et par nom."

    Select-DnsServer
    while ($true) {
        if (Test-DnsPointsToVps) { break }
        Write-Info 'Corriger la zone chez OVH, ou attendre la propagation (TTL).'
        Confirm-Continue 'Entrée pour revérifier, Q pour quitter'
    }

    $aaaa = @(Get-DnsAddresses $Domain 'AAAA')
    if ($aaaa.Count -gt 0) {
        $ubuntu = Get-UbuntuOptions
        $v6 = Invoke-Capture { & ssh @ubuntu -o BatchMode=yes $UbuntuTarget 'ip -6 -o addr show scope global' }
        $missing = @($aaaa | Where-Object { $v6.Text -notmatch [regex]::Escape($_) })
        if ($missing.Count -eq 0) {
            Write-Ok "AAAA $($aaaa -join ', ') présente sur le VPS."
        } else {
            Write-Warn "AAAA $($missing -join ', ') absente du VPS : Let's Encrypt essaiera l'IPv6 et échouera."
            Write-Info 'Retirer l''AAAA chez OVH ou corriger l''IPv6 du VPS avant de continuer.'
            Confirm-Continue
        }
    } else {
        Write-Info 'Pas d''AAAA : IPv4 seulement.'
    }
}

$EdgeEnvTemplate = @'
set -euo pipefail
cd /srv/edge
if [ -e .env ]; then
  echo '/srv/edge/.env already exists: left untouched.' >&2
  exit 3
fi
b64d() { printf '%s' "$1" | base64 -d; }
email=$(b64d '__EMAIL__')
domain=$(b64d '__DOMAIN__')
user=$(b64d '__USER__')
hash=$({ b64d '__PASSWORD__'; echo; } | docker run --rm -i caddy:2-alpine caddy hash-password)
case "$hash" in
  '$2'*) ;;
  *) echo 'caddy hash-password returned no bcrypt hash.' >&2; exit 4 ;;
esac
umask 077
tmp=$(mktemp .env.XXXXXX)
trap 'rm -f "$tmp"' EXIT
printf 'ACME_EMAIL=%s\nCV_DOMAIN=%s\nPREVIEW_USER=%s\nPREVIEW_HASH=%s\n' \
  "$email" "$domain" "$user" "${hash//\$/\$\$}" > "$tmp"
chmod 600 "$tmp"
mv "$tmp" .env
trap - EXIT
echo '/srv/edge/.env written (mode 600).'
exit 0
'@

function New-EdgeEnv {
    $deploy = Get-DeployOptions

    Write-Info '/srv/edge/.env absent : création. Le mot de passe n''est ni affiché ni écrit sur le PC.'
    # Ni `$` (interprété par Compose), ni apostrophe, guillemet, accent grave ou antislash.
    while ($true) {
        $email = (Read-Host '  ACME_EMAIL (contact Let''s Encrypt)').Trim()
        if ($email -match '^[^@\s$''"`\\]+@[^@\s$''"`\\]+\.[^@\s$''"`\\]+$') { break }
        Write-Warn 'Adresse invalide.'
    }
    while ($true) {
        $user = (Read-Host '  PREVIEW_USER (identifiant de pré-ouverture)').Trim()
        if ($user -match '^[A-Za-z0-9._-]+$') { break }
        Write-Warn 'Lettres, chiffres, . _ - seulement.'
    }

    $plain = $null
    $confirm = $null
    $remote = $null
    try {
        while ($true) {
            $plain = ConvertFrom-SecureToPlain (Read-Host '  Mot de passe de pré-ouverture' -AsSecureString)
            $confirm = ConvertFrom-SecureToPlain (Read-Host '  Le même, pour confirmer' -AsSecureString)
            if ($plain.Length -eq 0) {
                Write-Warn 'Mot de passe vide.'
            } elseif ($plain -cne $confirm) {
                Write-Warn 'Les deux saisies diffèrent.'
            } else {
                break
            }
        }
        if ($plain.Length -lt 12) {
            Write-Warn 'Moins de 12 caractères.'
            Confirm-Continue 'Entrée pour le garder, Q pour quitter'
        }

        $remote = $EdgeEnvTemplate.Replace('__EMAIL__', (ConvertTo-Base64 $email))
        $remote = $remote.Replace('__DOMAIN__', (ConvertTo-Base64 $Domain))
        $remote = $remote.Replace('__USER__', (ConvertTo-Base64 $user))
        $remote = $remote.Replace('__PASSWORD__', (ConvertTo-Base64 $plain))
        Invoke-RemoteScript $DeployTarget $deploy $remote
        Assert-ExitCode 'Écriture de /srv/edge/.env'
    } finally {
        $plain = $null
        $confirm = $null
        $remote = $null
        Remove-Variable plain, confirm, remote -ErrorAction SilentlyContinue
        [GC]::Collect()
    }
    Write-Ok '/srv/edge/.env écrit (600).'
}

function Test-Https([string]$Url) {
    $result = Invoke-Capture { & curl.exe -s -o NUL --max-time 10 -w '%{http_code}' $Url }
    return ($result.Code -eq 0)
}

function Invoke-Step7 {
    Write-Step 7 'Caddy de bordure (/srv/edge)'
    $deploy = Get-DeployOptions

    if ($From -eq 7) {
        Write-Info "Reprise à l'étape 7 : contrôle du DNS avant de démarrer Caddy."
        Select-DnsServer
        if (-not (Test-DnsPointsToVps)) {
            $script:CurrentStep = 6
            throw "Le DNS ne pointe pas sur $Ip : Caddy n'est pas démarré (limite Let's Encrypt). Reprendre avec -From 6."
        }
    }

    & ssh @deploy -o BatchMode=yes $DeployTarget 'mkdir -p /srv/edge/conf && chmod 755 /srv/edge/conf'
    Assert-ExitCode 'Création de /srv/edge/conf'
    & scp @deploy $EdgeCompose "${DeployTarget}:/srv/edge/docker-compose.yml"
    Assert-ExitCode 'scp de docker-compose.yml'
    & scp @deploy $EdgeCaddyfile "${DeployTarget}:/srv/edge/conf/Caddyfile"
    Assert-ExitCode 'scp du Caddyfile'
    Write-Ok 'docker-compose.yml et conf/Caddyfile envoyés.'

    $envProbe = Invoke-Capture { & ssh @deploy -o BatchMode=yes $DeployTarget 'test -f /srv/edge/.env' }
    if ($envProbe.Code -eq 0) {
        Write-Ok '/srv/edge/.env présent, conservé.'
    } elseif ($envProbe.Code -eq 1) {
        New-EdgeEnv
    } else {
        throw "Test de /srv/edge/.env impossible : $($envProbe.Text)"
    }

    & ssh @deploy -o BatchMode=yes $DeployTarget 'cd /srv/edge && docker compose up -d < /dev/null'
    Assert-ExitCode 'docker compose up -d'
    Start-Sleep -Seconds 5
    # Un Caddyfile recopié sur un conteneur déjà lancé n'est lu qu'au reload.
    $reload = Invoke-Capture {
        & ssh @deploy -o BatchMode=yes $DeployTarget 'cd /srv/edge && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile'
    }
    if ($reload.Code -eq 0) {
        Write-Ok 'Caddy démarré, configuration rechargée.'
    } else {
        Write-Warn "Reload refusé : $($reload.Text)"
        Write-Info 'Si « permission denied » : chmod 755 /srv/edge/conf (fait plus haut), puis reprendre avec -From 7.'
    }

    Write-Info 'Attente des certificats Let''s Encrypt (2 minutes au plus)...'
    $ready = $false
    for ($i = 0; $i -lt 12; $i++) {
        if ((Test-Https "https://$Domain") -and (Test-Https "https://www.$Domain")) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 10
    }
    if ($ready) {
        Write-Ok "HTTPS valide sur $Domain et www.$Domain."
    } else {
        Write-Ko 'Certificats pas encore valides. Derniers journaux de Caddy :'
        & ssh @deploy -o BatchMode=yes $DeployTarget 'cd /srv/edge && docker compose logs --no-color --tail 30 caddy'
        Write-Info 'Chercher « certificate obtained successfully » ou l''erreur ACME ; docs/VPS.md § 8.'
        Write-Info 'Ne pas relancer en boucle : 5 échecs par heure et par nom chez Let''s Encrypt.'
        Confirm-Continue
    }
}

function Invoke-Step8 {
    Write-Step 8 'Dossier du CV (/srv/cv)'
    $deploy = Get-DeployOptions
    $probe = Invoke-Capture { & ssh @deploy -o BatchMode=yes $DeployTarget 'test -f /srv/cv/.env' }
    if ($probe.Code -eq 0) {
        Write-Ok '/srv/cv/.env présent, conservé.'
        return
    }
    if ($probe.Code -ne 1) {
        throw "Test de /srv/cv/.env impossible : $($probe.Text)"
    }
    & ssh @deploy -o BatchMode=yes $DeployTarget 'umask 077 && echo CV_TAG=latest > /srv/cv/.env && chmod 600 /srv/cv/.env'
    Assert-ExitCode 'Création de /srv/cv/.env'
    Write-Ok '/srv/cv/.env créé (CV_TAG=latest, 600).'
}

function Get-Head([string]$Url) {
    $result = Invoke-Capture { & curl.exe -sI --max-time 15 $Url }
    $status = 0
    $headers = @{}
    foreach ($line in ($result.Text -split "`n")) {
        if ($line -match '^HTTP/\S+\s+(\d{3})') {
            $status = [int]$Matches[1]
        } elseif ($line -match '^([A-Za-z0-9-]+):\s*(.*?)\s*$') {
            $headers[$Matches[1].ToLowerInvariant()] = $Matches[2]
        }
    }
    return [pscustomobject]@{ Code = $result.Code; Status = $status; Headers = $headers }
}

function Invoke-Step9 {
    Write-Step 9 'Vérifications HTTP'

    $root = Get-Head "https://$Domain"
    if ($root.Status -eq 401) {
        Write-Ok "https://$Domain : 401 (pré-ouverture)"
        if ($root.Headers.ContainsKey('x-robots-tag') -and $root.Headers['x-robots-tag'] -match 'noindex') {
            Write-Ok 'X-Robots-Tag : noindex'
        } else {
            Write-Ko 'X-Robots-Tag noindex absent'
        }
    } elseif ($root.Status -eq 200) {
        Write-Ok "https://$Domain : 200 (site ouvert au public)"
    } elseif ($root.Status -eq 502) {
        Write-Ko "https://$Domain : 502, le conteneur cv ne tourne pas encore : lancer Deploy (docs/VPS.md § 4)"
    } else {
        Write-Ko "https://$Domain : statut $($root.Status), curl $($root.Code)"
    }
    if ($root.Headers.ContainsKey('strict-transport-security')) {
        Write-Ok 'Strict-Transport-Security présent'
    } else {
        Write-Ko 'Strict-Transport-Security absent'
    }

    $www = Get-Head "https://www.$Domain"
    $location = if ($www.Headers.ContainsKey('location')) { $www.Headers['location'] } else { '' }
    if ($www.Status -eq 301 -and $location -like "https://$Domain/*") {
        Write-Ok "https://www.$Domain : 301 vers $location"
    } else {
        Write-Ko "https://www.$Domain : statut $($www.Status), location '$location' (attendu 301 vers https://$Domain/)"
    }

    $http = Get-Head "http://$Domain"
    if ($http.Status -eq 308) {
        Write-Ok "http://$Domain : 308 vers HTTPS"
    } else {
        Write-Ko "http://$Domain : statut $($http.Status) (attendu 308)"
    }
}

function Invoke-Step10 {
    Write-Step 10 'GitHub (à faire à la main)'
    Write-Info "Ce script ne touche pas GitHub. Suivre $DocPath § 3, avec ta session gh :"
    Write-Info '  - SSH_KNOWN_HOSTS à refaire après toute réinstallation (nouvelle clé d''hôte) ;'
    Write-Info '  - SSH_HOST si l''IP a changé ; SSH_KEY si la clé de déploiement a été recréée ;'
    Write-Info '  - environment production, ruleset, DEPLOY_PATH, DEPLOY_ENABLED si le dépôt est neuf.'
    Write-Info 'Clé d''hôte actuelle du VPS (valeur de SSH_KNOWN_HOSTS, empreinte à vérifier) :'
    $scan = Invoke-Capture { & ssh-keyscan -t ed25519 $Ip }
    $line = @($scan.Text -split "`n" | Where-Object { $_ -match '^\S+ ssh-ed25519 ' }) | Select-Object -First 1
    if ($line) {
        Write-Host "    $line"
        # ssh-keygen -lf ne lit ni l'entrée standard ni l'UTF-16 de PowerShell 5.1 : fichier ASCII
        # sans BOM.
        $tmp = [IO.Path]::GetTempFileName()
        try {
            [IO.File]::WriteAllText($tmp, "$($line.Trim())`n", [Text.Encoding]::ASCII)
            $fingerprint = Invoke-Capture { & ssh-keygen -lf $tmp }
        } finally {
            Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
        }
        if ($fingerprint.Code -eq 0) {
            Write-Info 'Empreinte :'
            Write-Host "    $($fingerprint.Text)"
            Write-Info 'La comparer à celle acceptée à la première connexion (étape 3, vérifiée dans la'
            Write-Info 'console KVM) avant d''enregistrer SSH_KNOWN_HOSTS.'
        } else {
            Write-Ko "ssh-keygen -lf : $($fingerprint.Text)"
        }
    } else {
        Write-Warn 'ssh-keyscan sans réponse.'
    }
    Write-Info "Puis mise en ligne : $DocPath § 4."
}

# --- déroulé --------------------------------------------------------------------------

function Get-ResumeCommand([int]$Step) {
    $command = "powershell -NoProfile -File edge\install-vps.ps1 -Ip $Ip"
    foreach ($name in 'Domain', 'PersonalKey', 'DeployKey') {
        if ($script:ScriptParameters.ContainsKey($name)) {
            $command += " -$name `"$($script:ScriptParameters[$name])`""
        }
    }
    return "$command -From $Step"
}

$script:ScriptParameters = $PSBoundParameters

try {
    for ($step = $From; $step -le $LastStep; $step++) {
        & "Invoke-Step$step"
    }
} catch [System.OperationCanceledException] {
    Write-Host ''
    Write-Host "Arrêt à l'étape $script:CurrentStep." -ForegroundColor Yellow
    Write-Host "Reprendre : $(Get-ResumeCommand $script:CurrentStep)"
    exit 2
} catch {
    Write-Host ''
    Write-Host "Échec à l'étape $($script:CurrentStep) : $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Reprendre après correction : $(Get-ResumeCommand $script:CurrentStep)"
    exit 1
}

Write-Host ''
if ($script:Failures -gt 0) {
    Write-Host "Terminé avec $script:Failures point(s) KO : voir ci-dessus et $DocPath § 8." -ForegroundColor Yellow
    exit 1
}
Write-Host 'Terminé.' -ForegroundColor Green
