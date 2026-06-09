import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { getAssetURL } from "../services/api";

const { width } = Dimensions.get("window");

const YUNA_QUOTES = [
  "¡Bienvenido de vuelta, aventurero!",
  "¿Listo para una nueva batalla?",
  "Los enemigos de Waterdeep no se vencerán solos...",
  "¡Invoca nuevos héroes para tu equipo!",
  "¡Juntos somos invencibles!",
];

export default function HeroSprite({
  heroName = "Yuna",
  heroTitle = "Héroe de Leyenda",
  heroImage = "", // Aquí llega: "/assets/heroes/yuna/portrait.png"
}) {
  const [quote, setQuote] = useState("");
  const [showQuote, setShowQuote] = useState(false);

  const spriteScale = useSharedValue(0);
  const breathing = useSharedValue(1);
  const bubbleOpacity = useSharedValue(0);
  const bubbleScale = useSharedValue(0.5);

  useEffect(() => {
    spriteScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    breathing.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const handlePress = () => {
    const randomQuote =
      YUNA_QUOTES[Math.floor(Math.random() * YUNA_QUOTES.length)];
    setQuote(randomQuote);
    setShowQuote(true);

    bubbleOpacity.value = withTiming(1, { duration: 300 });
    bubbleScale.value = withSpring(1, { damping: 10 });

    spriteScale.value = withSequence(
      withSpring(1.15, { damping: 5 }),
      withSpring(1, { damping: 8 }),
    );

    setTimeout(() => {
      bubbleOpacity.value = withTiming(0, { duration: 300 });
      bubbleScale.value = withTiming(0.5, { duration: 300 });
      setTimeout(() => setShowQuote(false), 300);
    }, 3000);
  };

  const spriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: spriteScale.value * breathing.value }],
  }));

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }],
  }));

  const fullUrl = getAssetURL(heroImage);
  const spriteSource = fullUrl ? { uri: fullUrl } : null;

  return (
    <View style={styles.container}>
      {showQuote && (
        <Animated.View style={[styles.speechBubble, bubbleAnimatedStyle]}>
          <Text style={styles.speechText}>{quote}</Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}

      <Pressable onPress={handlePress}>
        <View style={styles.spriteContainer}>
          <View style={styles.glow} />

          {/* Si hay imagen válida cargamos mediante URI de red */}
          {spriteSource ? (
            <Animated.Image
              source={spriteSource}
              style={[styles.sprite, spriteAnimatedStyle]}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.sprite, styles.placeholder]} />
          )}

          <View style={styles.shadow} />
        </View>
      </Pressable>

      <Text style={styles.heroName}>{heroName}</Text>
      <Text style={styles.heroTitle}>{heroTitle.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 10 },
  spriteContainer: { alignItems: "center", justifyContent: "center" },
  glow: {
    position: "absolute",
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  sprite: { width: width * 0.7, height: width * 0.7 },
  placeholder: { backgroundColor: "transparent" },
  shadow: {
    position: "absolute",
    bottom: -10,
    width: width * 0.4,
    height: 25,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 50,
  },
  speechBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 15,
    maxWidth: width * 0.8,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#8B4513",
    elevation: 5,
  },
  speechText: {
    fontSize: 14,
    color: "#2C1810",
    textAlign: "center",
    fontWeight: "500",
  },
  bubbleTail: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    marginLeft: -10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#8B4513",
  },
  heroName: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroTitle: {
    color: "#E0E0E0",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 2,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
