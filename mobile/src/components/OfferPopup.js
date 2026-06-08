import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getAssetURL } from "../services/api";

const { width, height } = Dimensions.get("window");

// Imagen de Hendrikka (local)
const hendrikkaImage = require("../assets/heroes/hendrikka/Render Hendrikka.png");
const pergaminoDoradoImage = require("../assets/objetcs/pergaminoDorado.png");

// Ofertas disponibles
const OFFERS = [
  {
    id: "starter_pack",
    name: "Pack de Iniciación",
    badge: "¡OFERTA EXCLUSIVA!",
    originalPrice: "19,99€",
    price: "4,99€",
    discount: "-75%",
    items: [
      { type: "hero", heroId: "hero_hendrikka", name: "Hendrikka, la hija del cuervo", icon: "⚔️" },
      { type: "gems", amount: 1000, icon: "💎" },
      { type: "gold", amount: 50000, icon: "💰" },
      { type: "scroll_large", amount: 10, name: "Pergaminos Dorados", useImage: true },
    ],
    gradient: ["#FFD700", "#FF8C00"],
    timeLeft: "23:59:59",
    useLocalImage: true,
  },
  {
    id: "monthly_gems",
    name: "Suscripción Mensual",
    badge: "MEJOR VALOR",
    originalPrice: "14,99€",
    price: "9,99€",
    discount: "-33%",
    items: [
      { type: "gems", amount: 300, icon: "💎", note: "¡Cada día durante 30 días!" },
      { type: "gems", amount: 500, icon: "💎", note: "Bonus inmediato" },
    ],
    gradient: ["#9C27B0", "#E91E63"],
    timeLeft: null,
  },
  {
    id: "mega_pack",
    name: "MEGA PACK",
    badge: "¡LIMITADO!",
    originalPrice: "99,99€",
    price: "29,99€",
    discount: "-70%",
    items: [
      { type: "hero", heroId: "hero_yuna", name: "Yuna ★★★★★", icon: "🌟" },
      { type: "gems", amount: 5000, icon: "💎" },
      { type: "gold", amount: 500000, icon: "💰" },
      { type: "scroll_large", amount: 50, name: "Pergaminos Dorados", icon: "📜" },
      { type: "equipment", name: "Set Legendario", icon: "🗡️" },
    ],
    gradient: ["#FF6B6B", "#FFD700"],
    timeLeft: "2:15:33",
    heroImage: "/assets/heroes/yuna.png",
  },
];

export default function OfferPopup({ visible, onClose, offerId = "starter_pack" }) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [countdown, setCountdown] = useState("");

  const offer = OFFERS.find((o) => o.id === offerId) || OFFERS[0];

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Animación de pulso para el botón
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Countdown si hay tiempo límite
      if (offer.timeLeft) {
        setCountdown(offer.timeLeft);
        const interval = setInterval(() => {
          // Simular countdown (en producción sería real)
          setCountdown((prev) => {
            const parts = prev.split(":");
            let hours = parseInt(parts[0]);
            let mins = parseInt(parts[1]);
            let secs = parseInt(parts[2]);
            
            if (secs > 0) secs--;
            else if (mins > 0) { mins--; secs = 59; }
            else if (hours > 0) { hours--; mins = 59; secs = 59; }
            
            return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handlePurchase = () => {
    // En producción aquí iría la integración con la tienda
    alert("¡Gracias por tu interés! Las compras in-app estarán disponibles próximamente 😉");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Botón cerrar */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Badge de oferta */}
          <View style={[styles.badge, { backgroundColor: offer.gradient[0] }]}>
            <Text style={styles.badgeText}>{offer.badge}</Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>{offer.name}</Text>

          {/* Countdown si existe */}
          {countdown && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownLabel}>⏰ Oferta termina en:</Text>
              <Text style={styles.countdownTime}>{countdown}</Text>
            </View>
          )}

          {/* Contenido de la oferta */}
          <View style={styles.contentContainer}>
            {/* Imagen del héroe si existe */}
            {(offer.heroImage || offer.useLocalImage) && (
              <View style={styles.heroImageContainer}>
                <View style={styles.heroGlow} />
                <Image
                  source={offer.useLocalImage ? hendrikkaImage : { uri: getAssetURL(offer.heroImage) }}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Lista de items */}
            <View style={styles.itemsList}>
              {offer.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  {item.useImage ? (
                    <Image source={pergaminoDoradoImage} style={styles.itemImage} />
                  ) : (
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.name || 
                        (item.type === "gems" ? `${item.amount.toLocaleString()} Gemas` : 
                         item.type === "gold" ? `${item.amount.toLocaleString()} Oro` : 
                         item.name)}
                    </Text>
                    {item.note && (
                      <Text style={styles.itemNote}>{item.note}</Text>
                    )}
                  </View>
                  {item.amount && (
                    <Text style={styles.itemAmount}>x{item.amount.toLocaleString()}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Precio */}
          <View style={styles.priceContainer}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{offer.discount}</Text>
            </View>
            <Text style={styles.originalPrice}>{offer.originalPrice}</Text>
            <Text style={styles.currentPrice}>{offer.price}</Text>
          </View>

          {/* Botón de compra */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.buyButton, { backgroundColor: offer.gradient[0] }]}
              onPress={handlePurchase}
            >
              <Text style={styles.buyButtonText}>¡COMPRAR AHORA!</Text>
            </Pressable>
          </Animated.View>

          {/* Texto legal pequeño */}
          <Text style={styles.legalText}>
            *Oferta válida una sola vez. Los precios pueden variar según región.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFD700",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  countdownContainer: {
    backgroundColor: "rgba(255,0,0,0.2)",
    borderRadius: 10,
    padding: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  countdownLabel: {
    color: "#FF6B6B",
    fontSize: 11,
    textAlign: "center",
  },
  countdownTime: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  contentContainer: {
    width: "100%",
    marginBottom: 15,
  },
  heroImageContainer: {
    alignItems: "center",
    marginBottom: 5,
    marginTop: 10,
  },
  heroGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFD700",
    opacity: 0.3,
  },
  heroImage: {
    width: 150,
    height: 150,
  },
  itemsList: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemImage: {
    width: 30,
    height: 30,
    marginRight: 12,
    resizeMode: "contain",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  itemNote: {
    color: "#4CAF50",
    fontSize: 11,
    fontStyle: "italic",
  },
  itemAmount: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  discountBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  discountText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  originalPrice: {
    color: "#888",
    fontSize: 16,
    textDecorationLine: "line-through",
  },
  currentPrice: {
    color: "#4CAF50",
    fontSize: 28,
    fontWeight: "bold",
  },
  buyButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buyButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  legalText: {
    color: "#666",
    fontSize: 9,
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
});
