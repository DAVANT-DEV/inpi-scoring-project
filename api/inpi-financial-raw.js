const axios = require("axios");

module.exports = async (req, res) => {
  const { siren } = req.query;

  if (!siren) {
    return res.status(400).json({ error: "SIREN manquant" });
  }

  try {
    console.log(`🔍 Recherche pour SIREN: ${siren}`);
    
    // Connexion INPI
    const loginRes = await axios.post("https://registre-national-entreprises.inpi.fr/api/sso/login", {
      username: process.env.INPI_USERNAME,
      password: process.env.INPI_PASSWORD,
    });

    const token = loginRes.data.token;
    if (!token) throw new Error("Token INPI manquant");
    
    console.log("✅ Token INPI obtenu");

    // Appel : attachments (TOUS les documents)
    const attRes = await axios.get(
      `https://registre-national-entreprises.inpi.fr/api/companies/${siren}/attachments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`📄 Réponse attachments:`, JSON.stringify(attRes.data, null, 2));

    // Vérifier la structure complète
    const { bilans, bilansSaisis, actes } = attRes.data;
    
    console.log(`📊 Bilans PDF: ${bilans?.length || 0}`);
    console.log(`📊 Bilans saisis: ${bilansSaisis?.length || 0}`);
    console.log(`📊 Actes: ${actes?.length || 0}`);

    // Si on a des bilans saisis
    if (bilansSaisis && bilansSaisis.length > 0) {
      const idBilan = bilansSaisis[0].id;
      console.log(`🎯 Traitement du bilan ID: ${idBilan}`);
      
      const bilanRes = await axios.get(
        `https://registre-national-entreprises.inpi.fr/api/bilans-saisis/${idBilan}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return res.status(200).json({
        siren,
        debug: {
          totalBilansSaisis: bilansSaisis.length,
          totalBilansPDF: bilans?.length || 0,
          totalActes: actes?.length || 0
        },
        bilan: bilanRes.data,
      });
    }

    // Si on a des bilans PDF mais pas de saisis
    if (bilans && bilans.length > 0) {
      return res.status(200).json({
        siren,
        debug: {
          totalBilansSaisis: bilansSaisis?.length || 0,
          totalBilansPDF: bilans.length,
          totalActes: actes?.length || 0
        },
        message: "Bilans PDF disponibles mais pas de données saisies",
        bilansPDF: bilans.map(b => ({
          id: b.id,
          dateDepot: b.dateDepot,
          dateCloture: b.dateCloture,
          confidentiality: b.confidentiality
        }))
      });
    }

    // Aucun bilan trouvé
    return res.status(200).json({
      siren,
      debug: {
        totalBilansSaisis: 0,
        totalBilansPDF: 0,
        totalActes: actes?.length || 0
      },
      message: "Aucun bilan trouvé pour cette entreprise",
      rawResponse: attRes.data
    });

  } catch (err) {
    console.error("❌ Erreur serveur :", err.message);
    console.error("❌ Détails :", err.response?.data);
    
    return res.status(500).json({ 
      error: "Erreur serveur", 
      details: err.message,
      apiResponse: err.response?.data 
    });
  }
};