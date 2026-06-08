const User = require("../models/User");
const { Hero, BASE_HEROES } = require("../models/Hero");

const TICKET_ITEM_ID = "summon_ticket";
const GEMS_COST_1 = 250;
const GEMS_COST_10 = 2000;
const TICKETS_COST_1 = 1;
const TICKETS_COST_10 = 10;
const PITY_HARD = 90;
const PITY_SOFT = 70;
const MAX_PULL_RETRIES = 3;

// Probabilidades base
const RATES = {
  5: 0.006, // 0.6% base para 5★
  4: 0.994, // 99.4% para 4★ (el resto)
};

// ============ CONFIGURACIÓN DEL BANNER ============
const CURRENT_BANNER = {
  id: "banner_hendrika_001",
  name: "Hija del Cuervo",
  featuredHeroId: "hero_hendrikka",
  // Rate-up 4★ del banner (personajes del banner)
  rateUp4Star: ["hero_rain", "hero_barbariccia", "hero_red_xiii", "hero_vivi"],
  // Probabilidad de ganar el destacado en un 5★ sin garantía
  featuredRate: 1,
  // Probabilidad de que el 4★ sea uno de los rate-up
  rateUp4StarRate: 1,
  startDate: new Date("2026-05-01"),
  endDate: new Date("2026-06-15"),
};

function getFeaturedHero() {
  return (
    BASE_HEROES.find(
      (h) => h._id === CURRENT_BANNER.featuredHeroId && h.rarity === 5,
    ) ||
    BASE_HEROES.find((h) => h.rarity === 5) ||
    BASE_HEROES[0]
  );
}

function getRateUp4StarPool() {
  const configuredPool = BASE_HEROES.filter(
    (h) => h.rarity === 4 && CURRENT_BANNER.rateUp4Star.includes(h._id),
  );

  if (configuredPool.length > 0) {
    return configuredPool;
  }

  // Fallback defensivo para no romper invocaciones si se elimina algún héroe del catálogo.
  return BASE_HEROES.filter((h) => h.rarity === 4).slice(0, 4);
}

/**
 * Calcula la probabilidad efectiva de 5★ considerando soft/hard pity
 */
function get5StarRate(pity) {
  if (pity >= PITY_HARD - 1) return 1.0; // Hard pity garantizado

  let rate = RATES[5];
  if (pity >= PITY_SOFT) {
    // Soft pity: +6% por cada tirada después de 70
    rate += (pity - PITY_SOFT + 1) * 0.06;
  }
  return Math.min(rate, 1.0);
}

/**
 * Determina la rareza del héroe basándose en probabilidades y pity
 */
function getRarity(pity) {
  const rate5 = get5StarRate(pity);
  const roll = Math.random();

  if (roll < rate5) return 5;
  return 4; // Base del banner: siempre 4★ si no cae 5★
}

/**
 * Selecciona un héroe de 5★ considerando el 50/50 y garantía
 */
function select5StarHero(isGuaranteed) {
  const featuredHero = getFeaturedHero();

  // El banner solo tiene un 5★ posible: el destacado.
  return { hero: featuredHero, wonFiftyFifty: true };
}

/**
 * Selecciona un héroe de 4★ considerando rate-up
 */
function select4StarHero() {
  const pool = getRateUp4StarPool();
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return BASE_HEROES.find((h) => h.rarity === 4) || BASE_HEROES[0];
}

/**
 * Realiza las tiradas del gacha
 */
