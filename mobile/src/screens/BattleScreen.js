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
import { useSafeAreaInsets } from "react-native-safe-area-context"; // ¡NUEVO! Para esquivar la barra blanca/área segura del dispositivo
import ThemedDialog from "../components/ThemedDialog";
import { useMusic } from "../context/MusicContext";
import api, {
    fetchCurrentUser,
    getAssetURL,
    SERVER_URL,
} from "../services/api";

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
  const hpWidth = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const mpWidth = maxMp > 0 ? (mp / maxMp) * 100 : 0;

  return (
    <View style={[styles.unitCard, isDead && { opacity: 0.5 }]}>
      <View style={styles.unitCardHeader}>
        <Text style={styles.unitCardName} numberOfLines={1}>
          {name.toUpperCase()}
        </Text>
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
          <View
            style={[
              styles.hpBar,
              { width: `${Math.max(0, Math.min(100, hpWidth))}%` },
            ]}
          />
        </View>

        <View style={styles.statLine}>
          <Text style={styles.statLabel}>MP</Text>
          <Text style={styles.statValue}>{mp}</Text>
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.mpBar,
              { width: `${Math.max(0, Math.min(100, mpWidth))}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export default function BattleScreen({ route, navigation }) {
  const AUTO_ADVANCE_SECONDS = 2;
  const REPEAT_ADVANCE_SECONDS = 3;
  const { stageId, stage, selectedHeroIds } = route.params;
  const insets = useSafeAreaInsets(); // Guardamos los espaciados del notch y barras de navegación del dispositivo
  const { playTrack } = useMusic();

  const [loading, setLoading] = useState(true);
  const [battleResult, setBattleResult] = useState(null);
  const [logsToDisplay, setLogsToDisplay] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [nextStage, setNextStage] = useState(null);

  // Cuenta atrás visible para el bucle de combates automatizados (Evita el softlock infinito)
  const [repeatCountdown, setRepeatCountdown] = useState(null);
  const [countdownMode, setCountdownMode] = useState(null);

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
  const countdownIntervalRef = useRef(null);
  const nextStageRef = useRef(null);
  const goToNextStageDirectRef = useRef(null);

  useEffect(() => {
    isAutoRef.current = isAuto;
    if (!isAuto && !isRepeatRef.current && repeatCountdown !== null) {
      clearInterval(countdownIntervalRef.current);
      setRepeatCountdown(null);
      setCountdownMode(null);
    }
  }, [isAuto, repeatCountdown]);

  useEffect(() => {
    isRepeatRef.current = isRepeat;
    if (!isRepeat && !isAutoRef.current && repeatCountdown !== null) {
      clearInterval(countdownIntervalRef.current);
      setRepeatCountdown(null);
      setCountdownMode(null);
    }
  }, [isRepeat, repeatCountdown]);

  // Limpieza estricta de intervalos al desmontar el componente
  useEffect(() => {
    return () => {
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

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
            attack: (prev[log.attacker]?.attack || 0) + 1,
          },
        }));

        const speed = isAutoRef.current ? 0.3 : 0.6;

        setTimeout(() => {
          if (abortBattleRef.current) return;
          setTriggers((prev) => ({
            ...prev,
            [log.target]: {
              ...prev[log.target],
              hit: (prev[log.target]?.hit || 0) + 1,
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
        // AL TERMINAR EL COMBATE: Siempre mostramos la pantalla de resultados primero
        setTimeout(() => {
          if (abortBattleRef.current) return;
          setShowResults(true);
          if (victory) playTrack("Victory");

          // Si el modo REPEAT está encendido y ganamos, iniciamos una cuenta atrás controlada
          if (isRepeatRef.current && victory) {
            let timeLeft = REPEAT_ADVANCE_SECONDS;
            setRepeatCountdown(timeLeft);
            setCountdownMode("repeat");

            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
              timeLeft -= 1;
              if (timeLeft <= 0) {
                clearInterval(countdownIntervalRef.current);
                setRepeatCountdown(null);
                setCountdownMode(null);
                startBattleRef.current?.(); // Lanza el siguiente combate de forma segura
              } else {
                setRepeatCountdown(timeLeft);
              }
            }, 1000);
          } else if (isAutoRef.current && victory && nextStageRef.current) {
            let timeLeft = AUTO_ADVANCE_SECONDS;
            setRepeatCountdown(timeLeft);
            setCountdownMode("auto");

            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = setInterval(() => {
              timeLeft -= 1;
              if (timeLeft <= 0) {
                clearInterval(countdownIntervalRef.current);
                setRepeatCountdown(null);
                setCountdownMode(null);
                goToNextStageDirectRef.current?.(nextStageRef.current); // Salta a la siguiente fase
              } else {
                setRepeatCountdown(timeLeft);
              }
            }, 1000);
          }
        }, 1500);
      }
    };

    nextLog();
  }, []);

  const startBattle = useCallback(async () => {
    clearInterval(countdownIntervalRef.current);
    setRepeatCountdown(null);
    setCountdownMode(null);
    abortBattleRef.current = true;

    setTimeout(async () => {
      abortBattleRef.current = false;
      playTrack("Battle");
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
        const availableStages = nextStageResponse?.data?.stages || [];
        const nextProgress = result.userStats?.progress;
        const progressBasedNextStage = availableStages.find(
          (availableStage) =>
            availableStage.zone === nextProgress?.zone &&
            availableStage.stageNumber === nextProgress?.stage,
        );

        // Fallback robusto: si el backend aún no ha avanzado el progreso,
        // intentamos obtener la siguiente fase por posición dentro del catálogo.
        const currentStageIndex = availableStages.findIndex(
          (availableStage) => availableStage.stageId === stageId,
        );
        const indexBasedNextStage =
          currentStageIndex >= 0 &&
          currentStageIndex < availableStages.length - 1
            ? availableStages[currentStageIndex + 1]
            : null;

        setBattleResult(result);
        const resolvedTarget =
          progressBasedNextStage && progressBasedNextStage.stageId !== stageId
            ? progressBasedNextStage
            : indexBasedNextStage && indexBasedNextStage.stageId !== stageId
              ? indexBasedNextStage
              : null;
        setNextStage(resolvedTarget);
        nextStageRef.current = resolvedTarget;
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
      clearInterval(countdownIntervalRef.current);
    };
  }, [startBattle]);

  const goToHeroSelection = useCallback(
    (targetStage) => {
      clearInterval(countdownIntervalRef.current);
      playTrack("EternalWind");
      navigation.reset({
        index: 2,
        routes: [
          { name: "Home" },
          { name: "Campaign" },
          { name: "HeroSelection", params: { stage: targetStage } },
        ],
      });
    },
    [navigation, playTrack],
  );

  const goToNextStageDirect = useCallback(
    (targetStage) => {
      if (!targetStage?.stageId) {
        return;
      }

      const currentEnergy = battleResult?.userStats?.energy ?? 0;
      const nextStageCost = targetStage.energyCost ?? 0;

      // Fallback: si no alcanza la energía para la siguiente fase,
      // redirige a selección de equipo en lugar de mostrar error y volver atrás.
      if (currentEnergy < nextStageCost) {
        goToHeroSelection(targetStage);
        return;
      }

      clearInterval(countdownIntervalRef.current);
      navigation.replace("Battle", {
        stageId: targetStage.stageId,
        stage: targetStage,
        selectedHeroIds,
      });
    },
    [
      battleResult?.userStats?.energy,
      goToHeroSelection,
      navigation,
      selectedHeroIds,
    ],
  );

  useEffect(() => {
    goToNextStageDirectRef.current = goToNextStageDirect;
  }, [goToNextStageDirect]);

  const cancelRepeatMode = () => {
    clearInterval(countdownIntervalRef.current);
    setRepeatCountdown(null);
    setCountdownMode(null);
    setIsRepeat(false);
    setIsAuto(false);
  };

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
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      {/* 1. CAMPO DE BATALLA (ZONA SUPERIOR) */}
      <ImageBackground
        source={battleBackgroundSource}
        style={styles.battlefield}
      >
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

      {/* 2. PANEL DE CONTROL (ZONA INFERIOR) - Protegido contra la barra del sistema mediante insets.bottom */}
      <View
        style={[styles.uiPanel, { paddingBottom: Math.max(12, insets.bottom) }]}
      >
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

          {/* Alerta Medieval de recompensa por primera victoria (First Clear) */}
          {battleResult.firstClearReward && (
            <View style={styles.firstClearBadge}>
              <Text style={styles.firstClearBadgeText}>
                ⚔️ ¡PRIMERA VICTORIA EN LA ZONA! ⚔️
              </Text>
            </View>
          )}

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
                {/* Mostramos las 1000 gemas inyectadas dinámicamente si es First Clear */}
                <Text
                  style={[
                    styles.resultsSummaryLine,
                    battleResult.firstClearReward && {
                      color: "#FFD700",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Gemas: +
                  {battleResult.firstClearReward
                    ? battleResult.gemsEarned
                    : battleResult.rewards.gems || 0}
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

            {/* Texto informativo de la cuenta atrás automática */}
            {repeatCountdown !== null && (
              <Text style={styles.countdownText}>
                {countdownMode === "auto"
                  ? "Siguiente fase automática en: "
                  : "Siguiente combate automático en: "}
                <Text style={{ color: "#FFD700", fontWeight: "bold" }}>
                  {repeatCountdown}s
                </Text>
              </Text>
            )}
          </View>

          <View style={styles.resultsButtons}>
            {repeatCountdown !== null && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF3333" }]}
                onPress={cancelRepeatMode}
              >
                <Text style={[styles.actionBtnText, { color: "#FFF" }]}>
                  {countdownMode === "auto" ? "DETENER AUTO" : "DETENER REPEAT"}
                </Text>
              </TouchableOpacity>
            )}

            {battleResult.victory ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => goToNextStageDirect(nextStage)}
                disabled={!nextStage?.stageId}
              >
                <Text style={styles.actionBtnText}>SIGUIENTE FASE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => startBattle()}
              >
                <Text style={styles.actionBtnText}>REINTENTAR</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryActionBtn]}
              onPress={() => goToHeroSelection(stage)}
            >
              <Text style={styles.actionBtnText}>CAMBIAR EQUIPO</Text>
            </TouchableOpacity>

            {battleResult.victory ? null : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondaryActionBtn]}
                onPress={() => {
                  clearInterval(countdownIntervalRef.current);
                  setRepeatCountdown(null);
                  setCountdownMode(null);
                  playTrack("EternalWind");
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
    paddingVertical: 20,
  },
  battleLogPanel: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginTop: 40,
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
    marginVertical: 6,
  },
  spriteWrapper: {
    width: 75,
    height: 75,
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
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  unitGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  unitCard: {
    width: "49%",
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
  unitCardName: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    flex: 1,
    marginRight: 4,
  },
  limitText: {
    color: "#FF4400",
    fontSize: 9,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  statsContainer: { flex: 1, justifyContent: "flex-end", marginTop: 2 },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: { color: "#4a90e2", fontSize: 9, fontWeight: "bold" },
  statValue: { color: "#FFF", fontSize: 9, fontWeight: "bold" },
  barBackground: {
    height: 5,
    backgroundColor: "#111",
    width: "100%",
    marginBottom: 2,
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
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#002b4d",
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 6,
  },
  footerBtnActive: { backgroundColor: "#4a90e2", borderColor: "#FFF" },
  footerBtnText: { color: "#4a90e2", fontSize: 12, fontWeight: "bold" },
  footerBtnTextActive: { color: "#FFF" },

  // Results
  resultsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    paddingHorizontal: 20,
  },
  resultTitle: {
    color: "#FFD700",
    fontSize: 44,
    fontWeight: "bold",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  resultStageTitle: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "600",
  },
  firstClearBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.25)",
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 14,
  },
  firstClearBadgeText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
  },
  resultsSummaryCard: {
    width: "90%",
    backgroundColor: "rgba(0, 21, 41, 0.95)",
    borderWidth: 1,
    borderColor: "#4a90e2",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
  },
  resultsSummaryLine: {
    color: "#FFF",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 6,
  },
  resultsSummaryMeta: {
    color: "#9dc7ff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 144, 226, 0.2)",
    paddingTop: 8,
  },
  countdownText: {
    color: "#AAA",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  resultsButtons: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  actionBtn: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  secondaryActionBtn: { backgroundColor: "#d6aa33" },
  actionBtnText: { fontWeight: "bold", color: "#000", fontSize: 12 },
});
