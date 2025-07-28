const axios = require('axios');

module.exports = async (req, res) => {
  const { siren } = req.query;

  if (!siren) {
    return res.status(400).json({ error: "SIREN manquant" });
  }

  try {
    // 1. Authentification auprès de l'INPI (registre-national-entreprises)
    const loginResponse = await axios.post(
      "https://registre-national-entreprises.inpi.fr/api/sso/login",
      {
        username: process.env.INPI_USERNAME,
        password: process.env.INPI_PASSWORD
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const token = loginResponse.data.token;
    if (!token) {
      return res.status(401).json({ error: "Token INPI non reçu" });
    }

    // 2. Récupération des données de l'entreprise
    const apiResponse = await axios.get(
      `https://registre-national-entreprises.inpi.fr/api/companies/${siren}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = apiResponse.data;

    // 3. Extraction des données financières si elles existent
    const comptes = data?.financial?.financialStatements?.[0]?.compteResultat || {};

    return res.status(200).json({
      siren: data.siren,
      denomination: data.denomination,
      dateCreation: data.dateCreation,
      comptes
    });
  } catch (error) {
    console.error("Erreur:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Erreur serveur",
      details: error?.response?.data || error.message
    });
  }
};
