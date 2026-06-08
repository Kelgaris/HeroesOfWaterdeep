/**
 * Script para añadir pergaminos de experiencia a todos los usuarios
 * Ejecutar: node scripts/addScrollsToUsers.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const SCROLLS_TO_ADD = [
  { itemId: "scroll_small", quantity: 10 },
  { itemId: "scroll_medium", quantity: 10 },
  { itemId: "scroll_large", quantity: 10 },
];

async function addScrollsToAllUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    const users = await User.find();
    console.log(`Encontrados ${users.length} usuarios`);

    for (const user of users) {
      console.log(`\nProcesando usuario: ${user.username}`);

      for (const scroll of SCROLLS_TO_ADD) {
        // Buscar si ya tiene este tipo de pergamino
        const existingIndex = user.inventory.findIndex(
          (item) => item.itemId === scroll.itemId,
        );

        if (existingIndex !== -1) {
          // Añadir a la cantidad existente
          user.inventory[existingIndex].quantity += scroll.quantity;
          console.log(
            `  - ${scroll.itemId}: añadidos ${scroll.quantity} (total: ${user.inventory[existingIndex].quantity})`,
          );
        } else {
          // Crear nuevo item en inventario
          user.inventory.push({
            itemId: scroll.itemId,
            quantity: scroll.quantity,
          });
          console.log(`  - ${scroll.itemId}: creado con ${scroll.quantity}`);
        }
      }

      await user.save();
      console.log(`  Usuario ${user.username} guardado`);
    }

    console.log("\n✅ Pergaminos añadidos a todos los usuarios");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addScrollsToAllUsers();
