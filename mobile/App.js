import {
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    useFonts,
} from "@expo-google-fonts/cinzel";
import {
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
} from "@expo-google-fonts/nunito-sans";
import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppNavigator />
    </View>
  );
}

registerRootComponent(App);
