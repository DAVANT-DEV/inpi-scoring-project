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
    // Authentification
    const authRes = await fetch("https://data.inpi.fr/api/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!authRes.ok) {
      return res.status(401).json({ error: "Échec d'authentification INPI" });
    }

    const { token } = await authRes.json();

    // Appel comptes annuels
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
    const bilan = comptes?.bilanSimplifie;
    const cr = comptes?.compteResultat;

    return res.status(200).json({
      siren,
      exercice: comptes?.dateCloture || null,
      ca: cr?.ca || null,
      resultat: cr?.resultat || null,
      chargesExploitation: cr?.chargesExploitation || null,
      produitsExploitation: cr?.produitsExploitation || null,
      chargesFinancieres: cr?.chargesFinancieres || null,
      produitsFinanciers: cr?.produitsFinanciers || null,
      impotsBenefices: cr?.impotsBenefices || null,
      participationSalaries: cr?.participationSalaries || null,
      dotationsAmortissements: cr?.dotationsAmortissements || null,
      chargesExceptionnelles: cr?.chargesExceptionnelles || null,
      produitsExceptionnels: cr?.produitsExceptionnels || null,
      subventionsExploitation: cr?.subventionsExploit || null,
      resultatExploitation: cr?.resultatExploitation || null,
      resultatFinancier: cr?.resultatFinancier || null,
      resultatCourantAvantImpots: cr?.resultatCourantAvantImpots || null,
      totalActif: bilan?.totalActif || null,
      totalPassif: bilan?.totalPassif || null,
      capitauxPropres: bilan?.capitauxPropres || null
    });

  } catch (err) {
    console.error("Erreur scoring INPI complet:", err);
    return res.status(500).json({ error: "Erreur serveur lors de l'appel à l'API INPI" });
  }
}
