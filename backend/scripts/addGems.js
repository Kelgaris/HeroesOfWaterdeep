// Script para añadir gemas a usuarios para pruebas
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const GEMS_TO_ADD = 20000;

async function addGems() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    // Añadir gemas a TODOS los usuarios
    const result = await User.updateMany({}, { $inc: { gems: GEMS_TO_ADD } });

    console.log(
      `✅ Se añadieron ${GEMS_TO_ADD} gemas a ${result.modifiedCount} usuario(s)`,
    );

    // Mostrar usuarios actualizados
    const users = await User.find({}, "username gems");
    users.forEach((u) => {
      console.log(`  - ${u.username}: ${u.gems} gemas`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

addGems();
