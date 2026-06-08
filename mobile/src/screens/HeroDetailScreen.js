import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import Animated, {
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

const { width, height } = Dimensions.get("window");

// Colores por rareza
const RARITY_COLORS = {
  1: "#9E9E9E",
  2: "#4CAF50",
  3: "#2196F3",
  4: "#9C27B0",
  5: "#FF9800",
};

// Nombres de elementos
const ELEMENT_NAMES = {
  fire: "Fuego",
  water: "Agua",
  earth: "Tierra",
  wind: "Viento",
  light: "Luz",
  dark: "Oscuridad",
};

// Colores de elementos
const ELEMENT_COLORS = {
  fire: "#FF6B6B",
  water: "#4169E1",
  earth: "#8B4513",
  wind: "#32CD32",
  light: "#FFD700",
  dark: "#4B0082",
};

const ASCENDED_STAR_COLOR = "#FF6B6B";
const MAX_ASCENDED_BG = "rgba(120, 30, 30, 0.75)";
const ASCENSION_FRAGMENT_COSTS = {
  0: 50,
  1: 100,
  2: 150,
  3: 200,
  4: 300,
};

export default function HeroDetailScreen({ route, navigation }) {
  const { heroId } = route.params;

  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingStars, setUpgradingStars] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);

  // Animaciones
  const spriteScale = useSharedValue(0);
  const breathing = useSharedValue(1);

  // Recargar datos cuando volvemos de la pantalla de subir nivel
  useFocusEffect(
    useCallback(() => {
      loadHeroDetail();
    }, [heroId]),
  );

  useEffect(() => {
    if (heroData) {
      spriteScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      breathing.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500 }),
          withTiming(1, { duration: 1500 }),
        ),
        -1,
        true,
      );
    }
  }, [heroData]);

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

  const loadHeroDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/heroes/detail/${heroId}`);
      setHeroData(response.data);
    } catch (error) {
      console.error("Error cargando detalle del héroe:", error);
      openInfoDialog("Error", "No se pudo cargar el héroe", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLevelUp = () => {
    if (!heroData?.owned) {
      openInfoDialog("Héroe bloqueado", "No posees este héroe.", "error");
      return;
    }

    // Navegar a la pantalla de subir nivel con pergaminos
    navigation.navigate("LevelUp", {
      heroData,
      expForNextLevel,
    });
  };

  const handleUpgradeStars = async () => {
    if (!heroData?.owned) {
      openInfoDialog("Héroe bloqueado", "No posees este héroe.", "error");
      return;
    }

    const userHero = heroData.userHero;
    const currentStars = userHero?.starsUpgraded || 0;
    const fragments = userHero?.resonancePieces || 0;

    const needed = ASCENSION_FRAGMENT_COSTS[currentStars] || 0;

    if (currentStars >= 5) {
      openInfoDialog(
        "Ascensión máxima",
        "Este héroe ya alcanzó el máximo de ascensión.",
        "success",
      );
      return;
    }

    if (fragments < needed) {
      openInfoDialog(
        "Fragmentos insuficientes",
        `Necesitas ${needed} fragmentos de resonancia y ahora tienes ${fragments}.`,
        "warning",
      );
      return;
    }

    openConfirmDialog(
      "Confirmar Ascensión",
      `Se usarán ${needed} fragmentos para subir 1 estrella de ascensión.\n\n¿Quieres continuar?`,
      async () => {
        try {
          setUpgradingStars(true);
          const response = await api.post(`/heroes/upgrade-stars/${heroId}`);

          if (response.data.success) {
            await fetchCurrentUser().catch(() => null);
            openInfoDialog(
              "Ascensión completada",
              `${heroData.catalog.name} ahora tiene ${response.data.newStars}/5 estrellas de ascensión.`,
              "success",
            );
            await loadHeroDetail();
          }
        } catch (error) {
          openInfoDialog(
            "Error de ascensión",
            error.response?.data?.error || "No se pudo subir estrellas.",
            "error",
          );
        } finally {
          setUpgradingStars(false);
        }
      },
    );
  };

  const spriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spriteScale.value * breathing.value }],
  }));

  if (loading) {
    return (
      <GameBackground variant="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </GameBackground>
    );
  }

  if (!heroData) {
    return (
      <GameBackground variant="dark">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Héroe no encontrado</Text>
          <FantasyButton title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </GameBackground>
    );
  }

  const {
    catalog,
    owned,
    userHero,
    expForNextLevel,
    currentStats,
    populatedEquipment,
  } = heroData;
  const rarityColor = RARITY_COLORS[catalog.rarity] || RARITY_COLORS[3];
  const elementColor = ELEMENT_COLORS[catalog.element] || ELEMENT_COLORS.fire;

  // Obtener imagen del héroe desde el servidor
  const getHeroSprite = () => {
    const imageUrl = getAssetURL(catalog.splashArt);
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return null;
  };
  const heroSprite = getHeroSprite();

  const level = userHero?.level || 1;
  const experience = userHero?.experience || 0;
  const starsUpgraded = userHero?.starsUpgraded || 0;
  const resonancePieces = userHero?.resonancePieces || 0;
  const isMaxAscended = starsUpgraded >= 5;
  const fragmentsNeededForNext = ASCENSION_FRAGMENT_COSTS[starsUpgraded] || 0;
  const fragmentDeficit = Math.max(0, fragmentsNeededForNext - resonancePieces);

  // Renderizar estrellas
  const renderStars = () => {
    const baseStars = [];

    for (let i = 0; i < catalog.rarity; i++) {
      baseStars.push(
        <Text key={`base-${i}`} style={[styles.star, { color: rarityColor }]}>
          ★
        </Text>,
      );
    }

    const ascendedStars = [];
    for (let i = 0; i < starsUpgraded; i++) {
      ascendedStars.push(
        <Text
          key={`bonus-${i}`}
          style={[styles.star, { color: ASCENDED_STAR_COLOR }]}
        >
          ★
        </Text>,
      );
    }

    for (let i = starsUpgraded; i < 5; i++) {
      ascendedStars.push(
        <Text
          key={`empty-bonus-${i}`}
          style={[styles.star, styles.emptyAscensionStar]}
        >
          ☆
        </Text>,
      );
    }

    return (
      <View style={styles.starsBlock}>
        <View style={styles.starsLine}>{baseStars}</View>
        <View style={styles.starsLine}>{ascendedStars}</View>
      </View>
    );
  };

  return (
    <GameBackground variant="dark">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
        </View>

        {/* Imagen del héroe */}
        <View
          style={[
            styles.spriteContainer,
            isMaxAscended && styles.spriteContainerAscendedMax,
          ]}
        >
          <View
            style={[
              styles.glow,
              {
                backgroundColor: isMaxAscended
                  ? ASCENDED_STAR_COLOR
                  : rarityColor,
              },
            ]}
          />
          {heroSprite ? (
            <Animated.Image
              source={heroSprite}
              style={[styles.heroSprite, spriteAnimatedStyle]}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[styles.placeholder, { backgroundColor: elementColor }]}
            >
              <Text style={styles.placeholderText}>
                {catalog.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info básica */}
        <View style={styles.infoContainer}>
          <Text style={[styles.heroName, { color: rarityColor }]}>
            {catalog.name}
          </Text>
          {catalog.title && (
            <Text style={styles.heroTitle}>{catalog.title}</Text>
          )}
          <View style={styles.starsContainer}>{renderStars()}</View>
          <Text style={[styles.elementName, { color: elementColor }]}>
            {ELEMENT_NAMES[catalog.element] || catalog.element}
          </Text>
        </View>

        {/* Estado de posesión */}
        {!owned && (
          <View style={styles.notOwnedBanner}>
            <Text style={styles.notOwnedText}>🔒 No posees este héroe</Text>
          </View>
        )}

        {/* Stats y nivel (solo si lo posee) */}
        {owned && (
          <>
            {/* Nivel y EXP */}
            <View style={styles.levelContainer}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelLabel}>Nivel {level}</Text>
                <Text style={styles.expText}>
                  {experience} / {expForNextLevel} EXP
                </Text>
              </View>
              <View style={styles.expBarContainer}>
                <View
                  style={[
                    styles.expBar,
                    {
                      width: `${Math.min((experience / expForNextLevel) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Fragmentos de resonancia */}
            <View style={styles.resonanceContainer}>
              <Text style={styles.resonanceLabel}>
                Fragmentos de Resonancia: {resonancePieces}
              </Text>
              <Text style={styles.ascensionProgressLabel}>
                Ascensión: {starsUpgraded}/5
                {isMaxAscended
                  ? " (MÁXIMA)"
                  : ` · Siguiente mejora: ${fragmentsNeededForNext} (${fragmentDeficit > 0 ? `faltan ${fragmentDeficit}` : "lista"})`}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>❤️</Text>
                  <Text style={styles.statLabel}>HP</Text>
                  <Text style={styles.statValue}>{currentStats.hp}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>⚔️</Text>
                  <Text style={styles.statLabel}>ATK</Text>
                  <Text style={styles.statValue}>{currentStats.attack}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🛡️</Text>
                  <Text style={styles.statLabel}>DEF</Text>
                  <Text style={styles.statValue}>{currentStats.defense}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>💨</Text>
                  <Text style={styles.statLabel}>SPD</Text>
                  <Text style={styles.statValue}>{currentStats.speed}</Text>
                </View>
              </View>
            </View>

            {/* Equipamiento */}
            <View style={styles.equipmentContainer}>
              <Text style={styles.statsTitle}>Equipamiento</Text>
              <View style={styles.equipmentGrid}>
                {[
                  { key: "weapon", name: "Arma", icon: "⚔️" },
                  { key: "head", name: "Cabeza", icon: "🪖" },
                  { key: "chest", name: "Pechera", icon: "👕" },
                  { key: "hands", name: "Guantes", icon: "🧤" },
                  { key: "feet", name: "Botas", icon: "👢" },
                  { key: "accessory", name: "Accesorio", icon: "💍" },
                ].map((slot) => {
                  const equippedItem = populatedEquipment
                    ? populatedEquipment[slot.key]
                    : null;
                  return (
                    <Pressable
                      key={slot.key}
                      style={styles.equipmentSlot}
                      onPress={() =>
                        navigation.navigate("EquipmentSelection", {
                          heroId,
                          slot: slot.key,
                        })
                      }
                    >
                      {equippedItem ? (
                        <View style={styles.equippedItem}>
                          <Text style={styles.equippedIcon}>{slot.icon}</Text>
                          <Text style={styles.equippedName} numberOfLines={1}>
                            {equippedItem.name}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.emptySlot}>
                          <Text style={styles.emptySlotIcon}>{slot.icon}</Text>
                          <Text style={styles.emptySlotText}>Vacío</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Botones de mejora */}
            <View style={styles.buttonsContainer}>
              <FantasyButton
                title="Subir Nivel"
                onPress={handleLevelUp}
                small
              />
              <View style={styles.buttonSpacer} />
              <FantasyButton
                title={upgradingStars ? "Ascendiendo..." : "Ascender +1★"}
                onPress={handleUpgradeStars}
                disabled={upgradingStars || starsUpgraded >= 5}
                small
              />
            </View>
          </>
        )}

        {/* Stats base (si no lo posee) */}
        {!owned && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Estadísticas Base</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>❤️</Text>
                <Text style={styles.statLabel}>HP</Text>
                <Text style={styles.statValue}>{catalog.stats.hp}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⚔️</Text>
                <Text style={styles.statLabel}>ATK</Text>
                <Text style={styles.statValue}>{catalog.stats.attack}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🛡️</Text>
                <Text style={styles.statLabel}>DEF</Text>
                <Text style={styles.statValue}>{catalog.stats.defense}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>💨</Text>
                <Text style={styles.statLabel}>SPD</Text>
                <Text style={styles.statValue}>{catalog.stats.speed}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

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
                    style={[styles.dialogButton, styles.dialogButtonSecondary]}
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
                    {dialogConfig.mode === "confirm" ? "Confirmar" : "Aceptar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  spriteContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: height * 0.35,
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 18,
  },
  spriteContainerAscendedMax: {
    backgroundColor: MAX_ASCENDED_BG,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.6)",
  },
  glow: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    opacity: 0.2,
  },
  heroSprite: {
    width: width * 0.7,
    height: width * 0.7,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  infoContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroName: {
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  starsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  starsBlock: {
    alignItems: "center",
  },
  starsLine: {
    flexDirection: "row",
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  emptyAscensionStar: {
    color: "rgba(255,255,255,0.25)",
  },
  heroTitle: {
    color: "#AAA",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  elementName: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  notOwnedBanner: {
    backgroundColor: "rgba(255,0,0,0.2)",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  notOwnedText: {
    color: "#FF6B6B",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  levelContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 15,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelLabel: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  expText: {
    color: "#AAA",
    fontSize: 14,
  },
  expBarContainer: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 5,
    overflow: "hidden",
  },
  expBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  resonanceContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.45)",
  },
  resonanceLabel: {
    color: "#FF9FA5",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  ascensionProgressLabel: {
    color: "#FFD8D8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 15,
  },
  statsTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 12,
    minWidth: 70,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    color: "#888",
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  buttonSpacer: {
    width: 15,
  },
  equipmentContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 15,
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  equipmentSlot: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
  emptySlotIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  emptySlotText: {
    color: "#FFF",
    fontSize: 10,
  },
  equippedItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  equippedIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  equippedName: {
    color: "#FFF",
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
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
