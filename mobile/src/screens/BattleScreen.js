import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import ThemedDialog from "../components/ThemedDialog";
import api, { fetchCurrentUser, getAssetURL, SERVER_URL } from "../services/api";

const { width } = Dimensions.get("window");

// --- COMPONENTE: UNIDAD EN EL CAMPO (SPRITE) ---
const FieldSprite = ({
  imageUri,
  color,
  isHero,
  attackTrigger,
  hitTrigger,
  isDead,
  damageInfo,
  isActiveTurn,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (attackTrigger > 0) {
      // Movimiento hacia el enemigo (arriba/abajo en vertical)
      const moveDistance = isHero ? -40 : 40;
      translateY.value = withSequence(
        withTiming(moveDistance, { duration: 100 }),
        withSpring(0, { damping: 15, stiffness: 150 }),
      );
    }
  }, [attackTrigger, isHero, translateY]);

  useEffect(() => {
    if (hitTrigger > 0) {
      flash.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }
  }, [flash, hitTrigger]);

  useEffect(() => {
    if (isDead) opacity.value = withTiming(0, { duration: 500 });
  }, [isDead, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const resolvedImageUri = getAssetURL(imageUri);

  return (
    <View style={styles.spriteContainer}>
      <Animated.View style={[styles.spriteWrapper, animatedStyle]}>
        {/* Sombra a los pies */}
        <View style={styles.shadow} />
        {resolvedImageUri ? (
          <Image
            source={{ uri: resolvedImageUri }}
            style={styles.sprite}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[styles.enemyShape, { backgroundColor: color || "#F44336" }]}
          />
        )}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.flashOverlay, flashStyle]}
        />
        {damageInfo !== undefined && (
          <Text
            numberOfLines={1}
            style={[
              styles.damageFloating,
              damageInfo.isCrit
                ? styles.damageCrit
                : damageInfo.isHeal
                  ? styles.damageHeal
                  : styles.damageNormal,
            ]}
          >
            {damageInfo.isHeal ? "+" : "-"}
            {damageInfo.amount}
          </Text>
        )}
        {isActiveTurn && <View style={styles.activeIndicator} />}
      </Animated.View>
    </View>
  );
};

// --- COMPONENTE: TARJETA DE UNIDAD (UI PANEL) ---
const ROLE_LABELS = {
  tank: "Tanque",
  fighter: "Luchador",
  assassin: "Asesino",
  mage: "Mago",
  ranger: "Ranger",
  healer: "Healer",
  support: "Soporte",
};

const UnitControlCard = ({ name, role, hp, maxHp, mp, maxMp, isDead }) => {
  const hpWidth = (hp / maxHp) * 100;
  const mpWidth = (mp / maxMp) * 100;

  return (
    <View style={[styles.unitCard, isDead && { opacity: 0.5 }]}>
      <View style={styles.unitCardHeader}>
        <Text style={styles.unitCardName}>{name.toUpperCase()}</Text>
        <Text style={styles.limitText}>{ROLE_LABELS[role] || "LIMIT"}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statLine}>
          <Text style={styles.statLabel}>HP</Text>
          <Text style={styles.statValue}>
            {hp}/{maxHp}
          </Text>
        </View>
        <View style={styles.barBackground}>
          <View style={[styles.hpBar, { width: `${hpWidth}%` }]} />
        </View>

        <View style={styles.statLine}>
          <Text style={styles.statLabel}>MP</Text>
          <Text style={styles.statValue}>{mp}</Text>
        </View>
        <View style={styles.barBackground}>
          <View style={[styles.mpBar, { width: `${mpWidth}%` }]} />
        </View>
      </View>
    </View>
  );
};

