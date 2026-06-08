import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import FantasyButton from "../components/FantasyButton";
import GameBackground from "../components/GameBackground";
import api, { fetchCurrentUser, getAssetURL } from "../services/api";

const { width } = Dimensions.get("window");
const SCROLL_IMAGES = {
  azul: require("../assets/objetcs/pergaminoAzul.png"),
  morado: require("../assets/objetcs/pergaminoMorado.png"),
  dorado: require("../assets/objetcs/pergaminoDorado.png"),
};

// Configuración de pergaminos
const SCROLL_CONFIG = {
  azul: {
    id: "scroll_small",
    name: "Pergamino Azul",
    exp: 100,
    color: "#4169E1",
    glowColor: "rgba(65, 105, 225, 0.8)",
  },
  morado: {
    id: "scroll_medium",
    name: "Pergamino Morado",
    exp: 500,
    color: "#9C27B0",
    glowColor: "rgba(156, 39, 176, 0.8)",
  },
  dorado: {
    id: "scroll_large",
    name: "Pergamino Dorado",
    exp: 1000,
    color: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.8)",
  },
};

// Colores por rareza
const RARITY_COLORS = {
  1: "#9E9E9E",
  2: "#4CAF50",
  3: "#2196F3",
  4: "#9C27B0",
  5: "#FF9800",
};

