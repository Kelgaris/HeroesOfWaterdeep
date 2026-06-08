import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GameBackground from "../components/GameBackground";
import ThemedDialog from "../components/ThemedDialog";
import api, {
    fetchCurrentUser,
    getAssetURL,
    getStoredUser,
    SERVER_URL,
} from "../services/api";

const ROLE_LABELS = {
  tank: "Tanque",
  fighter: "Luchador",
  assassin: "Asesino",
  mage: "Mago",
  ranger: "Ranger",
  healer: "Healer",
  support: "Soporte",
};

const ROLE_COLORS = {
  tank: "#4FC3F7",
  fighter: "#FFB74D",
  assassin: "#F06292",
  mage: "#BA68C8",
  ranger: "#81C784",
  healer: "#FFF176",
  support: "#90CAF9",
};

const calculateHeroPower = (hero) => {
  const stats = hero.userHeroData?.stats || hero.stats || {};
  const level = hero.userHeroData?.level || hero.level || 1;
  const rarity = hero.rarity || hero.userHeroData?.rarity || 1;

  const power =
    (stats.hp || 0) * 0.18 +
    (stats.attack || 0) * 2.4 +
    (stats.defense || 0) * 2 +
    (stats.speed || 0) * 1.4 +
    level * 10 +
    rarity * 40;

  return Math.round(power);
};

const buildStageRecommendation = (stage) => {
  const enemyIds = (stage.enemies || []).map((enemy) => enemy.enemyId || "");
  const enemyCount = (stage.enemies || []).reduce(
    (total, enemy) => total + (enemy.quantity || 1),
    0,
  );

  const roles = new Set();
  const notes = [];

  if (
    stage.difficulty === "hard" ||
    stage.difficulty === "extreme" ||
    enemyIds.some(
      (enemyId) =>
        enemyId.includes("chief") ||
        enemyId.includes("boss") ||
        enemyId.includes("dragon"),
    )
  ) {
    roles.add("tank");
    notes.push(
      "Lleva una primera línea resistente para absorber el pico de daño.",
    );
  }

  if (
    enemyIds.some(
      (enemyId) => enemyId.includes("shaman") || enemyId.includes("mage"),
    )
  ) {
    roles.add("assassin");
    notes.push("Prioriza daño explosivo para borrar soportes enemigos rápido.");
  }

  if (enemyCount >= 5) {
    roles.add("mage");
    notes.push("El daño en área rinde especialmente bien en esta fase.");
  }

  if (
    stage.difficulty !== "easy" ||
    enemyIds.some(
      (enemyId) => enemyId.includes("wolf") || enemyId.includes("bat"),
    )
  ) {
    roles.add("healer");
    notes.push("El sustain reduce mucho el riesgo de wipe en esta pelea.");
  }

  if (roles.size === 0) {
    roles.add("fighter");
    notes.push(
      "Basta con una formación ofensiva balanceada para superar esta fase.",
    );
  }

  return {
    recommendedRoles: Array.from(roles),
    note: notes[0],
  };
};

