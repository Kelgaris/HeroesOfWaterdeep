import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
    Dimensions,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import FantasyButton from "../components/FantasyButton";
import ThemedDialog from "../components/ThemedDialog";
import api, {
  fetchCurrentUser,
  hasConfiguredApiUrl,
  saveCurrentUser,
} from "../services/api";

const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);

  const login = async () => {
    if (!username || !password) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Campos incompletos",
        message: "Por favor completa todos los campos",
      });
      return;
    }

    if (!hasConfiguredApiUrl()) {
      setDialogConfig({
        mode: "info",
        tone: "error",
        title: "Configuración incompleta",
        message:
          "Esta APK no tiene configurada la URL de la API. Regenera la build con EXPO_PUBLIC_API_URL en GitHub Actions.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      // Guardar token y datos del usuario
      await AsyncStorage.setItem("token", res.data.token);
      const currentUser = await fetchCurrentUser().catch(() => null);
      await saveCurrentUser(currentUser || res.data.user);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request
          ? "No se pudo conectar con el servidor. Comprueba la conexion y que la API este disponible."
          : "Error al iniciar sesión");
      setDialogConfig({
        mode: "info",
        tone: "error",
        title: "Error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/backgrounds/waterdeep_bg_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/backgrounds/inicioTitulo.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Bienvenido de vuelta, héroe</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Nombre de usuario"
            placeholderTextColor="#8a8070"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#8a8070"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <FantasyButton
          title={loading ? "Entrando..." : "Entrar"}
          onPress={login}
          disabled={loading}
        />

        <FantasyButton
          title="Volver"
          onPress={() => navigation.goBack()}
          secondary
        />

        {dialogConfig && (
          <ThemedDialog
            visible={!!dialogConfig}
            mode={dialogConfig.mode}
            tone={dialogConfig.tone}
            title={dialogConfig.title}
            message={dialogConfig.message}
            onClose={() => setDialogConfig(null)}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titleImage: {
    width: width * 0.7,
    height: 80,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Cinzel_400Regular",
    color: "#c0b090",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 300,
  },
  input: {
    backgroundColor: "rgba(20, 15, 10, 0.85)",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#5a4a2a",
    color: "#e8d9c0",
  },
});
