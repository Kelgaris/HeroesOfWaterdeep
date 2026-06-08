import { useEffect, useState, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, View, AppState } from "react-native";
import api, {
  fetchCurrentUser,
  getStoredUser,
  saveCurrentUser,
} from "../services/api";

import GameBackground from "../components/GameBackground";
import GameMenu from "../components/GameMenu";
import HeroSprite from "../components/HeroSprite";
import OfferPopup from "../components/OfferPopup";
import ResourceBar from "../components/ResourceBar";

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState({
    username: "Héroe",
    accountLevel: 1,
    experience: 0,
    maxExperience: 100,
    energy: 100,
    maxEnergy: 100,
    gold: 5000,
    gems: 500,
    heroes: [],
    progress: { zone: 1, stage: 1 },
  });

  const [mainHero] = useState({
    name: "Yuna",
    class: "summoner",
  });

  const [showOffer, setShowOffer] = useState(false);

  const appState = useRef(AppState.currentState);

  const syncEnergy = useCallback(async () => {
    try {
      const response = await api.post("/battle/refresh-energy");
      if (response.data) {
        setUser((prev) => {
          if (prev.energy !== response.data.energy || prev.maxEnergy !== response.data.maxEnergy) {
            const updatedUser = { ...prev, energy: response.data.energy, maxEnergy: response.data.maxEnergy };
            saveCurrentUser(updatedUser);
            return updatedUser;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error sincronizando energía con el servidor:", err);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const storedUser = await getStoredUser();
      if (storedUser) {
        setUser((prev) => ({
          ...prev,
          ...storedUser,
        }));
      }
      // Inmediatamente después de cargar localmente, sincronizamos con el servidor
      syncEnergy();
    } catch (error) {
      console.error("Error cargando datos del usuario:", error);
    }
  }, [syncEnergy]);

  const fetchFullUserData = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
        setUser((prev) => ({
          ...prev,
          ...currentUser,
        }));
      }
    } catch (error) {
      console.error("Error fetching full user data:", error);
      loadUserData(); // fallback
    }
  }, [loadUserData]);

  useEffect(() => {
    loadUserData();

    // Mostrar oferta después de 2 segundos (típico de juegos gacha 😄)
    const offerTimer = setTimeout(() => {
      setShowOffer(true);
    }, 2000);

    // Sincronizar energía cada minuto mientras la app esté abierta
    const energyInterval = setInterval(() => {
      syncEnergy();
    }, 60000);

    // Sincronizar energía cuando la app vuelve al primer plano
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Volvió al juego, sincronizamos
        syncEnergy();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearTimeout(offerTimer);
      clearInterval(energyInterval);
      subscription.remove();
    };
  }, [loadUserData, syncEnergy]);

  useFocusEffect(
    useCallback(() => {
      fetchFullUserData();
    }, [fetchFullUserData])
  );

  const handleNavigate = (screen) => {
    switch (screen) {
      case "heroes":
        navigation.navigate("Heroes");
        break;
      case "adventure":
        navigation.navigate("Campaign");
        break;
      case "summon":
        navigation.navigate("Summon");
        break;
      case "inventory":
        navigation.navigate("Inventory");
        break;
      case "settings":
        navigation.navigate("Settings");
        break;
      default:
        break;
    }
  };

  return (
    <GameBackground>
      <View style={styles.container}>
        {/* Barra de recursos superior */}
        <ResourceBar
          energy={user.energy}
          maxEnergy={user.maxEnergy || 100}
          gold={user.gold}
          gems={user.gems}
          level={user.accountLevel}
          username={user.username}
        />

        {/* Sprite del héroe principal */}
        <View style={styles.heroArea}>
          <HeroSprite heroName={mainHero.name} heroClass={mainHero.class} />
        </View>

        {/* Menú de navegación inferior */}
        <GameMenu
          onNavigate={handleNavigate}
          currentZone={user.progress?.zone || 1}
          currentStage={user.progress?.stage || 1}
        />
      </View>

      {/* Popup de oferta especial (típico de gachas 😄) */}
      <OfferPopup
        visible={showOffer}
        onClose={() => setShowOffer(false)}
        offerId="starter_pack"
      />
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
});
