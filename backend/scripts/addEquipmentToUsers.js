/**
 * Script para añadir items de equipo a todos los usuarios
 * Ejecutar: node scripts/addEquipmentToUsers.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

// Items de equipo a añadir (2 de cada uno)
const EQUIPMENT_TO_ADD = [
  { itemId: "sword_1", quantity: 2 },
  { itemId: "axe_1", quantity: 1 },
  { itemId: "staff_1", quantity: 1 },
  { itemId: "wand_1", quantity: 1 },
  { itemId: "helmet_1", quantity: 2 },
  { itemId: "chest_1", quantity: 2 },
  { itemId: "gloves_1", quantity: 2 },
  { itemId: "boots_1", quantity: 2 },
];

async function addEquipmentToAllUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    const users = await User.find();
    console.log(`Encontrados ${users.length} usuarios`);

    for (const user of users) {
      console.log(`\nProcesando usuario: ${user.username}`);

      for (const equipment of EQUIPMENT_TO_ADD) {
        // Buscar si ya tiene este item
        const existingIndex = user.inventory.findIndex(
          (item) => item.itemId === equipment.itemId
        );

        if (existingIndex !== -1) {
          // Añadir a la cantidad existente
          user.inventory[existingIndex].quantity += equipment.quantity;
          console.log(
            `  - ${equipment.itemId}: añadidos ${equipment.quantity} (total: ${user.inventory[existingIndex].quantity})`
          );
        } else {
          // Crear nuevo item en inventario
          user.inventory.push({
            itemId: equipment.itemId,
            quantity: equipment.quantity,
          });
          console.log(`  - ${equipment.itemId}: creado con ${equipment.quantity}`);
        }
      }

      await user.save();
      console.log(`  Usuario ${user.username} guardado`);
    }

    console.log("\n✅ Equipamiento añadido a todos los usuarios");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addEquipmentToAllUsers();
