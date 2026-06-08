const User = require("../models/User");
const { Item } = require("../models/Item");

// Obtener inventario del usuario con detalles completos
exports.getInventory = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtener detalles de todos los items del inventario
    const itemIds = usuario.inventory.map((i) => i.itemId);
    const itemDetails = await Item.find({ _id: { $in: itemIds } });

    // Crear mapa de detalles
    const itemMap = {};
    for (const item of itemDetails) {
      itemMap[item._id] = item;
    }

    // Combinar inventario con detalles y agrupar por categoría
    const inventoryWithDetails = usuario.inventory.map((invItem) => ({
      ...invItem.toObject(),
      details: itemMap[invItem.itemId] || null,
    }));

    // Agrupar por categoría
    const grouped = {
      equipment: [],
      consumable: [],
      material: [],
      special: [],
    };

    // También crear objeto de scrolls para compatibilidad
    const scrolls = {};

    for (const item of inventoryWithDetails) {
      if (item.details) {
        const category = item.details.category;
        if (grouped[category]) {
          grouped[category].push(item);
        }
        // Scrolls para compatibilidad con LevelUpScreen
        if (item.itemId.startsWith("scroll_")) {
          scrolls[item.itemId] = item.quantity;
        }
      }
    }

    res.json({
      inventory: inventoryWithDetails,
      grouped,
      scrolls,
      gold: usuario.gold,
      gems: usuario.gems,
    });
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
};

// Obtener perfil del usuario
exports.getUserProfile = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId).select("-passwordHash");
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};
