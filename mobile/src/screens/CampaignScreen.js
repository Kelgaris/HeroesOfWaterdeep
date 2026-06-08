import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import GameBackground from "../components/GameBackground";
import api from "../services/api";

const ZONE_NAMES = {
  1: "Bosque de los Susurros",
  2: "Cavernas Sombrías",
  3: "Ruinas Arcanas",
  4: "Fortaleza del Vacío",
};

const DIFFICULTY_LABELS = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  extreme: "Extrema",
};

const DIFFICULTY_COLORS = {
  easy: "#4CAF50",
  normal: "#4a90e2",
  hard: "#FF9800",
  extreme: "#FF5252",
};

const TOTAL_ZONES = Object.keys(ZONE_NAMES)
  .map(Number)
  .sort((a, b) => a - b);

export default function CampaignScreen({ navigation }) {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentZone, setCurrentZone] = useState(1);
  const [maxZoneReached, setMaxZoneReached] = useState(1);
  const [currentProgress, setCurrentProgress] = useState({ zone: 1, stage: 1 });
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchStages = useCallback(async () => {
    try {
      const response = await api.get("/battle/stages");
      if (response.data && response.data.stages) {
        setStages(response.data.stages);
        if (response.data.currentProgress) {
          const progress = response.data.currentProgress;
          setCurrentProgress(progress);

          // Limitar maxZoneReached a las zonas que existen
          const maxAvailableZone = Math.max(...TOTAL_ZONES);
          const userMaxZone = Math.min(progress.zone, maxAvailableZone);
          setMaxZoneReached(userMaxZone);

          // Solo inicializar la zona una vez al cargar
          if (!isInitialized) {
            // El usuario debe estar en la zona más alta a la que ha llegado (pero que exista)
            const targetZone = Math.min(progress.zone, maxAvailableZone);
            setCurrentZone(targetZone);
            setIsInitialized(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
    } finally {
      setLoading(false);
    }
  }, [isInitialized]);

  useFocusEffect(
    useCallback(() => {
      fetchStages();
    }, [fetchStages]),
  );

  const handlePrevZone = () => {
    const currentIndex = TOTAL_ZONES.indexOf(currentZone);
    if (currentIndex > 0) {
      setCurrentZone(TOTAL_ZONES[currentIndex - 1]);
    }
  };

  const handleNextZone = () => {
    const currentIndex = TOTAL_ZONES.indexOf(currentZone);
    // Solo permitir avanzar si la siguiente zona existe y está desbloqueada
    if (currentIndex < TOTAL_ZONES.length - 1) {
      const nextZone = TOTAL_ZONES[currentIndex + 1];
      if (nextZone <= maxZoneReached) {
        setCurrentZone(nextZone);
      }
    }
  };

  const handleSelectStage = (stage) => {
    navigation.navigate("HeroSelection", { stage });
  };

  const renderStage = ({ item }) => {
    const isCurrentObjective =
      item.zone === currentProgress.zone &&
      item.stageNumber === currentProgress.stage;
    const isCompleted =
      item.zone < currentProgress.zone ||
      (item.zone === currentProgress.zone &&
        item.stageNumber < currentProgress.stage);
    const difficultyColor =
      DIFFICULTY_COLORS[item.difficulty] || DIFFICULTY_COLORS.normal;

    return (
      <TouchableOpacity
        style={styles.stageCard}
        onPress={() => handleSelectStage(item)}
      >
        <View style={styles.stageInfo}>
          <View style={styles.stageMetaRow}>
            <View
              style={[styles.difficultyBadge, { borderColor: difficultyColor }]}
            >
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {DIFFICULTY_LABELS[item.difficulty] || "Normal"}
              </Text>
            </View>
            {isCurrentObjective ? (
              <View style={[styles.statusBadge, styles.statusObjective]}>
                <Text style={styles.statusBadgeText}>OBJETIVO</Text>
              </View>
            ) : isCompleted ? (
              <View style={[styles.statusBadge, styles.statusCompleted]}>
                <Text style={styles.statusBadgeText}>SUPERADA</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.stageTitle}>
            Fase {item.stageNumber}: {item.name}
          </Text>
          <Text style={styles.stageDescription}>{item.description}</Text>
          <View style={styles.rewardRow}>
            <Text style={styles.energyText}>⚡ {item.energyCost}</Text>
            <Text style={styles.rewardText}>
              EXP +{item.rewards?.experience || 0}
            </Text>
            <Text style={styles.rewardText}>💰 {item.rewards?.gold || 0}</Text>
            <Text style={styles.rewardText}>💎 {item.rewards?.gems || 0}</Text>
          </View>
        </View>
        <View style={styles.actionBtn}>
          <Text style={styles.actionText}>Jugar</Text>
        </View>
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
          <Text style={styles.title}>Campaña</Text>
          <View style={{ width: 60 }} />
        </View>

        {!loading && (
          <View style={styles.zoneSelector}>
            <TouchableOpacity
              onPress={handlePrevZone}
              disabled={TOTAL_ZONES.indexOf(currentZone) === 0}
            >
              <Text
                style={[
                  styles.arrowText,
                  TOTAL_ZONES.indexOf(currentZone) === 0 && { opacity: 0.3 },
                ]}
              >
                {"<"}
              </Text>
            </TouchableOpacity>

            <View style={styles.zoneTitleContainer}>
              <Text style={styles.zoneTitle}>ZONA {currentZone}</Text>
              <Text style={styles.zoneSubtitle}>
                {ZONE_NAMES[currentZone] || "Tierra Desconocida"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNextZone}
              disabled={
                TOTAL_ZONES.indexOf(currentZone) === TOTAL_ZONES.length - 1 ||
                TOTAL_ZONES[TOTAL_ZONES.indexOf(currentZone) + 1] >
                  maxZoneReached
              }
            >
              <Text
                style={[
                  styles.arrowText,
                  (TOTAL_ZONES.indexOf(currentZone) ===
                    TOTAL_ZONES.length - 1 ||
                    TOTAL_ZONES[TOTAL_ZONES.indexOf(currentZone) + 1] >
                      maxZoneReached) && { opacity: 0.3 },
                ]}
              >
                {">"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : currentZone > maxZoneReached ? (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Zona Bloqueada</Text>
            <Text style={styles.lockedSubtitle}>
              Completa las fases anteriores para acceder a esta zona.
            </Text>
          </View>
        ) : (
          <FlatList
            data={stages.filter((s) => s.zone === currentZone)}
            keyExtractor={(item) => item.stageId}
            renderItem={renderStage}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: "#FFD700",
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 16,
  },
  title: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 24,
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  zoneSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(20, 30, 50, 0.9)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4a90e2",
  },
  arrowText: {
    fontSize: 28,
    color: "#4a90e2",
    fontWeight: "bold",
    padding: 10,
  },
  zoneTitleContainer: {
    alignItems: "center",
  },
  zoneTitle: {
    fontSize: 22,
    color: "#FFD700",
    fontFamily: "Cinzel_700Bold",
  },
  zoneSubtitle: {
    fontSize: 14,
    color: "#FFF",
    fontStyle: "italic",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
  },
  stageCard: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 30, 40, 0.8)",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#444",
    alignItems: "center",
  },
  stageInfo: {
    flex: 1,
  },
  stageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusObjective: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.55)",
  },
  statusCompleted: {
    backgroundColor: "rgba(76, 175, 80, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.45)",
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  stageTitle: {
    fontFamily: "Cinzel_600SemiBold",
    color: "#FFD700",
    fontSize: 16,
    marginBottom: 5,
  },
  stageDescription: {
    color: "#CCC",
    fontSize: 12,
    marginBottom: 5,
  },
  energyText: {
    color: "#00E5FF",
    fontWeight: "bold",
    fontSize: 12,
  },
  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  rewardText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  actionText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    margin: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#555",
  },
  lockedIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  lockedTitle: {
    color: "#FF6B6B",
    fontSize: 22,
    fontFamily: "Cinzel_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  lockedSubtitle: {
    color: "#CCC",
    fontSize: 14,
    textAlign: "center",
  },
});
