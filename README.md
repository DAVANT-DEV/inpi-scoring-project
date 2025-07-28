# INPI Scoring Project

Backend Vercel permettant d'effectuer un pré-scoring simple d'une entreprise via son SIREN en interrogeant l'API INSEE.

## Endpoint

`GET /api/score?siren=XXXXXXXXX`

### Réponse
```json
{
  "siren": "849891957",
  "naf": "62.01Z",
  "dateCreation": "2019-03-20",
  "score": "A"
}
```

## Configuration

Ajouter une variable d'environnement `INSEE_API_KEY` dans Vercel (ou local `.env`)
