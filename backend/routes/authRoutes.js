const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados intentos de inicio de sesión desde esta IP. Intenta de nuevo en 15 minutos.",
  },
});

const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 24 })
    .withMessage("El nombre de usuario debe tener entre 3 y 24 caracteres")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage(
      "El nombre de usuario solo puede contener letras, números, _, . y -",
    ),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Correo electrónico inválido")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("La contraseña debe tener entre 8 y 128 caracteres")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe incluir al menos una mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe incluir al menos una minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe incluir al menos un número"),
];

const loginValidation = [
  body("username").trim().notEmpty().withMessage("Usuario requerido"),
  body("password").isLength({ min: 1 }).withMessage("Contraseña requerida"),
];

const handleValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  res.status(400).json({
    message: "Datos de entrada inválidos",
    errors: result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

// Ruta para registrar un nuevo usuario
router.post("/register", registerValidation, handleValidation, register);

// Ruta para iniciar sesión con un usuario existente
router.post("/login", loginLimiter, loginValidation, handleValidation, login);

// Ruta protegida para obtener el usuario autenticado actual
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
