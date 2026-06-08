import { useState } from "react";
import {
    Dimensions,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import FantasyButton from "../components/FantasyButton";
import ThemedDialog from "../components/ThemedDialog";
import api from "../services/api";

const { width } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Campos incompletos",
        message: "Por favor completa todos los campos",
      });
      return;
    }

    if (password !== confirmPassword) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Validación",
        message: "Las contraseñas no coinciden",
      });
      return;
    }

    if (password.length < 6) {
      setDialogConfig({
        mode: "info",
        tone: "warning",
        title: "Contraseña inválida",
        message: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      });

      setDialogConfig({
        mode: "info",
        tone: "success",
        title: "¡Bienvenido Héroe!",
        message: "Tu cuenta ha sido creada. ¡Has recibido tu primer héroe!",
        acceptText: "¡Empezar Aventura!",
        onClose: () => {
          setDialogConfig(null);
          navigation.navigate("Login");
        },
      });
    } catch (err) {
      const message = err.response?.data?.message || "Error al registrar";
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Image
            source={require("../assets/backgrounds/tituloRegistro.png")}
            style={styles.titleImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Únete a la aventura</Text>

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
              placeholder="Correo electrónico"
              placeholderTextColor="#8a8070"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
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

            <TextInput
              placeholder="Confirmar contraseña"
              placeholderTextColor="#8a8070"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <FantasyButton
            title={loading ? "Registrando..." : "Crear Cuenta"}
            onPress={handleRegister}
            disabled={loading}
          />

          <FantasyButton
            title="Volver"
            onPress={() => navigation.goBack()}
            secondary
          />
        </View>

        {dialogConfig && (
          <ThemedDialog
            visible={!!dialogConfig}
            mode={dialogConfig.mode}
            tone={dialogConfig.tone}
            title={dialogConfig.title}
            message={dialogConfig.message}
            acceptText={dialogConfig.acceptText}
            onClose={dialogConfig.onClose || (() => setDialogConfig(null))}
          />
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    flexGrow: 1,
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
