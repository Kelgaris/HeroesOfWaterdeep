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

const { width, height } = Dimensions.get("window");

const YUNA_QUOTES = [
  "¡Bienvenido de vuelta, aventurero!",
  "¿Listo para una nueva batalla?",
  "Los enemigos de Waterdeep no se vencerán solos...",
  "¡Invoca nuevos héroes para tu equipo!",
  "Tu equipo se vuelve más fuerte cada día.",
  "¿Exploraremos una nueva zona hoy?",
  "¡Los tesoros nos esperan, héroe!",
  "Recuerda revisar tu inventario.",
  "¡La aventura nunca termina!",
  "Waterdeep cuenta contigo.",
  "Que la luz guíe tu camino.",
  "¡Juntos somos invencibles!",
];

const HERO_SPRITES = {
  yuna: require("../assets/heroes/yuna/portrait.png"),
  rain: require("../assets/heroes/rain/portrait.png"),
  hendrikka: require("../assets/heroes/hendrikka/Hendrikka banner.png"),
  hendrika: require("../assets/heroes/hendrikka/Hendrikka banner.png"),
};

export default function HeroSprite({
  heroName = "Yuna",
  heroClass = "summoner",
}) {
  const [quote, setQuote] = useState("");
  const [showQuote, setShowQuote] = useState(false);

  // Animaciones
  const spriteScale = useSharedValue(0);
  const breathing = useSharedValue(1);
  const bubbleOpacity = useSharedValue(0);
  const bubbleScale = useSharedValue(0.5);

  useEffect(() => {
    // Animación de entrada
    spriteScale.value = withSpring(1, { damping: 8, stiffness: 100 });

    // Animación de respiración continua
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

    // Animar bocadillo
    bubbleOpacity.value = withTiming(1, { duration: 300 });
    bubbleScale.value = withSpring(1, { damping: 10 });

    // Reacción de Yuna - pequeño salto
    spriteScale.value = withSequence(
      withSpring(1.15, { damping: 5 }),
      withSpring(1, { damping: 8 }),
    );

    // Ocultar bocadillo después de 3 segundos
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

  const normalizedHeroKey = String(heroName || "")
    .trim()
    .toLowerCase();
  const spriteSource = HERO_SPRITES[normalizedHeroKey] || HERO_SPRITES.yuna;

  return (
    <View style={styles.container}>
      {/* Bocadillo de diálogo */}
      {showQuote && (
        <Animated.View style={[styles.speechBubble, bubbleAnimatedStyle]}>
          <Text style={styles.speechText}>{quote}</Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}

      {/* Sprite de Yuna */}
      <Pressable onPress={handlePress}>
        <View style={styles.spriteContainer}>
          {/* Efecto de brillo detrás */}
          <View style={styles.glow} />

          <Animated.Image
            source={spriteSource}
            style={[styles.sprite, spriteAnimatedStyle]}
            resizeMode="contain"
          />

          {/* Plataforma/sombra */}
          <View style={styles.shadow} />
        </View>
      </Pressable>

      {/* Nombre del héroe */}
      <Text style={styles.heroName}>{heroName}</Text>
      <Text style={styles.heroClass}>{heroClass.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },

  spriteContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  glow: {
    position: "absolute",
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },

  sprite: {
    width: width * 0.7,
    height: width * 0.7,
  },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    width: 0,
    height: 0,
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

  heroClass: {
    color: "#E0E0E0",
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 2,
  },
});
