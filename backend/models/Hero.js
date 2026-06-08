// Modelo de Héroes disponibles en el juego
const mongoose = require("mongoose");

const BATTLE_ACTION_TYPES = [
  "damage_single",
  "damage_burst",
  "damage_aoe",
  "damage_execute",
  "heal_single",
  "heal_all",
];

const ROLE_TYPES = [
  "tank",
  "fighter",
  "assassin",
  "mage",
  "ranger",
  "healer",
  "support",
];

const createBattleKit = ({
  summary,
  passiveName,
  passiveEffect,
  basic,
  ultimate,
}) => ({
  summary,
  passiveName,
  passiveEffect,
  basic,
  ultimate,
});

// Esquema para los héroes del catálogo del juego
const HeroSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "",
  },
  element: {
    type: String,
    enum: ["fire", "water", "earth", "wind", "light", "dark"],
    required: true,
  },
  rarity: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  splashArt: {
    type: String,
    default: "",
  },
  pixelArt: {
    type: String,
    default: "",
  },
  stats: {
    hp: { type: Number, default: 100 },
    attack: { type: Number, default: 10 },
    defense: { type: Number, default: 10 },
    speed: { type: Number, default: 10 },
  },
  role: {
    type: String,
    enum: ROLE_TYPES,
    default: "fighter",
  },
  skills: {
    passive: { type: String, default: "" },
    basic: { type: String, default: "" },
    ultimate: { type: String, default: "" },
  },
  battleKit: {
    summary: { type: String, default: "" },
    passiveName: { type: String, default: "" },
    passiveEffect: { type: String, default: "" },
    basic: {
      name: { type: String, default: "Ataque" },
      type: {
        type: String,
        enum: BATTLE_ACTION_TYPES,
        default: "damage_single",
      },
      target: { type: String, default: "lowestHp" },
    },
    ultimate: {
      name: { type: String, default: "Límite" },
      type: {
        type: String,
        enum: BATTLE_ACTION_TYPES,
        default: "damage_burst",
      },
      target: { type: String, default: "lowestHp" },
    },
  },
  resonancePieces: {
    type: Number,
    default: 0,
  },
});

const Hero = mongoose.model("Hero", HeroSchema);

