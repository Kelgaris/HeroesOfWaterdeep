import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import FantasyButton from "../components/FantasyButton";
import GameBackground from "../components/GameBackground";
import api, { fetchCurrentUser } from "../services/api";

const SLOT_NAMES = {
  weapon: "Arma",
  head: "Cabeza",
  chest: "Pechera",
  hands: "Guantes",
  feet: "Botas",
  accessory: "Accesorio",
};

export default function EquipmentSelectionScreen({ route, navigation }) {
  const { heroId, slot } = route.params;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [equippedItemId, setEquippedItemId] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);

  const closeDialog = () => setDialogConfig(null);

  const openInfoDialog = (title, message, tone = "info") => {
    setDialogConfig({
      mode: "info",
      title,
      message,
      tone,
    });
  };

  const openConfirmDialog = (title, message, onConfirm) => {
    setDialogConfig({
      mode: "confirm",
      title,
      message,
      tone: "warning",
      onConfirm,
    });
  };

  const confirmDialogAction = async () => {
    if (!dialogConfig?.onConfirm) {
      closeDialog();
      return;
    }

    const onConfirm = dialogConfig.onConfirm;
    closeDialog();
    await onConfirm();
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Get user hero details to see what's currently equipped
      const heroRes = await api.get(`/heroes/detail/${heroId}`);
      if (
        heroRes.data &&
        heroRes.data.userHero &&
        heroRes.data.userHero.equipment
      ) {
        setEquippedItemId(heroRes.data.userHero.equipment[slot] || null);
      }

      // 2. Get user inventory
      const invRes = await api.get("/user/inventory");
      const inventory = invRes.data.grouped?.equipment || [];

      // Filter inventory to only match the selected slot
      const filteredItems = inventory.filter(
        (i) => i.details && i.details.equipmentSlot === slot,
      );
      setItems(filteredItems);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      openInfoDialog("Error", "No se pudo cargar el inventario", "error");
    } finally {
      setLoading(false);
    }
  }, [heroId, slot]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const doEquip = async (itemId) => {
    try {
      Haptics.selectionAsync().catch(() => null);
      setLoading(true);
      await api.post(`/heroes/equip/${heroId}`, { itemId, slot });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => null,
      );
      await fetchCurrentUser().catch(() => null);
      openInfoDialog(
        "Objeto equipado",
        "El objeto se equipó correctamente.",
        "success",
      );
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => null,
      );
      openInfoDialog(
        "Error al equipar",
        error.response?.data?.error || "Error al equipar objeto",
        "error",
      );
      setLoading(false);
    }
  };

  const handleEquip = async (itemId, itemName) => {
    openConfirmDialog(
      "Confirmar equipamiento",
      `¿Deseas equipar ${itemName} en la ranura ${SLOT_NAMES[slot]}?`,
      async () => doEquip(itemId),
    );
  };

  const doUnequip = async () => {
    try {
      Haptics.selectionAsync().catch(() => null);
      setLoading(true);
      await api.post(`/heroes/unequip/${heroId}`, { slot });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => null,
      );
      await fetchCurrentUser().catch(() => null);
      openInfoDialog(
        "Objeto retirado",
        "El objeto se desequipó correctamente.",
        "success",
      );
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => null,
      );
      openInfoDialog(
        "Error al desequipar",
        error.response?.data?.error || "Error al desequipar objeto",
        "error",
      );
      setLoading(false);
    }
  };

  const handleUnequip = async () => {
    openConfirmDialog(
      "Confirmar retiro",
      `¿Deseas desequipar el objeto actual de ${SLOT_NAMES[slot]}?`,
      doUnequip,
    );
  };

  const renderItem = ({ item }) => {
    const isEquipped = item.itemId === equippedItemId;
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {item.details.name} (x{item.quantity})
          </Text>
          <Text style={styles.itemDesc}>{item.details.description}</Text>

          <View style={styles.statsRow}>
            {item.details.stats?.attack ? (
              <Text style={styles.stat}>ATK: +{item.details.stats.attack}</Text>
            ) : null}
            {item.details.stats?.defense ? (
              <Text style={styles.stat}>
                DEF: +{item.details.stats.defense}
              </Text>
            ) : null}
            {item.details.stats?.hp ? (
              <Text style={styles.stat}>HP: +{item.details.stats.hp}</Text>
            ) : null}
            {item.details.stats?.speed ? (
              <Text style={styles.stat}>SPD: +{item.details.stats.speed}</Text>
            ) : null}
          </View>
        </View>

        <FantasyButton
          title="Equipar"
          onPress={() => handleEquip(item.itemId, item.details.name)}
          small
          disabled={isEquipped}
        />
      </View>
    );
  };

  return (
    <GameBackground variant="dark">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Seleccionar {SLOT_NAMES[slot]}</Text>
          <View style={{ width: 60 }} />
        </View>

        {equippedItemId && (
          <View style={styles.unequipContainer}>
            <FantasyButton title="Desequipar" onPress={handleUnequip} />
          </View>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.itemId}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No tienes objetos de este tipo en tu inventario.
              </Text>
            }
          />
        )}

        {dialogConfig && (
          <Modal
            transparent
            animationType="fade"
            visible={!!dialogConfig}
            onRequestClose={closeDialog}
          >
            <View style={styles.dialogBackdrop}>
              <View
                style={[
                  styles.dialogCard,
                  dialogConfig.tone === "success" && styles.dialogCardSuccess,
                  dialogConfig.tone === "warning" && styles.dialogCardWarning,
                  dialogConfig.tone === "error" && styles.dialogCardError,
                ]}
              >
                <Text style={styles.dialogTitle}>{dialogConfig.title}</Text>
                <Text style={styles.dialogMessage}>{dialogConfig.message}</Text>

                <View style={styles.dialogActions}>
                  {dialogConfig.mode === "confirm" && (
                    <Pressable
                      style={[
                        styles.dialogButton,
                        styles.dialogButtonSecondary,
                      ]}
                      onPress={closeDialog}
                    >
                      <Text style={styles.dialogButtonSecondaryText}>
                        Cancelar
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.dialogButton, styles.dialogButtonPrimary]}
                    onPress={
                      dialogConfig.mode === "confirm"
                        ? confirmDialogAction
                        : closeDialog
                    }
                  >
                    <Text style={styles.dialogButtonPrimaryText}>
                      {dialogConfig.mode === "confirm"
                        ? "Confirmar"
                        : "Aceptar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  unequipContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  itemCard: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemDesc: {
    color: "#AAA",
    fontSize: 12,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  stat: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 10,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 200,
  },
  dialogCard: {
    width: "100%",
    backgroundColor: "rgba(15, 20, 27, 0.98)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(217, 182, 106, 0.7)",
    padding: 16,
  },
  dialogCardSuccess: {
    borderColor: "rgba(100, 196, 124, 0.85)",
  },
  dialogCardWarning: {
    borderColor: "rgba(217, 182, 106, 0.95)",
  },
  dialogCardError: {
    borderColor: "rgba(255, 107, 107, 0.95)",
  },
  dialogTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  dialogMessage: {
    color: "#EADFC7",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 10,
  },
  dialogButton: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  dialogButtonPrimary: {
    backgroundColor: "rgba(123, 92, 46, 0.9)",
    borderColor: "rgba(217, 182, 106, 0.9)",
  },
  dialogButtonSecondary: {
    backgroundColor: "rgba(47, 74, 95, 0.3)",
    borderColor: "rgba(150, 181, 204, 0.55)",
  },
  dialogButtonPrimaryText: {
    color: "#F7E7C3",
    fontWeight: "700",
    fontSize: 13,
  },
  dialogButtonSecondaryText: {
    color: "#CFE0EC",
    fontWeight: "600",
    fontSize: 13,
  },
});
