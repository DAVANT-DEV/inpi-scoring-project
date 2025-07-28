export default async function handler(req, res) {
  const { siren } = req.query;

  if (!siren || siren.length !== 9) {
    return res.status(400).json({ error: "SIREN invalide ou manquant." });
  }

  try {
    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siren?q=${siren}`,
      {
        headers: {
          "X-Insee-Api-Key": process.env.INSEE_API_KEY,
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur API INSEE" });
    }

    const json = await response.json();
    const entreprise = json.etablissements?.[0];

    // Extraction simplifiée pour scoring
    const ca = entreprise?.uniteLegale?.trancheEffectifsUniteLegale;
    const naf = entreprise?.uniteLegale?.activitePrincipaleUniteLegale;
    const dateCreation = entreprise?.dateCreationEtablissement;

    let score = "C";
    if (ca === "51" || naf?.startsWith("62")) score = "A";
    else if (ca === "41") score = "B";

    res.status(200).json({
      siren,
      naf,
      dateCreation,
      score
    });
  } catch (error) {
    console.error("Erreur scoring INPI:", error);
    res.status(500).json({ error: "Erreur interne serveur." });
  }
}
