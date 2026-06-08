const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getInventory,
  getUserProfile,
} = require("../controllers/userController");

// Ruta protegida para obtener el inventario del usuario
router.get("/inventory", authMiddleware, getInventory);

// Ruta protegida para obtener el perfil del usuario
router.get("/profile", authMiddleware, getUserProfile);

module.exports = router;
