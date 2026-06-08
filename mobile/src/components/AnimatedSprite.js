import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * Componente para animar sprite sheets
 *
 * Props:
 * - source: require() del sprite sheet
 * - frameWidth: ancho de cada frame en px
 * - frameHeight: alto de cada frame en px
 * - frameCount: número total de frames en la animación
 * - fps: frames por segundo (default: 12)
 * - columns: número de columnas en el sprite sheet (default: frameCount)
 * - loop: si la animación debe repetirse (default: true)
 * - playing: si la animación está activa (default: true)
 * - scale: escala del sprite (default: 1)
 * - onAnimationEnd: callback cuando termina la animación (si loop=false)
 * - style: estilos adicionales para el contenedor
 */
export default function AnimatedSprite({
  source,
  frameWidth,
  frameHeight,
  frameCount,
  fps = 12,
  columns = null,
  loop = true,
  playing = true,
  scale = 1,
  onAnimationEnd,
  style,
}) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef(null);
  const cols = columns || frameCount;

  useEffect(() => {
    if (playing) {
      const interval = 1000 / fps;

      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          const nextFrame = prev + 1;

          if (nextFrame >= frameCount) {
            if (loop) {
              return 0;
            } else {
              clearInterval(intervalRef.current);
              onAnimationEnd?.();
              return prev;
            }
          }

          return nextFrame;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playing, fps, frameCount, loop, onAnimationEnd]);

  // Calcular posición del frame actual en el sprite sheet
  const col = currentFrame % cols;
  const row = Math.floor(currentFrame / cols);

  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  return (
    <View
      style={[
        styles.container,
        {
          width: scaledWidth,
          height: scaledHeight,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          position: "absolute",
          left: -col * scaledWidth,
          top: -row * scaledHeight,
          width: cols * scaledWidth,
          height: Math.ceil(frameCount / cols) * scaledHeight,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
});
