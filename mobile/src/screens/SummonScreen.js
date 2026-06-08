import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GameBackground from "../components/GameBackground";
import ThemedDialog from "../components/ThemedDialog";
import api, { fetchCurrentUser } from "../services/api";
import { DEFAULT_GAME_SETTINGS, getGameSettings } from "../services/preferences";
import {
    elevation,
    palette,
    radii,
    spacing,
    typography,
} from "../theme/tokens";

// Banners
const bannerHendrika = require("../assets/banners/banner_hendrika.png");

export default function SummonScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [userResources, setUserResources] = useState({ gems: 0, tickets: 0 });
  const [bannerInfo, setBannerInfo] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);
  const [gameSettings, setGameSettings] = useState(DEFAULT_GAME_SETTINGS);

  const getUserResources = (user) => {
    const ticketsItem = user?.inventory?.find(
      (item) => item.itemId === "summon_ticket",
    );

    return {
      gems: user?.gems || 0,
      tickets: ticketsItem ? ticketsItem.quantity : 0,
    };
  };

  const fetchResources = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
        setUserResources(getUserResources(currentUser));
      }
    } catch (err) {
      console.error("Error fetching resources", err);
    }
  }, []);

  const fetchBannerInfo = useCallback(async () => {
    try {
      const response = await api.get("/gacha/banner");
      setBannerInfo(response.data || null);
    } catch (err) {
      console.error("Error fetching banner info", err);
      setBannerInfo(null);
    }
  }, []);

  useEffect(() => {
    fetchResources();
    fetchBannerInfo();
  }, [fetchResources, fetchBannerInfo]);

  useEffect(() => {
    getGameSettings()
      .then(setGameSettings)
      .catch(() => setGameSettings(DEFAULT_GAME_SETTINGS));
  }, []);

  const handlePull = async (amount) => {
    const costTickets = amount === 10 ? 10 : 1;
    const costGems = amount === 10 ? 2000 : 250;

    if (userResources.tickets < costTickets && userResources.gems < costGems) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Recursos insuficientes",
        message: "No tienes suficientes Gemas o Tickets de Invocación.",
      });
      return;
    }

    if (gameSettings.hapticsEnabled) {
      Haptics.selectionAsync().catch(() => null);
    }

    setLoading(true);
    try {
      const response = await api.post("/gacha/pull", { amount });
      if (response.data && response.data.results) {
        if (gameSettings.hapticsEnabled) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => null);
        }
        const currentUser = await fetchCurrentUser().catch(() => null);
        setUserResources(
          currentUser
            ? getUserResources(currentUser)
            : {
                gems: response.data.remainingGems,
                tickets: response.data.remainingTickets,
              },
        );

        if (gameSettings.gachaAnimationEnabled) {
          navigation.navigate("SummonReveal", {
            results: response.data.results,
            bannerTitle,
            featuredName,
          });
        } else {
          navigation.navigate("SummonResult", {
            results: response.data.results,
          });
        }
      }
    } catch (err) {
      if (gameSettings.hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => null,
        );
      }
      setDialogConfig({
        mode: "info",
        tone: "error",
        title: "Error",
        message: err.response?.data?.message || "Hubo un error al invocar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const featuredName = bannerInfo?.featuredHero?.name || "Hendrikka";
  const featuredRate = bannerInfo?.rates?.featuredRate || "100%";
  const base5Star = bannerInfo?.rates?.base5Star || "0.6%";
  const bannerTitle = bannerInfo?.name || "Hija del Cuervo";
  const rateUp4Stars = (bannerInfo?.rateUp4Stars || []).slice(0, 4);

  return (
    <GameBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.backButtonText}>{"< Volver"}</Text>
          </TouchableOpacity>
          <View style={styles.resourcesContainer}>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceIcon}>Ticket</Text>
              <Text style={styles.resourceText}>{userResources.tickets}</Text>
            </View>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceIcon}>Gemas</Text>
              <Text style={styles.resourceText}>{userResources.gems}</Text>
            </View>
          </View>
        </View>

        {/* Banner Area */}
        <View style={styles.bannerContainer}>
          <ImageBackground
            source={bannerHendrika}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerInfoTitle}>{bannerTitle}</Text>
              <Text style={styles.bannerInfoSubtitle}>
                5★ único: {featuredName} ({featuredRate} de los 5★)
              </Text>
              <Text style={styles.bannerInfoSubtitle}>
                Probabilidad 5★ por tiro: {base5Star}
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.poolContainer}>
            <Text style={styles.poolTitle}>Pool del banner</Text>
            <Text style={styles.poolText}>4★ (solo 4 héroes):</Text>
            <View style={styles.poolChipRow}>
              {rateUp4Stars.length > 0 ? (
                rateUp4Stars.map((hero) => (
                  <View key={hero._id} style={styles.poolChip}>
                    <Text style={styles.poolChipText}>{hero.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.poolFallbackText}>
                  Cargando héroes 4★...
                </Text>
              )}
            </View>

            <Text style={[styles.poolText, styles.poolTextSpacing]}>
              5★ (solo 1 héroe):
            </Text>
            <View style={styles.poolChipFeatured}>
              <Text style={styles.poolChipFeaturedText}>{featuredName}</Text>
            </View>
          </View>
        </View>

        {/* Action Area */}
        <View style={styles.actionContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.summonButton}
                onPress={() => handlePull(1)}
              >
                <Text style={styles.summonButtonText}>Invocar x1</Text>
                <Text style={styles.costText}>1 Ticket / 250 Gemas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summonButton, styles.summonButton10]}
                onPress={() => handlePull(10)}
              >
                <Text style={styles.summonButtonText}>Invocar x10</Text>
                <Text style={styles.costText}>10 Tickets / 2000 Gemas</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {dialogConfig && (
        <ThemedDialog
          visible={!!dialogConfig}
          mode={dialogConfig.mode}
          tone={dialogConfig.tone}
          title={dialogConfig.title}
          message={dialogConfig.message}
          onClose={() => setDialogConfig(null)}
        />
      )}
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.md,
    backgroundColor: "rgba(15, 20, 27, 0.7)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.bronze,
    ...elevation.soft,
  },
  backButtonText: {
    color: palette.gold,
    fontFamily: typography.subtitle,
  },
  resourcesContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  resourceBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 20, 27, 0.82)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.steel,
  },
  resourceIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
    color: palette.frost,
    fontFamily: typography.ui,
  },
  resourceText: {
    color: palette.parchment,
    fontFamily: typography.ui,
  },
  bannerContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.bronze,
    overflow: "hidden",
    backgroundColor: "rgba(15, 20, 27, 0.9)",
    ...elevation.strong,
  },
  bannerImage: {
    width: "100%",
    height: 260,
    justifyContent: "flex-end",
  },
  bannerOverlay: {
    backgroundColor: "rgba(15, 20, 27, 0.72)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  poolContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "rgba(15, 20, 27, 0.92)",
    borderTopWidth: 1,
    borderTopColor: palette.steel,
  },
  bannerInfoTitle: {
    color: palette.gold,
    fontFamily: typography.title,
    fontSize: 16,
  },
  bannerInfoSubtitle: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 4,
  },
  poolTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  poolText: {
    color: palette.frost,
    fontFamily: typography.ui,
    fontSize: 12,
  },
  poolTextSpacing: {
    marginTop: spacing.sm,
  },
  poolChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  poolChip: {
    backgroundColor: "rgba(47, 74, 95, 0.5)",
    borderWidth: 1,
    borderColor: palette.steel,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  poolChipText: {
    color: palette.parchment,
    fontFamily: typography.ui,
    fontSize: 11,
  },
  poolChipFeatured: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: "rgba(123, 92, 46, 0.4)",
    borderWidth: 1,
    borderColor: palette.gold,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  poolChipFeaturedText: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 12,
  },
  poolFallbackText: {
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 12,
  },
  actionContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  summonButton: {
    width: "48%",
    backgroundColor: "rgba(28, 37, 48, 0.95)",
    paddingVertical: 15,
    borderRadius: radii.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: palette.steel,
  },
  summonButton10: {
    backgroundColor: "rgba(123, 92, 46, 0.92)",
    borderColor: palette.gold,
  },
  summonButtonText: {
    color: palette.parchment,
    fontSize: 18,
    fontFamily: typography.subtitle,
    marginBottom: 5,
  },
  costText: {
    color: palette.frost,
    fontSize: 13,
    fontFamily: typography.ui,
  },
  scrollContent: {
    paddingBottom: 30,
  },
});
