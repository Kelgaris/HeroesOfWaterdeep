// Servicio de batalla
const User = require("../models/User");
const { BASE_HEROES } = require("../models/Hero");
const { Stage, BASE_STAGES } = require("../models/Stage");
const { Enemy, BASE_ENEMIES } = require("../models/Enemy");

// Constantes de batalla
const ENERGY_REGEN_RATE = 1; // Energía por minuto
const MAX_ENERGY = 100;
const MAX_MP = 100;
const BASIC_MP_GAIN = 35;
const MAX_ENEMY_UNITS = 6;
const STAGE_DIFFICULTY_MULTIPLIER = {
  easy: 0.95,
  normal: 1,
  hard: 1.15,
  extreme: 1.3,
};
const ENEMY_TYPE_MULTIPLIER = {
  normal: 1,
  elite: 1.18,
  boss: 1.35,
};
const ZONE_ADAPTIVE_BALANCE = new Set([3, 4]);
const STAGE_BALANCE_TARGET_WIN_RATE = 0.58;
const STAGE_BALANCE_MIN_SAMPLE_SIZE = 10;
const STAGE_BALANCE_MAX_SAMPLE_SIZE = 400;
const MAX_SIMULATION_RUNS = 500;
const stageWinrateMetrics = new Map();

const HERO_EXP_TABLE = {
  2: { baseExp: 50, multiplier: 1.2 },
  3: { baseExp: 100, multiplier: 1.3 },
  4: { baseExp: 150, multiplier: 1.4 },
  5: { baseExp: 200, multiplier: 1.5 },
};

async function getEnemyCatalog() {
  const storedEnemies = await Enemy.find({}).lean();
  return storedEnemies.length > 0 ? storedEnemies : BASE_ENEMIES;
}

async function getStageCatalog() {
  const storedStages = await Stage.find({})
    .sort({ zone: 1, stageNumber: 1 })
    .lean();
  return storedStages.length > 0 ? storedStages : BASE_STAGES;
}

async function getStageById(stageId) {
  const storedStage = await Stage.findOne({ stageId }).lean();
  if (storedStage) {
    return storedStage;
  }

  return BASE_STAGES.find((stage) => stage.stageId === stageId) || null;
}

function buildEnemyCatalogMap(enemyCatalog) {
  return new Map(enemyCatalog.map((enemy) => [enemy.enemyId, enemy]));
}

function buildAssetUrl(asset) {
  return asset?.imagePath || null;
}

