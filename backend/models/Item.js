// Modelo de Items del juego
const mongoose = require("mongoose");

// Esquema para items del catálogo
const ItemSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ID único del item (ej: "sword_1", "helmet_1")
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: {
    type: String,
    enum: ["equipment", "consumable", "material", "special"],
    required: true,
  },
  // Subcategoría para equipamiento
  equipmentSlot: {
    type: String,
    enum: ["weapon", "head", "chest", "hands", "feet", "accessory"],
    default: null,
  },
  // Tipo de arma (si aplica)
  weaponType: {
    type: String,
    enum: ["sword", "axe", "staff", "wand", null],
    default: null,
  },
  rarity: { type: Number, default: 1, min: 1, max: 5 },
  // Stats que otorga el item
  stats: {
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    hp: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    critRate: { type: Number, default: 0 }, // % de crítico
    critDamage: { type: Number, default: 0 }, // % de daño crítico
  },
  // Imagen del item
  icon: { type: String, default: "" },
  // Precio de venta
  sellPrice: { type: Number, default: 10 },
  // Si es stackeable (consumibles) o único (equipo)
  stackable: { type: Boolean, default: false },
  // Nivel mínimo para usar
  levelRequired: { type: Number, default: 1 },
});

const Item = mongoose.model("Item", ItemSchema);

// Items base del juego
const BASE_ITEMS = [
  // === ARMAS ===
  {
    _id: "sword_1",
    name: "Espada de Hierro",
    description: "Una espada básica forjada en hierro.",
    category: "equipment",
    equipmentSlot: "weapon",
    weaponType: "sword",
    rarity: 1,
    stats: { attack: 5, critRate: 2 },
    icon: "/assets/objects/espada1.png",
    sellPrice: 50,
    stackable: false,
  },
  {
    _id: "axe_1",
    name: "Hacha de Leñador",
    description: "Un hacha pesada pero efectiva.",
    category: "equipment",
    equipmentSlot: "weapon",
    weaponType: "axe",
    rarity: 1,
    stats: { attack: 7, speed: -1 },
    icon: "/assets/objects/hacha1.png",
    sellPrice: 55,
    stackable: false,
  },
  {
    _id: "staff_1",
    name: "Bastón de Aprendiz",
    description: "Un bastón mágico para principiantes.",
    category: "equipment",
    equipmentSlot: "weapon",
    weaponType: "staff",
    rarity: 1,
    stats: { attack: 4, hp: 10 },
    icon: "/assets/objects/baston1.png",
    sellPrice: 45,
    stackable: false,
  },
  {
    _id: "wand_1",
    name: "Vara Mística",
    description: "Una vara que canaliza energía mágica.",
    category: "equipment",
    equipmentSlot: "weapon",
    weaponType: "wand",
    rarity: 1,
    stats: { attack: 3, critDamage: 10 },
    icon: "/assets/objects/vara1.png",
    sellPrice: 40,
    stackable: false,
  },
  // === ARMADURAS ===
  {
    _id: "helmet_1",
    name: "Casco de Cuero",
    description: "Protección básica para la cabeza.",
    category: "equipment",
    equipmentSlot: "head",
    rarity: 1,
    stats: { defense: 3, hp: 15 },
    icon: "/assets/objects/casco1.png",
    sellPrice: 30,
    stackable: false,
  },
  {
    _id: "chest_1",
    name: "Pechera de Hierro",
    description: "Armadura que protege el torso.",
    category: "equipment",
    equipmentSlot: "chest",
    rarity: 1,
    stats: { defense: 5, hp: 25 },
    icon: "/assets/objects/pechera1.png",
    sellPrice: 60,
    stackable: false,
  },
  {
    _id: "gloves_1",
    name: "Guantes de Combate",
    description: "Guantes que mejoran el agarre.",
    category: "equipment",
    equipmentSlot: "hands",
    rarity: 1,
    stats: { attack: 2, critRate: 3 },
    icon: "/assets/objects/guante1.png",
    sellPrice: 25,
    stackable: false,
  },
  {
    _id: "boots_1",
    name: "Botas de Viajero",
    description: "Botas ligeras para moverse rápido.",
    category: "equipment",
    equipmentSlot: "feet",
    rarity: 1,
    stats: { speed: 3, defense: 1 },
    icon: "/assets/objects/bota1.png",
    sellPrice: 35,
    stackable: false,
  },
  // === CONSUMIBLES ===
  {
    _id: "scroll_small",
    name: "Pergamino Azul",
    description: "Otorga 100 puntos de experiencia.",
    category: "consumable",
    rarity: 3,
    stats: {},
    icon: "/assets/objects/pergaminoAzul.png",
    sellPrice: 10,
    stackable: true,
  },
  {
    _id: "scroll_medium",
    name: "Pergamino Morado",
    description: "Otorga 500 puntos de experiencia.",
    category: "consumable",
    rarity: 4,
    stats: {},
    icon: "/assets/objects/pergaminoMorado.png",
    sellPrice: 50,
    stackable: true,
  },
  {
    _id: "scroll_large",
    name: "Pergamino Dorado",
    description: "Otorga 1000 puntos de experiencia.",
    category: "consumable",
    rarity: 5,
    stats: {},
    icon: "/assets/objects/pergaminoDorado.png",
    sellPrice: 100,
    stackable: true,
  },
];

// Función para sembrar items iniciales
const seedItems = async () => {
  try {
    for (const item of BASE_ITEMS) {
      await Item.findOneAndUpdate({ _id: item._id }, item, { upsert: true });
    }
    console.log("Items sembrados correctamente");
  } catch (error) {
    console.error("Error sembrando items:", error);
  }
};

module.exports = { Item, seedItems, BASE_ITEMS };
