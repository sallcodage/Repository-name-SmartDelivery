const pool = require("../config/database");


// ======================================================
// CREER UNE COMMANDE
// POST /api/commandes
// CLIENT UNIQUEMENT
// ======================================================
const creerCommande = async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    const {
      adresse_depart,
      adresse_arrivee,
      montant
    } = req.body;

    if (!adresse_depart || !adresse_arrivee || montant === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "L'adresse de départ, l'adresse d'arrivée et le montant sont obligatoires."
      });
    }

    const montantNombre = Number(montant);

    if (isNaN(montantNombre) || montantNombre < 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être un nombre positif."
      });
    }

    const clientResult = await pool.query(
      `
      SELECT id
      FROM clients
      WHERE id = $1
      `,
      [utilisateurId]
    );

    if (clientResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Profil client introuvable."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO commandes (
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut
      )
      VALUES ($1, $2, $3, $4, 'NOUVELLE')
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [
        utilisateurId,
        adresse_depart.trim(),
        adresse_arrivee.trim(),
        montantNombre
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Commande créée avec succès.",
      data: {
        commande: result.rows[0]
      }
    });

  } catch (error) {
    console.error("Erreur création commande :", error);

    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création de la commande."
    });
  }
};


// ======================================================
// CONSULTER SES PROPRES COMMANDES
// GET /api/commandes/mes-commandes
// CLIENT UNIQUEMENT
// ======================================================
const getMesCommandes = async (req, res) => {
  try {
    const clientId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE client_id = $1
      ORDER BY date_creation DESC
      `,
      [clientId]
    );

    return res.status(200).json({
      success: true,
      message: "Commandes récupérées avec succès.",
      data: {
        nombre: result.rows.length,
        commandes: result.rows
      }
    });

  } catch (error) {
    console.error("Erreur récupération commandes :", error);

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération des commandes."
    });
  }
};


// ======================================================
// CONSULTER UNE COMMANDE PAR ID
// GET /api/commandes/:id
// CLIENT UNIQUEMENT
// ======================================================
const getCommandeParId = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE id = $1
        AND client_id = $2
      `,
      [id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Commande récupérée avec succès.",
      data: {
        commande: result.rows[0]
      }
    });

  } catch (error) {
    console.error("Erreur récupération commande :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération de la commande."
    });
  }
};


