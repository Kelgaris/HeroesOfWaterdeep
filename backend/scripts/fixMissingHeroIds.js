/**
 * Script para corregir héroes sin heroId
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { Hero } = require("../models/Hero");

async function fixMissingHeroIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB\n");

    const usuarios = await User.find({});
    let totalFixed = 0;

    for (const usuario of usuarios) {
      let modified = false;

      for (let i = 0; i < usuario.heroes.length; i++) {
        const hero = usuario.heroes[i];

        // Si no tiene heroId, buscar por nombre en el catálogo
        if (!hero.heroId) {
          console.log(
            `Usuario ${usuario.username}: Héroe "${hero.name}" sin heroId`,
          );

          // Buscar en catálogo por nombre
          const catalogHero = await Hero.findOne({ name: hero.name });

          if (catalogHero) {
            usuario.heroes[i].heroId = catalogHero._id;
            console.log(`  ✓ Asignado heroId: ${catalogHero._id}`);
            modified = true;
            totalFixed++;
          } else {
            console.log(`  ✗ No encontrado en catálogo`);
          }
        }
      }

      if (modified) {
        await usuario.save();
        console.log(`  → Usuario ${usuario.username} guardado\n`);
      }
    }

    console.log(`\n=== ${totalFixed} héroes corregidos ===`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixMissingHeroIds();
