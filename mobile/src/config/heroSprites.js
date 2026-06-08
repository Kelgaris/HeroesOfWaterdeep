/**
 * Configuración de sprites para héroes
 *
 * INSTRUCCIONES PARA DESCARGAR SPRITES DE FFBE:
 * 1. Ve a https://www.spriters-resource.com/mobile/finalfantasybraveexvius/
 * 2. Busca el personaje que quieras
 * 3. Descarga el ZIP y extrae los PNG
 * 4. Coloca los sprite sheets en src/assets/heroes/[nombre]/
 * 5. Configura las animaciones aquí abajo
 *
 * PERSONAJES RECOMENDADOS:
 * - Summoner Yuna (invocadora): asset/174350/
 * - Rain (guerrero): asset/241772/ (map characters)
 * - Aldore King Rain: asset/117472/ (versión batalla)
 *
 * Los sprite sheets de FFBE típicamente tienen:
 * - idle/stand: 6-12 frames
 * - attack: 8-16 frames
 * - magic/skill: 10-20 frames
 * - limit_burst: 15-40 frames
 * - win/victory: 6-12 frames
 * - dead/death: 4-8 frames
 */

// ============================================
// SPRITES DISPONIBLES - Descomentar cuando tengas los archivos
// ============================================

// Summoner Yuna - Para la heroína del inicio (figura clickeable)
// Descarga de: https://www.spriters-resource.com/mobile/finalfantasybraveexvius/asset/174350/
const YUNA_SPRITES = {
  // Descomentar y ajustar cuando descargues los sprites:
  // idle: require("../assets/heroes/yuna/stand.png"),
  // attack: require("../assets/heroes/yuna/attack.png"),
  // magic: require("../assets/heroes/yuna/magic.png"),
  // victory: require("../assets/heroes/yuna/win.png"),
};

// Rain - Para el héroe inicial "Durnan"
// Descarga de: https://www.spriters-resource.com/mobile/finalfantasybraveexvius/asset/117472/
const RAIN_SPRITES = {
  // Descomentar y ajustar cuando descargues los sprites:
  // idle: require("../assets/heroes/rain/stand.png"),
  // attack: require("../assets/heroes/rain/attack.png"),
  // skill: require("../assets/heroes/rain/limit.png"),
  // victory: require("../assets/heroes/rain/win.png"),
};

// Placeholder temporal
const PLACEHOLDER_SPRITE = null;

export const HERO_SPRITES = {
  // Summoner Yuna - Figura del inicio (al hacer click muestra mensajes)
  yuna: {
    name: "Invocadora Yuna",
    description: "Heroína principal de la pantalla de inicio",
    animations: {
      idle: {
        source: YUNA_SPRITES.idle || PLACEHOLDER_SPRITE,
        frameWidth: 134, // Ajustar según el sprite real
        frameHeight: 140,
        frameCount: 12,
        fps: 8,
        columns: 12,
      },
      magic: {
        source: YUNA_SPRITES.magic || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 18,
        fps: 12,
        columns: 18,
      },
      victory: {
        source: YUNA_SPRITES.victory || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 10,
        fps: 10,
        columns: 10,
      },
    },
  },

  // Rain - Héroe inicial del juego (Durnan)
  rain: {
    name: "Guerrero Rain",
    description: "Héroe inicial - representa a Durnan",
    animations: {
      idle: {
        source: RAIN_SPRITES.idle || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 10,
        fps: 8,
        columns: 10,
      },
      attack: {
        source: RAIN_SPRITES.attack || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 14,
        fps: 14,
        columns: 14,
      },
      skill: {
        source: RAIN_SPRITES.skill || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 20,
        fps: 16,
        columns: 20,
      },
      victory: {
        source: RAIN_SPRITES.victory || PLACEHOLDER_SPRITE,
        frameWidth: 134,
        frameHeight: 140,
        frameCount: 12,
        fps: 10,
        columns: 12,
      },
    },
  },

  // Guerrera de Waterdeep (héroe inicial alternativo)
  warrior: {
    name: "Guerrera de Waterdeep",
    animations: {
      idle: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 8,
        columns: 6,
      },
      attack: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 14,
        columns: 8,
      },
      skill: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 12,
        fps: 16,
        columns: 12,
      },
      victory: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 10,
        columns: 8,
      },
      death: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 5,
        fps: 6,
        columns: 5,
      },
    },
  },

  // Mago de Neverwinter
  mage: {
    name: "Mago de Neverwinter",
    animations: {
      idle: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 8,
        columns: 6,
      },
      attack: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 10,
        fps: 12,
        columns: 10,
      },
      magic: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 14,
        fps: 14,
        columns: 14,
      },
      victory: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 10,
        columns: 8,
      },
      death: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 5,
        fps: 6,
        columns: 5,
      },
    },
  },

  // Clérigo de Helm
  healer: {
    name: "Clérigo de Helm",
    animations: {
      idle: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 6,
        fps: 8,
        columns: 6,
      },
      attack: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 12,
        columns: 8,
      },
      heal: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 12,
        fps: 10,
        columns: 12,
      },
      victory: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,
        fps: 10,
        columns: 8,
      },
      death: {
        source: PLACEHOLDER_SPRITE,
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 5,
        fps: 6,
        columns: 5,
      },
    },
  },
};

/**
 * Obtener configuración de sprite por ID de héroe
 */
export function getHeroSprite(heroId) {
  return HERO_SPRITES[heroId] || null;
}

/**
 * Instrucciones para preparar sprites de FFBE:
 *
 * 1. Descarga el sprite sheet del personaje que quieras usar
 * 2. Identifica las dimensiones de cada frame (normalmente 64x64 o 128x128)
 * 3. Cuenta el número de frames en cada animación
 * 4. Coloca el archivo en src/assets/heroes/[nombre]/[animacion].png
 * 5. Actualiza este archivo con la configuración correcta
 *
 * Herramientas útiles:
 * - Aseprite: para visualizar y editar sprite sheets
 * - TexturePacker: para reorganizar sprites si es necesario
 * - GIMP/Photoshop: para recortar animaciones individuales
 */
