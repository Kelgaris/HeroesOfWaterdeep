import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import GameBackground from "../components/GameBackground";
import { SERVER_URL } from "../services/api";
import {
  elevation,
  palette,
  radii,
  spacing,
  typography,
} from "../theme/tokens";

const RARITY_COLORS = {
  5: "#FFD700",
  4: "#8C5BFF",
  3: "#0070dd",
  2: "#1eff00",
  1: "#ffffff",
};

function getOrderedFanLayout(index, total) {
  const center = (total - 1) / 2;
  const distance = index - center;
  const spread = total <= 5 ? 28 : total <= 8 ? 21 : 16;

  return {
    x: distance * spread,
    y: Math.abs(distance) * 3,
    rotate: distance * 4.5,
  };
}

function SummonRevealCard({
  item,
  isRevealed,
  isFocused,
  stageMode,
  isLegendarySpotlight,
}) {
  const flip = useSharedValue(isRevealed ? 1 : 0);
  const focus = useSharedValue(isFocused ? 1 : 0);
  const spotlight = useSharedValue(isLegendarySpotlight ? 1 : 0);
  const rarity = item.hero.rarity;
  const accentColor = RARITY_COLORS[rarity] || palette.gold;
  const isHighestRarity = rarity === 5;

  useEffect(() => {
    flip.value = withTiming(isRevealed ? 1 : 0, {
      duration: 950, // <-- Subido de 820ms a 950ms para que el giro de la carta sea más majestuoso
      easing: Easing.out(Easing.cubic),
    });
  }, [flip, isRevealed]);

  useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, {
      duration: 450, // <-- Subido de 340ms a 450ms para un acercamiento más suave a la pantalla
      easing: Easing.out(Easing.cubic),
    });
  }, [focus, isFocused]);

  useEffect(() => {
    spotlight.value = withTiming(isLegendarySpotlight ? 1 : 0, {
      duration: 550, // <-- Más transicionado para el escalado del 5 estrellas
      easing: Easing.out(Easing.cubic),
    });
  }, [isLegendarySpotlight, spotlight]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 360]);
    const opacity = interpolate(flip.value, [0.49, 0.5], [0, 1]);

    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180]);
    const opacity = interpolate(flip.value, [0.5, 0.51], [1, 0]);

    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  const slotStyle = useAnimatedStyle(() => {
    const translateY = interpolate(focus.value, [0, 1], [0, -10]);
    const scale = interpolate(
      spotlight.value,
      [0, 1],
      [interpolate(focus.value, [0, 1], [1, 1.12]), 2.35],
    );

    return {
      zIndex: isLegendarySpotlight ? 50 : isFocused ? 10 : 1,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardSlot,
        stageMode ? styles.cardSlotStage : styles.cardSlotGrid,
        slotStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardBack,
          { borderColor: accentColor, shadowColor: accentColor },
          backStyle,
        ]}
      >
        <View style={[styles.cardBackGlow, { backgroundColor: accentColor }]} />
        <Text style={styles.cardBackSigil}>✦</Text>
        <Text style={[styles.cardBackText, { color: accentColor }]}>
          {rarity}★
        </Text>
        {stageMode && !isRevealed && (
          <Text style={styles.cardBackHint}>Llamando héroe...</Text>
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          {
            borderColor: accentColor,
            shadowColor: accentColor,
            backgroundColor: isHighestRarity
              ? "rgba(50, 40, 0, 0.96)"
              : "rgba(10, 14, 20, 0.96)",
          },
          frontStyle,
        ]}
      >
        <Image
          source={{ uri: `${SERVER_URL}${item.hero.splashArt}` }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <Text style={[styles.starsText, { color: accentColor }]}>
          {"★".repeat(rarity)}
        </Text>
        <Text style={styles.heroName} numberOfLines={1}>
          {item.hero.name}
        </Text>

        {item.isNew ? (
          <View style={[styles.statusBadge, styles.newBadge]}>
            <Text style={styles.statusBadgeText}>NUEVO</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.dupeBadge]}>
            <Text style={styles.statusBadgeText}>
              +{item.addedResonance} Resonancia
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function RevealFanCard({ item, state, index, total }) {
  const rarityColor = RARITY_COLORS[item.hero?.rarity] || palette.gold;
  const isActive = state === "active";
  const isRevealed = state === "revealed";
  const layout = getOrderedFanLayout(index, total);

  const bgColor = isRevealed
    ? "rgba(15, 20, 27, 0.94)"
    : "rgba(12, 17, 24, 0.74)";

  return (
    <View
      style={[
        styles.fanCard,
        {
          borderColor: rarityColor,
          backgroundColor: bgColor,
          transform: [
            { translateX: layout.x },
            { translateY: layout.y },
            { rotate: `${layout.rotate}deg` },
          ],
          zIndex: isActive ? 30 : index + 1,
          opacity: state === "pending" ? 0.76 : 1,
        },
        isActive && styles.fanCardActive,
      ]}
    >
      <Text style={[styles.fanStars, { color: rarityColor }]}>
        {"★".repeat(item.hero?.rarity || 4)}
      </Text>
      <Text style={styles.fanName} numberOfLines={1}>
        {item.hero?.name || "Héroe"}
      </Text>
    </View>
  );
}

function LegendarySpotlightPanel({ item }) {
  const [isClosing, setIsClosing] = useState(false);
  const panelProgress = useSharedValue(0);
  const closingProgress = useSharedValue(0);

  useEffect(() => {
    panelProgress.value = withTiming(1, {
      duration: 620,
      easing: Easing.out(Easing.cubic),
    });
  }, [panelProgress]);

  useEffect(() => {
    // 🔥 MODIFICADO: Aumentamos el tiempo que el splashArt del 5 estrellas se queda quieto en el centro.
    // Antes tardaba 820ms en cerrarse, ahora le damos 2600ms para que impacte visualmente.
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
      closingProgress.value = withTiming(1, {
        duration: 650, // Cierre ligeramente más pausado y elegante
        easing: Easing.inOut(Easing.cubic),
      });
    }, 2600);

    return () => clearTimeout(closeTimer);
  }, [closingProgress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(panelProgress.value, [0, 1], [0, 1]) *
      interpolate(closingProgress.value, [0, 1], [1, 0]),
  }));

  const artStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(panelProgress.value, [0, 0.35, 1], [0, 0.7, 1]) *
      interpolate(closingProgress.value, [0, 1], [1, 0.92]),
    transform: [
      {
        scale: interpolate(
          closingProgress.value,
          [0, 1],
          [interpolate(panelProgress.value, [0, 1], [1.18, 1]), 0.34],
        ),
      },
      {
        translateY: interpolate(
          closingProgress.value,
          [0, 1],
          [interpolate(panelProgress.value, [0, 1], [16, 0]), 265],
        ),
      },
      {
        translateX: interpolate(closingProgress.value, [0, 1], [0, 96]),
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(panelProgress.value, [0.15, 0.45], [0, 1]) *
      interpolate(closingProgress.value, [0, 0.45], [1, 0]),
    transform: [
      { translateY: interpolate(panelProgress.value, [0.15, 0.45], [14, 0]) },
    ],
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(panelProgress.value, [0.35, 0.65], [0, 1]) *
      interpolate(closingProgress.value, [0, 0.55], [1, 0]),
    transform: [
      { scale: interpolate(panelProgress.value, [0.35, 0.65], [0.8, 1]) },
    ],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(panelProgress.value, [0.5, 0.85], [0, 1]) *
      interpolate(closingProgress.value, [0, 0.65], [1, 0]),
    transform: [
      { translateY: interpolate(panelProgress.value, [0.5, 0.85], [20, 0]) },
      { scale: interpolate(closingProgress.value, [0, 1], [1, 0.92]) },
    ],
  }));

  return (
    <Animated.View
      style={[styles.legendaryPanelBackdrop, backdropStyle]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.legendaryPanel, artStyle]}>
        <Image
          source={{ uri: `${SERVER_URL}${item.hero.splashArt}` }}
          style={styles.legendaryPanelArt}
          resizeMode="cover"
        />
        <View style={styles.legendaryPanelShade} />

        <Animated.Text style={[styles.legendaryPanelKicker, titleStyle]}>
          Invocación legendaria
        </Animated.Text>
        <Animated.Text style={[styles.legendaryPanelStars, starsStyle]}>
          {"★".repeat(item.hero.rarity)}
        </Animated.Text>
        <Animated.Text style={[styles.legendaryPanelName, nameStyle]}>
          {item.hero.name}
        </Animated.Text>

        {isClosing && <View style={styles.legendaryPanelTrail} />}
      </Animated.View>
    </Animated.View>
  );
}

