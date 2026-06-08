import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function ThemedDialog({
  visible,
  title,
  message,
  tone = "info",
  mode = "info",
  onClose,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  acceptText = "Aceptar",
}) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }
    onClose?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!visible}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            tone === "success" && styles.cardSuccess,
            tone === "warning" && styles.cardWarning,
            tone === "error" && styles.cardError,
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {mode === "confirm" && (
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleClose}
              >
                <Text style={styles.buttonSecondaryText}>{cancelText}</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.button, styles.buttonPrimary]}
              onPress={mode === "confirm" ? handleConfirm : handleClose}
            >
              <Text style={styles.buttonPrimaryText}>
                {mode === "confirm" ? confirmText : acceptText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(15, 20, 27, 0.98)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(217, 182, 106, 0.7)",
    padding: 16,
  },
  cardSuccess: {
    borderColor: "rgba(100, 196, 124, 0.85)",
  },
  cardWarning: {
    borderColor: "rgba(217, 182, 106, 0.95)",
  },
  cardError: {
    borderColor: "rgba(255, 107, 107, 0.95)",
  },
  title: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    color: "#EADFC7",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 10,
  },
  button: {
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: "rgba(123, 92, 46, 0.9)",
    borderColor: "rgba(217, 182, 106, 0.9)",
  },
  buttonSecondary: {
    backgroundColor: "rgba(47, 74, 95, 0.3)",
    borderColor: "rgba(150, 181, 204, 0.55)",
  },
  buttonPrimaryText: {
    color: "#F7E7C3",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonSecondaryText: {
    color: "#CFE0EC",
    fontWeight: "600",
    fontSize: 13,
  },
});
