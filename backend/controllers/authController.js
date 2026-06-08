// Controlador de autenticación para manejar el inicio de sesión y registro de usuarios
const User = require("../models/User");
const { BASE_HEROES } = require("../models/Hero");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const LOGIN_ATTEMPT_STORE = new Map();
const MAX_BACKOFF_MS = 15 * 60 * 1000;

const escapeRegExp = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeUsername = (username) => String(username || "").trim();
const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const getAttemptKey = (username, ip) =>
  `${normalizeUsername(username).toLowerCase()}::${ip || "unknown"}`;

const getAttemptState = (key) => {
  const state = LOGIN_ATTEMPT_STORE.get(key);
  if (!state) return null;
  if (state.lockUntil && state.lockUntil < Date.now()) {
    LOGIN_ATTEMPT_STORE.delete(key);
    return null;
  }
  return state;
};

const computeBackoffMs = (failedAttempts) => {
  if (failedAttempts < 3) {
    return 0;
  }
  // 2s, 4s, 8s... con techo de 15 minutos
  return Math.min(MAX_BACKOFF_MS, Math.pow(2, failedAttempts - 2) * 1000);
};

const registerFailedAttempt = (key) => {
  const state = getAttemptState(key) || { failedAttempts: 0, lockUntil: 0 };
  state.failedAttempts += 1;

  const backoffMs = computeBackoffMs(state.failedAttempts);
  state.lockUntil = backoffMs > 0 ? Date.now() + backoffMs : 0;
  LOGIN_ATTEMPT_STORE.set(key, state);

  return state;
};

const clearAttempts = (key) => {
  LOGIN_ATTEMPT_STORE.delete(key);
};

const serializeUser = (usuario) => ({
  id: usuario._id,
  username: usuario.username,
  email: usuario.email,
  accountLevel: usuario.accountLevel,
  experience: usuario.experience,
  maxExperience: usuario.maxExperience,
  energy: usuario.energy,
  maxEnergy: usuario.maxEnergy,
  gold: usuario.gold,
  gems: usuario.gems,
  heroes: usuario.heroes,
  inventory: usuario.inventory,
  progress: usuario.progress,
  gachaPity: usuario.gachaPity,
  lastEnergyRefresh: usuario.lastEnergyRefresh,
  createdAt: usuario.createdAt,
});

const STARTER_HERO_BASE =
  BASE_HEROES.find((hero) => hero._id === "hero_rain") ||
  BASE_HEROES.find((hero) => hero.rarity === 4) ||
  BASE_HEROES[0];

const buildStarterHero = () => ({
  heroId: STARTER_HERO_BASE._id,
  name: STARTER_HERO_BASE.name,
  element: STARTER_HERO_BASE.element,
  title: STARTER_HERO_BASE.title || "",
  level: 1,
  rarity: STARTER_HERO_BASE.rarity,
  experience: 0,
  resonancePieces: 0,
  starsUpgraded: 0,
  stats: STARTER_HERO_BASE.stats,
});

// Función para registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!STARTER_HERO_BASE) {
      return res.status(500).json({
        message: "No hay héroes base configurados para crear cuentas nuevas",
      });
    }

    const usernameRegex = new RegExp(`^${escapeRegExp(username)}$`, "i");

    // Verificar username/email en una sola consulta
    const usuarioExistente = await User.findOne({
      $or: [{ email }, { username: usernameRegex }],
    });

    if (usuarioExistente?.email === email) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está en uso" });
    }

    if (usuarioExistente) {
      return res
        .status(400)
        .json({ message: "El nombre de usuario ya está en uso" });
    }

    // Hasheamos la constraseña del usuario para almacenarla de forma segura en la base de datos.
    const passwordHasheada = await bcrypt.hash(password, 10);

    const starterHero = buildStarterHero();

    // Creamos un nuevo usuario con los datos proporcionados y su héroe inicial
    const nuevoUsuario = new User({
      username,
      email,
      passwordHash: passwordHasheada,
      heroes: [starterHero],
      accountLevel: 1,
      experience: 0,
      energy: 100,
      gold: 5000,
      gems: 500,
      progress: {
        zone: 1,
        stage: 1,
      },
    });

    // Guardamos el nuevo usuario en la base de datos
    await nuevoUsuario.save();

    // Respondemos con un mensaje de éxito
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      starterHero,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Función para iniciar sesión con un usuario existente
exports.login = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Configuración del servidor incompleta (JWT_SECRET faltante).",
      });
    }

    const username = normalizeUsername(req.body.username);
    const { password } = req.body;
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
    const attemptKey = getAttemptKey(username, ip);
    const attemptState = getAttemptState(attemptKey);

    if (attemptState?.lockUntil && attemptState.lockUntil > Date.now()) {
      const retryAfterSeconds = Math.ceil(
        (attemptState.lockUntil - Date.now()) / 1000,
      );
      return res.status(429).json({
        message: `Demasiados intentos. Intenta de nuevo en ${retryAfterSeconds} segundos.`,
      });
    }

    const usernameRegex = new RegExp(`^${escapeRegExp(username)}$`, "i");

    // Buscamos al usuario por su nombre de usuario
    const usuario = await User.findOne({ username: usernameRegex });

    if (!usuario) {
      registerFailedAttempt(attemptKey);
      return res
        .status(400)
        .json({ message: "Usuario o contraseña incorrectos." });
    }

    // Comparamos la contraseña proporcionada con el hash almacenado en la base de datos
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      registerFailedAttempt(attemptKey);
      return res
        .status(400)
        .json({ message: "Usuario o contraseña incorrectos." });
    }

    clearAttempts(attemptKey);

    // Si el inicio de sesión es exitoso, generamos un token JWT para el usuario
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respondemos con el token y todos los datos del usuario
    res.json({
      token,
      user: serializeUser(usuario),
    });
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuarioId).select("-passwordHash");

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json({ user: serializeUser(usuario) });
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
