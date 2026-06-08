import {
    Dimensions,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getAssetURL } from "../services/api";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 3; // 3 columnas con padding

// Colores por rareza
const RARITY_COLORS = {
  1: "#9E9E9E", // Gris - Común
  2: "#4CAF50", // Verde - Poco común
  3: "#2196F3", // Azul - Raro
  4: "#9C27B0", // Púrpura - Épico
  5: "#FF9800", // Naranja/Dorado - Legendario
};

const RARITY_BORDER_COLORS = {
  1: "#757575",
  2: "#388E3C",
  3: "#1976D2",
  4: "#7B1FA2",
  5: "#F57C00",
};
const ASCENDED_STAR_COLOR = "#FF6B6B";
const MAX_ASCENDED_BG = "#5A1B1B";

// Mapeo de elementos a colores
const ELEMENT_COLORS = {
  fire: "#FF6B6B",
  water: "#4169E1",
  earth: "#8B4513",
  wind: "#32CD32",
  light: "#FFD700",
  dark: "#4B0082",
};

export default function HeroCard({
  hero,
  owned = true,
  onPress,
  userHeroData,
  selected = false,
}) {
  const rarityColor = RARITY_COLORS[hero.rarity] || RARITY_COLORS[3];
  const borderColor =
    RARITY_BORDER_COLORS[hero.rarity] || RARITY_BORDER_COLORS[3];
  const elementColor = ELEMENT_COLORS[hero.element] || ELEMENT_COLORS.fire;
  const starsUpgraded = Math.max(0, userHeroData?.starsUpgraded || 0);
  const isMaxAscended = owned && starsUpgraded >= 5;

  // Renderizar estrellas
  const renderStars = () => {
    const baseStars = [];
    for (let i = 0; i < hero.rarity; i++) {
      baseStars.push(
        <Text key={i} style={[styles.star, { color: rarityColor }]}>
          ★
        </Text>,
      );
    }

    const ascendedStars = [];
    for (let i = 0; i < 5; i++) {
      const isFilled = i < starsUpgraded;
      ascendedStars.push(
        <Text
          key={`asc-${i}`}
          style={[
            styles.star,
            styles.ascendedStar,
            {
              color: isFilled ? ASCENDED_STAR_COLOR : "rgba(255,255,255,0.28)",
            },
          ]}
        >
          {isFilled ? "★" : "☆"}
        </Text>,
      );
    }

    return (
      <View style={styles.starsBlock}>
        <View style={styles.starsRow}>{baseStars}</View>
        {owned && <View style={styles.starsRow}>{ascendedStars}</View>}
      </View>
    );
  };

  // Obtener imagen del héroe desde el servidor
  const getHeroImage = () => {
    const imageUrl = getAssetURL(hero.pixelArt);
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return null;
  };

  const heroImage = getHeroImage();
  const level = userHeroData?.level || hero.level || 1;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor: owned ? borderColor : "#555" },
        !owned && styles.cardNotOwned,
        selected && styles.selectedCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Fondo de color según rareza */}
      <View
        style={[
          styles.cardBackground,
          {
            backgroundColor: owned
              ? isMaxAscended
                ? MAX_ASCENDED_BG
                : rarityColor
              : "#1a1a2e",
          },
          isMaxAscended && styles.maxAscendedGlow,
        ]}
      >
        {/* Imagen del héroe */}
        <View style={styles.imageContainer}>
          {heroImage ? (
            <Image
              source={heroImage}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.placeholderImage,
                { backgroundColor: owned ? elementColor : "#333" },
              ]}
            >
              <Text style={styles.placeholderText}>
                {hero.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {/* Capa oscura para héroes no poseídos */}
          {!owned && <View style={styles.darkOverlay} />}
        </View>

        {/* Nivel si lo posee */}
        {owned && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Nv.{level}</Text>
          </View>
        )}
      </View>

      {/* Información del héroe */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.heroName, !owned && styles.textNotOwned]}
          numberOfLines={1}
        >
          {hero.name}
        </Text>
        <View style={styles.starsContainer}>{renderStars()}</View>
      </View>

      {/* Indicador de no poseído */}
      {!owned && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#1a1a2e",
  },
  cardNotOwned: {
    opacity: 1,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  cardBackground: {
    height: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageContainer: {
    width: CARD_WIDTH - 16,
    height: CARD_WIDTH - 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  levelBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.5)",
  },
  levelText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "bold",
  },
  infoContainer: {
    padding: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  heroName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textNotOwned: {
    color: "#888",
  },
  starsContainer: {
    marginTop: 4,
    minHeight: 26,
  },
  starsBlock: {
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
  },
  star: {
    fontSize: 10,
    marginHorizontal: 1,
  },
  ascendedStar: {
    fontSize: 9,
    marginTop: 1,
  },
  maxAscendedGlow: {
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255, 107, 107, 0.9)",
  },
  lockOverlay: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  lockIcon: {
    fontSize: 12,
  },
});
