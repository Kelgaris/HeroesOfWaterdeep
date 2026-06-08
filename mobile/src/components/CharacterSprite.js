import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AnimatedSprite from "./AnimatedSprite";

/**
 * Componente para personajes con múltiples animaciones
 *
 * Props:
 * - animations: objeto con las animaciones disponibles
 *   {
 *     idle: { source, frameWidth, frameHeight, frameCount, fps, columns },
 *     attack: { source, frameWidth, frameHeight, frameCount, fps, columns },
 *     ...
 *   }
 * - currentAnimation: nombre de la animación actual (default: "idle")
 * - scale: escala del sprite (default: 1)
 * - onAnimationEnd: callback cuando termina una animación no-loop
 * - style: estilos adicionales
 * - flipX: invertir horizontalmente (default: false)
 */
export default function CharacterSprite({
  animations,
  currentAnimation = "idle",
  scale = 1,
  onAnimationEnd,
  style,
  flipX = false,
}) {
  const [activeAnimation, setActiveAnimation] = useState(currentAnimation);

  useEffect(() => {
    setActiveAnimation(currentAnimation);
  }, [currentAnimation]);

  const handleAnimationEnd = useCallback(() => {
    // Volver a idle después de animaciones de acción
    if (activeAnimation !== "idle" && animations.idle) {
      setActiveAnimation("idle");
    }
    onAnimationEnd?.(activeAnimation);
  }, [activeAnimation, animations, onAnimationEnd]);

  const anim = animations[activeAnimation];

  if (!anim) {
    console.warn(`Animation "${activeAnimation}" not found`);
    return null;
  }

  // Determinar si la animación debe hacer loop
  const loopAnimations = ["idle", "walk", "run"];
  const shouldLoop = loopAnimations.includes(activeAnimation);

  return (
    <View style={[styles.container, flipX && styles.flipped, style]}>
      <AnimatedSprite
        source={anim.source}
        frameWidth={anim.frameWidth}
        frameHeight={anim.frameHeight}
        frameCount={anim.frameCount}
        fps={anim.fps || 12}
        columns={anim.columns}
        scale={scale}
        loop={shouldLoop}
        onAnimationEnd={!shouldLoop ? handleAnimationEnd : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
});

/**
 * Ejemplo de uso:
 *
 * const heroAnimations = {
 *   idle: {
 *     source: require("../assets/heroes/warrior/idle.png"),
 *     frameWidth: 64,
 *     frameHeight: 64,
 *     frameCount: 6,
 *     fps: 8,
 *     columns: 6,
 *   },
 *   attack: {
 *     source: require("../assets/heroes/warrior/attack.png"),
 *     frameWidth: 64,
 *     frameHeight: 64,
 *     frameCount: 8,
 *     fps: 16,
 *     columns: 8,
 *   },
 * };
 *
 * <CharacterSprite
 *   animations={heroAnimations}
 *   currentAnimation="idle"
 *   scale={2}
 * />
 */
