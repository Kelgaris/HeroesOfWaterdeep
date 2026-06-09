import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
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

  // Estado dinámico del héroe principal
  const [mainHero, setMainHero] = useState({
    name: "Rain",
    class: "warrior",
    title: "Vanguardia de la Luz",
    image: "",
  });

  const [showOffer, setShowOffer] = useState(false);
  const [ownedCatalogHeroes, setOwnedCatalogHeroes] = useState([]);
  const appState = useRef(AppState.currentState);

  const syncEnergy = useCallback(async () => {
    try {
      const response = await api.post("/battle/refresh-energy");
      if (response.data) {
        setUser((prev) => {
          if (
            prev.energy !== response.data.energy ||
            prev.maxEnergy !== response.data.maxEnergy
          ) {
            const updatedUser = {
              ...prev,
              energy: response.data.energy,
              maxEnergy: response.data.maxEnergy,
            };
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
      syncEnergy();
    } catch (error) {
      console.error("Error cargando datos del usuario:", error);
    }
  }, [syncEnergy]);

  const fetchFullUserData = useCallback(async () => {
    try {
      const [currentUser, catalogResponse] = await Promise.all([
        fetchCurrentUser(),
        api.get("/heroes/catalog").catch(() => null),
      ]);

      const ownedHeroes = (catalogResponse?.data || []).filter(
        (hero) => hero.owned,
      );

      if (currentUser) {
        setUser((prev) => ({
          ...prev,
          ...currentUser,
        }));
      }

      setOwnedCatalogHeroes(ownedHeroes);
    } catch (error) {
      console.error("Error fetching full user data:", error);
      loadUserData(); // fallback
    }
  }, [loadUserData]);

  // Función optimizada para determinar qué héroe mostrar en el Lobby
  const updateHomeHero = useCallback(async () => {
    try {
      const selectedCharId = await AsyncStorage.getItem("SELECTED_HOME_CHAR");
      const heroPool =
        ownedCatalogHeroes.length > 0 ? ownedCatalogHeroes : user.heroes || [];

      if (heroPool.length > 0) {
        let foundHero = null;

        if (selectedCharId) {
          // Buscamos coincidencia por heroId, _id o por nombre
          foundHero = heroPool.find(
            (h) =>
              h.heroId === selectedCharId ||
              h._id === selectedCharId ||
              h.name.toLowerCase() === selectedCharId.toLowerCase(),
          );
        }

        // 1. Héroe seleccionado (Usa splashArt)
        if (foundHero) {
          setMainHero({
            name: foundHero.name,
            class:
              foundHero.class || foundHero.role || foundHero.name.toLowerCase(),
            title: foundHero.title || "Héroe de Leyenda",
            image: foundHero.splashArt || "", // <-- CORREGIDO
          });
          return;
        }

        // Fallback 1: Si no hay selección, buscamos a 'Rain' (Usa splashArt)
        const rainHero = heroPool.find(
          (h) => h.name.toLowerCase() === "rain" || h.heroId === "hero_rain",
        );
        if (rainHero) {
          setMainHero({
            name: rainHero.name,
            class: rainHero.class || "warrior",
            title: rainHero.title || "Vanguardia de la Luz",
            image: rainHero.splashArt || "", // <-- CORREGIDO
          });
          return;
        }

        // Fallback 2: Primer héroe disponible (Usa splashArt)
        if (heroPool[0]) {
          setMainHero({
            name: heroPool[0].name,
            class:
              heroPool[0].class ||
              heroPool[0].role ||
              heroPool[0].name.toLowerCase(),
            title: heroPool[0].title || heroPool[0].class || "Héroe de Leyenda",
            image: heroPool[0].splashArt || "", // <-- CORREGIDO
          });
          return;
        }
      }

      // Último recurso por defecto total si el inventario está completamente vacío
      setMainHero({
        name: "Rain",
        class: "warrior",
        title: "Vanguardia de la Luz",
        image: "/assets/heroes/rain/portrait.png", // Fallback de ruta manual
      });
    } catch (error) {
      console.error(
        "Error al actualizar el héroe de la interfaz principal:",
        error,
      );
    }
  }, [ownedCatalogHeroes, user.heroes]);

  // Escucha cambios en el inventario de héroes para refrescar la vista en tiempo real
  useEffect(() => {
    updateHomeHero();
  }, [ownedCatalogHeroes, user.heroes, updateHomeHero]);

  useEffect(() => {
    loadUserData();

    // LÓGICA DE CONTROL DEL POPUP DE RENDRIKA (CADA 30 MINUTOS)
    let offerTimer;
    const checkAndScheduleOffer = async () => {
      try {
        const lastShown = await AsyncStorage.getItem("LAST_OFFER_TIME");
        const now = Date.now();
        const THIRTY_MINUTES = 30 * 60 * 1000;

        if (!lastShown || now - parseInt(lastShown) > THIRTY_MINUTES) {
          offerTimer = setTimeout(() => {
            setShowOffer(true);
            AsyncStorage.setItem("LAST_OFFER_TIME", Date.now().toString());
          }, 2000);
        }
      } catch (error) {
        console.error("Error controlando el temporizador de la oferta:", error);
      }
    };

    checkAndScheduleOffer();

    const energyInterval = setInterval(() => {
      syncEnergy();
    }, 60000);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        syncEnergy();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (offerTimer) clearTimeout(offerTimer);
      clearInterval(energyInterval);
      subscription.remove();
    };
  }, [loadUserData, syncEnergy]);

  useFocusEffect(
    useCallback(() => {
      fetchFullUserData();
    }, [fetchFullUserData]),
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
        <ResourceBar
          energy={user.energy}
          maxEnergy={user.maxEnergy || 100}
          gold={user.gold}
          gems={user.gems}
          level={user.accountLevel}
          username={user.username}
        />

        {/* CORREGIDO: Se añade la propiedad heroImage vinculada a la URL del estado dinámico */}
        <View style={styles.heroArea}>
          <HeroSprite
            heroName={mainHero.name}
            heroClass={mainHero.class}
            heroTitle={mainHero.title}
            heroImage={mainHero.image}
          />
        </View>

        <GameMenu
          onNavigate={handleNavigate}
          currentZone={user.progress?.zone || 1}
          currentStage={user.progress?.stage || 1}
        />
      </View>

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
