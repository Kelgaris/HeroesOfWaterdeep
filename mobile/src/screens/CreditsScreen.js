import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import GameBackground from "../components/GameBackground";
import { elevation, palette, radii, spacing, typography } from "../theme/tokens";

const CREDIT_GROUPS = [
  {
    title: "Dirección del Proyecto",
    lines: [
      "Heroes of Waterdeep",
      "Diseño y desarrollo del proyecto por el equipo fundador del juego.",
    ],
  },
  {
    title: "Inspiración",
    lines: [
      "Universo de fantasía inspirado en Waterdeep y JRPGs tácticos de invocación.",
      "Dirección artística con influencia de aventuras medievales y estética gacha clásica.",
    ],
  },
  {
    title: "Tecnología",
    lines: [
      "Backend: Node.js, Express, MongoDB",
      "Mobile: Expo, React Native, React Navigation",
    ],
  },
  {
    title: "Agradecimientos",
    lines: [
      "A quienes prueban, equilibran y ayudan a convertir la base del proyecto en un juego publicable.",
    ],
  },
];

export default function CreditsScreen({ navigation }) {
  return (
    <GameBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Créditos</Text>
          <View style={styles.headerSpacer} />
        </View>

        {CREDIT_GROUPS.map((group) => (
          <View key={group.title} style={styles.creditCard}>
            <Text style={styles.creditTitle}>{group.title}</Text>
            {group.lines.map((line) => (
              <Text key={line} style={styles.creditLine}>{line}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  backButton: { padding: spacing.sm },
  backButtonText: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 16,
  },
  title: {
    color: palette.parchment,
    fontFamily: typography.title,
    fontSize: 24,
  },
  headerSpacer: { width: 64 },
  creditCard: {
    backgroundColor: "rgba(15, 20, 27, 0.88)",
    borderWidth: 1,
    borderColor: palette.steel,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.soft,
  },
  creditTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  creditLine: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
});