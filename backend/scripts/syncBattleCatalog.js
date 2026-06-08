require("../config/loadEnv");

const connectDB = require("../config/db");
const { seedEnemies } = require("../models/Enemy");
const { seedStages } = require("../models/Stage");

async function syncBattleCatalog() {
  try {
    await connectDB();
    await Promise.all([seedEnemies(), seedStages()]);
    console.log("Catalogo de combate sincronizado correctamente");
    process.exit(0);
  } catch (error) {
    console.error(
      "No se pudo sincronizar el catalogo de combate:",
      error.message,
    );
    process.exit(1);
  }
}

syncBattleCatalog();
