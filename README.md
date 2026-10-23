# Finly

Application d'éducation financière : budget, factures, dettes, épargne, investissement, cours et quiz.

- Site statique sans framework, installable sur iPhone (écran d'accueil).
- Le code de l'appli est dans `src/index.01.html` … `src/index.12.html` : à la mise en ligne, Netlify les met bout à bout
  pour former `index.html` et recrée les icônes à partir de `src/icons.json` (voir `build.js`).
- `cloud.js` : connexion à la base de données Supabase (remplace le stockage de l'ancien artifact).
- Base de données : Supabase (voir `supabase/README.md`).
- Hébergement : Netlify, mis à jour automatiquement à chaque modification de ce dépôt.
