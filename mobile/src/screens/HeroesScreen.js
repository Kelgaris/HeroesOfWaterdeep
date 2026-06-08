import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import GameBackground from "../components/GameBackground";
import HeroCard from "../components/HeroCard";
import api from "../services/api";

const { width } = Dimensions.get("window");

// Opciones de filtro
const FILTER_OPTIONS = {
  sortBy: [
    { key: "rarity", label: "Rareza" },
    { key: "name", label: "Nombre" },
    { key: "level", label: "Nivel" },
  ],
  ownership: [
    { key: "all", label: "Todos" },
    { key: "owned", label: "Poseídos" },
    { key: "notOwned", label: "No poseídos" },
  ],
};

export default function HeroesScreen({ navigation }) {
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("rarity");
  const [sortOrder, setSortOrder] = useState("desc");
  const [ownershipFilter, setOwnershipFilter] = useState("all");

  // Cargar héroes
  const loadHeroes = useCallback(async () => {
    try {
      const response = await api.get("/heroes/catalog");
      setHeroes(response.data);
    } catch (error) {
      console.error("Error cargando héroes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHeroes();
    }, [loadHeroes])
  );

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...heroes];

    // Filtro de propiedad
    if (ownershipFilter === "owned") {
      result = result.filter((h) => h.owned);
    } else if (ownershipFilter === "notOwned") {
      result = result.filter((h) => !h.owned);
    }

    // Ordenamiento
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "rarity") {
        comparison = a.rarity - b.rarity;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "level") {
        const levelA = a.userHeroData?.level || 0;
        const levelB = b.userHeroData?.level || 0;
        comparison = levelA - levelB;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredHeroes(result);
  }, [heroes, sortBy, sortOrder, ownershipFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHeroes();
  }, [loadHeroes]);

  const handleHeroPress = (hero) => {
    navigation.navigate("HeroDetail", { heroId: hero._id, hero });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const renderFilterButton = (option, currentValue, onPress) => (
    <Pressable
      key={option.key}
      style={[
        styles.filterButton,
        currentValue === option.key && styles.filterButtonActive,
      ]}
      onPress={() => onPress(option.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          currentValue === option.key && styles.filterButtonTextActive,
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );

  const renderHero = ({ item }) => (
    <HeroCard
      hero={item}
      owned={item.owned}
      userHeroData={item.userHeroData}
      onPress={() => handleHeroPress(item)}
    />
  );

  if (loading) {
    return (
      <GameBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Cargando héroes...</Text>
        </View>
      </GameBackground>
    );
  }

  return (
    <GameBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Héroes</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          {/* Ordenar por */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Ordenar:</Text>
            <View style={styles.filterButtons}>
              {FILTER_OPTIONS.sortBy.map((option) =>
                renderFilterButton(option, sortBy, setSortBy),
              )}
              <Pressable
                style={styles.sortOrderButton}
                onPress={toggleSortOrder}
              >
                <Text style={styles.sortOrderText}>
                  {sortOrder === "desc" ? "↓" : "↑"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Filtro de propiedad */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Mostrar:</Text>
            <View style={styles.filterButtons}>
              {FILTER_OPTIONS.ownership.map((option) =>
                renderFilterButton(option, ownershipFilter, setOwnershipFilter),
              )}
            </View>
          </View>
        </View>

        {/* Contador */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {filteredHeroes.filter((h) => h.owned).length} / {heroes.length}{" "}
            héroes desbloqueados
          </Text>
        </View>

        {/* Lista de héroes */}
        <FlatList
          data={filteredHeroes}
          renderItem={renderHero}
          keyExtractor={(item) => item._id}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay héroes que mostrar</Text>
            </View>
          }
        />
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFD700",
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
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
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 80,
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  filterLabel: {
    color: "#FFF",
    fontSize: 12,
    width: 60,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  filterButtons: {
    flexDirection: "row",
    flex: 1,
    flexWrap: "wrap",
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  filterButtonActive: {
    backgroundColor: "#FFD700",
  },
  filterButtonText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  sortOrderButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,215,0,0.3)",
    borderRadius: 15,
  },
  sortOrderText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
  },
  counterText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
});
