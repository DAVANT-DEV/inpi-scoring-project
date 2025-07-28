const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { siren } = req.query;

  if (!siren) {
    return res.status(400).json({ error: "SIREN manquant" });
  }

  try {
    // Authentification INPI via registre-national-entreprises
    const authRes = await fetch("https://registre-national-entreprises.inpi.fr/api/sso/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.INPI_USERNAME,
        password: process.env.INPI_PASSWORD
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      return res.status(401).json({ error: "Échec d'authentification INPI", details: errText });
    }

    const { token } = await authRes.json();

    // Requête vers /companies pour récupérer les données financières
    const response = await fetch(`https://registre-national-entreprises.inpi.fr/api/companies/${siren}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: "Erreur récupération données INPI", details: errText });
    }

    const data = await response.json();

    // On extrait les infos financières si disponibles
    const comptes = data?.financial?.financialStatements?.[0]?.compteResultat || {};

    return res.status(200).json({
      siren: data.siren,
      denomination: data.denomination,
      dateCreation: data.dateCreation,
      comptes,
    });
  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};
