import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BattleScreen from "../screens/BattleScreen";
import CampaignScreen from "../screens/CampaignScreen";
import HeroDetailScreen from "../screens/HeroDetailScreen";
import EquipmentSelectionScreen from "../screens/EquipmentSelectionScreen";
import HeroSelectionScreen from "../screens/HeroSelectionScreen";
import HeroesScreen from "../screens/HeroesScreen";
import HomeScreen from "../screens/HomeScreen";
import InventoryScreen from "../screens/InventoryScreen";
import LandingScreen from "../screens/LandingScreen";
import LevelUpScreen from "../screens/LevelUpScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SummonScreen from "../screens/SummonScreen";
import SummonRevealScreen from "../screens/SummonRevealScreen";
import SummonResultScreen from "../screens/SummonResultScreen";
import CreditsScreen from "../screens/CreditsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="EquipmentSelection" component={EquipmentSelectionScreen} />
        <Stack.Screen name="LevelUp" component={LevelUpScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="Summon" component={SummonScreen} />
        <Stack.Screen name="SummonReveal" component={SummonRevealScreen} />
        <Stack.Screen name="SummonResult" component={SummonResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
