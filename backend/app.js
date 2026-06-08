// Cargamos las variables de entorno desde la raiz del monorepo o backend/.env
require("./config/loadEnv");

// Importamos las dependencias necesarias
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Importamos la función para conectar a la base de datos
const connectDB = require("./config/db");
const { seedEnemies } = require("./models/Enemy");
const { seedStages } = require("./models/Stage");

// Importamos las rutas de la API
const authRoutes = require("./routes/authRoutes");
const heroRoutes = require("./routes/heroRoutes");
const gachaRoutes = require("./routes/gachaRoutes");
const battleRoutes = require("./routes/battleRoutes");
const userRoutes = require("./routes/userRoutes");

const parseAllowedOrigins = () => {
  const configuredOrigins = process.env.CORS_ORIGINS || "";
  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const buildCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();
  const allowAllInDev = process.env.NODE_ENV !== "production";

  return {
    origin: (origin, callback) => {
      // Permite requests sin origin (apps nativas/Postman/servidor a servidor)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowAllInDev || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por CORS"));
    },
  };
};

// Creamos una instancia de Express
const app = express();

// Middleware para manejar CORS, seguridad y parseo de JSON
app.use(cors(buildCorsOptions()));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir cargar imágenes desde otros orígenes
  }),
);
app.use(express.json());

// Servir archivos estáticos (imágenes de héroes)
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Usamos las rutas de autenticación, héroes, gacha y batalla
app.use("/api/auth", authRoutes);
app.use("/api/heroes", heroRoutes);
app.use("/api/gacha", gachaRoutes);
app.use("/api/battle", battleRoutes);
app.use("/api/user", userRoutes);

// Ruta de health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Definimos el puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await Promise.all([seedEnemies(), seedStages()]);
  return app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
