const express = require("express");
const router = express.Router();
const battleController = require("../controllers/battleController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener stages disponibles
router.get("/stages", battleController.getStages);

// Iniciar batalla
router.post("/battle", battleController.startBattle);

if (process.env.NODE_ENV !== "production") {
  router.post("/simulate-many", battleController.simulateMany);
}

// Regenerar energía
router.post("/refresh-energy", battleController.refreshEnergy);

module.exports = router;
