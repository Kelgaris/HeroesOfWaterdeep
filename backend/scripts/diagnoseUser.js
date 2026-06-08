/**
 * Script de diagnóstico para ver los héroes del usuario
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { Hero } = require("../models/Hero");

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB\n");

    // Buscar usuario kelga
    const usuario = await User.findOne({ username: "kelga" });

    if (!usuario) {
      console.log("Usuario kelga no encontrado");
      return;
    }

    console.log("=== HÉROES DEL USUARIO KELGA ===\n");

    for (const hero of usuario.heroes) {
      const heroObj = hero.toObject();
      console.log(`Héroe: ${heroObj.name}`);
      console.log(`  - _id: ${heroObj._id} (tipo: ${typeof heroObj._id})`);
      console.log(
        `  - heroId: ${heroObj.heroId} (tipo: ${typeof heroObj.heroId})`,
      );
      console.log(`  - element: ${heroObj.element}`);
      console.log(`  - rarity: ${heroObj.rarity}`);
      console.log("");
    }

    console.log("\n=== HÉROES EN CATÁLOGO ===\n");
    const catalogHeroes = await Hero.find({});
    for (const hero of catalogHeroes) {
      console.log(`${hero._id}: ${hero.name} (${hero.rarity}★)`);
    }

    console.log("\n=== COMPARACIÓN ===\n");
    for (const userHero of usuario.heroes) {
      const heroObj = userHero.toObject();
      const idToCheck = heroObj.heroId || heroObj._id?.toString();
      const catalogHero = await Hero.findById(idToCheck);

      console.log(`${heroObj.name}:`);
      console.log(`  - ID usado para buscar: "${idToCheck}"`);
      console.log(`  - ¿Encontrado en catálogo?: ${catalogHero ? "SÍ" : "NO"}`);
      if (!catalogHero) {
        // Buscar coincidencia parcial
        const partial = await Hero.findOne({ name: heroObj.name });
        if (partial) {
          console.log(`  - Posible coincidencia: ${partial._id}`);
        }
      }
      console.log("");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
