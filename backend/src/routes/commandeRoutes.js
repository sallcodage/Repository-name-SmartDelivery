const express = require("express");

const {
  creerCommande,
  getMesCommandes,
  getCommandeParId,
  modifierCommande,
  annulerCommande,
  getToutesLesCommandes,
  validerCommande,
  affecterLivreur,
  confirmerCommande,
  suivreCommande
} = require("../controllers/commandeController");

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// CREER UNE COMMANDE
// POST /api/commandes
// CLIENT UNIQUEMENT
// ======================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("CLIENT"),
  creerCommande
);


// ======================================================
// CONSULTER TOUTES LES COMMANDES
// GET /api/commandes
// ADMINISTRATEUR UNIQUEMENT
// ======================================================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMINISTRATEUR"),
  getToutesLesCommandes
);


// ======================================================
// CONSULTER SES PROPRES COMMANDES
// GET /api/commandes/mes-commandes
// CLIENT UNIQUEMENT
// ======================================================

router.get(
  "/mes-commandes",
  authMiddleware,
  roleMiddleware("CLIENT"),
  getMesCommandes
);


// ======================================================
// SUIVI GPS D'UNE COMMANDE
// GET /api/commandes/:id/suivi
// CLIENT UNIQUEMENT
// ======================================================

router.get(
  "/:id/suivi",
  authMiddleware,
  roleMiddleware("CLIENT"),
  suivreCommande
);


// ======================================================
// CONSULTER UNE COMMANDE PAR ID
// GET /api/commandes/:id
// CLIENT UNIQUEMENT
// ======================================================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("CLIENT"),
  getCommandeParId
);


// ======================================================
// MODIFIER UNE COMMANDE
// PUT /api/commandes/:id
// CLIENT UNIQUEMENT
// ======================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("CLIENT"),
  modifierCommande
);


// ======================================================
// ANNULER UNE COMMANDE
// PATCH /api/commandes/:id/annuler
// CLIENT UNIQUEMENT
// ======================================================

router.patch(
  "/:id/annuler",
  authMiddleware,
  roleMiddleware("CLIENT"),
  annulerCommande
);


// ======================================================
// CONFIRMER LA RECEPTION D'UNE COMMANDE
// PATCH /api/commandes/:id/confirmer
// CLIENT UNIQUEMENT
// ======================================================

router.patch(
  "/:id/confirmer",
  authMiddleware,
  roleMiddleware("CLIENT"),
  confirmerCommande
);


// ======================================================
// VALIDER UNE COMMANDE
// PATCH /api/commandes/:id/valider
// ADMINISTRATEUR UNIQUEMENT
// ======================================================

router.patch(
  "/:id/valider",
  authMiddleware,
  roleMiddleware("ADMINISTRATEUR"),
  validerCommande
);


// ======================================================
// AFFECTER UN LIVREUR A UNE COMMANDE
// PATCH /api/commandes/:id/affecter-livreur
// ADMINISTRATEUR UNIQUEMENT
// ======================================================

router.patch(
  "/:id/affecter-livreur",
  authMiddleware,
  roleMiddleware("ADMINISTRATEUR"),
  affecterLivreur
);


// ======================================================
// EXPORT DU ROUTER
// ======================================================

module.exports = router;