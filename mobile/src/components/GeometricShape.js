import { StyleSheet, Text, View } from "react-native";

// Componente para renderizar formas geométricas usando Views nativos
// Sin dependencia de react-native-svg
export default function GeometricShape({
  shape = "circle",
  color = "#FFD700",
  size = 60,
  borderColor = "#FFF",
  borderWidth = 2,
  showFace = true,
  isBoss = false,
}) {
  const actualSize = isBoss ? size * 1.5 : size;

  const getShapeStyle = () => {
    const baseStyle = {
      width: actualSize,
      height: actualSize,
      backgroundColor: color,
      borderWidth: borderWidth,
      borderColor: borderColor,
      alignItems: "center",
      justifyContent: "center",
    };

    switch (shape) {
      case "circle":
        return {
          ...baseStyle,
          borderRadius: actualSize / 2,
        };

      case "triangle":
        // Simular triángulo con bordes
        return {
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          borderLeftWidth: actualSize / 2,
          borderRightWidth: actualSize / 2,
          borderBottomWidth: actualSize,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        };

      case "square":
        return {
          ...baseStyle,
          borderRadius: 5,
        };

      case "diamond":
        return {
          ...baseStyle,
          transform: [{ rotate: "45deg" }],
          borderRadius: 5,
        };

      case "pentagon":
        return {
          ...baseStyle,
          borderRadius: actualSize / 4,
        };

      case "hexagon":
        return {
          ...baseStyle,
          borderRadius: actualSize / 5,
        };

      case "star":
        return {
          ...baseStyle,
          borderRadius: actualSize / 2,
          shadowColor: color,
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 10,
        };

      default:
        return {
          ...baseStyle,
          borderRadius: actualSize / 2,
        };
    }
  };

  const isTriangle = shape === "triangle";
  const isDiamond = shape === "diamond";

  return (
    <View style={[styles.container, { width: actualSize, height: actualSize }]}>
      <View style={getShapeStyle()}>
        {showFace && !isTriangle && (
          <View
            style={[
              styles.faceContainer,
              isDiamond && { transform: [{ rotate: "-45deg" }] },
            ]}
          >
            <View style={styles.eyes}>
              <View
                style={[
                  styles.eye,
                  { width: actualSize * 0.12, height: actualSize * 0.12 },
                ]}
              />
              <View
                style={[
                  styles.eye,
                  { width: actualSize * 0.12, height: actualSize * 0.12 },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {showFace && isTriangle && (
        <View style={[styles.triangleFace, { top: actualSize * 0.4 }]}>
          <View style={styles.eyes}>
            <View
              style={[
                styles.eye,
                { width: actualSize * 0.1, height: actualSize * 0.1 },
              ]}
            />
            <View
              style={[
                styles.eye,
                { width: actualSize * 0.1, height: actualSize * 0.1 },
              ]}
            />
          </View>
        </View>
      )}

      {isBoss && (
        <View style={styles.bossIndicator}>
          <Text style={styles.bossText}>👑</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  faceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  triangleFace: {
    position: "absolute",
    alignItems: "center",
  },
  eyes: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  eye: {
    backgroundColor: "#333",
    borderRadius: 100,
  },
  bossIndicator: {
    position: "absolute",
    top: -15,
    right: -5,
  },
  bossText: {
    fontSize: 20,
  },
});