async function pullHeroes(userId, amount) {
  if (amount !== 1 && amount !== 10)
    throw new Error("Cantidad de tiradas inválida");

  for (let attempt = 1; attempt <= MAX_PULL_RETRIES; attempt++) {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const originalVersion = user.__v;

    // Validar moneda
    let usedCurrency = "gems";
    const ticketsCost = amount === 10 ? TICKETS_COST_10 : TICKETS_COST_1;
    const gemsCost = amount === 10 ? GEMS_COST_10 : GEMS_COST_1;

    let ticketItem = user.inventory.find((i) => i.itemId === TICKET_ITEM_ID);

    if (ticketItem && ticketItem.quantity >= ticketsCost) {
      usedCurrency = "tickets";
      ticketItem.quantity -= ticketsCost;
    } else if (user.gems >= gemsCost) {
      usedCurrency = "gems";
      user.gems -= gemsCost;
    } else {
      throw new Error("No tienes suficientes gemas ni tickets de invocación.");
    }

    const results = [];
    let pity = user.gachaPity || 0;
    let guaranteed = user.guaranteedFeatured || false;
    let got4Star = false; // Conservado para compatibilidad, ahora siempre saldrá 4★ o 5★

    for (let i = 0; i < amount; i++) {
      let rarity = getRarity(pity);

      // En este banner no hay 3★: base 4★ con posibilidad de múltiples 5★.

      let selectedHero = null;
      let wonFiftyFifty = null;

      if (rarity === 5) {
        const result = select5StarHero(guaranteed);
        selectedHero = result.hero;
        wonFiftyFifty = result.wonFiftyFifty;

        // Actualizar garantía para siguiente 5★
        if (wonFiftyFifty) {
          guaranteed = false; // Ganó, no tiene garantía
        } else {
          guaranteed = true; // Perdió el 50/50, siguiente es garantizado
        }

        pity = 0; // Reset pity al obtener 5★
      } else if (rarity === 4) {
        selectedHero = select4StarHero();
        got4Star = true;
        pity += 1;
      } else {
        const availableHeroes = BASE_HEROES.filter((h) => h.rarity === rarity);
        selectedHero =
          availableHeroes[Math.floor(Math.random() * availableHeroes.length)];
        pity += 1;
      }

      if (!selectedHero) {
        const fallback = BASE_HEROES.filter((h) => h.rarity === rarity);
        selectedHero = fallback[0];
      }

      // Verificar si ya tiene el héroe (incluye compatibilidad legacy)
      const existingHero = user.heroes.find(
        (h) => (h.heroId || h._id?.toString()) === selectedHero._id,
      );
      let isNew = false;
      let addedResonance = 0;

      if (existingHero) {
        // Duplicado -> Resonancia según rareza
        const resonanceByRarity = { 5: 50, 4: 25, 3: 10 };
        addedResonance = resonanceByRarity[selectedHero.rarity] || 10;
        existingHero.resonancePieces =
          (existingHero.resonancePieces || 0) + addedResonance;
      } else {
        isNew = true;
        user.heroes.push({
          heroId: selectedHero._id,
          name: selectedHero.name,
          element: selectedHero.element,
          title: selectedHero.title,
          level: 1,
          rarity: selectedHero.rarity,
          experience: 0,
          resonancePieces: 0,
          starsUpgraded: 0,
          stats: selectedHero.stats,
        });
      }

      results.push({
        hero: selectedHero,
        isNew,
        addedResonance,
        wonFiftyFifty, // null para no-5★, true/false para 5★
      });
    }

    user.gachaPity = pity;
    user.guaranteedFeatured = guaranteed;

    const updateResult = await User.updateOne(
      { _id: userId, __v: originalVersion },
      {
        $set: {
          gems: user.gems,
          inventory: user.inventory,
          heroes: user.heroes,
          gachaPity: user.gachaPity,
          guaranteedFeatured: user.guaranteedFeatured,
        },
        $inc: { __v: 1 },
      },
    );

    if (updateResult.modifiedCount !== 1) {
      if (attempt === MAX_PULL_RETRIES) {
        throw new Error(
          "No se pudo completar la invocación por concurrencia. Intenta de nuevo.",
        );
      }
      continue;
    }

    const remainingTicketItem = user.inventory.find(
      (i) => i.itemId === TICKET_ITEM_ID,
    );

    return {
      results,
      usedCurrency,
      remainingGems: user.gems,
      remainingTickets: remainingTicketItem ? remainingTicketItem.quantity : 0,
      currentPity: user.gachaPity,
      guaranteedFeatured: user.guaranteedFeatured,
    };
  }

  throw new Error("No se pudo completar la invocación.");
}

/**
 * Obtiene información del banner actual
 */
function getBannerInfo() {
  const featuredHero = getFeaturedHero();
  const rateUp4Stars = getRateUp4StarPool();

  return {
    id: CURRENT_BANNER.id,
    name: CURRENT_BANNER.name,
    featuredHero: {
      _id: featuredHero._id,
      name: featuredHero.name,
      title: featuredHero.title,
      element: featuredHero.element,
      rarity: featuredHero.rarity,
      splashArt: featuredHero.splashArt,
      role: featuredHero.role,
    },
    rateUp4Stars: rateUp4Stars.map((h) => ({
      _id: h._id,
      name: h.name,
      title: h.title,
      element: h.element,
      rarity: h.rarity,
      splashArt: h.splashArt,
      role: h.role,
    })),
    other5Stars: [],
    rates: {
      base5Star: `${(RATES[5] * 100).toFixed(1)}%`,
      base4Star: `${(RATES[4] * 100).toFixed(1)}%`,
      softPityStart: PITY_SOFT,
      hardPity: PITY_HARD,
      featuredRate: "100%",
      rateUp4StarRate: "100%",
    },
    startDate: CURRENT_BANNER.startDate,
    endDate: CURRENT_BANNER.endDate,
  };
}

/**
 * Obtiene el estado del pity de un usuario
 */
async function getUserPityStatus(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("Usuario no encontrado");

  const currentRate = get5StarRate(user.gachaPity || 0);

  return {
    currentPity: user.gachaPity || 0,
    guaranteedFeatured: user.guaranteedFeatured || false,
    softPityStart: PITY_SOFT,
    hardPity: PITY_HARD,
    pullsUntilSoftPity: Math.max(0, PITY_SOFT - (user.gachaPity || 0)),
    pullsUntilHardPity: Math.max(0, PITY_HARD - (user.gachaPity || 0)),
    current5StarRate: `${(currentRate * 100).toFixed(1)}%`,
  };
}

module.exports = {
  pullHeroes,
  getBannerInfo,
  getUserPityStatus,
  CURRENT_BANNER,
};
