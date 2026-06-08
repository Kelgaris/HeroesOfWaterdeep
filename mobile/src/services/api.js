import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const normalizeServerUrl = (serverUrl) =>
  serverUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

// Configura la URL base del servidor según la plataforma
const getServerURL = () => {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    Constants.expoConfig?.extra?.expoPublicApiUrl?.trim();
  if (configuredUrl) {
    return normalizeServerUrl(configuredUrl);
  }

  if (__DEV__) {
    if (Platform.OS === "android") {
      // Android emulator usa 10.0.2.2 para acceder al host
      return "http://10.0.2.2:5000";
    } else if (Platform.OS === "ios") {
      return "http://localhost:5000";
    } else {
      // Web
      return "http://localhost:5000";
    }
  }
  return "http://localhost:5000";
};

// URL base para la API
const getBaseURL = () => {
  return `${getServerURL()}/api`;
};

// Exportar la URL del servidor para construir URLs de imágenes
export const SERVER_URL = getServerURL();

// Función helper para construir URLs de assets
export const getAssetURL = (path) => {
  if (!path) return null;
  // Si ya es una URL completa, devolverla
  if (path.startsWith("http")) return path;
  // Si es una ruta relativa, construir la URL completa
  return `${SERVER_URL}${path}`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log para debug
if (__DEV__) {
  console.log("API Base URL:", getBaseURL());
}

export const saveCurrentUser = async (user) => {
  if (!user) {
    return null;
  }

  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
};

export const getStoredUser = async () => {
  const userData = await AsyncStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

export const clearStoredSession = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_error) {
      // AsyncStorage no disponible, continuar sin token
      console.log("AsyncStorage not available");
    }
    if (__DEV__) {
      console.log("Request:", config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("Response:", response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log("Error:", error.message, error.config?.url);
    }
    if (error.response?.status === 401) {
      try {
        await clearStoredSession();
      } catch (_error) {
        // Ignorar errores de AsyncStorage
      }
    }
    return Promise.reject(error);
  },
);

export const fetchCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return saveCurrentUser(response.data?.user || null);
};

export const simulateManyBattles = async ({
  stageId,
  selectedHeroIds,
  runs = 200,
}) => {
  const response = await api.post("/battle/simulate-many", {
    stageId,
    selectedHeroIds,
    runs,
  });

  return response.data;
};

export default api;
