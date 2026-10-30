---
description: Pipeline complet pour une modification du CV, du ticket jusqu'au code relu, testé et commité sur `claude` (poussé en fin de lot).
---

Demande de l'utilisateur : $ARGUMENTS

Chaque agent est un **nouvel** agent : jamais de reprise par SendMessage, tout le contexte
passe dans le prompt.

1. Si la demande cache un choix de contenu ou de design non tranché, pose la question AVANT
   de continuer (notification téléphone si l'utilisateur n'est pas là). Sinon, enchaîne.
2. Écris ou mets à jour le ticket dans `docs/BACKLOG.md` et la ligne « Tâche en cours » de
   « En cours ».
3. **Contrôle de référence** : `tester` en mode contrôle, avant toute modification. Ses
   échecs sont préexistants et vont dans le prompt du `developer`.
4. Lance `developer` avec le gabarit ci-dessous. Modèle (vaut aussi pour `code-reviewer`) :
   Sonnet par défaut ; Opus d'emblée sur en-têtes de sécurité, workflows ou `edge/`, et pour
   le `developer` du 2e passage.
5. Écris le diff, **avec l'outil Bash** (sous PowerShell 5.1, `>` écrit en UTF-16) :
   `git add -N <fichiers nouveaux listés par le developer>`, `git diff HEAD >
   .claude/review.diff`, puis `git reset -q`. Jamais `git add -A -N`.
6. Lance **en parallèle** `tester` (contrôle du lot) et `code-reviewer` (ticket + chemin du
   diff + findings déjà arbitrés, à ne pas reposer).
7. `CHANGEMENTS REQUIS` ou `KO à cause du lot` : nouveau `developer` avec les findings
   **recopiés intégralement**, retour à 5. **Trois passages du `developer` au plus**, puis
   explique le blocage et notifie.
8. `APPROUVÉ` et `OK` : relance toi-même `powershell -NoProfile -File .claude/check.ps1` et
   rapporte son tableau brut. Dockerfile, Caddyfile ou compose touchés : construis et lance
   l'image (`CLAUDE.md`).
9. Commit sur `claude` (conventional commit en anglais, **sans `Co-Authored-By`**). Push sur
   `origin claude` **seulement en fin de lot**. Rien d'autre.
10. Mets à jour « En cours » de `docs/BACKLOG.md` (état présent, « Prochaine action ») et
    redonne à l'utilisateur ce qu'il doit regarder pour valider.

## Gabarit du prompt `developer`

```
Projet : C:\Development\yannhurry.fr\cv, branche `claude`. Ne commite pas, ne pousse pas.
Lis d'abord CLAUDE.md.

Objectif : <ticket complet recopié, critères d'acceptation>.
Fichiers attendus : <liste ou zone>. Autres fichiers touchés : dis lesquels.
Hors périmètre : <ce qui est ticketé ailleurs>.
Contrôle de référence : <tableau de check.ps1 avant le lot>.
<Au 2e passage : findings du relecteur et du testeur, recopiés intégralement.>

Secrets : ni .env ni variables d'environnement ; une valeur manque → arrête-toi et demande.
Vérifier avant d'affirmer : aucun chiffre ni code de sortie non lu dans une sortie.
Fin : `powershell -NoProfile -File .claude/check.ps1`, tableau recopié.
Réponse : critère par critère, fichiers touchés, hypothèses, points d'attention pour le relecteur.
```
