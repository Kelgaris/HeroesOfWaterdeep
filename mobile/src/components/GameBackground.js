import { ImageBackground, StyleSheet } from "react-native";
import { palette } from "../theme/tokens";

// Fondos disponibles
const BACKGROUNDS = {
  default: require("../assets/backgrounds/waterdeep_bg.webp"),
  dark: require("../assets/backgrounds/waterdeep_bg_login.png"),
  login: require("../assets/backgrounds/waterdeep_bg_login.png"),
};

export default function GameBackground({ children, variant = "default" }) {
  const backgroundSource = BACKGROUNDS[variant] || BACKGROUNDS.default;

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: palette.abyss,
  },
});
