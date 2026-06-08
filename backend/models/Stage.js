// Modelo de Stages/Niveles del juego
const mongoose = require("mongoose");

// Esquema para los enemigos dentro de un stage
const StageEnemySchema = new mongoose.Schema({
  enemyId: { type: String, required: true },
  name: String,
  quantity: { type: Number, default: 1 },
  isBoss: { type: Boolean, default: false },
});

// Esquema para los stages
const StageSchema = new mongoose.Schema({
  stageId: {
    type: String,
    unique: true,
    required: true,
  },
  zone: {
    type: Number,
    required: true,
  },
  stageNumber: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  enemies: [StageEnemySchema],
  energyCost: {
    type: Number,
    default: 5,
  },
  rewards: {
    experience: { type: Number, default: 50 },
    gold: { type: Number, default: 100 },
    gems: { type: Number, default: 0 },
  },
  backgroundAsset: {
    fileName: String,
    imagePath: String,
  },
  difficulty: {
    type: String,
    enum: ["easy", "normal", "hard", "extreme"],
    default: "normal",
  },
});

const Stage = mongoose.model("Stage", StageSchema);

const BACKGROUND_ASSETS_BY_ZONE = {
  1: {
    fileName: "ArgusPlains.jpg",
    imagePath: "/assets/backgrounds/ArgusPlains.jpg",
  },
  2: {
    fileName: "BrownSands.jpg",
    imagePath: "/assets/backgrounds/BrownSands.jpg",
  },
  3: {
    fileName: "Expedition.jpg",
    imagePath: "/assets/backgrounds/Expedition.jpg",
  },
  4: {
    fileName: "ArgusPlains.jpg",
    imagePath: "/assets/backgrounds/ArgusPlains.jpg",
  },
};

