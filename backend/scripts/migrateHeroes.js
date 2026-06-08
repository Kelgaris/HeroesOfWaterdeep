/**
 * Script de migración para corregir datos de héroes de usuarios
 *
 * Problemas que corrige:
 * 1. Héroes con _id en lugar de heroId
 * 2. Héroes con 'class' en lugar de 'element'
 * 3. Normaliza la estructura de datos de héroes
 *
 * Uso: node scripts/migrateHeroes.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { Hero, BASE_HEROES } = require("../models/Hero");

// Mapeo de class a element para datos legacy
const CLASS_TO_ELEMENT = {
  warrior: "earth",
  mage: "fire",
  healer: "light",
  rogue: "wind",
  tank: "earth",
};

async function migrateHeroes() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    // Primero, asegurarse de que los héroes base estén en la BD
    console.log("\n1. Sembrando héroes base en catálogo...");
    for (const hero of BASE_HEROES) {
      await Hero.findOneAndUpdate({ _id: hero._id }, hero, {
        upsert: true,
        new: true,
      });
    }
    console.log(`   ✓ ${BASE_HEROES.length} héroes sembrados`);

    // Obtener todos los usuarios
    const usuarios = await User.find({});
    console.log(`\n2. Migrando héroes de ${usuarios.length} usuarios...`);

    let totalMigrados = 0;
    let totalProblemas = 0;

    for (const usuario of usuarios) {
      let cambios = false;
      const heroesCorregidos = [];

      for (const hero of usuario.heroes) {
        const heroeCorregido = { ...hero.toObject() };

        // Problema 1: El héroe tiene _id pero no heroId
        if (!heroeCorregido.heroId && heroeCorregido._id) {
          // Si _id parece ser un ID de héroe (empieza con "hero_")
          if (
            typeof heroeCorregido._id === "string" &&
            heroeCorregido._id.startsWith("hero_")
          ) {
            heroeCorregido.heroId = heroeCorregido._id;
            delete heroeCorregido._id;
            cambios = true;
            console.log(
              `   - Usuario ${usuario.username}: Corregido heroId para ${heroeCorregido.name}`,
            );
          }
        }

        // Problema 2: El héroe tiene 'class' en lugar de 'element'
        if (heroeCorregido.class && !heroeCorregido.element) {
          heroeCorregido.element =
            CLASS_TO_ELEMENT[heroeCorregido.class] || "earth";
          delete heroeCorregido.class;
          cambios = true;
          console.log(
            `   - Usuario ${usuario.username}: Corregido element para ${heroeCorregido.name}`,
          );
        }

        // Problema 3: El héroe no tiene element
        if (!heroeCorregido.element) {
          // Buscar en el catálogo para obtener el element correcto
          const catalogHero = await Hero.findById(heroeCorregido.heroId);
          if (catalogHero) {
            heroeCorregido.element = catalogHero.element;
            cambios = true;
            console.log(
              `   - Usuario ${usuario.username}: Añadido element desde catálogo para ${heroeCorregido.name}`,
            );
          } else {
            heroeCorregido.element = "earth"; // Default
            cambios = true;
            totalProblemas++;
            console.log(
              `   ⚠ Usuario ${usuario.username}: Héroe ${heroeCorregido.name} no encontrado en catálogo`,
            );
          }
        }

        heroesCorregidos.push(heroeCorregido);
      }

      if (cambios) {
        usuario.heroes = heroesCorregidos;
        await usuario.save();
        totalMigrados++;
      }
    }

    console.log("\n========== RESUMEN ==========");
    console.log(`Usuarios migrados: ${totalMigrados}`);
    console.log(`Problemas encontrados: ${totalProblemas}`);
    console.log("==============================\n");

    // Mostrar estado actual de los héroes en catálogo
    console.log("Héroes en catálogo:");
    const heroesCatalogo = await Hero.find().sort({ rarity: -1 });
    for (const hero of heroesCatalogo) {
      console.log(
        `  - ${hero.name} (${hero._id}) - Rareza ${hero.rarity}★ - ${hero.element}`,
      );
    }
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDesconectado de MongoDB");
  }
}

// Ejecutar migración
migrateHeroes();
