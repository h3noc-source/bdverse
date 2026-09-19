# BDVerse v0.4

Prototype full-stack prêt pour branchement backend.

## Lancer en local
1. Installer Node.js 20+.
2. Dans ce dossier : `npm install`
3. Puis : `npm start`
4. Ouvrir `http://localhost:3000`

## API
- `GET /api/health`
- `POST /api/register`
- `POST /api/login`
- `GET /api/stories`
- `POST /api/stories`
- `POST /api/stories/:storyId/episodes`
- `GET /api/stories/:storyId/episodes`
- `POST /api/purchases`
- `GET /api/creator/:creatorId/stats`

## Important
Les crédits sont encore un système de démonstration. Aucun paiement réel n'est traité.
Pour la production, il faudra ajouter une vraie authentification avec sessions/tokens sécurisés, stockage des pages BD, modération, sauvegardes, protection anti-fraude et un prestataire de paiement disponible dans le pays ciblé.