function buildPublicStage(stage) {
  return {
    ...stage,
    backgroundImageUri: buildAssetUrl(stage.backgroundAsset),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateHeroExpForLevel(level, rarity) {
  const config = HERO_EXP_TABLE[rarity] || HERO_EXP_TABLE[3];
  return Math.floor(config.baseExp * Math.pow(config.multiplier, level - 1));
}

function calculateHeroStatsForLevel(baseStats, level, rarity) {
  const growthRate = 0.05 + rarity * 0.01;
  return {
    hp: Math.floor(baseStats.hp * (1 + growthRate * (level - 1))),
    attack: Math.floor(baseStats.attack * (1 + growthRate * (level - 1))),
    defense: Math.floor(baseStats.defense * (1 + growthRate * (level - 1))),
    speed: Math.floor(baseStats.speed * (1 + growthRate * (level - 1))),
  };
}

function getStageMetrics(stageId) {
  const metrics = stageWinrateMetrics.get(stageId);
  if (!metrics) {
    return null;
  }

  return {
    wins: metrics.wins,
    total: metrics.total,
    winRate: metrics.total > 0 ? metrics.wins / metrics.total : null,
  };
}

function registerStageResult(stageId, victory) {
  const existing = stageWinrateMetrics.get(stageId) || { wins: 0, total: 0 };

  existing.total += 1;
  if (victory) {
    existing.wins += 1;
  }

  if (existing.total > STAGE_BALANCE_MAX_SAMPLE_SIZE) {
    existing.wins = Math.round(existing.wins * 0.85);
    existing.total = Math.round(existing.total * 0.85);
  }

  stageWinrateMetrics.set(stageId, existing);
}

function buildStageEconomy(stage) {
  return {
    energyCost: stage.energyCost,
    rewards: {
      experience: stage.rewards.experience,
      gold: stage.rewards.gold,
      gems: stage.rewards.gems,
    },
    adjusted: false,
    observedWinRate: null,
    sampleSize: 0,
    targetWinRate: STAGE_BALANCE_TARGET_WIN_RATE,
  };
}

function applyAdaptiveEconomy(stage, observedWinRate, sampleSize) {
  const baseEconomy = buildStageEconomy(stage);

  if (
    !ZONE_ADAPTIVE_BALANCE.has(stage.zone) ||
    observedWinRate === null ||
    sampleSize < STAGE_BALANCE_MIN_SAMPLE_SIZE
  ) {
    return baseEconomy;
  }

  const deltaVsTarget = clamp(
    observedWinRate - STAGE_BALANCE_TARGET_WIN_RATE,
    -0.35,
    0.35,
  );

  const energyMultiplier = clamp(1 + deltaVsTarget * 0.6, 0.82, 1.22);
  const rewardMultiplier = clamp(1 - deltaVsTarget * 0.9, 0.8, 1.4);

  return {
    energyCost: Math.max(1, Math.round(stage.energyCost * energyMultiplier)),
    rewards: {
      experience: Math.max(
        1,
        Math.round(stage.rewards.experience * rewardMultiplier),
      ),
      gold: Math.max(1, Math.round(stage.rewards.gold * rewardMultiplier)),
      gems: Math.max(0, Math.round(stage.rewards.gems * rewardMultiplier)),
    },
    adjusted: true,
    observedWinRate,
    sampleSize,
    targetWinRate: STAGE_BALANCE_TARGET_WIN_RATE,
  };
}

function getLiveStageEconomy(stage) {
  const metrics = getStageMetrics(stage.stageId);
  return applyAdaptiveEconomy(
    stage,
    metrics?.winRate ?? null,
    metrics?.total ?? 0,
  );
}

function formatSkillLabel(skillId, fallbackLabel) {
  if (!skillId) {
    return fallbackLabel;
  }

  return skillId
    .replace(/^skill_/, "")
    .split("_")
    .slice(1)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function calculateDamage(attackerStats, defenderStats, options = {}) {
  const multiplier = options.multiplier || 1;
  const critChance = 0.1 + (options.critChanceBonus || 0);
  const defenseFactor = clamp(0.5 - (options.ignoreDefense || 0), 0.15, 0.5);
  const baseDamage =
    attackerStats.attack * multiplier - defenderStats.defense * defenseFactor;
  const variance = Math.random() * 0.2 + 0.9;
  const isCrit = Math.random() < critChance;

  let damage = Math.max(1, Math.floor(baseDamage * variance));
  if (isCrit) {
    damage = Math.floor(damage * (options.critMultiplier || 1.5));
  }

  return { damage, isCrit };
}

function calculateHealing(unit, multiplier = 1) {
  const baseHealing = unit.stats.attack * 0.85 + unit.maxHp * 0.06;
  return Math.max(1, Math.floor(baseHealing * multiplier));
}

function sortByPriority(units, mode) {
  return [...units].sort((a, b) => {
    const hpRatioA = a.currentHp / a.maxHp;
    const hpRatioB = b.currentHp / b.maxHp;

    switch (mode) {
      case "lowestDefense":
        return a.stats.defense - b.stats.defense || a.currentHp - b.currentHp;
      case "highestAttack":
        return b.stats.attack - a.stats.attack || a.currentHp - b.currentHp;
      case "highestHp":
        return b.maxHp - a.maxHp || b.currentHp - a.currentHp;
      case "lowestHp":
      default:
        return hpRatioA - hpRatioB || a.currentHp - b.currentHp;
    }
  });
}

function chooseTarget(units, mode = "lowestHp") {
  return sortByPriority(units, mode)[0] || null;
}

function buildHeroProfile(unit) {
  const basic = unit.battleKit?.basic || {};
  const ultimate = unit.battleKit?.ultimate || {};

  return {
    basicType: basic.type || "damage_single",
    basicLabel: basic.name || formatSkillLabel(unit.skills?.basic, "Ataque"),
    ultimateType: ultimate.type || "damage_burst",
    ultimateLabel:
      ultimate.name || formatSkillLabel(unit.skills?.ultimate, "Límite"),
    targeting: ultimate.target || basic.target || "lowestHp",
  };
}

function buildEnemyProfile(unit) {
  if (unit.battleProfile?.basicType || unit.battleProfile?.ultimateType) {
    return {
      basicType: unit.battleProfile.basicType || "damage_single",
      basicLabel: unit.battleProfile.basicLabel || "Ataque",
      ultimateType: unit.battleProfile.ultimateType || "damage_burst",
      ultimateLabel: unit.battleProfile.ultimateLabel || "Ataque Potenciado",
      targeting: unit.battleProfile.targeting || "lowestHp",
    };
  }

  if (unit.enemyId.includes("shaman")) {
    return {
      basicType: "heal_single",
      basicLabel: "Rito Sombrío",
      ultimateType: "damage_aoe",
      ultimateLabel: "Maldición Tribal",
      targeting: "lowestHp",
    };
  }

  if (unit.enemyId.includes("archer")) {
    return {
      basicType: "damage_execute",
      basicLabel: "Disparo Certero",
      ultimateType: "damage_burst",
      ultimateLabel: "Tiro Letal",
      targeting: "lowestHp",
    };
  }

  if (unit.enemyId.includes("mage")) {
    return {
      basicType: "damage_burst",
      basicLabel: "Descarga Ósea",
      ultimateType: "damage_aoe",
      ultimateLabel: "Nova Oscura",
      targeting: "lowestDefense",
    };
  }

  if (unit.type === "boss") {
    return {
      basicType: "damage_burst",
      basicLabel: "Golpe Brutal",
      ultimateType: "damage_aoe",
      ultimateLabel: "Dominio del Jefe",
      targeting: "highestAttack",
    };
  }

  if (unit.enemyId.includes("wolf") || unit.enemyId.includes("bat")) {
    return {
      basicType: "damage_execute",
      basicLabel: "Embestida Veloz",
      ultimateType: "damage_burst",
      ultimateLabel: "Desgarro Salvaje",
      targeting: "lowestHp",
    };
  }

  return {
    basicType: "damage_single",
    basicLabel: "Ataque",
    ultimateType: unit.type === "elite" ? "damage_burst" : "damage_single",
    ultimateLabel: unit.type === "elite" ? "Golpe Feroz" : "Ataque Potenciado",
    targeting: "lowestHp",
  };
}

function buildSkillProfile(unit) {
  return unit.isHero ? buildHeroProfile(unit) : buildEnemyProfile(unit);
}

function getStageScalingFactor(stage, enemyType) {
  const zoneFactor = 1 + Math.max(0, stage.zone - 1) * 0.18;
  const stageFactor = 1 + Math.max(0, stage.stageNumber - 1) * 0.03;
  const difficultyFactor = STAGE_DIFFICULTY_MULTIPLIER[stage.difficulty] || 1;
  const typeFactor = ENEMY_TYPE_MULTIPLIER[enemyType] || 1;

  return zoneFactor * stageFactor * difficultyFactor * typeFactor;
}

function scaleEnemyStats(baseStats, stage, enemyType) {
  const factor = getStageScalingFactor(stage, enemyType);
  return {
    hp: Math.max(1, Math.floor(baseStats.hp * factor * 1.18)),
    attack: Math.max(1, Math.floor(baseStats.attack * factor)),
    defense: Math.max(1, Math.floor(baseStats.defense * factor)),
    speed: Math.max(1, Math.floor(baseStats.speed * (1 + (factor - 1) * 0.35))),
  };
}

function getHeroesToUse(usuario, selectedHeroIds) {
  if (!usuario.heroes || usuario.heroes.length === 0) {
    throw new Error("No tienes héroes para la batalla");
  }

  let heroesToUse = usuario.heroes;
  if (Array.isArray(selectedHeroIds) && selectedHeroIds.length > 0) {
    const uniqueSelectedIds = [...new Set(selectedHeroIds)];
    heroesToUse = usuario.heroes.filter((hero) =>
      uniqueSelectedIds.includes(hero.heroId),
    );
  }

  if (heroesToUse.length === 0) {
    throw new Error("No tienes héroes válidos seleccionados para la batalla");
  }

  return heroesToUse.slice(0, 6);
}

function buildHeroTeam(heroesToUse) {
  return heroesToUse.map((hero, index) => {
    const catalogHero = BASE_HEROES.find(
      (baseHero) => baseHero._id === hero.heroId,
    );
    const effectiveStats = hero.stats ||
      catalogHero?.stats || {
        hp: 100,
        attack: 10,
        defense: 10,
        speed: 10,
      };
    const heroData =
      typeof hero.toObject === "function" ? hero.toObject() : { ...hero };

    return {
      ...heroData,
      isHero: true,
      name: catalogHero?.name || hero.name,
      role: catalogHero?.role || "fighter",
      skills: catalogHero?.skills || {},
      battleKit: catalogHero?.battleKit || null,
      rarity: catalogHero?.rarity || hero.rarity,
      stats: effectiveStats,
      maxHp: effectiveStats.hp,
      currentHp: effectiveStats.hp,
      maxMp: MAX_MP,
      currentMp: 0,
      instanceId: `${hero.heroId}_${index}`,
    };
  });
}

function buildEnemyTeam(stage, enemyCatalogMap) {
  const enemyTeam = [];
  let enemyCounter = 0;

  for (const stageEnemy of stage.enemies) {
    const enemyData = enemyCatalogMap.get(stageEnemy.enemyId);
    if (!enemyData) {
      continue;
    }

    for (let index = 0; index < stageEnemy.quantity; index++) {
      if (enemyTeam.length >= MAX_ENEMY_UNITS) {
        break;
      }

      const resolvedEnemyType = stageEnemy.isBoss ? "boss" : enemyData.type;

      const scaledStats = scaleEnemyStats(
        enemyData.stats,
        stage,
        resolvedEnemyType,
      );

      enemyTeam.push({
        ...enemyData,
        type: resolvedEnemyType,
        isHero: false,
        stats: scaledStats,
        maxHp: scaledStats.hp,
        currentHp: scaledStats.hp,
        maxMp: MAX_MP,
        currentMp: resolvedEnemyType === "boss" ? 40 : 0,
        instanceId: `${enemyData.enemyId}_${enemyCounter}`,
      });
      enemyCounter += 1;
    }
  }

  if (enemyTeam.length === 0) {
    throw new Error("El stage no tiene enemigos válidos configurados");
  }

  return enemyTeam;
}

function runEncounter(heroTeam, enemyTeam, options = {}) {
  const includeBattleLog = options.includeBattleLog !== false;
  const battleLog = [];
  let turn = 0;
  const maxTurns = 30;

  while (turn < maxTurns) {
    turn++;

    const allUnits = [
      ...heroTeam.filter((hero) => hero.currentHp > 0),
      ...enemyTeam.filter((enemy) => enemy.currentHp > 0),
    ].sort((a, b) => b.stats.speed - a.stats.speed);

    for (const unit of allUnits) {
      if (unit.currentHp <= 0) {
        continue;
      }

      const allies = unit.isHero ? heroTeam : enemyTeam;
      const opponents = unit.isHero
        ? enemyTeam.filter((enemy) => enemy.currentHp > 0)
        : heroTeam.filter((hero) => hero.currentHp > 0);

      if (opponents.length === 0) {
        break;
      }

      const actionLogs = resolveUnitAction({ unit, allies, opponents, turn });
      if (includeBattleLog) {
        battleLog.push(...actionLogs);
      }

      const heroesVivosLoop = heroTeam.filter(
        (hero) => hero.currentHp > 0,
      ).length;
      const enemigosVivosLoop = enemyTeam.filter(
        (enemy) => enemy.currentHp > 0,
      ).length;
      if (heroesVivosLoop === 0 || enemigosVivosLoop === 0) {
        break;
      }
    }

    const heroesVivosLoop = heroTeam.filter(
      (hero) => hero.currentHp > 0,
    ).length;
    const enemigosVivosLoop = enemyTeam.filter(
      (enemy) => enemy.currentHp > 0,
    ).length;
    if (heroesVivosLoop === 0 || enemigosVivosLoop === 0) {
      break;
    }
  }

  const heroesRemaining = heroTeam.filter((hero) => hero.currentHp > 0).length;
  const enemiesRemaining = enemyTeam.filter(
    (enemy) => enemy.currentHp > 0,
  ).length;
  const victory = enemiesRemaining === 0 && heroesRemaining > 0;

  return {
    victory,
    turns: turn,
    heroesRemaining,
    enemiesRemaining,
    battleLog,
  };
}

function resolveDamageAction({
  unit,
  opponents,
  turn,
  actionType,
  actionLabel,
  targeting,
  attackerMpAfter,
}) {
  const livingTargets = opponents.filter((target) => target.currentHp > 0);
  if (livingTargets.length === 0) {
    return [];
  }

  const targetModes = {
    damage_execute: targeting || "lowestHp",
    damage_burst: targeting || "highestAttack",
    damage_single: targeting || "lowestHp",
    damage_aoe: targeting || "lowestHp",
  };

  const damageOptions = {
    damage_execute: {
      multiplier: 1.15,
      critChanceBonus: 0.2,
      critMultiplier: 1.8,
      ignoreDefense: 0.15,
    },
    damage_burst: {
      multiplier: 1.45,
      critChanceBonus: 0.05,
      critMultiplier: 1.7,
    },
    damage_aoe: { multiplier: 0.9, critChanceBonus: 0.02 },
    damage_single: { multiplier: 1 },
  };

  const selectedTargets =
    actionType === "damage_aoe"
      ? sortByPriority(livingTargets, targetModes[actionType]).slice(0, 3)
      : [chooseTarget(livingTargets, targetModes[actionType])].filter(Boolean);

  return selectedTargets.map((target) => {
    const { damage, isCrit } = calculateDamage(
      unit.stats,
      target.stats,
      damageOptions[actionType] || damageOptions.damage_single,
    );

    target.currentHp = Math.max(0, target.currentHp - damage);

    return {
      turn,
      attacker: unit.instanceId,
      attackerName: unit.name,
      attackerMpAfter,
      target: target.instanceId,
      targetName: target.name,
      actionLabel,
      actionType,
      damage,
      isCrit,
      isHeal: false,
      targetRemainingHp: target.currentHp,
    };
  });
}

function resolveHealingAction({
  unit,
  allies,
  opponents,
  turn,
  actionType,
  actionLabel,
  attackerMpAfter,
}) {
  const livingAllies = allies.filter((ally) => ally.currentHp > 0);
  const injuredAllies = livingAllies.filter(
    (ally) => ally.currentHp < ally.maxHp,
  );

  if (injuredAllies.length === 0) {
    return resolveDamageAction({
      unit,
      opponents,
      turn,
      actionType: "damage_burst",
      actionLabel:
        actionLabel === "Curación" ? "Ataque de Emergencia" : actionLabel,
      targeting: "lowestHp",
      attackerMpAfter,
    });
  }

  const selectedTargets =
    actionType === "heal_all"
      ? sortByPriority(injuredAllies, "lowestHp")
      : [chooseTarget(injuredAllies, "lowestHp")].filter(Boolean);

  return selectedTargets.map((target) => {
    const healAmount = calculateHealing(
      unit,
      actionType === "heal_all" ? 0.95 : 1.15,
    );

    target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);

    return {
      turn,
      attacker: unit.instanceId,
      attackerName: unit.name,
      attackerMpAfter,
      target: target.instanceId,
      targetName: target.name,
      actionLabel,
      actionType,
      damage: healAmount,
      isCrit: false,
      isHeal: true,
      targetRemainingHp: target.currentHp,
    };
  });
}

function resolveUnitAction({ unit, allies, opponents, turn }) {
  const profile = buildSkillProfile(unit);
  const hasUltimateReady = unit.currentMp >= MAX_MP;
  const livingAllies = allies.filter((ally) => ally.currentHp > 0);
  const needsHealing = livingAllies.some(
    (ally) => ally.currentHp / ally.maxHp < 0.65,
  );

  let actionType = profile.basicType;
  let actionLabel = profile.basicLabel;
  let targeting = profile.targeting;

  if (hasUltimateReady) {
    actionType = profile.ultimateType;
    actionLabel = profile.ultimateLabel;
  } else if (profile.basicType === "heal_single" && !needsHealing) {
    actionType = "damage_single";
    actionLabel = "Ataque";
  }

  const attackerMpAfter = hasUltimateReady
    ? 0
    : Math.min(MAX_MP, unit.currentMp + BASIC_MP_GAIN);

  unit.currentMp = attackerMpAfter;

  if (actionType === "heal_single" || actionType === "heal_all") {
    return resolveHealingAction({
      unit,
      allies,
      opponents,
      turn,
      actionType,
      actionLabel,
      attackerMpAfter,
    });
  }

  return resolveDamageAction({
    unit,
    opponents,
    turn,
    actionType,
    actionLabel,
    targeting,
    attackerMpAfter,
  });
}

// Simular batalla
async function simulateBattle(usuarioId, stageId, selectedHeroIds) {
  const usuario = await User.findById(usuarioId);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const [stage, allStages, enemyCatalog] = await Promise.all([
    getStageById(stageId),
    getStageCatalog(),
    getEnemyCatalog(),
  ]);
  if (!stage) {
    throw new Error("Stage no encontrado");
  }

  const stageEconomy = getLiveStageEconomy(stage);

  if (usuario.energy < stageEconomy.energyCost) {
    throw new Error("No tienes suficiente energía");
  }

  const heroesToUse = getHeroesToUse(usuario, selectedHeroIds);
  usuario.energy -= stageEconomy.energyCost;

  const heroTeam = buildHeroTeam(heroesToUse);
  const enemyTeam = buildEnemyTeam(stage, buildEnemyCatalogMap(enemyCatalog));
  const publicStage = buildPublicStage(stage);
  const initialHeroes = heroTeam.map((hero) => ({
    name: hero.name,
    heroId: hero.heroId,
    role: hero.role,
    instanceId: hero.instanceId,
    currentHp: hero.maxHp,
    maxHp: hero.maxHp,
    currentMp: 0,
    maxMp: hero.maxMp,
  }));
  const initialEnemies = enemyTeam.map((enemy) => ({
    name: enemy.name,
    enemyId: enemy.enemyId,
    instanceId: enemy.instanceId,
    color: enemy.color,
    imageUri: buildAssetUrl(enemy.asset),
    currentHp: enemy.maxHp,
    maxHp: enemy.maxHp,
    currentMp: enemy.currentMp,
    maxMp: enemy.maxMp,
  }));

  const encounter = runEncounter(heroTeam, enemyTeam, {
    includeBattleLog: true,
  });
  const { victory, turns, heroesRemaining, enemiesRemaining, battleLog } =
    encounter;

  registerStageResult(stage.stageId, victory);

  let rewards = {
    experience: 0,
    gold: 0,
    gems: 0,
  };

  if (victory) {
    rewards = {
      experience: stageEconomy.rewards.experience,
      gold: stageEconomy.rewards.gold,
      gems: stageEconomy.rewards.gems,
    };

    usuario.experience += rewards.experience;
    usuario.gold += rewards.gold;
    usuario.gems += rewards.gems;

    const expNeeded = usuario.accountLevel * 100;
    if (usuario.experience >= expNeeded) {
      usuario.accountLevel += 1;
      usuario.experience -= expNeeded;
      usuario.maxEnergy += 5;
    }

    if (
      usuario.progress.zone === stage.zone &&
      usuario.progress.stage === stage.stageNumber
    ) {
      usuario.progress.stage += 1;
      const stagesInZone = allStages.filter(
        (zoneStage) => zoneStage.zone === stage.zone,
      ).length;
      if (usuario.progress.stage > stagesInZone) {
        usuario.progress.zone += 1;
        usuario.progress.stage = 1;
      }
    }

    const participatingHeroIds = heroTeam.map((hero) => hero.heroId);
    const expPerHero = Math.floor(
      rewards.experience / participatingHeroIds.length,
    );

    for (let index = 0; index < usuario.heroes.length; index++) {
      const userHero = usuario.heroes[index];
      if (!participatingHeroIds.includes(userHero.heroId)) {
        continue;
      }

      const catalogHero = BASE_HEROES.find(
        (baseHero) => baseHero._id === userHero.heroId,
      );
      userHero.experience += expPerHero;

      while (userHero.level < 100) {
        const requiredExp = calculateHeroExpForLevel(
          userHero.level + 1,
          catalogHero?.rarity || userHero.rarity,
        );

        if (userHero.experience < requiredExp) {
          break;
        }

        userHero.level += 1;
        userHero.experience -= requiredExp;
      }

      if (catalogHero) {
        userHero.stats = calculateHeroStatsForLevel(
          catalogHero.stats,
          userHero.level,
          catalogHero.rarity,
        );
      }
    }
  }

  await usuario.save();

  const updatedMetrics = getStageMetrics(stage.stageId);

  return {
    victory,
    turns,
    heroesRemaining,
    enemiesRemaining,
    rewards: victory ? rewards : null,
    battleLog,
    initialHeroes,
    initialEnemies,
    stage: publicStage,
    backgroundImageUri: publicStage.backgroundImageUri,
    stageEconomy: {
      ...stageEconomy,
      observedWinRate: updatedMetrics?.winRate ?? stageEconomy.observedWinRate,
      sampleSize: updatedMetrics?.total ?? stageEconomy.sampleSize,
    },
    userStats: {
      level: usuario.accountLevel,
      experience: usuario.experience,
      energy: usuario.energy,
      gold: usuario.gold,
      gems: usuario.gems,
      progress: usuario.progress,
    },
  };
}

async function simulateManyBattles(
  usuarioId,
  stageId,
  selectedHeroIds,
  runs = 200,
) {
  const usuario = await User.findById(usuarioId);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const [stage, enemyCatalog] = await Promise.all([
    getStageById(stageId),
    getEnemyCatalog(),
  ]);
  if (!stage) {
    throw new Error("Stage no encontrado");
  }

  const heroesToUse = getHeroesToUse(usuario, selectedHeroIds);
  const totalRuns = clamp(Number(runs) || 200, 1, MAX_SIMULATION_RUNS);
  const enemyCatalogMap = buildEnemyCatalogMap(enemyCatalog);

  let wins = 0;
  let totalTurns = 0;
  let totalHeroesRemaining = 0;
  let totalEnemiesRemaining = 0;

  for (let index = 0; index < totalRuns; index++) {
    const heroTeam = buildHeroTeam(heroesToUse);
    const enemyTeam = buildEnemyTeam(stage, enemyCatalogMap);
    const result = runEncounter(heroTeam, enemyTeam, {
      includeBattleLog: false,
    });

    if (result.victory) {
      wins += 1;
    }

    totalTurns += result.turns;
    totalHeroesRemaining += result.heroesRemaining;
    totalEnemiesRemaining += result.enemiesRemaining;
  }

  const winRate = wins / totalRuns;
  const projectedEconomy = applyAdaptiveEconomy(stage, winRate, totalRuns);
  const currentMetrics = getStageMetrics(stage.stageId);
  const liveEconomy = getLiveStageEconomy(stage);

  return {
    stageId: stage.stageId,
    zone: stage.zone,
    stageNumber: stage.stageNumber,
    runs: totalRuns,
    wins,
    losses: totalRuns - wins,
    winRate,
    averageTurns: Number((totalTurns / totalRuns).toFixed(2)),
    averageHeroesRemaining: Number(
      (totalHeroesRemaining / totalRuns).toFixed(2),
    ),
    averageEnemiesRemaining: Number(
      (totalEnemiesRemaining / totalRuns).toFixed(2),
    ),
    baselineEconomy: buildStageEconomy(stage),
    projectedEconomy,
    liveEconomy,
    liveStageMetrics: {
      sampleSize: currentMetrics?.total || 0,
      winRate: currentMetrics?.winRate || null,
    },
  };
}

// Obtener stages disponibles para el usuario
async function getAvailableStages(usuarioId) {
  const usuario = await User.findById(usuarioId);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const stageCatalog = await getStageCatalog();

  const currentZone = usuario.progress.zone;
  const currentStage = usuario.progress.stage;

  // Filtrar stages disponibles (hasta el siguiente al actual)
  const availableStages = stageCatalog
    .filter((s) => {
      if (s.zone < currentZone) return true;
      if (s.zone === currentZone && s.stageNumber <= currentStage) return true;
      return false;
    })
    .map(buildPublicStage);

  return {
    stages: availableStages,
    currentProgress: usuario.progress,
  };
}

// Regenerar energía
async function regenerateEnergy(usuarioId) {
  const usuario = await User.findById(usuarioId);
  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const now = new Date();
  const lastRefresh = new Date(usuario.lastEnergyRefresh || now);
  const minutesPassed = Math.floor((now - lastRefresh) / (1000 * 60));

  if (minutesPassed > 0) {
    const energyToAdd = minutesPassed * ENERGY_REGEN_RATE;
    usuario.energy = Math.min(
      usuario.maxEnergy || MAX_ENERGY,
      usuario.energy + energyToAdd,
    );
    usuario.lastEnergyRefresh = now;
    await usuario.save();
  }

  return {
    energy: usuario.energy,
    maxEnergy: usuario.maxEnergy || MAX_ENERGY,
  };
}

module.exports = {
  simulateBattle,
  simulateManyBattles,
  getAvailableStages,
  regenerateEnergy,
};
