// Modelo de Enemigos del juego
const mongoose = require("mongoose");

// Esquema para los enemigos
const EnemySchema = new mongoose.Schema({
  enemyId: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["normal", "elite", "boss"],
    default: "normal",
  },
  stats: {
    hp: { type: Number, default: 50 },
    attack: { type: Number, default: 8 },
    defense: { type: Number, default: 5 },
    speed: { type: Number, default: 8 },
  },
  shape: {
    type: String,
    enum: ["circle", "triangle", "square", "diamond", "pentagon", "hexagon"],
    default: "square",
  },
  color: {
    type: String,
    default: "#FF0000",
  },
  experienceReward: {
    type: Number,
    default: 10,
  },
  goldReward: {
    type: Number,
    default: 20,
  },
  asset: {
    fileName: String,
    imagePath: String,
  },
  battleProfile: {
    basicType: String,
    basicLabel: String,
    ultimateType: String,
    ultimateLabel: String,
    targeting: String,
  },
});

const Enemy = mongoose.model("Enemy", EnemySchema);

// Catálogo reducido para un proyecto pequeño: solo enemigos con sprite real.
const BASE_ENEMIES = [
  {
    enemyId: "enemy_goblin",
    name: "Goblin",
    type: "normal",
    stats: { hp: 55, attack: 12, defense: 5, speed: 11 },
    shape: "triangle",
    color: "#7CB342",
    experienceReward: 14,
    goldReward: 20,
    asset: {
      fileName: "gobling.png",
      imagePath: "/assets/monsters/gobling.png",
    },
    battleProfile: {
      basicType: "damage_single",
      basicLabel: "Cuchillada Feral",
      ultimateType: "damage_burst",
      ultimateLabel: "Emboscada Tribal",
      targeting: "lowestHp",
    },
  },
  {
    enemyId: "enemy_killer_bee",
    name: "Abeja Asesina",
    type: "normal",
    stats: { hp: 85, attack: 20, defense: 7, speed: 22 },
    shape: "diamond",
    color: "#F9A825",
    experienceReward: 28,
    goldReward: 45,
    asset: {
      fileName: "abeja_asesina.png",
      imagePath: "/assets/monsters/abeja_asesina.png",
    },
    battleProfile: {
      basicType: "damage_execute",
      basicLabel: "Picadura Rápida",
      ultimateType: "damage_burst",
      ultimateLabel: "Enjambre Letal",
      targeting: "lowestHp",
    },
  },
  {
    enemyId: "enemy_blue_sphere",
    name: "Esfera Azul",
    type: "elite",
    stats: { hp: 130, attack: 24, defense: 16, speed: 16 },
    shape: "circle",
    color: "#1E88E5",
    experienceReward: 52,
    goldReward: 90,
    asset: {
      fileName: "esfera_azul.png",
      imagePath: "/assets/monsters/esfera_azul.png",
    },
    battleProfile: {
      basicType: "damage_burst",
      basicLabel: "Pulso Prismático",
      ultimateType: "damage_aoe",
      ultimateLabel: "Implosión Arcana",
      targeting: "lowestDefense",
    },
  },
  {
    enemyId: "enemy_carbuncle",
    name: "Garbúnculo",
    type: "boss",
    stats: { hp: 240, attack: 34, defense: 24, speed: 14 },
    shape: "pentagon",
    color: "#8E24AA",
    experienceReward: 120,
    goldReward: 180,
    asset: {
      fileName: "garbunculo.png",
      imagePath: "/assets/monsters/garbunculo.png",
    },
    battleProfile: {
      basicType: "damage_burst",
      basicLabel: "Zarpa Rúnica",
      ultimateType: "damage_aoe",
      ultimateLabel: "Rugido Cristalino",
      targeting: "highestAttack",
    },
  },
  {
    enemyId: "enemy_lycanthrope",
    name: "Licántropo",
    type: "elite",
    stats: { hp: 180, attack: 33, defense: 17, speed: 18 },
    shape: "hexagon",
    color: "#6D4C41",
    experienceReward: 74,
    goldReward: 130,
    asset: {
      fileName: "licantropo.png",
      imagePath: "/assets/monsters/licantropo.png",
    },
    battleProfile: {
      basicType: "damage_execute",
      basicLabel: "Garra Lunar",
      ultimateType: "damage_burst",
      ultimateLabel: "Frenesí Lupino",
      targeting: "lowestHp",
    },
  },
  {
    enemyId: "enemy_deadly_eye",
    name: "Ojo Letal",
    type: "elite",
    stats: { hp: 145, attack: 35, defense: 12, speed: 20 },
    shape: "circle",
    color: "#C62828",
    experienceReward: 80,
    goldReward: 140,
    asset: {
      fileName: "ojo_letal.png",
      imagePath: "/assets/monsters/ojo_letal.png",
    },
    battleProfile: {
      basicType: "damage_burst",
      basicLabel: "Rayo Escarlata",
      ultimateType: "damage_aoe",
      ultimateLabel: "Mirada de Aniquilación",
      targeting: "lowestDefense",
    },
  },
];

// Función para sembrar enemigos base
async function seedEnemies() {
  try {
    const activeEnemyIds = BASE_ENEMIES.map((enemy) => enemy.enemyId);

    await Enemy.deleteMany({
      enemyId: { $nin: activeEnemyIds },
    });

    for (const enemy of BASE_ENEMIES) {
      await Enemy.findOneAndUpdate({ enemyId: enemy.enemyId }, enemy, {
        upsert: true,
        returnDocument: "after",
      });
    }
    console.log("Enemigos base sembrados correctamente");
  } catch (error) {
    console.error("Error al sembrar enemigos:", error);
  }
}

module.exports = { Enemy, BASE_ENEMIES, seedEnemies };
