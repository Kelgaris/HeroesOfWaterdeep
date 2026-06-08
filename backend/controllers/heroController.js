const { Hero, BASE_HEROES } = require("../models/Hero");
const User = require("../models/User");
const { Item } = require("../models/Item");

const getBaseHeroMeta = (heroId) =>
  BASE_HEROES.find((hero) => hero._id === heroId) || null;

const enrichHeroCatalog = (heroDoc) => {
  const hero = heroDoc?.toObject ? heroDoc.toObject() : heroDoc;
  const baseHero = getBaseHeroMeta(hero._id?.toString() || hero._id);

  return {
    ...hero,
    title: hero.title || baseHero?.title || "",
    pixelArt: hero.pixelArt || baseHero?.pixelArt || "",
    splashArt: hero.splashArt || baseHero?.splashArt || "",
    role: hero.role || baseHero?.role || "fighter",
    skills: {
      ...(baseHero?.skills || {}),
      ...(hero.skills || {}),
    },
    battleKit: hero.battleKit?.summary
      ? hero.battleKit
      : baseHero?.battleKit || null,
  };
};

// Tabla de experiencia necesaria por nivel según rareza
const EXP_TABLE = {
  // Rareza 2 estrellas
  2: {
    baseExp: 50,
    multiplier: 1.2,
  },
  // Rareza 3 estrellas
  3: {
    baseExp: 100,
    multiplier: 1.3,
  },
  // Rareza 4 estrellas
  4: {
    baseExp: 150,
    multiplier: 1.4,
  },
  // Rareza 5 estrellas
  5: {
    baseExp: 200,
    multiplier: 1.5,
  },
};

// Calcular experiencia necesaria para subir de nivel
const calculateExpForLevel = (level, rarity) => {
  const config = EXP_TABLE[rarity] || EXP_TABLE[3];
  return Math.floor(config.baseExp * Math.pow(config.multiplier, level - 1));
};

// Calcular stats por nivel
const calculateStatsForLevel = (baseStats, level, rarity) => {
  const growthRate = 0.05 + rarity * 0.01; // 5% + 1% por rareza
  return {
    hp: Math.floor(baseStats.hp * (1 + growthRate * (level - 1))),
    attack: Math.floor(baseStats.attack * (1 + growthRate * (level - 1))),
    defense: Math.floor(baseStats.defense * (1 + growthRate * (level - 1))),
    speed: Math.floor(baseStats.speed * (1 + growthRate * (level - 1))),
  };
};

const getAscensionMultiplier = (starsUpgraded = 0) =>
  1 + Math.max(0, starsUpgraded) * 0.05;

const calculateAscendedStatsForLevel = (
  baseStats,
  level,
  rarity,
  starsUpgraded = 0,
) => {
  const levelStats = calculateStatsForLevel(baseStats, level, rarity);
  const starBonus = getAscensionMultiplier(starsUpgraded);

  return {
    hp: Math.floor(levelStats.hp * starBonus),
    attack: Math.floor(levelStats.attack * starBonus),
    defense: Math.floor(levelStats.defense * starBonus),
    speed: Math.floor(levelStats.speed * starBonus),
  };
};

// Obtener todos los héroes del catálogo
exports.getAllHeroes = async (req, res) => {
  try {
    const heroes = await Hero.find().sort({ rarity: -1, name: 1 });
    res.json(heroes.map(enrichHeroCatalog));
  } catch (error) {
    console.error("Error al obtener héroes:", error);
    res.status(500).json({ error: "Error al obtener héroes" });
  }
};

// Obtener todos los héroes con indicador de propiedad del usuario
exports.getAllHeroesWithOwnership = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const allHeroes = await Hero.find().sort({ rarity: -1, name: 1 });
    // Normalizar heroIds - soportar tanto heroId como _id en datos legacy
    const userHeroIds = usuario.heroes.map(
      (h) => h.heroId || h._id?.toString(),
    );

    const heroesWithOwnership = allHeroes.map((hero) => {
      // Buscar héroe tanto por heroId como por _id (para datos legacy)
      const userHero = usuario.heroes.find(
        (h) => (h.heroId || h._id?.toString()) === hero._id,
      );

      return {
        ...enrichHeroCatalog(hero),
        owned: userHeroIds.includes(hero._id),
        userHeroData: userHero || null,
      };
    });

    res.json(heroesWithOwnership);
  } catch (error) {
    console.error("Error al obtener héroes:", error);
    res.status(500).json({ error: "Error al obtener héroes" });
  }
};

