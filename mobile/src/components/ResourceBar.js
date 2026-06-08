import { StyleSheet, Text, View } from "react-native";

export default function ResourceBar({
  energy,
  maxEnergy,
  gold,
  gems,
  level,
  username = "Héroe",
}) {
  const energyPercent = (energy / maxEnergy) * 100;

  return (
    <View style={styles.container}>
      {/* Columna Izquierda */}
      <View style={styles.leftColumn}>
        {/* Arriba: Nombre + Nivel */}
        <View style={styles.userInfo}>
          <Text style={styles.usernameText} numberOfLines={1}>
            {username}
          </Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Nv.{level}</Text>
          </View>
        </View>

        {/* Abajo: Energía */}
        <View style={styles.energyContainer}>
          <Text style={styles.meatIcon}>🍖</Text>
          <View style={styles.energyBarBg}>
            <View
              style={[styles.energyBarFill, { width: `${energyPercent}%` }]}
            />
          </View>
          <Text style={styles.energyText}>{energy}</Text>
        </View>
      </View>

      {/* Centro: Nombre del juego */}
      <View style={styles.centerColumn}>
        <Text style={styles.gameTitle}>HEROES OF</Text>
        <Text style={styles.gameTitleBold}>WATERDEEP</Text>
      </View>

      {/* Columna Derecha */}
      <View style={styles.rightColumn}>
        {/* Arriba: Gemas */}
        <View style={styles.resourceRow}>
          <Text style={styles.gemIcon}>💎</Text>
          <Text style={styles.resourceText}>{formatNumber(gems)}</Text>
        </View>

        {/* Abajo: Oro */}
        <View style={styles.resourceRow}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.resourceText}>{formatNumber(gold)}</Text>
        </View>
      </View>
    </View>
  );
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 35,
    left: 8,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(10, 8, 5, 0.85)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#3a2a1a",
  },

  // Columna Izquierda
  leftColumn: {
    flex: 1,
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  usernameText: {
    color: "#E8D9C0",
    fontSize: 13,
    fontFamily: "Cinzel_600SemiBold",
    maxWidth: 80,
    marginRight: 6,
  },
  levelBadge: {
    backgroundColor: "#5a4520",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#8a7540",
  },
  levelText: {
    color: "#FFD700",
    fontSize: 10,
    fontFamily: "Cinzel_700Bold",
  },
  energyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  meatIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  energyBarBg: {
    width: 50,
    height: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a3a2a",
  },
  energyBarFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  energyText: {
    color: "#8BC34A",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },

  // Centro
  centerColumn: {
    flex: 1,
    alignItems: "center",
  },
  gameTitle: {
    color: "#8a7540",
    fontSize: 9,
    fontFamily: "Cinzel_400Regular",
    letterSpacing: 2,
  },
  gameTitleBold: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "Cinzel_700Bold",
    letterSpacing: 1,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Columna Derecha
  rightColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  gemIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  coinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  resourceText: {
    color: "#E8D9C0",
    fontWeight: "bold",
    fontSize: 12,
  },
});
