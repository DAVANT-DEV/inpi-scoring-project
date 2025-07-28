# INPI Scoring Project

Backend Vercel permettant d'effectuer un pré-scoring d'une entreprise via son SIREN en interrogeant l'API **INPI**.

## 🔐 Authentification

Ce backend utilise l'API INPI via une authentification avec identifiant et mot de passe.  
Le token JWT est généré automatiquement à chaque appel et utilisé pour interroger les comptes annuels.

## 📍 Endpoint principal

`GET /api/inpi-score?siren=XXXXXXXXX`

### Exemple :

```http
GET /api/inpi-score?siren=849891957
```

### Réponse

```json
{
  "siren": "849891957",
  "exercice": "2023-12-31",
  "chiffreAffaires": 680000,
  "resultatNet": 34000,
  "score": "A"
}
```

## 🧠 Scoring (exemple simplifié)

- Chiffre d'affaires > 500k € → **A**
- Chiffre d'affaires > 100k € → **B**
- Sinon → **C**

## ⚙️ Configuration Vercel

Ajouter ces variables d'environnement dans le projet :

| Nom              | Description                     |
|------------------|----------------------------------|
| `INPI_USERNAME` | Identifiant API INPI            |
| `INPI_PASSWORD` | Mot de passe API INPI           |

## 📁 Structure

```
api/
└── inpi-score.js     # Endpoint principal de scoring INPI
```

## 🛠️ À venir

- Support de l’analyse RNCS (liquidation, redressement...)
- Récupération automatique du PDF KBIS
- Enrichissement Power Platform / CRM
