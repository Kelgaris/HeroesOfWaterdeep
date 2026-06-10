import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import GameBackground from "../components/GameBackground";
import { palette, radii, spacing, typography } from "../theme/tokens";

const CREDIT_GROUPS = [
  {
    title: "Direccion del Proyecto",
    lines: [
      "Heroes of Waterdeep",
      "Edicion fan y desarrollo principal",
      "David Priego Puga",
    ],
  },
  {
    title: "Arte y Diseno",
    lines: [
      "Sprites originales de Square Enix",
      "Adaptaciones por:",
      "Connor Caballero Vieites",
      "Mael Alonso Abreu",
    ],
  },
  {
    title: "Musica",
    lines: [
      '"Prelude" - Nobuo Uematsu',
      '"Eternal Wind" - Nobuo Uematsu',
      '"Battle" - Nobuo Uematsu',
      '"Victory" - Nobuo Uematsu',
      '"Ending Theme" - Nobuo Uematsu',
    ],
  },
  {
    title: "Agradecimientos",
    sections: [
      {
        title: "Profesores",
        lines: [
          "Orto Vazquez Souto",
          "Teresa Garrido Velasco",
          "Roberto Castro Liste",
        ],
      },
      {
        title: "Tutor de practicas",
        lines: ["Orto Vazquez Souto"],
      },
      {
        title: "Companeros",
        lines: ["Adriano Condines Celada"],
      },
      {
        title: "Testers",
        lines: [
          "Roberto Comesana Casal",
          "Tamara Gonzalez Fernandez",
          "Mael Alonso Abreu",
          "Connor Caballero Vieites",
          "Alvaro Iglesias Gallego",
          "Anxo Rivas Nieto",
        ],
      },
    ],
  },
  {
    title: "Herramientas",
    lines: [
      "React Native + Expo",
      "Node.js + Express",
      "MongoDB",
      "Render + GitHub",
      "Visual Studio Code",
    ],
  },
];

export default function CreditsScreen({ navigation }) {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!contentHeight) return;

    const travelDistance = contentHeight + screenHeight + 80;
    const duration = Math.max(48000, Math.round(travelDistance * 20));
    let isCancelled = false;

    const startRoll = () => {
      translateY.setValue(screenHeight);
      Animated.timing(translateY, {
        toValue: -contentHeight - 40,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || isCancelled) return;
        startRoll();
      });
    };

    startRoll();

    return () => {
      isCancelled = true;
      translateY.stopAnimation();
    };
  }, [contentHeight, screenHeight, translateY]);

  return (
    <GameBackground>
      <View style={styles.container}>
        <View style={styles.topShade} />

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
        </View>

        <View style={styles.viewport}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <View
              style={styles.content}
              onLayout={(event) => {
                const measuredHeight = event.nativeEvent.layout.height;
                if (measuredHeight > 0 && measuredHeight !== contentHeight) {
                  setContentHeight(measuredHeight);
                }
              }}
            >
              <Text style={styles.gameTitle}>HEROES OF WATERDEEP</Text>
              <Text style={styles.subTitle}>CREDITOS DEL PROYECTO</Text>

              {CREDIT_GROUPS.map((group) => (
                <View key={group.title} style={styles.group}>
                  <Text style={styles.creditTitle}>{group.title}</Text>
                  {group.sections ? (
                    <View style={styles.subGroupList}>
                      {group.sections.map((section, sectionIndex) => (
                        <View
                          key={`${group.title}-${section.title}-${sectionIndex}`}
                          style={styles.subGroupCard}
                        >
                          <Text style={styles.subGroupTitle}>
                            {section.title}
                          </Text>
                          {section.lines.map((line, lineIndex) => (
                            <Text
                              key={`${group.title}-${section.title}-${line}-${lineIndex}`}
                              style={styles.subGroupLine}
                            >
                              {line}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  ) : (
                    group.lines.map((line, lineIndex) => (
                      <Text
                        key={`${group.title}-${line}-${lineIndex}`}
                        style={styles.creditLine}
                      >
                        {line}
                      </Text>
                    ))
                  )}
                </View>
              ))}

              <Text style={styles.finalThanks}>Gracias por jugar</Text>
              <Text style={styles.finalHint}>Pulsa Volver para salir</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.bottomShade} />

        <View style={styles.footer}>
          <Pressable
            style={styles.exitButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exitButtonText}>Volver al menu</Text>
          </Pressable>
        </View>
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(9, 12, 17, 0.55)",
  },
  header: {
    paddingTop: 38,
    paddingHorizontal: spacing.lg,
    zIndex: 3,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(15, 20, 27, 0.78)",
    borderWidth: 1,
    borderColor: palette.bronze,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 15,
    letterSpacing: 0.6,
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 120,
  },
  gameTitle: {
    color: palette.parchment,
    fontFamily: typography.title,
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
  },
  subTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  group: {
    width: "100%",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(217, 182, 106, 0.28)",
    backgroundColor: "rgba(15, 20, 27, 0.45)",
  },
  creditTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 18,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  creditLine: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  subGroupList: {
    width: "100%",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  subGroupCard: {
    width: "100%",
    backgroundColor: "rgba(9, 12, 17, 0.74)",
    borderWidth: 1,
    borderColor: "rgba(217, 182, 106, 0.35)",
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  subGroupTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subGroupLine: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  finalThanks: {
    color: palette.gold,
    fontFamily: typography.title,
    fontSize: 24,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  finalHint: {
    color: palette.parchment,
    fontFamily: typography.ui,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 40,
  },
  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "rgba(8, 10, 14, 0.85)",
    zIndex: 2,
  },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    backgroundColor: "rgba(8, 10, 14, 0.9)",
    zIndex: 2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: "center",
    zIndex: 3,
  },
  exitButton: {
    backgroundColor: "rgba(28, 37, 48, 0.94)",
    borderWidth: 1,
    borderColor: palette.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  exitButtonText: {
    color: palette.parchment,
    fontFamily: typography.subtitle,
    fontSize: 15,
    letterSpacing: 0.8,
  },
});
