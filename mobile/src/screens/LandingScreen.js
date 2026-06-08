import { useEffect } from "react";
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import FantasyButton from "../components/FantasyButton";

const { width, height } = Dimensions.get("window");

export default function LandingScreen({ navigation }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 2000 });
    scale.value = withTiming(1, { duration: 2000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <ImageBackground
      source={require("../assets/backgrounds/waterdeep_bg_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Animated.Image
          source={require("../assets/backgrounds/titulo.png")}
          style={[styles.logo, animatedStyle]}
          resizeMode="contain"
        />

        <View style={styles.buttonsContainer}>
          <FantasyButton
            title="Iniciar Sesión"
            onPress={() => navigation.navigate("Login")}
          />

          <FantasyButton
            title="Registrarse"
            onPress={() => navigation.navigate("Register")}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  logo: {
    width: width * 0.85,
    height: height * 0.25,
    marginBottom: 60,
  },

  buttonsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
});