export default function HeroSelectionScreen({ route, navigation }) {
  const { stage } = route.params;
  const [userHeroes, setUserHeroes] = useState([]);
  const [selectedHeroIds, setSelectedHeroIds] = useState([]);
  const [energy, setEnergy] = useState(0);
  const [dialogConfig, setDialogConfig] = useState(null);

  const loadUserHeroes = useCallback(async () => {
    try {
      const [currentUser, catalogResponse] = await Promise.all([
        fetchCurrentUser().catch(() => null),
        api.get("/heroes/catalog").catch(() => null),
      ]);
      const resolvedUser = currentUser || (await getStoredUser());
      const ownedCatalogHeroes = (catalogResponse?.data || []).filter(
        (hero) => hero.owned,
      );

      if (resolvedUser) {
        if (ownedCatalogHeroes.length > 0) {
          setUserHeroes(ownedCatalogHeroes);
        } else if (resolvedUser.heroes) {
          setUserHeroes(
            resolvedUser.heroes.map((hero) => ({
              ...hero,
              _id: hero.heroId,
              role: "fighter",
              battleKit: null,
              userHeroData: hero,
            })),
          );
        }
        setEnergy(resolvedUser.energy || 0);
      }
    } catch (error) {
      console.error("Error loading user heroes", error);
    }
  }, []);

  const stageRecommendation = useMemo(
    () => buildStageRecommendation(stage),
    [stage],
  );

  const selectedTeam = useMemo(
    () => userHeroes.filter((hero) => selectedHeroIds.includes(hero._id)),
    [selectedHeroIds, userHeroes],
  );

  const teamPower = useMemo(
    () =>
      selectedTeam.reduce((total, hero) => total + calculateHeroPower(hero), 0),
    [selectedTeam],
  );

  const selectedRoleCounts = useMemo(() => {
    return selectedTeam.reduce((counts, hero) => {
      const role = hero.role || "fighter";
      counts[role] = (counts[role] || 0) + 1;
      return counts;
    }, {});
  }, [selectedTeam]);

  const missingRecommendedRoles = useMemo(
    () =>
      stageRecommendation.recommendedRoles.filter(
        (role) => !selectedTeam.some((hero) => hero.role === role),
      ),
    [selectedTeam, stageRecommendation],
  );

  useEffect(() => {
    loadUserHeroes();
  }, [loadUserHeroes]);

  const toggleHeroSelection = (heroId) => {
    setSelectedHeroIds((prev) => {
      if (prev.includes(heroId)) {
        return prev.filter((id) => id !== heroId);
      }
      if (prev.length >= 6) {
        setDialogConfig({
          mode: "info",
          tone: "warning",
          title: "Límite alcanzado",
          message: "Solo puedes seleccionar hasta 6 héroes.",
        });
        return prev;
      }
      return [...prev, heroId];
    });
  };

  const handleStartBattle = () => {
    if (selectedHeroIds.length === 0) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Atención",
        message: "Debes seleccionar al menos un héroe.",
      });
      return;
    }
    if (energy < stage.energyCost) {
      setDialogConfig({
        mode: "info",
        tone: "error",
        title: "Sin Energía",
        message: "No tienes suficiente energía para este nivel.",
      });
      return;
    }

    // Navegar a la pantalla de batalla con la info necesaria
    navigation.navigate("Battle", {
      stageId: stage.stageId,
      stage,
      selectedHeroIds,
    });
  };

  const renderHero = ({ item }) => {
    const isSelected = selectedHeroIds.includes(item._id);
    const roleColor = ROLE_COLORS[item.role] || ROLE_COLORS.fighter;
    const power = calculateHeroPower(item);
    const imageUrl =
      getAssetURL(item.pixelArt) ||
      `${SERVER_URL}/assets/heroes/${item._id.replace("hero_", "")}/icon.png`;

    return (
      <TouchableOpacity
        style={[styles.heroCard, isSelected && styles.heroCardSelected]}
        onPress={() => toggleHeroSelection(item._id)}
      >
        <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
          <Text style={styles.roleBadgeText}>
            {ROLE_LABELS[item.role] || "Luchador"}
          </Text>
        </View>
        <Image
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          defaultSource={require("../../assets/images/icon.png")} // Fallback
        />
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>
            {item.name || item.userHeroData?.name}
          </Text>
          <Text style={styles.heroLevel}>
            Nv. {item.userHeroData?.level || item.level || 1}
          </Text>
          <Text style={styles.heroPower}>Poder {power}</Text>
          <Text style={styles.heroSkill} numberOfLines={1}>
            {item.battleKit?.basic?.name || "Ataque básico"}
          </Text>
          <Text style={styles.heroSkillSecondary} numberOfLines={1}>
            {item.battleKit?.ultimate?.name || "Límite"}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <GameBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{"< Volver"}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Selección de Equipo</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.stageInfoContainer}>
          <Text style={styles.stageTitle}>{stage.name}</Text>
          <Text style={styles.energyText}>
            Coste de Energía: {stage.energyCost} ⚡
          </Text>
          <View style={styles.stageRewardRow}>
            <Text style={styles.stageRewardText}>
              EXP +{stage.rewards?.experience || 0}
            </Text>
            <Text style={styles.stageRewardText}>
              💰 {stage.rewards?.gold || 0}
            </Text>
            <Text style={styles.stageRewardText}>
              💎 {stage.rewards?.gems || 0}
            </Text>
          </View>
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>
              Recomendación táctica
            </Text>
            <View style={styles.recommendationRolesRow}>
              {stageRecommendation.recommendedRoles.map((role) => (
                <View
                  key={role}
                  style={[
                    styles.recommendationRoleChip,
                    { borderColor: ROLE_COLORS[role] || ROLE_COLORS.fighter },
                  ]}
                >
                  <Text
                    style={[
                      styles.recommendationRoleText,
                      { color: ROLE_COLORS[role] || ROLE_COLORS.fighter },
                    ]}
                  >
                    {ROLE_LABELS[role] || role}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.recommendationNote}>
              {stageRecommendation.note}
            </Text>
          </View>
          <Text style={styles.selectedCountText}>
            Seleccionados: {selectedHeroIds.length}/6
          </Text>
        </View>

        <View style={styles.teamSummaryContainer}>
          <View>
            <Text style={styles.teamSummaryLabel}>Poder total</Text>
            <Text style={styles.teamSummaryValue}>{teamPower}</Text>
          </View>
          <View style={styles.teamSummaryRoles}>
            {Object.keys(selectedRoleCounts).length > 0 ? (
              Object.entries(selectedRoleCounts).map(([role, count]) => (
                <Text key={role} style={styles.teamSummaryRoleText}>
                  {ROLE_LABELS[role] || role} x{count}
                </Text>
              ))
            ) : (
              <Text style={styles.teamSummaryRoleText}>
                Selecciona héroes para ver la sinergia.
              </Text>
            )}
            {missingRecommendedRoles.length > 0 ? (
              <Text style={styles.teamSummaryWarning}>
                Falta:{" "}
                {missingRecommendedRoles
                  .map((role) => ROLE_LABELS[role] || role)
                  .join(", ")}
              </Text>
            ) : selectedHeroIds.length > 0 ? (
              <Text style={styles.teamSummaryOk}>
                Composición alineada con la fase.
              </Text>
            ) : null}
          </View>
        </View>

        <FlatList
          data={userHeroes}
          keyExtractor={(item) => item._id}
          renderItem={renderHero}
          numColumns={2}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes héroes disponibles.</Text>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              selectedHeroIds.length === 0 && styles.startButtonDisabled,
            ]}
            onPress={handleStartBattle}
            disabled={selectedHeroIds.length === 0}
          >
            <Text style={styles.startButtonText}>EMPEZAR BATALLA</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backButton: { padding: 10 },
  backButtonText: {
    color: "#FFD700",
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 16,
  },
  title: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 20,
    color: "#FFF",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  stageInfoContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  stageTitle: {
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 18,
    color: "#FFF",
    marginBottom: 5,
  },
  energyText: { color: "#00E5FF", fontWeight: "bold" },
  stageRewardRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  stageRewardText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  recommendationContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  recommendationTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 6,
  },
  recommendationRolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 6,
  },
  recommendationRoleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  recommendationRoleText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  recommendationNote: {
    color: "#DDD",
    fontSize: 12,
    textAlign: "center",
  },
  selectedCountText: { color: "#FFD700", marginTop: 5 },
  teamSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(9, 18, 30, 0.95)",
    borderBottomWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.35)",
  },
  teamSummaryLabel: {
    color: "#9dc7ff",
    fontSize: 12,
    textTransform: "uppercase",
  },
  teamSummaryValue: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },
  teamSummaryRoles: {
    flex: 1,
    marginLeft: 16,
  },
  teamSummaryRoleText: {
    color: "#FFF",
    fontSize: 12,
    marginBottom: 2,
  },
  teamSummaryWarning: {
    color: "#FFB74D",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  teamSummaryOk: {
    color: "#81C784",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  list: { padding: 10 },
  emptyText: {
    color: "#FFF",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  heroCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "rgba(40,40,50,0.8)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#555",
    alignItems: "center",
    padding: 10,
    position: "relative",
    minHeight: 225,
  },
  heroCardSelected: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(80,80,40,0.8)",
  },
  roleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  roleBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  heroImage: { width: 80, height: 80, resizeMode: "contain", marginBottom: 10 },
  heroInfo: { alignItems: "center" },
  heroName: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  heroLevel: { color: "#FFD700", fontSize: 12 },
  heroPower: {
    color: "#90CAF9",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  heroSkill: { color: "#FFF", fontSize: 11, marginTop: 6, textAlign: "center" },
  heroSkillSecondary: {
    color: "#B0BEC5",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#FFD700",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBadgeText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  footer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopWidth: 1,
    borderColor: "#444",
  },
  startButton: {
    backgroundColor: "#FFD700",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  startButtonDisabled: { backgroundColor: "#555" },
  startButtonText: {
    color: "#000",
    fontFamily: "Cinzel_700Bold",
    fontSize: 18,
  },
});
