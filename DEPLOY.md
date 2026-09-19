# BDVerse v0.5 — mise en ligne

Le projet est prêt pour un hébergeur Node.js.

## Option simple
Importer ce dossier dans un dépôt GitHub, puis connecter le dépôt à un hébergeur Node.js.

Variables utiles:
- PORT: fourni automatiquement par l'hébergeur
- DB_FILE: chemin vers une base SQLite persistante si l'hébergeur le permet

## Attention
SQLite dans un environnement sans disque persistant ne doit pas servir de base de production.
Pour la vraie version, migrer vers PostgreSQL/MySQL et ajouter stockage d'images (objet) + authentification sécurisée + sauvegardes.

Le paiement réel n'est pas activé dans cette version.