export default function BattleScreen({ route, navigation }) {
  const { stageId, stage, selectedHeroIds } = route.params;
  const [loading, setLoading] = useState(true);
  const [battleResult, setBattleResult] = useState(null);
  const [logsToDisplay, setLogsToDisplay] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [nextStage, setNextStage] = useState(null);

  const [heroes, setHeroes] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [triggers, setTriggers] = useState({});
  const [activeTurn, setActiveTurn] = useState(null);
  const [damageMap, setDamageMap] = useState({});
  const [dialogConfig, setDialogConfig] = useState(null);

  const abortBattleRef = useRef(false);
  const startBattleRef = useRef(null);
  const isAutoRef = useRef(isAuto);
  const isRepeatRef = useRef(isRepeat);

  useEffect(() => {
    isAutoRef.current = isAuto;
  }, [isAuto]);
  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  const animateBattleLogs = useCallback((logs, victory) => {
    let currentIndex = 0;

    const nextLog = () => {
      if (abortBattleRef.current) return;

      if (currentIndex < logs.length) {
        const log = logs[currentIndex];
        setActiveTurn(log.attacker);
        setLogsToDisplay((prev) =>
          [
            `${log.attackerName} · ${log.actionLabel}${log.isHeal ? ` +${log.damage}` : ` -${log.damage}`}`,
            ...prev,
          ].slice(0, 3),
        );
        setDamageMap((prev) => ({
          ...prev,
          [log.target]: {
            amount: log.damage,
            isCrit: log.isCrit,
            isHeal: log.isHeal,
          },
        }));
        setTriggers((prev) => ({
          ...prev,
          [log.attacker]: {
            ...prev[log.attacker],
            attack: prev[log.attacker].attack + 1,
          },
        }));

        const speed = isAutoRef.current ? 0.3 : 0.6;

        setTimeout(() => {
          if (abortBattleRef.current) return;
          setTriggers((prev) => ({
            ...prev,
            [log.target]: {
              ...prev[log.target],
              hit: prev[log.target].hit + 1,
            },
          }));
          setHeroes((cur) =>
            cur.map((hero) => {
              let updatedHero = hero;

              if (hero.instanceId === log.attacker) {
                updatedHero = {
                  ...updatedHero,
                  currentMp: log.attackerMpAfter ?? updatedHero.currentMp,
                };
              }

              if (hero.instanceId === log.target) {
                updatedHero = {
                  ...updatedHero,
                  currentHp: log.targetRemainingHp,
                };
              }

              return updatedHero;
            }),
          );
          setEnemies((cur) =>
            cur.map((enemy) => {
              let updatedEnemy = enemy;

              if (enemy.instanceId === log.attacker) {
                updatedEnemy = {
                  ...updatedEnemy,
                  currentMp: log.attackerMpAfter ?? updatedEnemy.currentMp,
                };
              }

              if (enemy.instanceId === log.target) {
                updatedEnemy = {
                  ...updatedEnemy,
                  currentHp: log.targetRemainingHp,
                };
              }

              return updatedEnemy;
            }),
          );
        }, 150 * speed);

        setTimeout(() => {
          if (abortBattleRef.current) return;
          setActiveTurn(null);
          setDamageMap((prev) => {
            const n = { ...prev };
            delete n[log.target];
            return n;
          });
        }, 500 * speed);

        currentIndex++;
        setTimeout(nextLog, 700 * speed);
      } else {
        setTimeout(() => {
          if (abortBattleRef.current) return;
          if (isRepeatRef.current && victory) {
            startBattleRef.current?.();
          } else {
            setShowResults(true);
          }
        }, 1500);
      }
    };

    nextLog();
  }, []);

  const startBattle = useCallback(async () => {
    abortBattleRef.current = true;
    setTimeout(async () => {
      abortBattleRef.current = false;
      setLoading(true);
      setShowResults(false);
      try {
        const response = await api.post("/battle/battle", {
          stageId,
          selectedHeroIds,
        });
        const result = response.data;
        if (abortBattleRef.current) return;
        await fetchCurrentUser().catch(() => null);

        const nextStageResponse = await api
          .get("/battle/stages")
          .catch(() => null);
        const nextProgress = result.userStats?.progress;
        const resolvedNextStage = nextStageResponse?.data?.stages?.find(
          (availableStage) =>
            availableStage.zone === nextProgress?.zone &&
            availableStage.stageNumber === nextProgress?.stage,
        );

        setBattleResult(result);
        setNextStage(
          resolvedNextStage && resolvedNextStage.stageId !== stageId
            ? resolvedNextStage
            : null,
        );
        setHeroes(result.initialHeroes);
        setEnemies(result.initialEnemies);

        const initialTriggers = {};
        [...result.initialHeroes, ...result.initialEnemies].forEach(
          (char) => (initialTriggers[char.instanceId] = { attack: 0, hit: 0 }),
        );
        setTriggers(initialTriggers);
        setLogsToDisplay([]);
        setLoading(false);
        animateBattleLogs(result.battleLog, result.victory);
      } catch (err) {
        if (!abortBattleRef.current) {
          setLoading(false);
          setDialogConfig({
            mode: "info",
            tone: "error",
            title: "Error",
            message:
              err.response?.data?.message || "No se pudo iniciar la batalla.",
            onClose: () => {
              setDialogConfig(null);
              navigation.goBack();
            },
          });
        }
      }
    }, 50);
  }, [animateBattleLogs, navigation, selectedHeroIds, stageId]);

  useEffect(() => {
    startBattleRef.current = startBattle;
  }, [startBattle]);

  useEffect(() => {
    startBattle();
    return () => {
      abortBattleRef.current = true;
    };
  }, [startBattle]);

  const goToHeroSelection = useCallback(
    (targetStage) => {
      navigation.reset({
        index: 2,
        routes: [
          { name: "Home" },
          { name: "Campaign" },
          { name: "HeroSelection", params: { stage: targetStage } },
        ],
      });
    },
    [navigation],
  );

  const battleBackgroundSource = battleResult?.backgroundImageUri
    ? { uri: `${SERVER_URL}${battleResult.backgroundImageUri}` }
    : stage?.backgroundImageUri
      ? { uri: `${SERVER_URL}${stage.backgroundImageUri}` }
      : require("../assets/backgrounds/waterdeep_bg.webp");

  if (loading)
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>CARGANDO BATALLA...</Text>
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      {/* 1. CAMPO DE BATALLA (ZONA SUPERIOR) */}
      <ImageBackground source={battleBackgroundSource} style={styles.battlefield}>
        <View style={styles.battleLogPanel}>
          {logsToDisplay.map((logLine, index) => (
            <Text
              key={`${logLine}-${index}`}
              style={[
                styles.battleLogText,
                index === 0 && styles.battleLogTextPrimary,
              ]}
            >
              {logLine}
            </Text>
          ))}
        </View>

        {/* Enemigos */}
        <View style={styles.enemiesRow}>
          {enemies.map((enemy, i) => (
            <FieldSprite
              key={i}
              {...enemy}
              isHero={false}
              attackTrigger={triggers[enemy.instanceId]?.attack}
              hitTrigger={triggers[enemy.instanceId]?.hit}
              damageInfo={damageMap[enemy.instanceId]}
              isDead={enemy.currentHp <= 0}
            />
          ))}
        </View>

        {/* Héroes */}
        <View style={styles.heroesRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const hero = heroes[index];
            if (!hero) {
              return (
                <View
                  key={`empty-hero-${index}`}
                  style={styles.spriteContainer}
                />
              );
            }
            return (
              <FieldSprite
                key={index}
                {...hero}
                isHero={true}
                imageUri={`${SERVER_URL}/assets/heroes/${hero.heroId.replace("hero_", "")}/portrait.png`}
                attackTrigger={triggers[hero.instanceId]?.attack}
                hitTrigger={triggers[hero.instanceId]?.hit}
                damageInfo={damageMap[hero.instanceId]}
                isActiveTurn={activeTurn === hero.instanceId}
                isDead={hero.currentHp <= 0}
              />
            );
          })}
        </View>
      </ImageBackground>

      {/* 2. PANEL DE CONTROL (ZONA INFERIOR) */}
      <View style={styles.uiPanel}>
        <View style={styles.unitGrid}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const hero = heroes[index];
            if (!hero) {
              return (
                <View
                  key={`empty-card-${index}`}
                  style={[
                    styles.unitCard,
                    {
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                    },
                  ]}
                />
              );
            }
            return (
              <UnitControlCard
                key={index}
                name={hero.name}
                role={hero.role}
                hp={hero.currentHp}
                maxHp={hero.maxHp}
                mp={hero.currentMp ?? 0}
                maxMp={hero.maxMp || 100}
                isDead={hero.currentHp <= 0}
              />
            );
          })}
        </View>

        {/* BOTONES DE ACCIÓN */}
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.footerBtn, isAuto && styles.footerBtnActive]}
            onPress={() => setIsAuto(!isAuto)}
          >
            <Text
              style={[
                styles.footerBtnText,
                isAuto && styles.footerBtnTextActive,
              ]}
            >
              AUTO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, isRepeat && styles.footerBtnActive]}
            onPress={() => setIsRepeat(!isRepeat)}
          >
            <Text
              style={[
                styles.footerBtnText,
                isRepeat && styles.footerBtnTextActive,
              ]}
            >
              REPEAT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => startBattle()}
          >
            <Text style={styles.footerBtnText}>RESET</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RESULTADOS OVERLAY */}
      {showResults && (
        <View style={styles.resultsOverlay}>
          <Text style={styles.resultTitle}>
            {battleResult.victory ? "VICTORIA" : "DERROTA"}
          </Text>
          {stage ? (
            <Text style={styles.resultStageTitle}>
              {`Fase ${stage.stageNumber}: ${stage.name}`}
            </Text>
          ) : null}
          <View style={styles.resultsSummaryCard}>
            <Text style={styles.resultsSummaryLine}>
              Turnos: {battleResult.turns}
            </Text>
            <Text style={styles.resultsSummaryLine}>
              Héroes en pie: {battleResult.heroesRemaining}
            </Text>
            {battleResult.rewards ? (
              <>
                <Text style={styles.resultsSummaryLine}>
                  EXP cuenta: +{battleResult.rewards.experience}
                </Text>
                <Text style={styles.resultsSummaryLine}>
                  Oro: +{battleResult.rewards.gold}
                </Text>
                <Text style={styles.resultsSummaryLine}>
                  Gemas: +{battleResult.rewards.gems}
                </Text>
              </>
            ) : (
              <Text style={styles.resultsSummaryLine}>
                No obtuviste recompensas en esta batalla.
              </Text>
            )}
            {battleResult.userStats ? (
              <Text style={styles.resultsSummaryMeta}>
                Energía restante: {battleResult.userStats.energy} · Progreso:
                Zona {battleResult.userStats.progress?.zone || 1}-
                {battleResult.userStats.progress?.stage || 1}
              </Text>
            ) : null}
          </View>
          <View style={styles.resultsButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => startBattle()}
            >
              <Text style={styles.actionBtnText}>REINTENTAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryActionBtn]}
              onPress={() => goToHeroSelection(stage)}
            >
              <Text style={styles.actionBtnText}>CAMBIAR EQUIPO</Text>
            </TouchableOpacity>
            {battleResult.victory && nextStage ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => goToHeroSelection(nextStage)}
              >
                <Text style={styles.actionBtnText}>SIGUIENTE FASE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryActionBtn]}
                onPress={() => {
                  navigation.reset({
                    index: 1,
                    routes: [{ name: "Home" }, { name: "Campaign" }],
                  });
                }}
              >
                <Text style={styles.actionBtnText}>VOLVER A CAMPAÑA</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {dialogConfig && (
        <ThemedDialog
          visible={!!dialogConfig}
          mode={dialogConfig.mode}
          tone={dialogConfig.tone}
          title={dialogConfig.title}
          message={dialogConfig.message}
          onClose={dialogConfig.onClose || (() => setDialogConfig(null))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#000" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "#FFD700", marginTop: 10, fontWeight: "bold" },

  // Battlefield
  battlefield: {
    flex: 1.2,
    justifyContent: "space-around",
    paddingVertical: 40,
  },
  battleLogPanel: {
    position: "absolute",
    top: 18,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  battleLogText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    textAlign: "center",
  },
  battleLogTextPrimary: { color: "#FFD700", fontWeight: "bold" },
  enemiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  heroesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },

  // Sprites
  spriteContainer: {
    width: width / 3,
    alignItems: "center",
    marginVertical: 10,
  },
  spriteWrapper: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  sprite: { width: "100%", height: "100%", zIndex: 2 },
  shadow: {
    position: "absolute",
    bottom: 5,
    width: 40,
    height: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  enemyShape: { width: 60, height: 60, borderRadius: 10 },
  damageFloating: {
    position: "absolute",
    top: -30,
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowRadius: 6,
    textShadowOffset: { width: 1, height: 1 },
    zIndex: 10,
  },
  damageNormal: { color: "#FFF" },
  damageCrit: { color: "#FF3333", fontSize: 24 },
  damageHeal: { color: "#33FF33" },
  flashOverlay: { backgroundColor: "#FFF", borderRadius: 10 },
  activeIndicator: {
    position: "absolute",
    bottom: -5,
    width: 30,
    height: 4,
    backgroundColor: "#00FF00",
  },

  // UI Panel
  uiPanel: {
    flex: 1,
    backgroundColor: "#001529",
    borderTopWidth: 2,
    borderColor: "#4a90e2",
    padding: 8,
  },
  unitGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
    marginBottom: 10,
  },
  unitCard: {
    width: "48%",
    height: "31%",
    backgroundColor: "rgba(0,40,80,0.8)",
    borderWidth: 1,
    borderColor: "#335588",
    padding: 6,
    borderRadius: 4,
    justifyContent: "space-between",
  },
  unitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitCardName: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
  limitText: {
    color: "#FF4400",
    fontSize: 9,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  statsContainer: { flex: 1, justifyContent: "flex-end", marginTop: 4 },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  statLabel: { color: "#4a90e2", fontSize: 10, fontWeight: "bold" },
  statValue: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  barBackground: {
    height: 6,
    backgroundColor: "#111",
    width: "100%",
    marginBottom: 4,
    borderRadius: 3,
    overflow: "hidden",
  },
  hpBar: { height: "100%", backgroundColor: "#00FF44" },
  mpBar: { height: "100%", backgroundColor: "#0099FF" },

  // Footer
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#002b4d",
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 4,
  },
  footerBtnActive: { backgroundColor: "#4a90e2", borderColor: "#FFF" },
  footerBtnText: { color: "#4a90e2", fontSize: 12, fontWeight: "bold" },
  footerBtnTextActive: { color: "#FFF" },

  // Results
  resultsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  resultTitle: {
    color: "#FFD700",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resultStageTitle: {
    color: "#FFF",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  resultsSummaryCard: {
    width: "84%",
    backgroundColor: "rgba(0, 21, 41, 0.92)",
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 24,
  },
  resultsSummaryLine: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
  },
  resultsSummaryMeta: {
    color: "#9dc7ff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  resultsButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionBtn: { backgroundColor: "#FFD700", padding: 15, borderRadius: 30 },
  secondaryActionBtn: { backgroundColor: "#d6aa33" },
  actionBtnText: { fontWeight: "bold", color: "#000", fontSize: 12 },
});
