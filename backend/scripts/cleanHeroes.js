/**
 * Script para limpiar héroes duplicados sin campo element
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function cleanHeroes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    // Eliminar héroes sin element (datos legacy)
    const result = await mongoose.connection.db.collection("heros").deleteMany({
      element: { $exists: false },
    });
    console.log("Héroes sin element eliminados:", result.deletedCount);

    // Mostrar héroes restantes
    const remaining = await mongoose.connection.db
      .collection("heros")
      .find({})
      .toArray();
    console.log("\nHéroes en catálogo:");
    remaining.forEach((h) =>
      console.log(`  - ${h.name} (${h._id}) - ${h.rarity}★ - ${h.element}`),
    );

    console.log(`\nTotal: ${remaining.length} héroes`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDesconectado de MongoDB");
  }
}

cleanHeroes();