// ======================================================
// MODIFIER UNE COMMANDE
// PUT /api/commandes/:id
// CLIENT UNIQUEMENT
// ======================================================
const modifierCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    const {
      adresse_depart,
      adresse_arrivee,
      montant
    } = req.body;

    if (
      !adresse_depart &&
      !adresse_arrivee &&
      montant === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir au moins un champ à modifier."
      });
    }

    let montantNombre = null;

    if (montant !== undefined) {
      montantNombre = Number(montant);

      if (isNaN(montantNombre) || montantNombre < 0) {
        return res.status(400).json({
          success: false,
          message: "Le montant doit être un nombre positif."
        });
      }
    }

    const commandeExistante = await pool.query(
      `
      SELECT
        id,
        client_id,
        statut
      FROM commandes
      WHERE id = $1
        AND client_id = $2
      `,
      [id, clientId]
    );

    if (commandeExistante.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable."
      });
    }

    const commande = commandeExistante.rows[0];

    if (commande.statut !== "NOUVELLE") {
      return res.status(409).json({
        success: false,
        message:
          "Cette commande ne peut plus être modifiée car son traitement a déjà commencé."
      });
    }

    const result = await pool.query(
      `
      UPDATE commandes
      SET
        adresse_depart = COALESCE($1, adresse_depart),
        adresse_arrivee = COALESCE($2, adresse_arrivee),
        montant = COALESCE($3, montant)
      WHERE id = $4
        AND client_id = $5
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [
        adresse_depart ? adresse_depart.trim() : null,
        adresse_arrivee ? adresse_arrivee.trim() : null,
        montantNombre,
        id,
        clientId
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Commande modifiée avec succès.",
      data: {
        commande: result.rows[0]
      }
    });

  } catch (error) {
    console.error("Erreur modification commande :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la modification de la commande."
    });
  }
};


// ======================================================
// ANNULER UNE COMMANDE
// PATCH /api/commandes/:id/annuler
// CLIENT UNIQUEMENT
// ======================================================
const annulerCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    const commandeExistante = await pool.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE id = $1
        AND client_id = $2
      `,
      [id, clientId]
    );

    if (commandeExistante.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable."
      });
    }

    const commande = commandeExistante.rows[0];

    if (commande.statut === "ANNULEE") {
      return res.status(409).json({
        success: false,
        message: "Cette commande est déjà annulée."
      });
    }

    if (commande.statut !== "NOUVELLE") {
      return res.status(409).json({
        success: false,
        message:
          "Cette commande ne peut plus être annulée car son traitement a déjà commencé."
      });
    }

    const result = await pool.query(
      `
      UPDATE commandes
      SET statut = 'ANNULEE'
      WHERE id = $1
        AND client_id = $2
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [id, clientId]
    );

    return res.status(200).json({
      success: true,
      message: "Commande annulée avec succès.",
      data: {
        commande: result.rows[0]
      }
    });

  } catch (error) {
    console.error("Erreur annulation commande :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de l'annulation de la commande."
    });
  }
};


// ======================================================
// CONSULTER TOUTES LES COMMANDES
// GET /api/commandes
// ADMINISTRATEUR UNIQUEMENT
// ======================================================
const getToutesLesCommandes = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.client_id,
        u.nom AS client_nom,
        u.prenom AS client_prenom,
        u.email AS client_email,
        u.telephone AS client_telephone,
        c.adresse_depart,
        c.adresse_arrivee,
        c.montant,
        c.statut,
        c.date_creation
      FROM commandes c
      INNER JOIN utilisateurs u
        ON u.id = c.client_id
      ORDER BY c.date_creation DESC
      `
    );

    return res.status(200).json({
      success: true,
      message: "Liste des commandes récupérée avec succès.",
      data: {
        nombre: result.rows.length,
        commandes: result.rows
      }
    });

  } catch (error) {
    console.error(
      "Erreur récupération de toutes les commandes :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération des commandes."
    });
  }
};


