---
description: Pipeline complet pour une modification du CV, du ticket jusqu'au code relu, testé et commité sur `claude` (poussé en fin de lot).
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
7. Commit sur `claude` (conventional commit en anglais, sans co-auteur). Push sur
   `origin claude` **seulement en fin de lot** : si d'autres tickets du même lot suivent, ne
   pas pousser — chaque push lance la CI. Rien d'autre.
8. Mets à jour la section « En cours » de `docs/BACKLOG.md`, et redonne à l'utilisateur ce
   qu'il doit regarder pour valider.
