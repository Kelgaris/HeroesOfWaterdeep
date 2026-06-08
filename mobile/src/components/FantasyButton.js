import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const buttonBg = require("../assets/backgrounds/fondoBoton.png");

export default function FantasyButton({
  title,
  onPress,
  secondary,
  disabled,
  small,
}) {
  if (secondary) {
    // Botón secundario sin imagen de fondo
    return (
      <TouchableOpacity
        style={[
          styles.secondaryButton,
          small && styles.smallButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={[styles.secondaryText, small && styles.smallText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  // Botón principal con imagen de fondo
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[disabled && styles.disabledButton]}
    >
      <ImageBackground
        source={buttonBg}
        style={[styles.buttonBg, small && styles.smallButtonBg]}
        imageStyle={styles.buttonImage}
        resizeMode="stretch"
      >
        <Text style={[styles.text, small && styles.smallText]}>{title}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBg: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginVertical: 8,
    width: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonImage: {
    borderRadius: 8,
  },

  smallButtonBg: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: 140,
    minWidth: 100,
  },

  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginVertical: 8,
    minWidth: 150,
    alignItems: "center",
  },

  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
  },

  disabledButton: {
    opacity: 0.5,
  },

  text: {
    color: "#ffee5c",
    fontSize: 18,
    fontFamily: "Cinzel_600SemiBold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  secondaryText: {
    color: "#ffee5c",
    fontSize: 16,
    fontFamily: "Cinzel_400Regular",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  smallText: {
    fontSize: 14,
  },
});
