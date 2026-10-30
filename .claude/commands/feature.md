---
description: Pipeline complet pour une modification du CV, du ticket jusqu'au code relu, testé et poussé sur `claude`.
---

Demande de l'utilisateur : $ARGUMENTS

1. Si la demande est ambiguë, pose les questions AVANT de continuer (notification téléphone
   si l'utilisateur n'est pas là).
2. Écris ou mets à jour le ticket dans `docs/BACKLOG.md`.
3. Lance l'agent `developer` avec le ticket complet.
4. Lance l'agent `code-reviewer` sur le diff (`git diff`).
5. `CHANGEMENTS REQUIS` : relance `developer` avec les findings **complets**, puis retour à 4.
   Trois boucles sans approbation : arrête-toi et explique le blocage.
6. `APPROUVÉ` : relance toi-même `npm run build && npm run lint && npm test -- --watch=false`,
   et rapporte les chiffres bruts.
7. Commit sur `claude` (conventional commit en anglais, sans co-auteur), push sur
   `origin claude`. Rien d'autre.
8. Mets à jour la section « En cours » de `docs/BACKLOG.md`, et redonne à l'utilisateur ce
   qu'il doit regarder pour valider.
