import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "game_settings";

export const DEFAULT_GAME_SETTINGS = {
  hapticsEnabled: true,
  gachaAnimationEnabled: true,
};

export async function getGameSettings() {
  try {
    const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!rawSettings) {
      return DEFAULT_GAME_SETTINGS;
    }

    return {
      ...DEFAULT_GAME_SETTINGS,
      ...JSON.parse(rawSettings),
    };
  } catch (_error) {
    return DEFAULT_GAME_SETTINGS;
  }
}

export async function updateGameSettings(partialSettings) {
  const currentSettings = await getGameSettings();
  const nextSettings = {
    ...currentSettings,
    ...partialSettings,
  };

  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  return nextSettings;
}