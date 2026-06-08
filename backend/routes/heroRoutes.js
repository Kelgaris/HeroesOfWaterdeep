const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getAllHeroes,
  getAllHeroesWithOwnership,
  getUserHeroes,
  getHeroDetail,
  levelUpHero,
  upgradeHeroStars,
  equipItem,
  unequipItem
} = require("../controllers/heroController");

// Ruta pública para obtener todos los héroes del catálogo
router.get("/", getAllHeroes);

// Ruta protegida para obtener todos los héroes con indicador de propiedad
router.get("/catalog", authMiddleware, getAllHeroesWithOwnership);

// Ruta protegida para obtener los héroes del usuario
router.get("/mis-heroes", authMiddleware, getUserHeroes);

// Ruta protegida para obtener detalle de un héroe específico
router.get("/detail/:heroId", authMiddleware, getHeroDetail);

// Ruta protegida para subir nivel de un héroe
router.post("/level-up/:heroId", authMiddleware, levelUpHero);

// Ruta protegida para subir estrellas de un héroe
router.post("/upgrade-stars/:heroId", authMiddleware, upgradeHeroStars);

// Ruta protegida para equipar un objeto
router.post("/equip/:heroId", authMiddleware, equipItem);

// Ruta protegida para desequipar un objeto
router.post("/unequip/:heroId", authMiddleware, unequipItem);

module.exports = router;