// ======================================================
// VALIDER UNE COMMANDE + CREER UNE NOTIFICATION
// PATCH /api/commandes/:id/valider
// ADMINISTRATEUR UNIQUEMENT
// ======================================================
const validerCommande = async (req, res) => {
  let client;

  try {
    const { id } = req.params;

    client = await pool.connect();

    await client.query("BEGIN");

    // Vérifier que la commande existe
    const commandeExistante = await client.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (commandeExistante.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Commande introuvable."
      });
    }

    const commande = commandeExistante.rows[0];

    // Une commande annulée ne peut pas être validée
    if (commande.statut === "ANNULEE") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Une commande annulée ne peut pas être validée."
      });
    }

    // Seule une commande NOUVELLE peut être validée
    if (commande.statut !== "NOUVELLE") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "Cette commande ne peut pas être validée car elle a déjà été traitée."
      });
    }

    // Valider la commande
    const result = await client.query(
      `
      UPDATE commandes
      SET statut = 'VALIDEE'
      WHERE id = $1
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [id]
    );

    // Créer automatiquement une notification pour le client
    const notificationResult = await client.query(
      `
      INSERT INTO notifications (
        utilisateur_id,
        message,
        statut
      )
      VALUES ($1, $2, 'NON_LUE')
      RETURNING
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      `,
      [
        commande.client_id,
        "Votre commande a été validée par l'administrateur."
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Commande validée avec succès.",
      data: {
        commande: result.rows[0],
        notification: notificationResult.rows[0]
      }
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Erreur rollback :", rollbackError);
      }
    }

    console.error("Erreur validation commande :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la validation de la commande."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};


// ======================================================
// AFFECTER UN LIVREUR A UNE COMMANDE
// PATCH /api/commandes/:id/affecter-livreur
// ADMINISTRATEUR UNIQUEMENT
// ======================================================
// ======================================================
// AFFECTER UN LIVREUR A UNE COMMANDE
// PATCH /api/commandes/:id/affecter-livreur
// ADMINISTRATEUR UNIQUEMENT
// ======================================================
const affecterLivreur = async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    // ==================================================
    // 1. VERIFIER QUE L'ID DU LIVREUR EST FOURNI
    // ==================================================
    if (!livreur_id) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du livreur est obligatoire."
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");

    // ==================================================
    // 2. VERIFIER QUE LA COMMANDE EXISTE
    // ==================================================
    const commandeResult = await client.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (commandeResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Commande introuvable."
      });
    }

    const commande = commandeResult.rows[0];

    // ==================================================
    // 3. VERIFIER LE STATUT DE LA COMMANDE
    // ==================================================
    if (commande.statut !== "VALIDEE") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "Seule une commande validée peut être affectée à un livreur."
      });
    }

    // ==================================================
    // 4. VERIFIER QUE LE LIVREUR EXISTE
    // ==================================================
    const livreurResult = await client.query(
      `
      SELECT
        l.id,
        l.vehicule,
        l.disponibilite,
        u.nom,
        u.prenom,
        u.email,
        u.telephone
      FROM livreurs l
      INNER JOIN utilisateurs u
        ON u.id = l.id
      WHERE l.id = $1
      `,
      [livreur_id]
    );

    if (livreurResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Livreur introuvable."
      });
    }

    const livreur = livreurResult.rows[0];

    // ==================================================
    // 5. VERIFIER LA DISPONIBILITE DU LIVREUR
    // ==================================================
    if (livreur.disponibilite === false) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Ce livreur n'est pas disponible actuellement."
      });
    }

    // ==================================================
    // 6. VERIFIER QU'AUCUNE LIVRAISON N'EXISTE DEJA
    // ==================================================
    const livraisonExistante = await client.query(
      `
      SELECT id
      FROM livraisons
      WHERE commande_id = $1
      `,
      [id]
    );

    if (livraisonExistante.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Cette commande possède déjà une livraison."
      });
    }

    // ==================================================
    // 7. CREER LA LIVRAISON
    // ==================================================
    const livraisonResult = await client.query(
      `
      INSERT INTO livraisons (
        commande_id,
        livreur_id,
        statut,
        montant
      )
      VALUES ($1, $2, 'AFFECTEE', $3)
      RETURNING
        id,
        commande_id,
        livreur_id,
        statut,
        date_debut,
        date_fin,
        distance,
        montant
      `,
      [
        commande.id,
        livreur_id,
        commande.montant
      ]
    );

    // ==================================================
    // 8. MODIFIER LE STATUT DE LA COMMANDE
    // ==================================================
    const commandeMiseAJour = await client.query(
      `
      UPDATE commandes
      SET statut = 'LIVREUR_AFFECTE'
      WHERE id = $1
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [id]
    );

    // ==================================================
    // 9. RENDRE LE LIVREUR INDISPONIBLE
    // ==================================================
    await client.query(
      `
      UPDATE livreurs
      SET disponibilite = false
      WHERE id = $1
      `,
      [livreur_id]
    );

    // ==================================================
    // 10. NOTIFIER LE CLIENT
    // ==================================================
    await client.query(
      `
      INSERT INTO notifications (
        utilisateur_id,
        message,
        statut
      )
      VALUES ($1, $2, 'NON_LUE')
      `,
      [
        commande.client_id,
        "Un livreur a été affecté à votre commande."
      ]
    );

    // ==================================================
    // 11. NOTIFIER LE LIVREUR
    // ==================================================
    await client.query(
      `
      INSERT INTO notifications (
        utilisateur_id,
        message,
        statut
      )
      VALUES ($1, $2, 'NON_LUE')
      `,
      [
        livreur_id,
        "Une nouvelle livraison vous a été affectée."
      ]
    );

    // ==================================================
    // 12. VALIDER LA TRANSACTION
    // ==================================================
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Livreur affecté à la commande avec succès.",
      data: {
        commande: commandeMiseAJour.rows[0],
        livraison: livraisonResult.rows[0],
        livreur: {
          id: livreur.id,
          nom: livreur.nom,
          prenom: livreur.prenom,
          email: livreur.email,
          telephone: livreur.telephone,
          vehicule: livreur.vehicule
        }
      }
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Erreur rollback :", rollbackError);
      }
    }

    console.error("Erreur affectation livreur :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande ou de livreur invalide."
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Cette commande possède déjà une livraison."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de l'affectation du livreur."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};


