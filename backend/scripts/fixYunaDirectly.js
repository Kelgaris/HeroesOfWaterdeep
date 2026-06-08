/**
 * Script para corregir héroes con _id inválido usando update directo
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function fixInvalidHeroIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB\n");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Buscar usuario kelga
    const usuario = await usersCollection.findOne({ username: "kelga" });

    if (!usuario) {
      console.log("Usuario kelga no encontrado");
      return;
    }

    console.log("Héroes actuales de kelga:");
    usuario.heroes.forEach((h, i) => {
      console.log(`  ${i}: ${h.name} - _id: ${h._id}, heroId: ${h.heroId}`);
    });

    // Construir array de héroes corregido
    const heroesCorregidos = usuario.heroes.map((hero, index) => {
      // Si el héroe es Yuna con _id inválido
      if (hero.name === "Yuna" && (!hero.heroId || hero._id === "hero_yuna")) {
        console.log(`\nCorrigiendo Yuna...`);
        return {
          heroId: "hero_yuna",
          name: hero.name,
          title: hero.title || "High Summoner of Spira",
          element: hero.element || "light",
          level: hero.level || 1,
          rarity: hero.rarity || 5,
          experience: hero.experience || 0,
          resonancePieces: hero.resonancePieces || 0,
          starsUpgraded: hero.starsUpgraded || 0,
          stats: hero.stats || {
            hp: 850,
            attack: 120,
            defense: 100,
            speed: 140,
          },
          _id: new mongoose.Types.ObjectId(), // Nuevo ObjectId válido
        };
      }

      // Si tiene heroId, está bien
      if (hero.heroId) {
        // Asegurar que _id sea un ObjectId válido
        return {
          ...hero,
          _id:
            hero._id instanceof mongoose.Types.ObjectId
              ? hero._id
              : new mongoose.Types.ObjectId(),
        };
      }

      return hero;
    });

    console.log("\nHéroes corregidos:");
    heroesCorregidos.forEach((h, i) => {
      console.log(`  ${i}: ${h.name} - _id: ${h._id}, heroId: ${h.heroId}`);
    });

    // Actualizar directamente en la colección
    const result = await usersCollection.updateOne(
      { username: "kelga" },
      { $set: { heroes: heroesCorregidos } },
    );

    console.log(
      `\nResultado: ${result.modifiedCount} documento(s) modificado(s)`,
    );

    // Verificar
    const usuarioActualizado = await usersCollection.findOne({
      username: "kelga",
    });
    console.log("\nVerificación final:");
    usuarioActualizado.heroes.forEach((h, i) => {
      console.log(`  ${i}: ${h.name} - heroId: ${h.heroId}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixInvalidHeroIds();
