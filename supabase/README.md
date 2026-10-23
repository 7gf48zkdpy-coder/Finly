# Base de données (Supabase)

Projet Supabase : `finly` (région Paris, eu-west-3), réf. `kfyblltpzbbkbqcgcgyu`.

Tables :
- `docs` : tout ce que l'appli enregistre, sous forme de « documents » (chemin, collection, données JSON).
  Mêmes règles que l'ancien artifact, appliquées par Row Level Security :
  - `data/users/<id>/state` : progression de chaque personne, visible par elle seule.
  - `config`, `codes` : lisibles par tous, modifiables par le créateur.
  - `redeem`, `ideas`, `votes`, `leagues`, `fl`, `chat` : lisibles par tous ; chacun ne modifie que son propre document.
  - `stats`, `cancel` : chacun écrit le sien ; seul le créateur voit l'ensemble.
  - `owner` : créateur uniquement.
- `admins` : compte(s) créateur (non lisible depuis l'appli).
- `admin_claim` : e-mail qui devient créateur à la création du compte (non lisible depuis l'appli).

Migrations : `finly_schema`, `admin_claim` (tableau de bord Supabase → Database → Migrations).

Fonction serveur : `link-account` (transforme le compte invité en compte e-mail + mot de passe,
sans e-mail de confirmation, en gardant la progression).

Connexions : « connexion anonyme » à activer dans Authentication → Sign In / Providers → Allow anonymous sign-ins.