// ======================================================
// CONFIRMER LA RECEPTION D'UNE COMMANDE
// PATCH /api/commandes/:id/confirmer
// CLIENT UNIQUEMENT
// ======================================================
const confirmerCommande = async (req, res) => {
  let client;

  try {
    const { id } = req.params;
    const clientId = req.user.id;

    client = await pool.connect();

    await client.query("BEGIN");

    // ==================================================
    // 1. VERIFIER ET VERROUILLER LA COMMANDE
    // ==================================================
    const commandeResult = await client.query(
      `
      SELECT
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      FROM commandes
      WHERE id = $1
        AND client_id = $2
      FOR UPDATE
      `,
      [id, clientId]
    );

    if (commandeResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Commande introuvable ou non autorisée."
      });
    }

    const commande = commandeResult.rows[0];

    // ==================================================
    // 2. VERIFIER LE STATUT
    // ==================================================
    if (commande.statut !== "LIVREE") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message:
          "Seule une commande au statut LIVREE peut être confirmée."
      });
    }

    // ==================================================
    // 3. RECUPERER LE LIVREUR ASSOCIE
    // ==================================================
    const livraisonResult = await client.query(
      `
      SELECT
        id,
        livreur_id
      FROM livraisons
      WHERE commande_id = $1
      LIMIT 1
      `,
      [id]
    );

    if (livraisonResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Aucune livraison associée à cette commande."
      });
    }

    const livraison = livraisonResult.rows[0];

    // ==================================================
    // 4. CONFIRMER LA COMMANDE
    // ==================================================
    const commandeMiseAJour = await client.query(
      `
      UPDATE commandes
      SET statut = 'CONFIRMEE'
      WHERE id = $1
        AND client_id = $2
      RETURNING
        id,
        client_id,
        adresse_depart,
        adresse_arrivee,
        montant,
        statut,
        date_creation
      `,
      [id, clientId]
    );

    // ==================================================
    // 5. NOTIFIER LE LIVREUR
    // ==================================================
    const notificationResult = await client.query(
      `
      INSERT INTO notifications (
        utilisateur_id,
        message,
        statut
      )
      VALUES ($1, $2, 'NON_LUE')
      RETURNING
        id,
        utilisateur_id,
        message,
        statut,
        date_creation
      `,
      [
        livraison.livreur_id,
        "Le client a confirmé la réception de la commande."
      ]
    );

    // ==================================================
    // 6. VALIDER LA TRANSACTION
    // ==================================================
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Réception de la commande confirmée avec succès.",
      data: {
        commande: commandeMiseAJour.rows[0],
        notification: notificationResult.rows[0]
      }
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Erreur rollback :", rollbackError);
      }
    }

    console.error("Erreur confirmation commande :", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide."
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la confirmation de la commande."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};
// ======================================================
// SUIVI GPS D'UNE COMMANDE PAR LE CLIENT
// GET /api/commandes/:id/suivi
// CLIENT UNIQUEMENT
// ======================================================
const suivreCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.id;

    // ==================================================
    // 1. RECUPERER LA COMMANDE, LA LIVRAISON,
    //    LE LIVREUR ET LA POSITION GPS
    // ==================================================
    const result = await pool.query(
      `
      SELECT
        c.id AS commande_id,
        c.client_id,
        c.adresse_depart,
        c.adresse_arrivee,
        c.statut AS statut_commande,

        l.id AS livraison_id,
        l.statut AS statut_livraison,

        -- Distance parcourue
        l.distance,

        -- Position GPS du livreur
        l.latitude_livreur,
        l.longitude_livreur,
        l.position_mise_a_jour,

        -- Informations du livreur
        u.id AS livreur_id,
        u.nom AS livreur_nom,
        u.prenom AS livreur_prenom,
        u.telephone AS livreur_telephone

      FROM commandes c

      LEFT JOIN livraisons l
        ON l.commande_id = c.id

      LEFT JOIN utilisateurs u
        ON u.id = l.livreur_id

      WHERE c.id = $1
        AND c.client_id = $2
      `,
      [id, clientId]
    );


    // ==================================================
    // 2. COMMANDE INTROUVABLE OU NON AUTORISEE
    // ==================================================
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Commande introuvable ou vous n'êtes pas autorisé à la suivre."
      });
    }

    const suivi = result.rows[0];


    // ==================================================
    // 3. AUCUNE LIVRAISON AFFECTEE
    // ==================================================
    if (!suivi.livraison_id) {
      return res.status(404).json({
        success: false,
        message:
          "Aucun livreur n'est encore affecté à cette commande."
      });
    }


    // ==================================================
    // 4. POSITION GPS INDISPONIBLE
    // ==================================================
    if (
      suivi.latitude_livreur === null ||
      suivi.longitude_livreur === null
    ) {
      return res.status(200).json({
        success: true,
        message:
          "La livraison existe, mais la position GPS du livreur n'est pas encore disponible.",

        data: {
          commande_id: suivi.commande_id,

          adresse_depart:
            suivi.adresse_depart,

          adresse_arrivee:
            suivi.adresse_arrivee,

          statut_commande:
            suivi.statut_commande,

          livraison: {
            id: suivi.livraison_id,
            statut: suivi.statut_livraison,
            distance: Number(suivi.distance || 0)
          },

          livreur: {
            id: suivi.livreur_id,
            nom: suivi.livreur_nom,
            prenom: suivi.livreur_prenom,
            telephone: suivi.livreur_telephone
          },

          position: null,

          position_disponible: false
        }
      });
    }


    // ==================================================
    // 5. POSITION GPS DISPONIBLE
    // ==================================================
    return res.status(200).json({
      success: true,
      message:
        "Suivi de la commande récupéré avec succès.",

      data: {
        commande_id:
          suivi.commande_id,

        adresse_depart:
          suivi.adresse_depart,

        adresse_arrivee:
          suivi.adresse_arrivee,

        statut_commande:
          suivi.statut_commande,


        // ==============================================
        // INFORMATIONS DE LA LIVRAISON
        // ==============================================
        livraison: {
          id:
            suivi.livraison_id,

          statut:
            suivi.statut_livraison,

          distance:
            Number(suivi.distance || 0)
        },


        // ==============================================
        // INFORMATIONS DU LIVREUR
        // ==============================================
        livreur: {
          id:
            suivi.livreur_id,

          nom:
            suivi.livreur_nom,

          prenom:
            suivi.livreur_prenom,

          telephone:
            suivi.livreur_telephone
        },


        // ==============================================
        // POSITION GPS
        // ==============================================
        position: {
          latitude:
            Number(suivi.latitude_livreur),

          longitude:
            Number(suivi.longitude_livreur),

          mise_a_jour:
            suivi.position_mise_a_jour
        },


        // ==============================================
        // INDICATEUR POSITION DISPONIBLE
        // ==============================================
        position_disponible: true
      }
    });

  } catch (error) {
    console.error(
      "Erreur suivi GPS commande :",
      error
    );


    // ==================================================
    // UUID INVALIDE
    // ==================================================
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant de la commande est invalide."
      });
    }


    // ==================================================
    // ERREUR SERVEUR
    // ==================================================
    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors du suivi de la commande."
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
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
};