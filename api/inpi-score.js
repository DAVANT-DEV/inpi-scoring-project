export default async function handler(req, res) {
  const { siren } = req.query;

  if (!siren || siren.length !== 9) {
    return res.status(400).json({ error: "SIREN invalide ou manquant." });
  }

  const username = process.env.INPI_USERNAME;
  const password = process.env.INPI_PASSWORD;

  if (!username || !password) {
    return res.status(500).json({ error: "Identifiants INPI manquants." });
  }

  try {
    // Étape 1 : Authentification INPI
    const authRes = await fetch("https://data.inpi.fr/api/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!authRes.ok) {
      return res.status(401).json({ error: "Échec d'authentification INPI" });
    }

    const { token } = await authRes.json();

    // Étape 2 : Appel à l’API comptes annuels
    const apiUrl = `https://data.inpi.fr/api/entreprises/${siren}/comptesannuels`;
    const dataRes = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (!dataRes.ok) {
      return res.status(dataRes.status).json({ error: "Erreur récupération comptes annuels" });
    }

    const data = await dataRes.json();

    const comptes = data?.bilans?.[0];
    const chiffreAffaires = comptes?.compteResultat?.ca;
    const resultatNet = comptes?.compteResultat?.resultat;
    const exercice = comptes?.dateCloture;

    // Scoring simple
    let score = "C";
    if (chiffreAffaires > 500000) score = "A";
    else if (chiffreAffaires > 100000) score = "B";

    return res.status(200).json({
      siren,
      exercice,
      chiffreAffaires,
      resultatNet,
      score
    });

  } catch (err) {
    console.error("Erreur scoring INPI :", err);
    return res.status(500).json({ error: "Erreur interne serveur INPI." });
  }
}
