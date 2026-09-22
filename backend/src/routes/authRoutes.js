const express = require("express");

const {
  register,
  login
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Inscription
router.post("/register", register);

// Connexion
router.post("/login", login);

// Route protégée pour tout utilisateur connecté
router.get(
  "/profile-test",
  authMiddleware,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Accès autorisé.",
      utilisateur: req.user
    });
  }
);

// Route réservée uniquement aux ADMINISTRATEURS
router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware("ADMINISTRATEUR"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Bienvenue dans l'espace administrateur.",
      utilisateur: req.user
    });
  }
);

// Route réservée aux CLIENTS
router.get(
  "/client-test",
  authMiddleware,
  roleMiddleware("CLIENT"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Bienvenue dans l'espace client.",
      utilisateur: req.user
    });
  }
);

module.exports = router;