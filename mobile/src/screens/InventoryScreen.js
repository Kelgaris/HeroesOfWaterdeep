import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import GameBackground from "../components/GameBackground";
import api, { getAssetURL } from "../services/api";

const { width } = Dimensions.get("window");

// Categorías de filtro
const CATEGORY_FILTERS = [
  { key: "all", label: "Todo", icon: "📦" },
  { key: "equipment", label: "Equipo", icon: "⚔️" },
  { key: "consumable", label: "Consumibles", icon: "📜" },
  { key: "material", label: "Materiales", icon: "🔧" },
  { key: "special", label: "Especial", icon: "✨" },
];

// Colores por rareza
const RARITY_COLORS = {
  1: "#9E9E9E",
  2: "#4CAF50",
  3: "#2196F3",
  4: "#9C27B0",
  5: "#FFD700",
};

// Colores de borde por rareza
const RARITY_BORDER_COLORS = {
  1: "#616161",
  2: "#388E3C",
  3: "#1976D2",
  4: "#7B1FA2",
  5: "#DAA520",
};

// Nombres de slots de equipo
const SLOT_NAMES = {
  weapon: "Arma",
  head: "Cabeza",
  chest: "Pecho",
  hands: "Manos",
  feet: "Pies",
  accessory: "Accesorio",
};

export default function InventoryScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [gold, setGold] = useState(0);
  const [gems, setGems] = useState(0);

  // Cargar inventario
  const loadInventory = useCallback(async () => {
    try {
      const response = await api.get("/user/inventory");
      setInventory(response.data.inventory || []);
      setGold(response.data.gold || 0);
      setGems(response.data.gems || 0);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Filtrar inventario cuando cambia la categoría
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredInventory(inventory);
    } else {
      setFilteredInventory(
        inventory.filter(
          (item) => item.details?.category === selectedCategory
        )
      );
    }
  }, [inventory, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInventory();
  }, [loadInventory]);

  // Renderizar item del inventario
  const renderItem = ({ item }) => {
    const details = item.details;
    if (!details) return null;

    const rarityColor = RARITY_COLORS[details.rarity] || RARITY_COLORS[1];
    const borderColor = RARITY_BORDER_COLORS[details.rarity] || RARITY_BORDER_COLORS[1];
    const iconUrl = getAssetURL(details.icon);

    return (
      <Pressable
        style={[styles.itemCard, { borderColor }]}
        onPress={() => {
          // TODO: Abrir detalle del item
          console.log("Item seleccionado:", item);
        }}
      >
        {/* Fondo con gradiente de rareza */}
        <View style={[styles.itemGlow, { backgroundColor: rarityColor }]} />

        {/* Icono del item */}
        <View style={styles.itemIconContainer}>
          {iconUrl ? (
            <Image
              source={{ uri: iconUrl }}
              style={styles.itemIcon}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.itemPlaceholder, { backgroundColor: rarityColor }]}>
              <Text style={styles.itemPlaceholderText}>
                {details.name?.charAt(0) || "?"}
              </Text>
            </View>
          )}
        </View>

        {/* Cantidad */}
        {item.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>x{item.quantity}</Text>
          </View>
        )}

        {/* Nombre del item */}
        <Text style={[styles.itemName, { color: rarityColor }]} numberOfLines={1}>
          {details.name}
        </Text>

        {/* Slot o categoría */}
        <Text style={styles.itemSlot}>
          {details.equipmentSlot
            ? SLOT_NAMES[details.equipmentSlot]
            : details.category === "consumable"
            ? "Consumible"
            : details.category}
        </Text>

        {/* Stats principales */}
        {details.stats && Object.keys(details.stats).length > 0 && (
          <View style={styles.statsPreview}>
            {details.stats.attack > 0 && (
              <Text style={styles.statText}>⚔️ {details.stats.attack}</Text>
            )}
            {details.stats.defense > 0 && (
              <Text style={styles.statText}>🛡️ {details.stats.defense}</Text>
            )}
            {details.stats.hp > 0 && (
              <Text style={styles.statText}>❤️ {details.stats.hp}</Text>
            )}
            {details.stats.speed > 0 && (
              <Text style={styles.statText}>💨 {details.stats.speed}</Text>
            )}
          </View>
        )}

        {/* Estrellas de rareza */}
        <View style={styles.rarityStars}>
          {Array.from({ length: details.rarity }, (_, i) => (
            <Text key={i} style={[styles.star, { color: rarityColor }]}>
              ★
            </Text>
          ))}
        </View>
      </Pressable>
    );
  };

  // Renderizar filtros de categoría
  const renderCategoryFilters = () => (
    <View style={styles.filterContainer}>
      {CATEGORY_FILTERS.map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            styles.filterButton,
            selectedCategory === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedCategory(filter.key)}
        >
          <Text style={styles.filterIcon}>{filter.icon}</Text>
          <Text
            style={[
              styles.filterLabel,
              selectedCategory === filter.key && styles.filterLabelActive,
            ]}
          >
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  if (loading) {
    return (
      <GameBackground variant="dark">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </GameBackground>
    );
  }

  return (
    <GameBackground variant="dark">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Inventario</Text>
          <View style={styles.resourcesContainer}>
            <Text style={styles.resourceText}>💰 {gold}</Text>
            <Text style={styles.resourceText}>💎 {gems}</Text>
          </View>
        </View>

        {/* Filtros de categoría */}
        {renderCategoryFilters()}

        {/* Contador de items */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredInventory.length} objeto{filteredInventory.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Lista de items */}
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {selectedCategory === "all"
                ? "Tu inventario está vacío"
                : `No tienes ${CATEGORY_FILTERS.find(f => f.key === selectedCategory)?.label.toLowerCase() || "items"}`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredInventory}
            renderItem={renderItem}
            keyExtractor={(item) => item.itemId}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
                colors={["#FFD700"]}
              />
            }
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  resourcesContainer: {
    alignItems: "flex-end",
  },
  resourceText: {
    color: "#FFF",
    fontSize: 12,
    marginBottom: 2,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 6,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(255,215,0,0.2)",
    borderColor: "#FFD700",
  },
  filterIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  filterLabel: {
    color: "#888",
    fontSize: 10,
    textAlign: "center",
  },
  filterLabelActive: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  countContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  countText: {
    color: "#888",
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  itemCard: {
    width: (width - 44) / 3,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  itemGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    opacity: 0.15,
  },
  itemIconContainer: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  itemIcon: {
    width: "100%",
    height: "100%",
  },
  itemPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemPlaceholderText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  quantityBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  quantityText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  itemName: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  itemSlot: {
    color: "#888",
    fontSize: 8,
    marginBottom: 3,
  },
  statsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 3,
    marginBottom: 3,
  },
  statText: {
    color: "#AAA",
    fontSize: 8,
  },
  rarityStars: {
    flexDirection: "row",
    marginTop: 2,
  },
  star: {
    fontSize: 8,
    marginHorizontal: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
});
