// Modelos utilizando Mongoose
const mongoose = require("mongoose");

// Esquema para los héroes que posee el usuario
const UserHeroSchema = new mongoose.Schema({
  heroId: { type: String, required: true }, // Referencia al _id del héroe en catálogo
  name: { type: String, required: true },
  element: { type: String, default: "earth" }, // Elemento del héroe (ya no es required para compatibilidad)
  title: { type: String, default: "" }, // Título opcional del héroe
  level: { type: Number, default: 1 },
  rarity: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  resonancePieces: { type: Number, default: 0 },
  starsUpgraded: { type: Number, default: 0 },
  stats: {
    hp: { type: Number, default: 100 },
    attack: { type: Number, default: 10 },
    defense: { type: Number, default: 10 },
    speed: { type: Number, default: 10 },
  },
  equipment: {
    weapon: { type: String, default: null },
    head: { type: String, default: null },
    chest: { type: String, default: null },
    hands: { type: String, default: null },
    feet: { type: String, default: null },
    accessory: { type: String, default: null },
  },
});

// Esquema para los usuarios.
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  accountLevel: {
    type: Number,
    default: 1,
  },
  experience: {
    type: Number,
    default: 0,
  },
  maxExperience: {
    type: Number,
    default: 100,
  },
  energy: {
    type: Number,
    default: 100,
  },
  maxEnergy: {
    type: Number,
    default: 100,
  },
  gold: {
    type: Number,
    default: 5000,
  },
  gems: {
    type: Number,
    default: 500,
  },
  heroes: [UserHeroSchema],
  inventory: [
    {
      itemId: String,
      quantity: Number,
    },
  ],
  progress: {
    zone: { type: Number, default: 1 },
    stage: { type: Number, default: 1 },
  },
  clearedStages: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastEnergyRefresh: {
    type: Date,
    default: Date.now,
  },
  gachaPity: {
    type: Number,
    default: 0,
  },
  // Si perdiste el 50/50, la siguiente 5★ es garantizada el héroe destacado
  guaranteedFeatured: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
