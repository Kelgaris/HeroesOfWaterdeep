import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    elevation,
    palette,
    radii,
    spacing,
    typography,
} from "../theme/tokens";

const MENU_ITEMS = [
  { id: "heroes", label: "Héroes", icon: "⚔️" },
  { id: "adventure", label: "Aventura", icon: "🗺️" },
  { id: "summon", label: "Invocar", icon: "✨" },
  { id: "inventory", label: "Inventario", icon: "🎒" },
  { id: "settings", label: "Ajustes", icon: "⚙️" },
];

export default function GameMenu({
  onNavigate,
  currentZone = 1,
  currentStage = 1,
}) {
  return (
    <View style={styles.container}>
      {/* Indicador de progreso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Zona {currentZone} - Nivel {currentStage}
        </Text>
      </View>

      {/* Botones del menú */}
      <View style={styles.menuRow}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuButton}
            onPress={() => onNavigate?.(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>

            {/* Notificación (opcional) */}
            {item.id === "summon" && (
              <View style={styles.notification}>
                <Text style={styles.notificationText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
  },
  progressContainer: {
    alignSelf: "center",
    backgroundColor: "rgba(15,20,27,0.82)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.bronze,
  },
  progressText: {
    color: palette.gold,
    fontSize: 14,
    fontFamily: typography.ui,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(28,37,48,0.92)",
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: palette.bronze,
    ...elevation.strong,
  },
  menuButton: {
    alignItems: "center",
    padding: 6,
    minWidth: 62,
  },
  iconContainer: {
    width: 46,
    height: 46,
    backgroundColor: palette.slate,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: palette.bronze,
    marginBottom: 4,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuLabel: {
    color: palette.parchment,
    fontSize: 10,
    fontFamily: typography.ui,
  },
  notification: {
    position: "absolute",
    top: 0,
    right: 5,
    width: 20,
    height: 20,
    backgroundColor: palette.blood,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: palette.parchment,
  },
  notificationText: {
    color: palette.parchment,
    fontSize: 12,
    fontFamily: typography.subtitle,
  },
});
