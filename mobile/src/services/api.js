import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const normalizeServerUrl = (serverUrl) =>
  serverUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

// Configura la URL base del servidor según la plataforma y el entorno
const getServerURL = () => {
  const configuredUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    Constants.expoConfig?.extra?.expoPublicApiUrl?.trim();

  if (configuredUrl) {
    return normalizeServerUrl(configuredUrl);
  }

  // Entorno de Desarrollo local
  if (__DEV__) {
    if (Platform.OS === "android") {
      // Android emulator usa 10.0.2.2 para acceder al localhost de la máquina hospedadora
      return "http://10.0.2.2:5000";
    } else if (Platform.OS === "ios") {
      return "http://localhost:5000";
    } else {
      // Entorno Web
      return "http://localhost:5000";
    }
  }

  // RED DE SEGURIDAD EN PRODUCCIÓN:
  // Si por fallos de caché en el CI/CD la variable inyectada se lee vacía,
  // forzamos el APK de producción a apuntar al backend real de Render.
  return "https://heroes-of-waterdeep-backend.onrender.com";
};

// URL base para los endpoints de la API
const getBaseURL = () => {
  const serverUrl = getServerURL();
  return serverUrl ? `${serverUrl}/api` : "";
};

export const API_BASE_URL = getBaseURL();

export const hasConfiguredApiUrl = () => Boolean(API_BASE_URL);

// Exportar la URL del servidor para construir URLs de imágenes e imágenes de héroes
export const SERVER_URL = getServerURL();

// Función helper para construir URLs de assets multimedia
export const getAssetURL = (path) => {
  if (!path) return null;
  // Si ya es una URL completa, devolverla directamente
  if (path.startsWith("http")) return path;
  // Si es una ruta relativa del backend, construir la URL completa
  return SERVER_URL ? `${SERVER_URL}${path}` : null;
};

// Instancia centralizada de Axios
const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 15000, // 15 segundos de margen de respuesta
  headers: {
    "Content-Type": "application/json",
  },
});

// Logs informativos solo visibles en fase de desarrollo
if (__DEV__) {
  console.log("API Base URL:", API_BASE_URL);
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

// Interceptor para añadir automáticamente el JWT Token a todas las peticiones salientes
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_error) {
      // AsyncStorage no disponible (ej. entorno web dañado), continuar sin detener la app
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

// Interceptor para manejar centralizadamente las respuestas y errores del servidor
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
    // Si el token expira o es inválido (401 Unauthorized), limpiamos la sesión local
    if (error.response?.status === 401) {
      try {
        await clearStoredSession();
      } catch (_error) {
        // Ignorar excepciones al intentar limpiar el almacenamiento
      }
    }
    return Promise.reject(error);
  },
);

/* ==========================================
   MÉTODOS DE LA API (AUTH / BATTLE / ETC.)
   ========================================== */

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