// Stages base del juego
const BASE_STAGES = [
  // Zona 1: Bosque de los Susurros
  {
    stageId: "stage_1_1",
    zone: 1,
    stageNumber: 1,
    name: "Entrada del Bosque",
    description: "Los primeros pasos en el bosque encantado.",
    enemies: [{ enemyId: "enemy_goblin", name: "Goblin", quantity: 3 }],
    energyCost: 5,
    rewards: { experience: 30, gold: 100, gems: 0 },
    difficulty: "easy",
  },
  {
    stageId: "stage_1_2",
    zone: 1,
    stageNumber: 2,
    name: "Sendero Oscuro",
    description: "El camino se vuelve más peligroso.",
    enemies: [
      { enemyId: "enemy_goblin", name: "Goblin", quantity: 2 },
      { enemyId: "enemy_wolf", name: "Lobo", quantity: 2 },
    ],
    energyCost: 5,
    rewards: { experience: 50, gold: 150, gems: 0 },
    difficulty: "easy",
  },
  {
    stageId: "stage_1_3",
    zone: 1,
    stageNumber: 3,
    name: "Claro del Bosque",
    description: "Un claro donde acechan los enemigos.",
    enemies: [
      { enemyId: "enemy_wolf", name: "Lobo", quantity: 3 },
      { enemyId: "enemy_goblin_archer", name: "Goblin Arquero", quantity: 2 },
    ],
    energyCost: 6,
    rewards: { experience: 70, gold: 200, gems: 5 },
    difficulty: "normal",
  },
  {
    stageId: "stage_1_4",
    zone: 1,
    stageNumber: 4,
    name: "Campamento Goblin",
    description: "Un pequeño campamento de goblins.",
    enemies: [
      { enemyId: "enemy_goblin", name: "Goblin", quantity: 4 },
      { enemyId: "enemy_goblin_archer", name: "Goblin Arquero", quantity: 2 },
    ],
    energyCost: 6,
    rewards: { experience: 90, gold: 250, gems: 5 },
    difficulty: "normal",
  },
  {
    stageId: "stage_1_5",
    zone: 1,
    stageNumber: 5,
    name: "Miniboss: Manada de Lobos",
    description: "Una feroz manada liderada por un chamán.",
    enemies: [
      { enemyId: "enemy_wolf", name: "Lobo", quantity: 4 },
      { enemyId: "enemy_goblin_shaman", name: "Chamán Goblin", quantity: 1 },
    ],
    energyCost: 7,
    rewards: { experience: 120, gold: 350, gems: 10 },
    difficulty: "hard",
  },
  {
    stageId: "stage_1_6",
    zone: 1,
    stageNumber: 6,
    name: "Bosque Profundo",
    description: "La vegetación es cada vez más densa.",
    enemies: [
      { enemyId: "enemy_goblin_archer", name: "Goblin Arquero", quantity: 4 },
      { enemyId: "enemy_wolf", name: "Lobo", quantity: 2 },
    ],
    energyCost: 7,
    rewards: { experience: 130, gold: 380, gems: 10 },
    difficulty: "normal",
  },
  {
    stageId: "stage_1_7",
    zone: 1,
    stageNumber: 7,
    name: "Guarida Goblin",
    description: "La guarida principal de los goblins.",
    enemies: [
      { enemyId: "enemy_goblin", name: "Goblin", quantity: 5 },
      { enemyId: "enemy_goblin_shaman", name: "Chamán Goblin", quantity: 2 },
    ],
    energyCost: 8,
    rewards: { experience: 150, gold: 450, gems: 15 },
    difficulty: "hard",
  },
  {
    stageId: "stage_1_8",
    zone: 1,
    stageNumber: 8,
    name: "Puente del Troll",
    description: "Un puente vigilado celosamente.",
    enemies: [
      { enemyId: "enemy_wolf", name: "Lobo", quantity: 5 },
      { enemyId: "enemy_goblin_archer", name: "Goblin Arquero", quantity: 3 },
    ],
    energyCost: 8,
    rewards: { experience: 170, gold: 500, gems: 15 },
    difficulty: "hard",
  },
  {
    stageId: "stage_1_9",
    zone: 1,
    stageNumber: 9,
    name: "Antesala del Jefe",
    description: "Las defensas de élite de los goblins.",
    enemies: [
      { enemyId: "enemy_goblin", name: "Goblin", quantity: 4 },
      { enemyId: "enemy_goblin_shaman", name: "Chamán Goblin", quantity: 2 },
      { enemyId: "enemy_goblin_archer", name: "Goblin Arquero", quantity: 2 },
    ],
    energyCost: 9,
    rewards: { experience: 200, gold: 600, gems: 20 },
    difficulty: "hard",
  },
  {
    stageId: "stage_1_10",
    zone: 1,
    stageNumber: 10,
    name: "Boss: Jefe Goblin",
    description: "El temible líder de todo el bosque.",
    enemies: [
      { enemyId: "enemy_goblin_shaman", name: "Chamán Goblin", quantity: 2 },
      {
        enemyId: "enemy_goblin_chief",
        name: "Jefe Goblin",
        quantity: 1,
        isBoss: true,
      },
    ],
    energyCost: 12,
    rewards: { experience: 350, gold: 1000, gems: 100 },
    difficulty: "extreme",
  },
  // Zona 2: Cavernas Sombrías
  {
    stageId: "stage_2_1",
    zone: 2,
    stageNumber: 1,
    name: "Entrada de la Caverna",
    description: "Las cavernas oscurecen el camino.",
    enemies: [
      { enemyId: "enemy_bat", name: "Murciélago", quantity: 4 },
      { enemyId: "enemy_spider", name: "Araña", quantity: 2 },
    ],
    energyCost: 8,
    rewards: { experience: 120, gold: 250, gems: 0 },
    difficulty: "normal",
  },
  {
    stageId: "stage_2_2",
    zone: 2,
    stageNumber: 2,
    name: "Túneles Profundos",
    description: "Los túneles se hacen más estrechos.",
    enemies: [
      { enemyId: "enemy_spider", name: "Araña", quantity: 3 },
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 2 },
    ],
    energyCost: 8,
    rewards: { experience: 150, gold: 300, gems: 5 },
    difficulty: "normal",
  },
  {
    stageId: "stage_2_3",
    zone: 2,
    stageNumber: 3,
    name: "Cámara de Huesos",
    description: "Una cámara llena de restos antiguos.",
    enemies: [
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 4 },
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 1 },
    ],
    energyCost: 9,
    rewards: { experience: 180, gold: 400, gems: 10 },
    difficulty: "hard",
  },
  {
    stageId: "stage_2_4",
    zone: 2,
    stageNumber: 4,
    name: "Pozo de Murciélagos",
    description: "Un nido donde los chillidos desorientan a los aventureros.",
    enemies: [
      { enemyId: "enemy_bat", name: "Murciélago", quantity: 5 },
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 2 },
    ],
    energyCost: 9,
    rewards: { experience: 210, gold: 460, gems: 10 },
    difficulty: "hard",
  },
  {
    stageId: "stage_2_5",
    zone: 2,
    stageNumber: 5,
    name: "Laboratorio Profanado",
    description: "Restos de alquimia oscura alimentan enemigos inestables.",
    enemies: [
      { enemyId: "enemy_spider", name: "Araña", quantity: 3 },
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 2 },
    ],
    energyCost: 10,
    rewards: { experience: 250, gold: 540, gems: 15 },
    difficulty: "hard",
  },
  {
    stageId: "stage_2_6",
    zone: 2,
    stageNumber: 6,
    name: "Galería Inundada",
    description: "Pasadizos estrechos donde acechan esqueletos olvidados.",
    enemies: [
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 4 },
      { enemyId: "enemy_spider", name: "Araña", quantity: 3 },
    ],
    energyCost: 10,
    rewards: { experience: 280, gold: 620, gems: 15 },
    difficulty: "hard",
  },
  {
    stageId: "stage_2_7",
    zone: 2,
    stageNumber: 7,
    name: "Tumba del Vigía",
    description: "Un guardián no-muerto protege antiguas reliquias.",
    enemies: [
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 3 },
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 2 },
      { enemyId: "enemy_orc", name: "Orco", quantity: 1 },
    ],
    energyCost: 11,
    rewards: { experience: 320, gold: 700, gems: 20 },
    difficulty: "hard",
  },
  {
    stageId: "stage_2_8",
    zone: 2,
    stageNumber: 8,
    name: "Santuario de Sombras",
    description: "La oscuridad absorbe luz y voluntad por igual.",
    enemies: [
      { enemyId: "enemy_bat", name: "Murciélago", quantity: 4 },
      { enemyId: "enemy_dark_knight", name: "Caballero Oscuro", quantity: 1 },
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 1 },
    ],
    energyCost: 11,
    rewards: { experience: 360, gold: 780, gems: 25 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_2_9",
    zone: 2,
    stageNumber: 9,
    name: "Cámara del Eco",
    description: "Los enemigos coordinan ataques desde múltiples frentes.",
    enemies: [
      { enemyId: "enemy_spider", name: "Araña", quantity: 3 },
      { enemyId: "enemy_dark_knight", name: "Caballero Oscuro", quantity: 1 },
      { enemyId: "enemy_skeleton", name: "Esqueleto", quantity: 2 },
    ],
    energyCost: 12,
    rewards: { experience: 420, gold: 860, gems: 30 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_2_10",
    zone: 2,
    stageNumber: 10,
    name: "Boss: Cría de Dragón",
    description: "Una bestia ancestral despierta en lo profundo de la caverna.",
    enemies: [
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 2 },
      {
        enemyId: "enemy_dragon_whelp",
        name: "Cría de Dragón",
        quantity: 1,
        isBoss: true,
      },
    ],
    energyCost: 14,
    rewards: { experience: 600, gold: 1300, gems: 120 },
    difficulty: "extreme",
  },
  // Zona 3: Ruinas Arcanas
  {
    stageId: "stage_3_1",
    zone: 3,
    stageNumber: 1,
    name: "Atrio de Runas",
    description: "Las runas antiguas despiertan a los primeros guardianes.",
    enemies: [
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 3 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
    energyCost: 12,
    rewards: { experience: 420, gold: 900, gems: 20 },
    difficulty: "hard",
  },
  {
    stageId: "stage_3_2",
    zone: 3,
    stageNumber: 2,
    name: "Pasillo Resonante",
    description: "La magia residual potencia a los enemigos cercanos.",
    enemies: [
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 4 },
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 1,
      },
    ],
    energyCost: 12,
    rewards: { experience: 470, gold: 980, gems: 25 },
    difficulty: "hard",
  },
  {
    stageId: "stage_3_3",
    zone: 3,
    stageNumber: 3,
    name: "Biblioteca Sellada",
    description: "Tomos malditos alimentan guardianes de élite.",
    enemies: [
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 2,
      },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
    energyCost: 13,
    rewards: { experience: 520, gold: 1080, gems: 30 },
    difficulty: "hard",
  },
  {
    stageId: "stage_3_4",
    zone: 3,
    stageNumber: 4,
    name: "Patio de los Caídos",
    description: "Templarios desterrados protegen las puertas internas.",
    enemies: [
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 2 },
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 2 },
    ],
    energyCost: 13,
    rewards: { experience: 560, gold: 1160, gems: 35 },
    difficulty: "hard",
  },
  {
    stageId: "stage_3_5",
    zone: 3,
    stageNumber: 5,
    name: "Miniboss: Altar del Vacío",
    description: "Una guardia ritual combina magia y acero.",
    enemies: [
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 2,
      },
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 1 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
    energyCost: 14,
    rewards: { experience: 620, gold: 1260, gems: 45 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_3_6",
    zone: 3,
    stageNumber: 6,
    name: "Nexo Roto",
    description: "La inestabilidad arcana acelera el ritmo de combate.",
    enemies: [
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 4 },
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 1 },
    ],
    energyCost: 14,
    rewards: { experience: 670, gold: 1360, gems: 50 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_3_7",
    zone: 3,
    stageNumber: 7,
    name: "Sagrario Invertido",
    description: "Las defensas antiguas castigan errores tácticos.",
    enemies: [
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 2,
      },
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 3 },
    ],
    energyCost: 15,
    rewards: { experience: 720, gold: 1460, gems: 55 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_3_8",
    zone: 3,
    stageNumber: 8,
    name: "Galería de Obsidiana",
    description: "El vacío corrompe armaduras y voluntades.",
    enemies: [
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 2 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 3 },
    ],
    energyCost: 15,
    rewards: { experience: 770, gold: 1570, gems: 60 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_3_9",
    zone: 3,
    stageNumber: 9,
    name: "Antesala del Draco",
    description: "Un último cordón defensivo protege al jefe de zona.",
    enemies: [
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 2,
      },
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 2 },
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 2 },
    ],
    energyCost: 16,
    rewards: { experience: 830, gold: 1680, gems: 70 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_3_10",
    zone: 3,
    stageNumber: 10,
    name: "Boss: Draco Abisal",
    description: "Una criatura ancestral capaz de aniquilar escuadras enteras.",
    enemies: [
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 2 },
      {
        enemyId: "enemy_abyss_drake",
        name: "Draco Abisal",
        quantity: 1,
        isBoss: true,
      },
    ],
    energyCost: 18,
    rewards: { experience: 1150, gold: 2200, gems: 160 },
    difficulty: "extreme",
  },
  // Zona 4: Fortaleza del Vacío
  {
    stageId: "stage_4_1",
    zone: 4,
    stageNumber: 1,
    name: "Puerta Umbral",
    description:
      "La fortaleza del vacío impone presión desde el primer combate.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 1 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
    energyCost: 17,
    rewards: { experience: 980, gold: 1800, gems: 80 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_2",
    zone: 4,
    stageNumber: 2,
    name: "Bastión Fracturado",
    description: "Un ejército oscuro domina cada corredor del bastión.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 1,
      },
    ],
    energyCost: 18,
    rewards: { experience: 1080, gold: 1950, gems: 90 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_3",
    zone: 4,
    stageNumber: 3,
    name: "Anillo de Tormentas",
    description: "El vacío distorsiona ataques y castiga la mala prioridad.",
    enemies: [
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 3 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
    energyCost: 18,
    rewards: { experience: 1180, gold: 2100, gems: 100 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_4",
    zone: 4,
    stageNumber: 4,
    name: "Claustro Silente",
    description: "Las unidades de élite enemigas sincronizan burst letal.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
    ],
    energyCost: 19,
    rewards: { experience: 1280, gold: 2260, gems: 110 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_5",
    zone: 4,
    stageNumber: 5,
    name: "Miniboss: Patio del Eclipse",
    description:
      "Un comandante oscuro pone a prueba la supervivencia del grupo.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_dark_knight", name: "Caballero Oscuro", quantity: 1 },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
    ],
    energyCost: 20,
    rewards: { experience: 1420, gold: 2440, gems: 120 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_6",
    zone: 4,
    stageNumber: 6,
    name: "Galería de Acero Negro",
    description: "La defensa enemiga obliga a composiciones más tácticas.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 3,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 1 },
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 1 },
    ],
    energyCost: 20,
    rewards: { experience: 1540, gold: 2620, gems: 130 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_7",
    zone: 4,
    stageNumber: 7,
    name: "Núcleo Sombrío",
    description: "El flujo de batalla acelera y cada error cuesta caro.",
    enemies: [
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 3 },
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 2,
      },
    ],
    energyCost: 21,
    rewards: { experience: 1660, gold: 2810, gems: 140 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_8",
    zone: 4,
    stageNumber: 8,
    name: "Baluarte del Titán",
    description: "La fortaleza despliega su ala más resistente.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 3,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
    ],
    energyCost: 22,
    rewards: { experience: 1780, gold: 3000, gems: 150 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_9",
    zone: 4,
    stageNumber: 9,
    name: "Antesala del Trono Vacío",
    description: "Última barrera antes del enfrentamiento final.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
      { enemyId: "enemy_abyss_drake", name: "Draco Abisal", quantity: 1 },
    ],
    energyCost: 23,
    rewards: { experience: 1940, gold: 3220, gems: 170 },
    difficulty: "extreme",
  },
  {
    stageId: "stage_4_10",
    zone: 4,
    stageNumber: 10,
    name: "Boss: Titán del Pavor",
    description: "El combate más exigente del contenido actual.",
    enemies: [
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
      {
        enemyId: "enemy_dread_titan",
        name: "Titán del Pavor",
        quantity: 1,
        isBoss: true,
      },
    ],
    energyCost: 25,
    rewards: { experience: 2600, gold: 4200, gems: 250 },
    difficulty: "extreme",
  },
];

