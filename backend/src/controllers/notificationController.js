const pool = require("../config/database");


// ======================================================
// CONSULTER SES NOTIFICATIONS
// GET /api/notifications
// UTILISATEUR CONNECTE
// ======================================================
const getMesNotifications = async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      FROM notifications
      WHERE utilisateur_id = $1
      ORDER BY date_creation DESC
      `,
      [utilisateurId]
    );

    return res.status(200).json({
      success: true,
      message: "Notifications récupérées avec succès.",
      data: {
        nombre: result.rows.length,
        notifications: result.rows
      }
    });

  } catch (error) {
    console.error("Erreur récupération notifications :", error);

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération des notifications."
    });
  }
};


// ======================================================
// COMPTER LES NOTIFICATIONS NON LUES
// GET /api/notifications/non-lues/count
// UTILISATEUR CONNECTE
// ======================================================
const compterNotificationsNonLues = async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    const result = await pool.query(
      `
      SELECT COUNT(*)::int AS nombre_non_lues
      FROM notifications
      WHERE utilisateur_id = $1
        AND statut = 'NON_LUE'
      `,
      [utilisateurId]
    );

    return res.status(200).json({
      success: true,
      message: "Nombre de notifications non lues récupéré avec succès.",
      data: {
        nombre_non_lues: result.rows[0].nombre_non_lues
      }
    });

  } catch (error) {
    console.error(
      "Erreur comptage notifications non lues :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors du comptage des notifications non lues."
    });
  }
};


// ======================================================
// MARQUER UNE NOTIFICATION COMME LUE
// PATCH /api/notifications/:id/lire
// UTILISATEUR CONNECTE
// ======================================================
const marquerCommeLue = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateurId = req.user.id;

    const notificationExistante = await pool.query(
      `
      SELECT
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      FROM notifications
      WHERE id = $1
        AND utilisateur_id = $2
      `,
      [id, utilisateurId]
    );

    if (notificationExistante.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification introuvable ou non autorisée."
      });
    }

    const notification = notificationExistante.rows[0];

    if (notification.statut === "LUE") {
      return res.status(200).json({
        success: true,
        message: "Cette notification est déjà marquée comme lue.",
        data: {
          notification
        }
      });
    }

    const result = await pool.query(
      `
      UPDATE notifications
      SET statut = 'LUE'
      WHERE id = $1
        AND utilisateur_id = $2
      RETURNING
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      `,
      [id, utilisateurId]
    );

    return res.status(200).json({
      success: true,
      message: "Notification marquée comme lue avec succès.",
      data: {
        notification: result.rows[0]
      }
    });

  } catch (error) {
    console.error(
      "Erreur mise à jour notification :",
      error
    );

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de notification invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la mise à jour de la notification."
    });
  }
};
// ======================================================
// MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// PATCH /api/notifications/tout-lire
// UTILISATEUR CONNECTE
// ======================================================
const marquerToutesCommeLues = async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    const result = await pool.query(
      `
      UPDATE notifications
      SET statut = 'LUE'
      WHERE utilisateur_id = $1
        AND statut = 'NON_LUE'
      RETURNING
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      `,
      [utilisateurId]
    );

    return res.status(200).json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues.",
      data: {
        nombre_mises_a_jour: result.rows.length,
        notifications: result.rows
      }
    });

  } catch (error) {
    console.error(
      "Erreur lors du marquage de toutes les notifications :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la mise à jour des notifications."
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  getMesNotifications,
  compterNotificationsNonLues,
  marquerCommeLue,
  marquerToutesCommeLues
};