export default function LevelUpScreen({ route, navigation }) {
  const { heroData, expForNextLevel } = route.params;
  const { catalog, userHero } = heroData;

  // Estado de pergaminos disponibles (simulado por ahora, debería venir del backend)
  const [scrollsAvailable, setScrollsAvailable] = useState({
    azul: 10,
    morado: 5,
    dorado: 2,
  });

  // Estado de pergaminos seleccionados
  const [scrollsSelected, setScrollsSelected] = useState({
    azul: 0,
    morado: 0,
    dorado: 0,
  });

  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);

  // Estado local del héroe para actualizar después de subir nivel
  const [currentHeroLevel, setCurrentHeroLevel] = useState(
    userHero?.level || 1,
  );
  const [currentHeroExp, setCurrentHeroExp] = useState(
    userHero?.experience || 0,
  );
  const [currentExpForNextLevel, setCurrentExpForNextLevel] =
    useState(expForNextLevel);

  // Animaciones
  const heroScale = useSharedValue(0);
  const heroBreathing = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const flashScale = useSharedValue(1);

  const loadUserScrolls = useCallback(async () => {
    try {
      const response = await api.get("/user/inventory");
      if (response.data?.scrolls) {
        setScrollsAvailable({
          azul: response.data.scrolls.scroll_small || 0,
          morado: response.data.scrolls.scroll_medium || 0,
          dorado: response.data.scrolls.scroll_large || 0,
        });
      }
    } catch (error) {
      console.log("Error cargando inventario:", error);
      // Usar valores por defecto si falla
    }
  }, []);

  useEffect(() => {
    // Entrada animada del héroe
    heroScale.value = withSpring(1, { damping: 15, stiffness: 150 });

    // Animación de respiración
    heroBreathing.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );

    // Cargar pergaminos del usuario
    loadUserScrolls();
  }, [heroBreathing, heroScale, loadUserScrolls]);

  const closeDialog = () => setDialogConfig(null);

  const openInfoDialog = (title, message, tone = "info") => {
    setDialogConfig({
      mode: "info",
      title,
      message,
      tone,
    });
  };

  const openConfirmDialog = (title, message, onConfirm) => {
    setDialogConfig({
      mode: "confirm",
      title,
      message,
      tone: "warning",
      onConfirm,
    });
  };

  const confirmDialogAction = async () => {
    if (!dialogConfig?.onConfirm) {
      closeDialog();
      return;
    }

    const onConfirm = dialogConfig.onConfirm;
    closeDialog();
    await onConfirm();
  };

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value * heroBreathing.value }],
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  // Calcular EXP total que se ganará
  const calculateTotalExp = () => {
    return (
      scrollsSelected.azul * SCROLL_CONFIG.azul.exp +
      scrollsSelected.morado * SCROLL_CONFIG.morado.exp +
      scrollsSelected.dorado * SCROLL_CONFIG.dorado.exp
    );
  };

  // Tabla de experiencia según rareza (igual que backend)
  const EXP_TABLE = {
    2: { baseExp: 50, multiplier: 1.2 },
    3: { baseExp: 100, multiplier: 1.3 },
    4: { baseExp: 150, multiplier: 1.4 },
    5: { baseExp: 200, multiplier: 1.5 },
  };

  // Calcular experiencia necesaria para subir de nivel (igual que backend)
  const calculateExpForLevel = (level, rarity) => {
    const config = EXP_TABLE[rarity] || EXP_TABLE[3];
    return Math.floor(config.baseExp * Math.pow(config.multiplier, level - 1));
  };

  // Calcular niveles que se subirán
  const calculateLevelsGained = () => {
    const totalExp = calculateTotalExp();
    const rarity = catalog.rarity;

    let exp = currentHeroExp + totalExp;
    let level = currentHeroLevel;

    while (level < 100) {
      const expNeeded = calculateExpForLevel(level + 1, rarity);
      if (exp >= expNeeded) {
        exp -= expNeeded;
        level++;
      } else {
        break;
      }
    }

    return level - currentHeroLevel;
  };

  // Manejar incremento de pergamino
  const handleIncrement = (type) => {
    if (scrollsSelected[type] < scrollsAvailable[type]) {
      Haptics.selectionAsync().catch(() => null);
      setScrollsSelected((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }));
    }
  };

  // Manejar decremento de pergamino
  const handleDecrement = (type) => {
    if (scrollsSelected[type] > 0) {
      Haptics.selectionAsync().catch(() => null);
      setScrollsSelected((prev) => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
    }
  };

  // Ejecutar animación de destello
  const playFlashAnimation = (callback) => {
    setShowFlash(true);

    // Secuencia de destellos con colores
    flashOpacity.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withTiming(0.3, { duration: 300 }),
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 500 }),
    );

    flashScale.value = withSequence(
      withTiming(1.5, { duration: 200 }),
      withTiming(1, { duration: 300 }),
      withTiming(2, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(3, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      }),
    );

    // Llamar callback después de la animación
    setTimeout(() => {
      setShowFlash(false);
      callback();
    }, 1200);
  };

  // Confirmar subida de nivel
  const executeLevelUp = async () => {
    setIsLevelingUp(true);

    // Ejecutar animación de destello
    playFlashAnimation(async () => {
      try {
        // Preparar datos para el backend
        const scrollsUsed = [];

        if (scrollsSelected.azul > 0) {
          scrollsUsed.push({
            scrollId: SCROLL_CONFIG.azul.id,
            quantity: scrollsSelected.azul,
          });
        }
        if (scrollsSelected.morado > 0) {
          scrollsUsed.push({
            scrollId: SCROLL_CONFIG.morado.id,
            quantity: scrollsSelected.morado,
          });
        }
        if (scrollsSelected.dorado > 0) {
          scrollsUsed.push({
            scrollId: SCROLL_CONFIG.dorado.id,
            quantity: scrollsSelected.dorado,
          });
        }

        const response = await api.post(
          `/heroes/level-up/${userHero.heroId || heroData.catalog._id}`,
          { scrollsUsed },
        );

        if (response.data.success) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => null);
          await fetchCurrentUser().catch(() => null);

          // Actualizar estado local con los nuevos datos
          setCurrentHeroLevel(response.data.hero.level);
          setCurrentHeroExp(response.data.hero.experience);
          setCurrentExpForNextLevel(response.data.expForNextLevel);

          // Actualizar pergaminos disponibles (restar los usados)
          setScrollsAvailable((prev) => ({
            azul: prev.azul - scrollsSelected.azul,
            morado: prev.morado - scrollsSelected.morado,
            dorado: prev.dorado - scrollsSelected.dorado,
          }));

          // Resetear selección
          setScrollsSelected({
            azul: 0,
            morado: 0,
            dorado: 0,
          });

          openInfoDialog(
            "Nivel mejorado",
            response.data.levelsGained > 0
              ? `${catalog.name} subió +${response.data.levelsGained} niveles.`
              : `${catalog.name} ganó experiencia correctamente.`,
            "success",
          );
        }
      } catch (error) {
        console.error("Error al subir nivel:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => null,
        );
        openInfoDialog(
          "Error de mejora",
          error.response?.data?.error || "No se pudo subir de nivel",
          "error",
        );
      } finally {
        setIsLevelingUp(false);
      }
    });
  };

  const handleConfirm = async () => {
    const totalExp = calculateTotalExp();

    if (totalExp === 0) {
      openInfoDialog(
        "Sin pergaminos",
        "Selecciona al menos un pergamino.",
        "warning",
      );
      return;
    }

    openConfirmDialog(
      "Confirmar mejora",
      `Se usarán pergaminos por un total de ${totalExp} EXP.\n\n¿Quieres continuar?`,
      executeLevelUp,
    );
  };

  // Obtener imagen del héroe
  const getHeroSprite = () => {
    const imageUrl = getAssetURL(catalog.splashArt);
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return null;
  };

  const heroSprite = getHeroSprite();
  const rarityColor = RARITY_COLORS[catalog.rarity] || RARITY_COLORS[3];
  const totalExpToAdd = calculateTotalExp();
  const levelsToGain = calculateLevelsGained();

  // Componente de pergamino (layout horizontal)
  const ScrollItem = ({ type }) => {
    const config = SCROLL_CONFIG[type];
    const available = scrollsAvailable[type];
    const selected = scrollsSelected[type];

    return (
      <View style={styles.scrollItem}>
        {/* Glow de fondo */}
        <View style={[styles.scrollGlow, { backgroundColor: config.color }]} />

        {/* Imagen del pergamino */}
        <Image source={SCROLL_IMAGES[type]} style={styles.scrollImage} />

        {/* Info central */}
        <View style={styles.scrollInfo}>
          <Text style={[styles.scrollName, { color: config.color }]}>
            {config.name}
          </Text>
          <Text style={styles.scrollExp}>+{config.exp} EXP</Text>
          <Text style={styles.scrollAvailable}>Tienes: {available}</Text>
        </View>

        {/* Controles a la derecha */}
        <View style={styles.scrollControls}>
          <Pressable
            style={[
              styles.controlButton,
              selected === 0 && styles.controlButtonDisabled,
            ]}
            onPress={() => handleDecrement(type)}
            disabled={selected === 0}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </Pressable>

          <View style={styles.selectedContainer}>
            <Text style={styles.selectedCount}>{selected}</Text>
          </View>

          <Pressable
            style={[
              styles.controlButton,
              selected >= available && styles.controlButtonDisabled,
            ]}
            onPress={() => handleIncrement(type)}
            disabled={selected >= available}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <GameBackground variant="dark">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Subir Nivel</Text>
        </View>

        {/* Héroe */}
        <View style={styles.heroSection}>
          <View style={[styles.heroGlow, { backgroundColor: rarityColor }]} />
          {heroSprite ? (
            <Animated.Image
              source={heroSprite}
              style={[styles.heroImage, heroAnimatedStyle]}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[styles.heroPlaceholder, { backgroundColor: rarityColor }]}
            >
              <Text style={styles.heroPlaceholderText}>
                {catalog.name.charAt(0)}
              </Text>
            </View>
          )}

          <Text style={[styles.heroName, { color: rarityColor }]}>
            {catalog.name}
          </Text>

          {/* Nivel y EXP */}
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>
              Nivel {currentHeroLevel}
              {levelsToGain > 0 && (
                <Text style={styles.levelGain}>
                  {" "}
                  → {currentHeroLevel + levelsToGain}
                </Text>
              )}
            </Text>
            <View style={styles.expBarContainer}>
              <View
                style={[
                  styles.expBar,
                  {
                    width: `${Math.min((currentHeroExp / currentExpForNextLevel) * 100, 100)}%`,
                  },
                ]}
              />
              {totalExpToAdd > 0 && (
                <View
                  style={[
                    styles.expBarPreview,
                    {
                      left: `${Math.min((currentHeroExp / currentExpForNextLevel) * 100, 100)}%`,
                      width: `${Math.min((totalExpToAdd / currentExpForNextLevel) * 100, 100 - (currentHeroExp / currentExpForNextLevel) * 100)}%`,
                    },
                  ]}
                />
              )}
            </View>
            <Text style={styles.expText}>
              {currentHeroExp} / {currentExpForNextLevel} EXP
              {totalExpToAdd > 0 && (
                <Text style={styles.expGain}> (+{totalExpToAdd})</Text>
              )}
            </Text>
          </View>
        </View>

        {/* Pergaminos */}
        <View style={styles.scrollsSection}>
          <Text style={styles.sectionTitle}>Pergaminos de Experiencia</Text>
          <View style={styles.scrollsContainer}>
            <ScrollItem type="azul" />
            <ScrollItem type="morado" />
            <ScrollItem type="dorado" />
          </View>
        </View>

        {/* Resumen */}
        {totalExpToAdd > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              EXP Total:{" "}
              <Text style={styles.summaryValue}>+{totalExpToAdd}</Text>
            </Text>
            {levelsToGain > 0 && (
              <Text style={styles.summaryText}>
                Niveles:{" "}
                <Text style={styles.summaryValue}>+{levelsToGain}</Text>
              </Text>
            )}
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <FantasyButton
            title="Cancelar"
            onPress={() => navigation.goBack()}
            secondary
            small
          />
          <FantasyButton
            title={isLevelingUp ? "Subiendo..." : "Confirmar"}
            onPress={handleConfirm}
            disabled={isLevelingUp || totalExpToAdd === 0}
            small
          />
        </View>

        {/* Efecto de destello */}
        {showFlash && (
          <Animated.View style={[styles.flashOverlay, flashAnimatedStyle]}>
            <View style={styles.flashInner}>
              <View style={[styles.flashRing, styles.flashRingOuter]} />
              <View style={[styles.flashRing, styles.flashRingMiddle]} />
              <View style={[styles.flashRing, styles.flashRingInner]} />
            </View>
          </Animated.View>
        )}

        {dialogConfig && (
          <Modal
            transparent
            animationType="fade"
            visible={!!dialogConfig}
            onRequestClose={closeDialog}
          >
            <View style={styles.dialogBackdrop}>
              <View
                style={[
                  styles.dialogCard,
                  dialogConfig.tone === "success" && styles.dialogCardSuccess,
                  dialogConfig.tone === "warning" && styles.dialogCardWarning,
                  dialogConfig.tone === "error" && styles.dialogCardError,
                ]}
              >
                <Text style={styles.dialogTitle}>{dialogConfig.title}</Text>
                <Text style={styles.dialogMessage}>{dialogConfig.message}</Text>

                <View style={styles.dialogActions}>
                  {dialogConfig.mode === "confirm" && (
                    <Pressable
                      style={[
                        styles.dialogButton,
                        styles.dialogButtonSecondary,
                      ]}
                      onPress={closeDialog}
                    >
                      <Text style={styles.dialogButtonSecondaryText}>
                        Cancelar
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.dialogButton, styles.dialogButtonPrimary]}
                    onPress={
                      dialogConfig.mode === "confirm"
                        ? confirmDialogAction
                        : closeDialog
                    }
                  >
                    <Text style={styles.dialogButtonPrimaryText}>
                      {dialogConfig.mode === "confirm"
                        ? "Confirmar"
                        : "Aceptar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 60, // Compensar el botón de volver
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 15,
  },
  heroGlow: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    opacity: 0.25,
    top: 10,
  },
  heroImage: {
    width: width * 0.35,
    height: width * 0.35,
  },
  heroPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  levelInfo: {
    width: "80%",
    marginTop: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 10,
  },
  levelText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  levelGain: {
    color: "#4CAF50",
  },
  expBarContainer: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  expBar: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 6,
  },
  expBarPreview: {
    position: "absolute",
    height: "100%",
    backgroundColor: "rgba(76, 175, 80, 0.5)",
    borderRadius: 6,
  },
  expText: {
    color: "#AAA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  expGain: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  scrollsSection: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  scrollsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  scrollItem: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scrollGlow: {
    position: "absolute",
    left: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.2,
  },
  scrollImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  scrollInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scrollName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollExp: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 2,
  },
  scrollAvailable: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
  },
  scrollControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonDisabled: {
    backgroundColor: "#555",
    opacity: 0.5,
  },
  controlButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 20,
  },
  selectedContainer: {
    width: 35,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  summaryText: {
    color: "#AAA",
    fontSize: 14,
  },
  summaryValue: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // Efecto de destello
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  flashInner: {
    width: width,
    height: width,
    alignItems: "center",
    justifyContent: "center",
  },
  flashRing: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 3,
  },
  flashRingOuter: {
    width: width * 0.8,
    height: width * 0.8,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  flashRingMiddle: {
    width: width * 0.5,
    height: width * 0.5,
    borderColor: "rgba(156, 39, 176, 0.5)",
  },
  flashRingInner: {
    width: width * 0.3,
    height: width * 0.3,
    borderColor: "rgba(65, 105, 225, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 200,
  },
  dialogCard: {
    width: "100%",
    backgroundColor: "rgba(15, 20, 27, 0.98)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(217, 182, 106, 0.7)",
    padding: 16,
  },
  dialogCardSuccess: {
    borderColor: "rgba(100, 196, 124, 0.85)",
  },
  dialogCardWarning: {
    borderColor: "rgba(217, 182, 106, 0.95)",
  },
  dialogCardError: {
    borderColor: "rgba(255, 107, 107, 0.95)",
  },
  dialogTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  dialogMessage: {
    color: "#EADFC7",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 10,
  },
  dialogButton: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  dialogButtonPrimary: {
    backgroundColor: "rgba(123, 92, 46, 0.9)",
    borderColor: "rgba(217, 182, 106, 0.9)",
  },
  dialogButtonSecondary: {
    backgroundColor: "rgba(47, 74, 95, 0.3)",
    borderColor: "rgba(150, 181, 204, 0.55)",
  },
  dialogButtonPrimaryText: {
    color: "#F7E7C3",
    fontWeight: "700",
    fontSize: 13,
  },
  dialogButtonSecondaryText: {
    color: "#CFE0EC",
    fontWeight: "600",
    fontSize: 13,
  },
});