const STAGE_OVERRIDES = {
  stage_2_4: {
    description: "Un enjambre de depredadores acecha en la penumbra del pozo.",
    enemies: [
      { enemyId: "enemy_bat", name: "Murciélago", quantity: 3 },
      { enemyId: "enemy_killer_bee", name: "Abeja Asesina", quantity: 2 },
      { enemyId: "enemy_spider", name: "Araña", quantity: 1 },
    ],
  },
  stage_2_5: {
    enemies: [
      { enemyId: "enemy_blue_sphere", name: "Esfera Azul", quantity: 1 },
      { enemyId: "enemy_spider", name: "Araña", quantity: 2 },
      { enemyId: "enemy_skeleton_mage", name: "Esqueleto Mago", quantity: 1 },
    ],
  },
  stage_3_2: {
    enemies: [
      { enemyId: "enemy_cultist", name: "Cultista Arcano", quantity: 3 },
      { enemyId: "enemy_blue_sphere", name: "Esfera Azul", quantity: 1 },
      {
        enemyId: "enemy_arcane_sentinel",
        name: "Centinela Arcano",
        quantity: 1,
      },
    ],
  },
  stage_3_5: {
    enemies: [
      { enemyId: "enemy_carbuncle", name: "Garbúnculo", quantity: 1 },
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 1 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 2 },
    ],
  },
  stage_3_8: {
    enemies: [
      { enemyId: "enemy_templar", name: "Templario Caído", quantity: 1 },
      { enemyId: "enemy_deadly_eye", name: "Ojo Letal", quantity: 1 },
      { enemyId: "enemy_void_hound", name: "Sabueso del Vacío", quantity: 3 },
    ],
  },
  stage_4_2: {
    enemies: [
      { enemyId: "enemy_lycanthrope", name: "Licántropo", quantity: 1 },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 1 },
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
    ],
  },
  stage_4_6: {
    enemies: [
      { enemyId: "enemy_deadly_eye", name: "Ojo Letal", quantity: 1 },
      { enemyId: "enemy_lycanthrope", name: "Licántropo", quantity: 1 },
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 2,
      },
    ],
  },
  stage_4_9: {
    enemies: [
      { enemyId: "enemy_carbuncle", name: "Garbúnculo", quantity: 1 },
      { enemyId: "enemy_warlock", name: "Brujo del Eclipse", quantity: 2 },
      { enemyId: "enemy_deadly_eye", name: "Ojo Letal", quantity: 1 },
      {
        enemyId: "enemy_void_knight",
        name: "Caballero del Vacío",
        quantity: 1,
      },
    ],
  },
};

