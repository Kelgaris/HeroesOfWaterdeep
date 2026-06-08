import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import GameBackground from "../components/GameBackground";
import ThemedDialog from "../components/ThemedDialog";
import { clearStoredSession, fetchCurrentUser } from "../services/api";
import {
  DEFAULT_GAME_SETTINGS,
  getGameSettings,
  updateGameSettings,
} from "../services/preferences";
import { elevation, palette, radii, spacing, typography } from "../theme/tokens";

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS);
  const [username, setUsername] = useState("Héroe");
  const [dialogConfig, setDialogConfig] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      const [storedSettings, currentUser] = await Promise.all([
        getGameSettings(),
        fetchCurrentUser().catch(() => null),
      ]);

      setSettings(storedSettings);
      if (currentUser?.username) {
        setUsername(currentUser.username);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = async (settingKey, value) => {
    const nextSettings = await updateGameSettings({ [settingKey]: value });
    setSettings(nextSettings);
  };

  const handleLogout = () => {
    setDialogConfig({
      mode: "confirm",
      tone: "warning",
      title: "Cerrar sesión",
      message: "Se cerrará tu sesión en este dispositivo. ¿Quieres continuar?",
      confirmText: "Salir",
      onConfirm: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
        await clearStoredSession();
        setDialogConfig(null);
        navigation.reset({
          index: 0,
          routes: [{ name: "Landing" }],
        });
      },
    });
  };

  return (
    <GameBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Ajustes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <Text style={styles.usernameText}>{username}</Text>
          <Text style={styles.sectionBody}>
            Gestiona tu sesión y revisa la información básica del juego desde un único lugar.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Vibración</Text>
              <Text style={styles.settingDescription}>
                Activa la respuesta háptica en acciones clave de la interfaz.
              </Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => handleToggle("hapticsEnabled", value)}
              trackColor={{ false: palette.steel, true: palette.bronze }}
              thumbColor={settings.hapticsEnabled ? palette.gold : palette.parchment}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Animación de invocación</Text>
              <Text style={styles.settingDescription}>
                Muestra la espera arcana antes de revelar los héroes del gacha.
              </Text>
            </View>
            <Switch
              value={settings.gachaAnimationEnabled}
              onValueChange={(value) => handleToggle("gachaAnimationEnabled", value)}
              trackColor={{ false: palette.steel, true: palette.bronze }}
              thumbColor={settings.gachaAnimationEnabled ? palette.gold : palette.parchment}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Accesos</Text>
          <Pressable style={styles.actionRow} onPress={() => navigation.navigate("Credits")}>
            <View>
              <Text style={styles.actionTitle}>Créditos</Text>
              <Text style={styles.actionSubtitle}>Equipo, arte, tecnología y agradecimientos</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>

          <Pressable style={[styles.actionRow, styles.logoutRow]} onPress={handleLogout}>
            <View>
              <Text style={[styles.actionTitle, styles.logoutTitle]}>Logout</Text>
              <Text style={styles.actionSubtitle}>Cerrar sesión y volver al portal principal</Text>
            </View>
            <Text style={[styles.actionArrow, styles.logoutTitle]}>→</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Estado del juego</Text>
          <Text style={styles.statusText}>Versión actual: 1.0.0</Text>
          <Text style={styles.statusText}>Entorno: Waterdeep Mobile Client</Text>
          <Text style={styles.sectionBody}>
            Los ajustes visuales, combate y gacha ya están integrados con la interfaz temática del proyecto.
          </Text>
        </View>
      </ScrollView>

      {dialogConfig && (
        <ThemedDialog
          visible={!!dialogConfig}
          mode={dialogConfig.mode}
          tone={dialogConfig.tone}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          onConfirm={dialogConfig.onConfirm}
          onClose={() => setDialogConfig(null)}
        />
      )}
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 16,
  },
  title: {
    color: palette.parchment,
    fontFamily: typography.title,
    fontSize: 24,
  },
  headerSpacer: {
    width: 64,
  },
  sectionCard: {
    backgroundColor: "rgba(15, 20, 27, 0.88)",
    borderWidth: 1,
    borderColor: palette.bronze,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...elevation.strong,
  },
  sectionTitle: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    color: palette.parchment,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  usernameText: {
    color: palette.gold,
    fontFamily: typography.title,
    fontSize: 21,
    marginBottom: spacing.sm,
  },
  settingRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 181, 204, 0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  settingRowLast: {
    paddingBottom: 0,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: palette.parchment,
    fontFamily: typography.ui,
    fontSize: 15,
  },
  settingDescription: {
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  actionRow: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.steel,
    backgroundColor: "rgba(28, 37, 48, 0.86)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionTitle: {
    color: palette.parchment,
    fontFamily: typography.subtitle,
    fontSize: 15,
  },
  actionSubtitle: {
    color: palette.frost,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 4,
  },
  actionArrow: {
    color: palette.gold,
    fontFamily: typography.subtitle,
    fontSize: 18,
  },
  logoutRow: {
    borderColor: palette.blood,
    backgroundColor: "rgba(143, 45, 45, 0.18)",
  },
  logoutTitle: {
    color: "#FFB7B7",
  },
  statusText: {
    color: palette.frost,
    fontFamily: typography.ui,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
});