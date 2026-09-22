const express = require("express");

const {
  getMesNotifications,
  marquerCommeLue,
  compterNotificationsNonLues,
  marquerToutesCommeLues
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// CONSULTER SES NOTIFICATIONS
// GET /api/notifications
// UTILISATEUR CONNECTE
// ======================================================

router.get(
  "/",
  authMiddleware,
  getMesNotifications
);


// ======================================================
// COMPTER LES NOTIFICATIONS NON LUES
// GET /api/notifications/non-lues/count
// UTILISATEUR CONNECTE
// ======================================================

router.get(
  "/non-lues/count",
  authMiddleware,
  compterNotificationsNonLues
);


// ======================================================
// MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// PATCH /api/notifications/tout-lire
// UTILISATEUR CONNECTE
// ======================================================

router.patch(
  "/tout-lire",
  authMiddleware,
  marquerToutesCommeLues
);


// ======================================================
// MARQUER UNE NOTIFICATION COMME LUE
// PATCH /api/notifications/:id/lire
// UTILISATEUR CONNECTE
// ======================================================

router.patch(
  "/:id/lire",
  authMiddleware,
  marquerCommeLue
);


// ======================================================
// EXPORT DU ROUTER
// ======================================================

module.exports = router;