const ENEMY_REPLACEMENTS = {
  enemy_goblin: { enemyId: "enemy_goblin", name: "Goblin" },
  enemy_goblin_archer: { enemyId: "enemy_goblin", name: "Goblin" },
  enemy_goblin_shaman: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_goblin_chief: { enemyId: "enemy_carbuncle", name: "Garbúnculo" },
  enemy_wolf: { enemyId: "enemy_lycanthrope", name: "Licántropo" },
  enemy_bat: { enemyId: "enemy_deadly_eye", name: "Ojo Letal" },
  enemy_spider: { enemyId: "enemy_killer_bee", name: "Abeja Asesina" },
  enemy_skeleton: { enemyId: "enemy_carbuncle", name: "Garbúnculo" },
  enemy_skeleton_mage: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_orc: { enemyId: "enemy_goblin", name: "Goblin" },
  enemy_dark_knight: { enemyId: "enemy_lycanthrope", name: "Licántropo" },
  enemy_dragon_whelp: { enemyId: "enemy_deadly_eye", name: "Ojo Letal" },
  enemy_cultist: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_void_hound: { enemyId: "enemy_deadly_eye", name: "Ojo Letal" },
  enemy_templar: { enemyId: "enemy_carbuncle", name: "Garbúnculo" },
  enemy_arcane_sentinel: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_abyss_drake: { enemyId: "enemy_deadly_eye", name: "Ojo Letal" },
  enemy_warlock: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_void_knight: { enemyId: "enemy_lycanthrope", name: "Licántropo" },
  enemy_dread_titan: { enemyId: "enemy_carbuncle", name: "Garbúnculo" },
  enemy_killer_bee: { enemyId: "enemy_killer_bee", name: "Abeja Asesina" },
  enemy_blue_sphere: { enemyId: "enemy_blue_sphere", name: "Esfera Azul" },
  enemy_carbuncle: { enemyId: "enemy_carbuncle", name: "Garbúnculo" },
  enemy_lycanthrope: { enemyId: "enemy_lycanthrope", name: "Licántropo" },
  enemy_deadly_eye: { enemyId: "enemy_deadly_eye", name: "Ojo Letal" },
};

function normalizeStageEnemy(stageEnemy) {
  const replacement = ENEMY_REPLACEMENTS[stageEnemy.enemyId];

  if (!replacement) {
    return stageEnemy;
  }

  return {
    ...stageEnemy,
    enemyId: replacement.enemyId,
    name: replacement.name,
  };
}

BASE_STAGES.forEach((stage) => {
  stage.backgroundAsset =
    stage.backgroundAsset || BACKGROUND_ASSETS_BY_ZONE[stage.zone] || null;

  const override = STAGE_OVERRIDES[stage.stageId];
  if (override) {
    Object.assign(stage, override);
  }

  stage.enemies = stage.enemies.map(normalizeStageEnemy);
});

// Función para sembrar stages base
async function seedStages() {
  try {
    for (const stage of BASE_STAGES) {
      await Stage.findOneAndUpdate({ stageId: stage.stageId }, stage, {
        upsert: true,
        returnDocument: "after",
      });
    }
    console.log("Stages base sembrados correctamente");
  } catch (error) {
    console.error("Error al sembrar stages:", error);
  }
}

module.exports = { Stage, BASE_STAGES, seedStages };