export default function SummonResultScreen({ route, navigation }) {
  const { results } = route.params;
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealComplete, setRevealComplete] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [legendarySpotlightIndex, setLegendarySpotlightIndex] = useState(null);
  const timersRef = useRef([]);

  const highestRarity = useMemo(
    () => Math.max(...results.map((item) => item.hero?.rarity || 4), 4),
    [results],
  );
  const newHeroesCount = useMemo(
    () => results.filter((item) => item.isNew).length,
    [results],
  );

  useEffect(() => {
    setRevealedCount(0);
    setRevealComplete(false);
    setFocusedIndex(-1);
    setLegendarySpotlightIndex(null);

    // 🔥 EL NUEVO TEMPO DE REVELACIÓN (Frenado estratégico)
    let currentDelay = 400; // Delay inicial antes de arrancar la primera carta (subido de 280ms)

    results.forEach((result, index) => {
      // 1. Enfocamos la carta en el centro
      timersRef.current.push(
        setTimeout(() => {
          setFocusedIndex(index);
        }, currentDelay),
      );

      // Esperamos un momento con la carta de espaldas enfocada
      currentDelay += 600; // <-- Subido de 430ms. Más suspense.

      if (result.hero?.rarity === 5) {
        // 2A. Es un HÉROE LEGENDARIO
        timersRef.current.push(
          setTimeout(() => {
            setLegendarySpotlightIndex(index);
            setRevealedCount(index + 1); // Se voltea la carta
          }, currentDelay),
        );

        // Dejamos que el panel completo de 5 estrellas brille con orgullo en la pantalla
        currentDelay += 3600; // <-- ¡SUBIDO BRUTALMENTE de 1760ms a 3600ms! (Le da tiempo a la animación interna de respirar)

        // Quitamos el spotlight gigante para regresar a la secuencia normal
        timersRef.current.push(
          setTimeout(() => {
            setLegendarySpotlightIndex(null);
          }, currentDelay),
        );
      } else {
        // 2B. Es un héroe común (1★ a 4★)
        timersRef.current.push(
          setTimeout(() => {
            setRevealedCount(index + 1); // Se voltea la carta
          }, currentDelay),
        );
      }

      // Tiempo que se queda la carta boca arriba antes de saltar a la siguiente del mazo
      currentDelay += 900; // <-- ¡Subido de 260ms a 900ms! Esto evita que vayan solapadas e histéricas.
    });

    // Finalización de la secuencia y renderizado de la cuadrícula completa (Grid)
    const completeTimer = setTimeout(() => {
      setFocusedIndex(-1);
      setLegendarySpotlightIndex(null);
      setRevealComplete(true);
    }, currentDelay + 300);

    timersRef.current.push(completeTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [results]);

  const handleRevealAll = () => {
    setRevealedCount(results.length);
    setFocusedIndex(-1);
    setLegendarySpotlightIndex(null);
    setRevealComplete(true);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const isStageMode = !revealComplete;
  const spotlightCard =
    legendarySpotlightIndex !== null ? results[legendarySpotlightIndex] : null;
  const activeStageIndex = legendarySpotlightIndex ?? Math.max(focusedIndex, 0);
  const activeStageCard = results[activeStageIndex] || results[0];

  return (
    <GameBackground>
      <View style={styles.container}>
        <Text style={styles.title}>REVELACIÓN DE INVOCACIÓN</Text>
        <Text
          style={[
            styles.summaryText,
            highestRarity === 5 && styles.summaryTextLegendary,
          ]}
        >
          {highestRarity === 5
            ? "Una presencia 5★ ha atravesado el portal"
            : "Las cartas están revelando a tus héroes"}
        </Text>

        {isStageMode ? (
          <View style={styles.stageArea}>
            <SummonRevealCard
              key={`stage-${activeStageCard?.hero?._id || activeStageCard?.hero?.name || "active"}`}
              item={activeStageCard}
              isRevealed={activeStageIndex < revealedCount}
              isFocused
              stageMode
              isLegendarySpotlight={
                activeStageIndex === legendarySpotlightIndex
              }
            />

            <View style={styles.fanDeckWrap}>
              {results.map((item, index) => {
                const state =
                  index === activeStageIndex
                    ? "active"
                    : index < revealedCount
                      ? "revealed"
                      : "pending";

                return (
                  <RevealFanCard
                    key={`fan-${item.hero._id || item.hero.name}-${index}`}
                    item={item}
                    state={state}
                    index={index}
                    total={results.length}
                  />
                );
              })}
            </View>

            {/* Overlay especial para carta 5★ */}
            {spotlightCard && (
              <View style={styles.legendaryOverlay} pointerEvents="none">
                <View style={styles.legendaryFlash} />
                <Text style={styles.legendaryTitle}>LEGENDARIO</Text>
                <Text style={styles.legendarySubtitle}>
                  {spotlightCard.hero.name} irrumpe en el portal
                </Text>
                <LegendarySpotlightPanel item={spotlightCard} />
              </View>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.resultsGrid}>
            {results.map((item, index) => (
              <SummonRevealCard
                key={`${item.hero._id || item.hero.name}-${index}`}
                item={item}
                isRevealed
                isFocused={false}
                stageMode={false}
                isLegendarySpotlight={false}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.footerPanel}>
          <Text style={styles.footerText}>
            {revealComplete
              ? `${newHeroesCount} nuevo(s) obtenido(s) en esta invocación.`
              : legendarySpotlightIndex !== null
                ? `Una carta 5★ ha roto la secuencia del portal.`
                : `Acercando carta ${Math.min(Math.max(focusedIndex + 1, 1), results.length)} de ${results.length}...`}
          </Text>

          {!revealComplete && (
            <Pressable style={styles.skipButton} onPress={handleRevealAll}>
              <Text style={styles.skipButtonText}>Revelar todo</Text>
            </Pressable>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !revealComplete && styles.confirmButtonDisabled,
          ]}
          onPress={() => navigation.navigate("Summon")}
          disabled={!revealComplete}
        >
          <Text style={styles.confirmButtonText}>
            {revealComplete ? "CONTINUAR" : "ESPERA LA REVELACIÓN"}
          </Text>
        </TouchableOpacity>
      </View>
    </GameBackground>
  );
}

// Mantenemos tus estilos exactamente iguales
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 46,
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 26,
    color: palette.parchment,
    fontFamily: typography.title,
    marginBottom: spacing.sm,
    textShadowColor: palette.gold,
    textShadowRadius: 10,
  },
  summaryText: {
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  summaryTextLegendary: {
    color: palette.gold,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
  },
  stageArea: {
    width: "100%",
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: spacing.md,
  },
  cardSlot: {
    width: 112,
    height: 164,
    margin: 7,
  },
  cardSlotStage: {
    position: "relative",
    marginTop: 14,
    marginBottom: spacing.md,
  },
  cardSlotGrid: {
    position: "relative",
  },
  fanDeckWrap: {
    width: "100%",
    maxWidth: 360,
    height: 120,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  fanCard: {
    position: "absolute",
    width: 70,
    height: 100,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    ...elevation.soft,
  },
  fanCardActive: {
    borderWidth: 2,
    shadowColor: palette.gold,
    shadowOpacity: 0.46,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 11,
  },
  fanStars: {
    fontFamily: typography.ui,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  fanName: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 10,
    textAlign: "center",
  },
  cardFace: {
    position: "absolute",
    inset: 0,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    padding: 6,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    ...elevation.strong,
  },
  cardBack: {
    backgroundColor: "rgba(12, 17, 24, 0.96)",
    justifyContent: "center",
  },
  cardBackGlow: {
    position: "absolute",
    inset: 0,
    opacity: 0.14,
  },
  cardBackSigil: {
    color: palette.parchment,
    fontSize: 34,
    marginBottom: spacing.xs,
  },
  cardBackText: {
    fontFamily: typography.subtitle,
    fontSize: 14,
    letterSpacing: 1,
  },
  cardBackHint: {
    marginTop: spacing.sm,
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 11,
  },
  cardFront: {
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  heroImage: {
    width: 98,
    height: 104,
    marginBottom: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(234, 223, 199, 0.35)",
  },
  starsText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: typography.ui,
  },
  heroName: {
    color: palette.parchment,
    fontSize: 10,
    fontFamily: typography.ui,
    textAlign: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    position: "absolute",
    bottom: 6,
    width: "90%",
  },
  newBadge: {
    backgroundColor: palette.ember,
  },
  dupeBadge: {
    backgroundColor: "#4a90e2",
  },
  statusBadgeText: {
    color: palette.parchment,
    fontSize: 8,
    fontFamily: typography.ui,
    textAlign: "center",
  },
  legendaryOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 42,
  },
  legendaryPanelBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 118,
    alignItems: "center",
  },
  legendaryPanel: {
    width: "84%",
    maxWidth: 330,
    height: 430,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: palette.gold,
    backgroundColor: "rgba(10, 14, 20, 0.98)",
    shadowColor: "#FFD700",
    shadowOpacity: 0.85,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 30,
    justifyContent: "flex-end",
  },
  legendaryPanelArt: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  legendaryPanelShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 10, 14, 0.28)",
  },
  legendaryFlash: {
    position: "absolute",
    top: 70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 215, 0, 0.18)",
    shadowColor: "#FFD700",
    shadowOpacity: 0.85,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
    elevation: 24,
  },
  legendaryTitle: {
    color: palette.gold,
    fontFamily: typography.title,
    fontSize: 30,
    textShadowColor: "rgba(255, 215, 0, 0.75)",
    textShadowRadius: 16,
  },
  legendarySubtitle: {
    marginTop: spacing.xs,
    color: palette.parchment,
    fontFamily: typography.subtitle,
    fontSize: 15,
    textAlign: "center",
  },
  legendaryPanelKicker: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowRadius: 10,
  },
  legendaryPanelStars: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowRadius: 10,
  },
  legendaryPanelName: {
    color: palette.parchment,
    fontFamily: typography.title,
    fontSize: 30,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.85)",
    textShadowRadius: 12,
  },
  legendaryPanelTrail: {
    position: "absolute",
    left: "50%",
    bottom: -54,
    width: 10,
    height: 84,
    marginLeft: -5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255, 215, 0, 0.26)",
  },
  footerPanel: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  footerText: {
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.steelBright,
    backgroundColor: "rgba(47, 74, 95, 0.24)",
  },
  skipButtonText: {
    color: palette.parchment,
    fontFamily: typography.ui,
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: palette.gold,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 40,
    minWidth: 240,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "rgba(123, 92, 46, 0.45)",
  },
  confirmButtonText: {
    color: palette.abyss,
    fontSize: 14,
    fontFamily: typography.subtitle,
  },
});