// Héroes base del juego
const BASE_HEROES = [
  // === HÉROES LEGENDARIOS (5 estrellas) ===
  {
    _id: "hero_durnan",
    name: "Durnan",
    title: "Master of the Yawning Portal",
    element: "earth",
    rarity: 5,
    splashArt: "/assets/heroes/durnan/portrait.png",
    pixelArt: "/assets/heroes/durnan/icon.png",
    stats: { hp: 1200, attack: 200, defense: 180, speed: 90 },
    role: "tank",
    skills: {
      passive: "skill_durnan_passive",
      basic: "skill_durnan_slash",
      ultimate: "skill_durnan_whirlwind",
    },
    battleKit: createBattleKit({
      summary:
        "Tanque legendario que fija amenazas y limpia oleadas con control de línea frontal.",
      passiveName: "Veterano del Portal",
      passiveEffect:
        "Su aguante escala mejor cuando es el primero en recibir presión.",
      basic: {
        name: "Espadazo Maestro",
        type: "damage_single",
        target: "highestAttack",
      },
      ultimate: {
        name: "Torbellino del Portal",
        type: "damage_aoe",
        target: "lowestHp",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_yuna",
    name: "Yuna",
    title: "High Summoner of Spira",
    element: "light",
    rarity: 5,
    splashArt: "/assets/heroes/yuna/portrait.png",
    pixelArt: "/assets/heroes/yuna/icon.png",
    stats: { hp: 850, attack: 120, defense: 100, speed: 140 },
    role: "healer",
    skills: {
      passive: "skill_yuna_passive",
      basic: "skill_yuna_heal",
      ultimate: "skill_yuna_summon",
    },
    battleKit: createBattleKit({
      summary:
        "Sanadora premium con sustain selectivo y ultimate ofensiva para remontar combates largos.",
      passiveName: "Plegaria de Spira",
      passiveEffect:
        "Mantiene al equipo por encima del umbral crítico y acelera remontadas.",
      basic: {
        name: "Rezo Restaurador",
        type: "heal_single",
        target: "lowestHp",
      },
      ultimate: {
        name: "Valefor Ascendente",
        type: "damage_aoe",
        target: "lowestDefense",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_rain",
    name: "Rain",
    title: "Knight of Grandshelt",
    element: "fire",
    rarity: 4,
    splashArt: "/assets/heroes/rain/portrait.png",
    pixelArt: "/assets/heroes/rain/icon.png",
    stats: { hp: 1200, attack: 220, defense: 180, speed: 120 },
    role: "fighter",
    skills: {
      passive: "skill_rain_passive",
      basic: "skill_rain_slash",
      ultimate: "skill_rain_lasswell_combo",
    },
    battleKit: createBattleKit({
      summary:
        "Luchador ofensivo que acelera la presión del grupo y remata frentes debilitados.",
      passiveName: "Juramento de Grandshelt",
      passiveEffect:
        "Aumenta su presencia en combate cuando encadena acciones ofensivas.",
      basic: {
        name: "Tajo Ardiente",
        type: "damage_burst",
        target: "lowestHp",
      },
      ultimate: {
        name: "Combo Gemelo",
        type: "damage_aoe",
        target: "lowestHp",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_hendrikka",
    name: "Hendrikka",
    title: "La Hija del Cuervo",
    element: "dark",
    rarity: 5,
    splashArt: "/assets/heroes/hendrikka/portrait.png",
    pixelArt: "/assets/heroes/hendrikka/Hendrikka Idle V2.png",
    stats: { hp: 950, attack: 240, defense: 120, speed: 150 },
    role: "assassin",
    skills: {
      passive: "skill_hendrikka_shadow_form",
      basic: "skill_hendrikka_raven_strike",
      ultimate: "skill_hendrikka_darkness_embrace",
    },
    battleKit: createBattleKit({
      summary:
        "Asesina de pick-off que neutraliza soportes y amenazas traseras con presión quirúrgica.",
      passiveName: "Forma del Cuervo",
      passiveEffect:
        "Encuentra huecos en la retaguardia y castiga rivales vulnerables.",
      basic: {
        name: "Raven Strike",
        type: "damage_execute",
        target: "lowestHp",
      },
      ultimate: {
        name: "Darkness Embrace",
        type: "damage_burst",
        target: "highestAttack",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_cloud",
    name: "Cloud",
    title: "SOLDIER 1st Class",
    element: "wind",
    rarity: 5,
    splashArt: "/assets/heroes/cloud/portrait.png",
    pixelArt: "/assets/heroes/cloud/207000105_idle.png",
    stats: { hp: 1100, attack: 250, defense: 140, speed: 130 },
    role: "fighter",
    skills: {
      passive: "skill_cloud_limit_break",
      basic: "skill_cloud_braver",
      ultimate: "skill_cloud_omnislash",
    },
    battleKit: createBattleKit({
      summary:
        "Guerrero versátil con alto daño burst y capacidad de rematar objetivos debilitados.",
      passiveName: "Límite Acumulado",
      passiveEffect:
        "Acumula poder con cada golpe recibido, aumentando el daño de su ultimate.",
      basic: { name: "Braver", type: "damage_burst", target: "highestAttack" },
      ultimate: { name: "Omnislash", type: "damage_aoe", target: "lowestHp" },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_terra",
    name: "Terra",
    title: "Esper Maiden",
    element: "fire",
    rarity: 5,
    splashArt: "/assets/heroes/terra/portrait.png",
    pixelArt: "/assets/heroes/terra/206000103_idle.png",
    stats: { hp: 800, attack: 280, defense: 100, speed: 145 },
    role: "mage",
    skills: {
      passive: "skill_terra_trance",
      basic: "skill_terra_fire",
      ultimate: "skill_terra_riot_blade",
    },
    battleKit: createBattleKit({
      summary:
        "Maga devastadora con daño elemental masivo y transformación que potencia sus habilidades.",
      passiveName: "Trance",
      passiveEffect:
        "Al bajar de 50% HP, entra en Trance duplicando su daño mágico.",
      basic: { name: "Firaga", type: "damage_burst", target: "lowestDefense" },
      ultimate: {
        name: "Riot Blade",
        type: "damage_aoe",
        target: "lowestDefense",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_tifa",
    name: "Tifa",
    title: "Martial Arts Master",
    element: "earth",
    rarity: 5,
    splashArt: "/assets/heroes/tifa/portrait.png",
    pixelArt: "/assets/heroes/tifa/unit_idle_207000307.png",
    stats: { hp: 950, attack: 230, defense: 120, speed: 160 },
    role: "fighter",
    skills: {
      passive: "skill_tifa_unbridled_strength",
      basic: "skill_tifa_beat_rush",
      ultimate: "skill_tifa_final_heaven",
    },
    battleKit: createBattleKit({
      summary:
        "Luchadora ágil que encadena combos devastadores y aumenta daño con cada golpe.",
      passiveName: "Fuerza Desatada",
      passiveEffect:
        "Cada ataque básico aumenta el daño del siguiente en un 15%.",
      basic: { name: "Beat Rush", type: "damage_burst", target: "lowestHp" },
      ultimate: {
        name: "Final Heaven",
        type: "damage_execute",
        target: "lowestHp",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_vivi",
    name: "Vivi",
    title: "Black Mage of Alexandria",
    element: "fire",
    rarity: 4,
    splashArt: "/assets/heroes/vivi/portrait.png",
    pixelArt: "/assets/heroes/vivi/209000203_idle.png",
    stats: { hp: 700, attack: 300, defense: 80, speed: 135 },
    role: "mage",
    skills: {
      passive: "skill_vivi_focus",
      basic: "skill_vivi_fire",
      ultimate: "skill_vivi_doomsday",
    },
    battleKit: createBattleKit({
      summary:
        "Mago negro con el mayor daño mágico del juego pero frágil en defensa.",
      passiveName: "Concentración",
      passiveEffect:
        "Sus hechizos ignoran el 30% de la defensa mágica enemiga.",
      basic: { name: "Fire", type: "damage_burst", target: "lowestDefense" },
      ultimate: {
        name: "Doomsday",
        type: "damage_aoe",
        target: "lowestDefense",
      },
    }),
    resonancePieces: 0,
  },
  // === HÉROES ÉPICOS (4 estrellas) ===
  {
    _id: "hero_tidus",
    name: "Tidus",
    title: "Star Player of Zanarkand",
    element: "water",
    rarity: 4,
    splashArt: "/assets/heroes/tidus/portrait.png",
    pixelArt: "/assets/heroes/tidus/210000105_idle.png",
    stats: { hp: 750, attack: 180, defense: 100, speed: 155 },
    role: "fighter",
    skills: {
      passive: "skill_tidus_quick_hit",
      basic: "skill_tidus_slash",
      ultimate: "skill_tidus_blitz_ace",
    },
    battleKit: createBattleKit({
      summary: "Luchador ágil con alta velocidad que encadena ataques rápidos.",
      passiveName: "Ataque Rápido",
      passiveEffect: "Tiene probabilidad de atacar dos veces por turno.",
      basic: { name: "Slash Combo", type: "damage_burst", target: "lowestHp" },
      ultimate: { name: "Blitz Ace", type: "damage_aoe", target: "lowestHp" },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_steiner",
    name: "Steiner",
    title: "Captain of Pluto Knights",
    element: "earth",
    rarity: 4,
    splashArt: "/assets/heroes/steiner/portrait.png",
    pixelArt: "/assets/heroes/steiner/unit_idle_209003005.png",
    stats: { hp: 900, attack: 160, defense: 180, speed: 80 },
    role: "tank",
    skills: {
      passive: "skill_steiner_protect",
      basic: "skill_steiner_sword_art",
      ultimate: "skill_steiner_shock",
    },
    battleKit: createBattleKit({
      summary:
        "Caballero leal con alta defensa que protege a los aliados más débiles.",
      passiveName: "Protector Real",
      passiveEffect:
        "Intercepta ataques dirigidos a aliados con menos del 30% HP.",
      basic: {
        name: "Sword Art",
        type: "damage_single",
        target: "highestAttack",
      },
      ultimate: {
        name: "Shock",
        type: "damage_burst",
        target: "highestAttack",
      },
    }),
    resonancePieces: 0,
  },
  {
    _id: "hero_barbariccia",
    name: "Barbariccia",
    title: "Empress of the Winds",
    element: "wind",
    rarity: 4,
    splashArt: "/assets/heroes/barbariccia/portrait.png",
    pixelArt: "/assets/heroes/barbariccia/401001406_idle.png",
    stats: { hp: 650, attack: 190, defense: 90, speed: 140 },
    role: "mage",
    skills: {
      passive: "skill_barbariccia_tornado",
      basic: "skill_barbariccia_aero",
      ultimate: "skill_barbariccia_maelstrom",
    },
    battleKit: createBattleKit({
      summary:
        "Maga de viento con ataques en área que debilitan la defensa enemiga.",
      passiveName: "Señora del Tornado",
      passiveEffect: "Sus ataques reducen la defensa enemiga en un 10%.",
      basic: { name: "Aeroga", type: "damage_burst", target: "lowestDefense" },
      ultimate: {
        name: "Maelstrom",
        type: "damage_aoe",
        target: "lowestDefense",
      },
    }),
    resonancePieces: 0,
  },
  // === HÉROES ÉPICOS (4 estrellas) ===
  {
    _id: "hero_red_xiii",
    name: "Red XIII",
    title: "Guardian of Cosmo Canyon",
    element: "earth",
    rarity: 4,
    splashArt: "/assets/heroes/red_xiii/portrait.png",
    pixelArt: "/assets/heroes/red_xiii/unit_idle_207000505.png",
    stats: { hp: 550, attack: 130, defense: 90, speed: 135 },
    role: "support",
    skills: {
      passive: "skill_red_lunatic_high",
      basic: "skill_red_sled_fang",
      ultimate: "skill_red_cosmo_memory",
    },
    battleKit: createBattleKit({
      summary:
        "Bestia sabia que apoya al grupo con buffs de velocidad y resistencia.",
      passiveName: "Lunatic High",
      passiveEffect:
        "Al inicio del combate, aumenta la velocidad de todo el equipo.",
      basic: { name: "Sled Fang", type: "damage_single", target: "lowestHp" },
      ultimate: {
        name: "Cosmo Memory",
        type: "damage_burst",
        target: "lowestHp",
      },
    }),
    resonancePieces: 0,
  },
];

// Función para sembrar héroes base en la BD
async function seedHeroes() {
  try {
    for (const hero of BASE_HEROES) {
      await Hero.findOneAndUpdate({ _id: hero._id }, hero, {
        upsert: true,
        new: true,
      });
    }
    console.log("Héroes base sembrados correctamente");
  } catch (error) {
    console.error("Error al sembrar héroes:", error);
  }
}

module.exports = { Hero, BASE_HEROES, seedHeroes };