// Obtener héroes del usuario
exports.getUserHeroes = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(usuario.heroes);
  } catch (error) {
    console.error("Error al obtener héroes del usuario:", error);
    res.status(500).json({ error: "Error al obtener héroes del usuario" });
  }
};

// Obtener detalle de un héroe específico
exports.getHeroDetail = async (req, res) => {
  try {
    const { heroId } = req.params;
    const usuario = await User.findById(req.usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar en catálogo
    const catalogHeroDoc = await Hero.findById(heroId);
    const catalogHero = catalogHeroDoc
      ? enrichHeroCatalog(catalogHeroDoc)
      : null;
    if (!catalogHero) {
      return res.status(404).json({ error: "Héroe no encontrado" });
    }

    // Buscar si el usuario lo tiene (soportar heroId y _id para datos legacy)
    const userHero = usuario.heroes.find(
      (h) => (h.heroId || h._id?.toString()) === heroId,
    );

    // Calcular exp necesaria para siguiente nivel
    const currentLevel = userHero?.level || 1;
    const rarity = catalogHero.rarity;
    const expForNextLevel = calculateExpForLevel(currentLevel + 1, rarity);

    let finalStats = userHero
      ? calculateAscendedStatsForLevel(
          catalogHero.stats,
          userHero.level,
          rarity,
          userHero.starsUpgraded || 0,
        )
      : catalogHero.stats;

    let populatedEquipment = null;
    if (userHero && userHero.equipment) {
      populatedEquipment = {
        weapon: null,
        head: null,
        chest: null,
        hands: null,
        feet: null,
        accessory: null,
      };
      const allItemIds = Object.values(userHero.equipment).filter(
        (id) => id !== null,
      );

      if (allItemIds.length > 0) {
        const items = await Item.find({ _id: { $in: allItemIds } });

        for (const [slot, itemId] of Object.entries(
          userHero.equipment.toObject
            ? userHero.equipment.toObject()
            : userHero.equipment,
        )) {
          if (!itemId) continue;

          const item = items.find((i) => i._id === itemId);
          populatedEquipment[slot] = item || null;

          if (item && item.stats) {
            finalStats.hp += item.stats.hp || 0;
            finalStats.attack += item.stats.attack || 0;
            finalStats.defense += item.stats.defense || 0;
            finalStats.speed += item.stats.speed || 0;
          }
        }
      }
    }

    res.json({
      catalog: catalogHero,
      owned: !!userHero,
      userHero: userHero || null,
      expForNextLevel,
      currentStats: finalStats,
      populatedEquipment,
    });
  } catch (error) {
    console.error("Error al obtener detalle del héroe:", error);
    res.status(500).json({ error: "Error al obtener detalle del héroe" });
  }
};

// Subir nivel de héroe
exports.levelUpHero = async (req, res) => {
  try {
    const { heroId } = req.params;
    const { scrollsUsed } = req.body; // Array de { scrollId, quantity }

    const usuario = await User.findById(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar héroe del usuario (soportar heroId y _id para datos legacy)
    const heroIndex = usuario.heroes.findIndex(
      (h) => (h.heroId || h._id?.toString()) === heroId,
    );
    if (heroIndex === -1) {
      return res.status(404).json({ error: "No tienes este héroe" });
    }

    const userHero = usuario.heroes[heroIndex];
    const catalogHero = await Hero.findById(heroId);

    if (!catalogHero) {
      return res.status(404).json({ error: "Héroe no encontrado en catálogo" });
    }

    // Calcular experiencia total de los pergaminos
    const SCROLL_EXP = {
      scroll_small: 100,
      scroll_medium: 500,
      scroll_large: 1000,
      scroll_epic: 2000,
    };

    let totalExpGained = 0;
    let totalGoldCost = 0;

    if (scrollsUsed && scrollsUsed.length > 0) {
      // Verificar que el usuario tiene suficientes pergaminos
      for (const scroll of scrollsUsed) {
        const inventoryItem = usuario.inventory.find(
          (item) => item.itemId === scroll.scrollId,
        );
        const available = inventoryItem ? inventoryItem.quantity : 0;

        if (available < scroll.quantity) {
          return res.status(400).json({
            error: `No tienes suficientes ${scroll.scrollId}. Tienes: ${available}, necesitas: ${scroll.quantity}`,
          });
        }

        const expPerScroll = SCROLL_EXP[scroll.scrollId] || 100;
        totalExpGained += expPerScroll * scroll.quantity;
        // Costo en oro: 10 por cada punto de exp
        totalGoldCost += expPerScroll * scroll.quantity * 0.1;
      }

      // Descontar pergaminos del inventario
      for (const scroll of scrollsUsed) {
        const inventoryIndex = usuario.inventory.findIndex(
          (item) => item.itemId === scroll.scrollId,
        );
        if (inventoryIndex !== -1) {
          usuario.inventory[inventoryIndex].quantity -= scroll.quantity;
          // Si la cantidad llega a 0, eliminar el item
          if (usuario.inventory[inventoryIndex].quantity <= 0) {
            usuario.inventory.splice(inventoryIndex, 1);
          }
        }
      }
    }

    // Verificar oro
    if (usuario.gold < totalGoldCost) {
      return res.status(400).json({ error: "Oro insuficiente" });
    }

    // Aplicar experiencia y calcular subidas de nivel
    let currentExp = userHero.experience + totalExpGained;
    let currentLevel = userHero.level;
    let levelsGained = 0;
    const maxLevel = 100;

    while (currentLevel < maxLevel) {
      const expNeeded = calculateExpForLevel(
        currentLevel + 1,
        catalogHero.rarity,
      );
      if (currentExp >= expNeeded) {
        currentExp -= expNeeded;
        currentLevel++;
        levelsGained++;
      } else {
        break;
      }
    }

    // Actualizar stats
    const newStats = calculateAscendedStatsForLevel(
      catalogHero.stats,
      currentLevel,
      catalogHero.rarity,
      userHero.starsUpgraded || 0,
    );

    // Actualizar héroe
    usuario.heroes[heroIndex].level = currentLevel;
    usuario.heroes[heroIndex].experience = currentExp;
    usuario.heroes[heroIndex].stats = newStats;

    // Descontar oro
    usuario.gold -= totalGoldCost;

    await usuario.save();

    res.json({
      success: true,
      hero: usuario.heroes[heroIndex],
      levelsGained,
      expGained: totalExpGained,
      goldSpent: totalGoldCost,
      newStats,
      expForNextLevel: calculateExpForLevel(
        currentLevel + 1,
        catalogHero.rarity,
      ),
    });
  } catch (error) {
    console.error("Error al subir nivel:", error);
    res.status(500).json({ error: "Error al subir nivel del héroe" });
  }
};

// Subir estrellas con fragmentos de resonancia
exports.upgradeHeroStars = async (req, res) => {
  try {
    const { heroId } = req.params;
    const usuario = await User.findById(req.usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar héroe del usuario (soportar heroId y _id para datos legacy)
    const heroIndex = usuario.heroes.findIndex(
      (h) => (h.heroId || h._id?.toString()) === heroId,
    );
    if (heroIndex === -1) {
      return res.status(404).json({ error: "No tienes este héroe" });
    }

    const userHero = usuario.heroes[heroIndex];
    const catalogHero = await Hero.findById(heroId);

    // Fragmentos necesarios según estrellas actuales
    const FRAGMENTS_NEEDED = {
      0: 50, // De base a +1
      1: 100, // De +1 a +2
      2: 150, // De +2 a +3
      3: 200, // De +3 a +4
      4: 300, // De +4 a +5 (máximo)
    };

    const currentStars = userHero.starsUpgraded || 0;
    if (currentStars >= 5) {
      return res
        .status(400)
        .json({ error: "Héroe ya está al máximo de estrellas" });
    }

    const fragmentsNeeded = FRAGMENTS_NEEDED[currentStars];
    if (userHero.resonancePieces < fragmentsNeeded) {
      return res.status(400).json({
        error: "Fragmentos de resonancia insuficientes",
        needed: fragmentsNeeded,
        have: userHero.resonancePieces,
      });
    }

    // Aplicar mejora
    usuario.heroes[heroIndex].resonancePieces -= fragmentsNeeded;
    usuario.heroes[heroIndex].starsUpgraded = currentStars + 1;

    // Bonus de stats por estrella (+5% por cada estrella adicional)
    const baseStats = catalogHero.stats;
    const level = userHero.level;
    const newRarity = catalogHero.rarity; // La rareza base no cambia

    const newStats = calculateAscendedStatsForLevel(
      baseStats,
      level,
      newRarity,
      currentStars + 1,
    );

    usuario.heroes[heroIndex].stats = newStats;
    await usuario.save();

    res.json({
      success: true,
      hero: usuario.heroes[heroIndex],
      newStars: currentStars + 1,
      newStats,
    });
  } catch (error) {
    console.error("Error al subir estrellas:", error);
    res.status(500).json({ error: "Error al subir estrellas del héroe" });
  }
};

// Equipar un objeto
exports.equipItem = async (req, res) => {
  try {
    const { heroId } = req.params;
    const { itemId, slot } = req.body;

    const usuario = await User.findById(req.usuarioId);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    // Verificar item en catálogo
    const itemCatalog = await Item.findById(itemId);
    if (!itemCatalog || itemCatalog.category !== "equipment") {
      return res
        .status(400)
        .json({ error: "Item inválido o no es equipamiento" });
    }
    if (itemCatalog.equipmentSlot !== slot) {
      return res
        .status(400)
        .json({ error: `Este item no se puede equipar en la ranura: ${slot}` });
    }

    // Verificar que el usuario tenga el item en inventario
    const inventoryIndex = usuario.inventory.findIndex(
      (i) => i.itemId === itemId,
    );
    if (
      inventoryIndex === -1 ||
      usuario.inventory[inventoryIndex].quantity < 1
    ) {
      return res
        .status(400)
        .json({ error: "No tienes este item en tu inventario" });
    }

    // Buscar héroe
    const heroIndex = usuario.heroes.findIndex(
      (h) => (h.heroId || h._id?.toString()) === heroId,
    );
    if (heroIndex === -1)
      return res.status(404).json({ error: "No tienes este héroe" });

    const userHero = usuario.heroes[heroIndex];

    // Desequipar el item actual si existe
    if (userHero.equipment && userHero.equipment[slot]) {
      const currentEquippedId = userHero.equipment[slot];
      const existingInvIndex = usuario.inventory.findIndex(
        (i) => i.itemId === currentEquippedId,
      );
      if (existingInvIndex !== -1) {
        usuario.inventory[existingInvIndex].quantity += 1;
      } else {
        usuario.inventory.push({ itemId: currentEquippedId, quantity: 1 });
      }
    }

    // Inicializar equipment si no existe (legacy support)
    if (!userHero.equipment) {
      userHero.equipment = {
        weapon: null,
        head: null,
        chest: null,
        hands: null,
        feet: null,
        accessory: null,
      };
    }

    // Equipar el nuevo item
    userHero.equipment[slot] = itemId;

    // Remover item del inventario
    usuario.inventory[inventoryIndex].quantity -= 1;
    if (usuario.inventory[inventoryIndex].quantity <= 0) {
      usuario.inventory.splice(inventoryIndex, 1);
    }

    await usuario.save();

    res.json({
      success: true,
      equipment: userHero.equipment,
      inventory: usuario.inventory,
    });
  } catch (error) {
    console.error("Error al equipar item:", error);
    res.status(500).json({ error: "Error al equipar item" });
  }
};

// Desequipar un objeto
exports.unequipItem = async (req, res) => {
  try {
    const { heroId } = req.params;
    const { slot } = req.body;

    const usuario = await User.findById(req.usuarioId);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    // Buscar héroe
    const heroIndex = usuario.heroes.findIndex(
      (h) => (h.heroId || h._id?.toString()) === heroId,
    );
    if (heroIndex === -1)
      return res.status(404).json({ error: "No tienes este héroe" });

    const userHero = usuario.heroes[heroIndex];

    if (!userHero.equipment || !userHero.equipment[slot]) {
      return res
        .status(400)
        .json({ error: "No hay nada equipado en esta ranura" });
    }

    const equippedId = userHero.equipment[slot];

    // Devolver al inventario
    const existingInvIndex = usuario.inventory.findIndex(
      (i) => i.itemId === equippedId,
    );
    if (existingInvIndex !== -1) {
      usuario.inventory[existingInvIndex].quantity += 1;
    } else {
      usuario.inventory.push({ itemId: equippedId, quantity: 1 });
    }

    // Limpiar ranura
    userHero.equipment[slot] = null;

    await usuario.save();

    res.json({
      success: true,
      equipment: userHero.equipment,
      inventory: usuario.inventory,
    });
  } catch (error) {
    console.error("Error al desequipar item:", error);
    res.status(500).json({ error: "Error al desequipar item" });
  }
};
