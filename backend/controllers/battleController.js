// Controlador de batalla y stages
const battleService = require("../services/battleService");
const User = require("../models/User"); // IMPORTANTE: Requerimos el modelo para manipular las gemas en la Base de Datos

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

// Iniciar batalla y procesar recompensas
exports.startBattle = async (req, res) => {
  try {
    const usuarioId = req.usuarioId;
    const { stageId, selectedHeroIds } = req.body;

    if (!stageId) {
      return res.status(400).json({ message: "Se requiere el ID del stage" });
    }

    // Ejecutamos la simulación del combate mediante el servicio
    const result = await battleService.simulateBattle(
      usuarioId,
      stageId,
      selectedHeroIds,
    );

    // LÓGICA DE RECOMPENSA POR PRIMERA VICTORIA (FIRST CLEAR DE 1000 GEMAS)
    // Suponemos que result contiene un booleano 'winner' o 'victory' indicando el resultado.
    // Ajusta 'result.winner' al nombre exacto de la propiedad que use tu battleService (ej. result.isVictory).
    const esVictoria = result.winner || result.isVictory || result.victory;

    if (esVictoria) {
      const user = await User.findById(usuarioId);

      if (user) {
        // Inicializar el array de stages completados por si acaso el modelo no lo tuviera por defecto
        if (!user.clearedStages) {
          user.clearedStages = [];
        }

        // Comprobamos si es la primera vez que el jugador se pasa este stage específico
        const yaCompletado = user.clearedStages.includes(stageId);

        if (!yaCompletado) {
          const RECOMPENSA_GEMAS = 1000;

          user.clearedStages.push(stageId);
          user.gems = (user.gems || 0) + RECOMPENSA_GEMAS;

          await user.save();

          // Inyectamos banderas adicionales en la respuesta JSON para que el Frontend
          // sepa que debe pintar una alerta medieval tocha de "¡Recompensa especial!"
          result.firstClearReward = true;
          result.gemsEarned = RECOMPENSA_GEMAS;

          // Actualizamos los datos del usuario en la respuesta del combate para que las barras visuales
          // de recursos del juego se actualicen automáticamente en el móvil sin tener que recargar
          if (result.user) {
            result.user.gems = user.gems;
            result.user.clearedStages = user.clearedStages;
          }
        }
      }
    }

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
