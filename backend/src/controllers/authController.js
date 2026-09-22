const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// ======================================================
// INSCRIPTION
// POST /api/auth/register
// ======================================================
const register = async (req, res) => {
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
    telephone,
    role
  } = req.body;

  // Vérification des champs obligatoires
  if (!nom || !prenom || !email || !mot_de_passe || !role) {
    return res.status(400).json({
      success: false,
      message: "Veuillez remplir tous les champs obligatoires."
    });
  }

  // Rôles correspondant aux valeurs PostgreSQL
  const rolesAutorises = [
    "ADMINISTRATEUR",
    "LIVREUR",
    "CLIENT"
  ];

  const roleNormalise = role.trim().toUpperCase();

  if (!rolesAutorises.includes(roleNormalise)) {
    return res.status(400).json({
      success: false,
      message: "Rôle invalide."
    });
  }

  let client;

  try {
    client = await pool.connect();

    // Début de la transaction
    await client.query("BEGIN");

    // Vérifier si l'email existe déjà
    const utilisateurExistant = await client.query(
      `
      SELECT id
      FROM utilisateurs
      WHERE LOWER(email) = LOWER($1)
      `,
      [email.trim()]
    );

    if (utilisateurExistant.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà."
      });
    }

    // Hashage du mot de passe utilisateur
    const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

    // Création dans la table utilisateurs
    const nouvelUtilisateur = await client.query(
      `
      INSERT INTO utilisateurs
        (nom, prenom, email, mot_de_passe, telephone, role)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        nom,
        prenom,
        email,
        telephone,
        role,
        date_creation
      `,
      [
        nom.trim(),
        prenom.trim(),
        email.trim().toLowerCase(),
        motDePasseHash,
        telephone ? telephone.trim() : null,
        roleNormalise
      ]
    );

    const utilisateur = nouvelUtilisateur.rows[0];

    // Création du profil CLIENT
    if (roleNormalise === "CLIENT") {
      await client.query(
        `
        INSERT INTO clients (id)
        VALUES ($1)
        `,
        [utilisateur.id]
      );
    }

    // Création du profil LIVREUR
    if (roleNormalise === "LIVREUR") {
      await client.query(
        `
        INSERT INTO livreurs (id)
        VALUES ($1)
        `,
        [utilisateur.id]
      );
    }

    // Création du profil ADMINISTRATEUR
    if (roleNormalise === "ADMINISTRATEUR") {
      await client.query(
        `
        INSERT INTO administrateurs (id)
        VALUES ($1)
        `,
        [utilisateur.id]
      );
    }

    // Valider la transaction
    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Inscription réussie.",
      data: {
        utilisateur
      }
    });

  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Erreur inscription :", error);

    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};


// ======================================================
// CONNEXION
// POST /api/auth/login
// ======================================================
const login = async (req, res) => {
  const {
    email,
    mot_de_passe
  } = req.body;

  // Vérification des champs
  if (!email || !mot_de_passe) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe obligatoires."
    });
  }

  try {
    // Rechercher l'utilisateur
    const result = await pool.query(
      `
      SELECT
        id,
        nom,
        prenom,
        email,
        mot_de_passe,
        telephone,
        role
      FROM utilisateurs
      WHERE LOWER(email) = LOWER($1)
      `,
      [email.trim()]
    );

    // Utilisateur inexistant
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect."
      });
    }

    const utilisateur = result.rows[0];

    // Vérifier le mot de passe avec bcrypt
    const motDePasseValide = await bcrypt.compare(
      mot_de_passe,
      utilisateur.mot_de_passe
    );

    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect."
      });
    }

    // Vérifier que JWT_SECRET existe
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET n'est pas défini dans le fichier .env");

      return res.status(500).json({
        success: false,
        message: "Erreur de configuration du serveur."
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        role: utilisateur.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    );

    // Réponse envoyée au frontend
    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      data: {
        token,
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          telephone: utilisateur.telephone,
          role: utilisateur.role
        }
      }
    });

  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la connexion."
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  register,
  login
};