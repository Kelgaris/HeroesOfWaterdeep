const express = require("express");
const router = express.Router();
const gachaController = require("../controllers/gachaController");
const authMiddleware = require("../middleware/authMiddleware");

// Info del banner (público, no requiere auth)
router.get("/banner", gachaController.getBannerInfo);

// Rutas que requieren autenticación
router.use(authMiddleware);

// Endpoint para realizar la invocación (pull)
router.post("/pull", gachaController.pull);

// Endpoint para ver el estado del pity del usuario
router.get("/pity", gachaController.getPityStatus);

module.exports = router;
