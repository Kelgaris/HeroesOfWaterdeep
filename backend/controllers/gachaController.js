const gachaService = require("../services/gachaService");

exports.pull = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { amount } = req.body;

    if (!amount || (amount !== 1 && amount !== 10)) {
      return res
        .status(400)
        .json({ message: "Cantidad inválida. Debe ser 1 o 10." });
    }

    const result = await gachaService.pullHeroes(usuarioId, amount);
    res.json(result);
  } catch (error) {
    console.error("Error en gacha pull:", error);
    res
      .status(400)
      .json({ message: error.message || "Error al realizar invocación" });
  }
};

// Obtener información del banner actual
exports.getBannerInfo = async (req, res) => {
  try {
    const bannerInfo = gachaService.getBannerInfo();
    res.json(bannerInfo);
  } catch (error) {
    console.error("Error obteniendo info del banner:", error);
    res
      .status(500)
      .json({ message: "Error al obtener información del banner" });
  }
};

// Obtener estado del pity del usuario
exports.getPityStatus = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const pityStatus = await gachaService.getUserPityStatus(usuarioId);
    res.json(pityStatus);
  } catch (error) {
    console.error("Error obteniendo estado del pity:", error);
    res
      .status(400)
      .json({ message: error.message || "Error al obtener estado del pity" });
  }
};
