# API — Envoi des emails de vérification

## Endpoint requis

Le client desktop appelle l’API PedaClic pour envoyer les emails de vérification d’inscription.

### `POST /api/auth/send-verification-email`

**Body JSON :**
```json
{
  "email": "utilisateur@exemple.sn",
  "token": "64-caracteres-hex-securise"
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Email envoyé"
}
```

**Réponse erreur (4xx/5xx) :**
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## Contenu de l’email

L’email doit contenir un lien de vérification au format :

```
pedaclic://verify?token=TOKEN_ICI
```

Exemple de lien complet :
```
pedaclic://verify?token=a1b2c3d4e5f6...
```

Lorsque l’utilisateur clique sur ce lien, l’OS ouvre l’application PedaClic Pro, qui reçoit le token et active le compte.

## Recommandations sécurité

- Utiliser un token cryptographiquement aléatoire (≥ 32 octets, ex. 64 caractères hex).
- Définir une durée de validité du token (ex. 24 h).
- Ne pas réutiliser un token déjà utilisé.
- Limiter le débit des envois pour éviter les abus (rate limiting).
