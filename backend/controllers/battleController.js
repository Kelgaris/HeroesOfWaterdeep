// Controlador de batalla y stages
const battleService = require("../services/battleService");

// Obtener stages disponibles
exports.getStages = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const result = await battleService.getAvailableStages(usuarioId);
    res.json(result);
  } catch (error) {
    console.error("Error obteniendo stages:", error);
    res.status(500).json({ message: error.message || "Error en el servidor" });
  }
};

// Iniciar batalla
exports.startBattle = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { stageId, selectedHeroIds } = req.body;

    if (!stageId) {
      return res.status(400).json({ message: "Se requiere el ID del stage" });
    }

    const result = await battleService.simulateBattle(
      usuarioId,
      stageId,
      selectedHeroIds,
    );
    res.json(result);
  } catch (error) {
    console.error("Error en batalla:", error);
    res.status(400).json({ message: error.message || "Error en la batalla" });
  }
};

// Regenerar energía
exports.refreshEnergy = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const result = await battleService.regenerateEnergy(usuarioId);
    res.json(result);
  } catch (error) {
    console.error("Error regenerando energía:", error);
    res.status(500).json({ message: error.message || "Error en el servidor" });
  }
};

// Simular muchas batallas para balance en desarrollo
exports.simulateMany = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "No encontrado" });
    }

    const usuarioId = req.usuarioId;
    const { stageId, selectedHeroIds, runs } = req.body;

    if (!stageId) {
      return res.status(400).json({ message: "Se requiere el ID del stage" });
    }

    const result = await battleService.simulateManyBattles(
      usuarioId,
      stageId,
      selectedHeroIds,
      runs,
    );

    res.json(result);
  } catch (error) {
    console.error("Error en simulación masiva:", error);
    res
      .status(400)
      .json({ message: error.message || "Error en la simulación" });
  }
};
