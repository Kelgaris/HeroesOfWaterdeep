import {
    NavigationContainer,
    useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useRef } from "react";
import { useMusic } from "../context/MusicContext";

import BattleScreen from "../screens/BattleScreen";
import CampaignScreen from "../screens/CampaignScreen";
import CreditsScreen from "../screens/CreditsScreen";
import EquipmentSelectionScreen from "../screens/EquipmentSelectionScreen";
import HeroDetailScreen from "../screens/HeroDetailScreen";
import HeroSelectionScreen from "../screens/HeroSelectionScreen";
import HeroesScreen from "../screens/HeroesScreen";
import HomeScreen from "../screens/HomeScreen";
import InventoryScreen from "../screens/InventoryScreen";
import LandingScreen from "../screens/LandingScreen";
import LevelUpScreen from "../screens/LevelUpScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SummonResultScreen from "../screens/SummonResultScreen";
import SummonRevealScreen from "../screens/SummonRevealScreen";
import SummonScreen from "../screens/SummonScreen";

const Stack = createNativeStackNavigator();
const AUTH_ROUTES = new Set(["Landing", "Login", "Register"]);
const BATTLE_ROUTES = new Set(["Battle"]);
const CREDITS_ROUTES = new Set(["Credits"]);

const resolveTrackForRoute = (routeName) => {
  if (AUTH_ROUTES.has(routeName)) return "Prelude";
  if (BATTLE_ROUTES.has(routeName)) return "Battle";
  if (CREDITS_ROUTES.has(routeName)) return "EndingTheme";
  return "EternalWind";
};

export default function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef();
  const { playTrack } = useMusic();

  const handleStateChange = () => {
    const currentRouteName = navigationRef.getCurrentRoute()?.name;
    if (!currentRouteName) return;
    const previousRouteName = routeNameRef.current;

    if (previousRouteName !== currentRouteName) {
      playTrack(resolveTrackForRoute(currentRouteName));
    }

    routeNameRef.current = currentRouteName;
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
        if (routeNameRef.current) {
          playTrack(resolveTrackForRoute(routeNameRef.current));
        }
      }}
      onStateChange={handleStateChange}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Credits" component={CreditsScreen} />
        <Stack.Screen name="Campaign" component={CampaignScreen} />
        <Stack.Screen name="HeroSelection" component={HeroSelectionScreen} />
        <Stack.Screen name="Battle" component={BattleScreen} />
        <Stack.Screen name="Heroes" component={HeroesScreen} />
        <Stack.Screen name="HeroDetail" component={HeroDetailScreen} />
        <Stack.Screen
          name="EquipmentSelection"
          component={EquipmentSelectionScreen}
        />
        <Stack.Screen name="LevelUp" component={LevelUpScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="Summon" component={SummonScreen} />
        <Stack.Screen name="SummonReveal" component={SummonRevealScreen} />
        <Stack.Screen name="SummonResult" component={SummonResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
