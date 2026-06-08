import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import GameBackground from "../components/GameBackground";
import { palette, spacing, typography } from "../theme/tokens";

const RARITY_COLORS = {
  5: "#FFD700",
  4: "#8C5BFF",
};

const RARITY_LABELS = {
  5: "Presagio legendario",
  4: "Llamada épica",
};

export default function SummonRevealScreen({ route, navigation }) {
  const { results, bannerTitle, featuredName } = route.params;
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(1);
  const shimmer = useSharedValue(0.4);
  const flash = useSharedValue(0.25);
  const cardFloat = useSharedValue(0);

  const highestRarity = useMemo(
    () => Math.max(...results.map((item) => item.hero?.rarity || 4), 4),
    [results],
  );
  const summonCount = results.length;
  const revealColor = RARITY_COLORS[highestRarity] || palette.gold;
  const revealLabel = RARITY_LABELS[highestRarity] || "Portal arcano";
  const previewCards = useMemo(() => results.slice(0, 5), [results]);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(0.96, { duration: 900 }),
      ),
      -1,
      true,
    );

    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0.35, { duration: 650 }),
      ),
      -1,
      true,
    );

    flash.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 420 }),
        withTiming(0.22, { duration: 720 }),
      ),
      -1,
      true,
    );

    cardFloat.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(8, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );

    const timeout = setTimeout(() => {
      navigation.replace("SummonResult", { results });
    }, 2900);

    return () => clearTimeout(timeout);
  }, [cardFloat, featuredName, flash, navigation, results, pulse, rotate, shimmer]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: pulse.value }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [{ scale: pulse.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ scale: 0.9 + pulse.value * 0.18 }],
  }));

  const cardDeckStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardFloat.value }],
  }));

  return (
    <GameBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Invocando</Text>
        <Text style={styles.subtitle}>{bannerTitle || "Portal Arcano"}</Text>
        <Text style={[styles.revealLabel, { color: revealColor }]}>{revealLabel}</Text>

        <View style={styles.sigilWrap}>
          <Animated.View
            style={[styles.flashHalo, { backgroundColor: revealColor }, flashStyle]}
          />
          <Animated.View style={[styles.outerRing, ringStyle]} />
          <Animated.View style={[styles.middleRing, ringStyle]} />
          <Animated.View style={[styles.core, coreStyle]}>
            <Text style={styles.coreText}>✦</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.cardsRow, cardDeckStyle]}>
          {previewCards.map((item, index) => {
            const rarity = item.hero?.rarity || 4;
            const rotation = `${(index - (previewCards.length - 1) / 2) * 8}deg`;
            const cardColor = RARITY_COLORS[rarity] || palette.gold;

            return (
              <View
                key={`${item.hero?._id || item.hero?.name || index}-${index}`}
                style={[
                  styles.previewCard,
                  {
                    borderColor: cardColor,
                    shadowColor: cardColor,
                    transform: [{ rotate: rotation }],
                    marginLeft: index === 0 ? 0 : -16,
                  },
                ]}
              >
                <View style={[styles.previewCardGlow, { backgroundColor: cardColor }]} />
                <Text style={styles.previewCardBack}>✦</Text>
                <Text style={[styles.previewCardStars, { color: cardColor }]}>
                  {"★".repeat(rarity)}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        <Text style={styles.statusText}>
          {summonCount > 1
            ? `El portal está alineando ${summonCount} ecos heroicos...`
            : "El sello de Waterdeep está decidiendo tu destino..."}
        </Text>
        <Text style={styles.featuredText}>Destacado actual: {featuredName}</Text>
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: palette.gold,
    fontFamily: typography.title,
    fontSize: 30,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: palette.parchment,
    fontFamily: typography.subtitle,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  revealLabel: {
    fontFamily: typography.subtitle,
    fontSize: 15,
    marginBottom: spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sigilWrap: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  flashHalo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.25,
  },
  outerRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: "rgba(217, 182, 106, 0.65)",
    borderStyle: "dashed",
  },
  middleRing: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "rgba(150, 181, 204, 0.65)",
  },
  core: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(123, 92, 46, 0.85)",
    borderWidth: 2,
    borderColor: palette.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.gold,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  coreText: {
    color: palette.parchment,
    fontSize: 40,
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    marginBottom: spacing.lg,
  },
  previewCard: {
    width: 76,
    height: 108,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(15, 20, 27, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  previewCardGlow: {
    position: "absolute",
    inset: 0,
    opacity: 0.14,
  },
  previewCardBack: {
    color: palette.parchment,
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  previewCardStars: {
    fontFamily: typography.ui,
    fontSize: 12,
  },
  statusText: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  featuredText: {
    color: palette.frost,
    fontFamily: typography.ui,
    fontSize: 13,
    textAlign: "center",
  },
});