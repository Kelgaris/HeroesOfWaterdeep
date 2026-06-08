/**
 * Migración para eliminar Clive (3★) de cuentas existentes.
 *
 * Reglas:
 * 1) Si el usuario tiene hero_clive y NO tiene hero_rain -> convierte Clive a Rain manteniendo progreso.
 * 2) Si ya tiene Rain -> elimina Clive y compensa con resonancia + gemas.
 * 3) Elimina hero_clive del catálogo Hero en BD si existiese.
 *
 * Uso: node scripts/migrateRemoveClive.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { Hero, BASE_HEROES } = require("../models/Hero");

const CLIVE_ID = "hero_clive";
const RAIN_ID = "hero_rain";
const DUPLICATE_RESONANCE_COMPENSATION = 25;
const DUPLICATE_GEM_COMPENSATION = 250;

function buildHeroFromCatalog(baseHero, sourceHero) {
  return {
    heroId: baseHero._id,
    name: baseHero.name,
    title: baseHero.title || "",
    element: baseHero.element,
    level: sourceHero.level || 1,
    rarity: baseHero.rarity,
    experience: sourceHero.experience || 0,
    resonancePieces: sourceHero.resonancePieces || 0,
    starsUpgraded: sourceHero.starsUpgraded || 0,
    stats: sourceHero.stats || baseHero.stats,
    equipment: sourceHero.equipment || {
      weapon: null,
      head: null,
      chest: null,
      hands: null,
      feet: null,
      accessory: null,
    },
  };
}

async function migrateRemoveClive() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    const rainBase = BASE_HEROES.find((hero) => hero._id === RAIN_ID);
    if (!rainBase) {
      throw new Error(
        "No se encontró hero_rain en BASE_HEROES. Abortando migración.",
      );
    }

    const users = await User.find({});
    let scanned = 0;
    let convertedToRain = 0;
    let compensated = 0;
    let unchanged = 0;

    for (const user of users) {
      scanned += 1;
      let changed = false;

      const heroes = user.heroes.map((hero) =>
        hero.toObject ? hero.toObject() : { ...hero },
      );

      const cliveIndex = heroes.findIndex(
        (hero) => (hero.heroId || hero._id?.toString()) === CLIVE_ID,
      );

      if (cliveIndex === -1) {
        unchanged += 1;
        continue;
      }

      const rainIndex = heroes.findIndex(
        (hero) => (hero.heroId || hero._id?.toString()) === RAIN_ID,
      );

      if (rainIndex === -1) {
        const cliveHero = heroes[cliveIndex];
        heroes[cliveIndex] = buildHeroFromCatalog(rainBase, cliveHero);
        convertedToRain += 1;
        changed = true;
        console.log(
          `Usuario ${user.username}: Clive convertido a Rain manteniendo progreso.`,
        );
      } else {
        const rainHero = heroes[rainIndex];
        rainHero.resonancePieces =
          (rainHero.resonancePieces || 0) + DUPLICATE_RESONANCE_COMPENSATION;

        user.gems = (user.gems || 0) + DUPLICATE_GEM_COMPENSATION;

        heroes.splice(cliveIndex, 1);
        compensated += 1;
        changed = true;
        console.log(
          `Usuario ${user.username}: Clive eliminado (duplicado) +${DUPLICATE_RESONANCE_COMPENSATION} resonancia Rain +${DUPLICATE_GEM_COMPENSATION} gemas.`,
        );
      }

      if (changed) {
        user.heroes = heroes;
        await user.save();
      }
    }

    const deleteResult = await Hero.deleteOne({ _id: CLIVE_ID });

    console.log("\n========== RESUMEN MIGRACION CLIVE ==========");
    console.log(`Usuarios revisados: ${scanned}`);
    console.log(`Convertidos a Rain: ${convertedToRain}`);
    console.log(`Compensados (ya tenian Rain): ${compensated}`);
    console.log(`Sin cambios: ${unchanged}`);
    console.log(
      `Clive eliminado de catalogo BD: ${deleteResult.deletedCount === 1 ? "si" : "no / no existia"}`,
    );
    console.log("=============================================\n");
  } catch (error) {
    console.error("Error en migración de Clive:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

migrateRemoveClive();
