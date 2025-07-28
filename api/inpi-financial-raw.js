const axios = require("axios");

module.exports = async (req, res) => {
  const { siren } = req.query;

  if (!siren) {
    return res.status(400).json({ error: "SIREN manquant" });
  }

  try {
    // Connexion INPI
    const loginRes = await axios.post("https://registre-national-entreprises.inpi.fr/api/sso/login", {
      username: process.env.INPI_USERNAME,
      password: process.env.INPI_PASSWORD,
    });

    const token = loginRes.data.token;
    if (!token) throw new Error("Token INPI manquant");

    // Appel : attachments
    const attRes = await axios.get(
      `https://registre-national-entreprises.inpi.fr/api/companies/${siren}/attachments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const bilansSaisis = attRes.data?.bilansSaisis;
    if (!bilansSaisis || bilansSaisis.length === 0) {
      return res.status(200).json({ siren, bilans: [] });
    }

    // Appel du premier bilan-saisi
    const idBilan = bilansSaisis[0].id;
    const bilanRes = await axios.get(
      `https://registre-national-entreprises.inpi.fr/api/bilans-saisis/${idBilan}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.status(200).json({
      siren,
      id: idBilan,
      bilan: bilanRes.data,
    });
  } catch (err) {
    console.error("Erreur serveur :", err.message);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
};
