const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/database");


// ======================================================
// IMPORT DES ROUTES
// ======================================================
const authRoutes = require("./routes/authRoutes");
const utilisateurRoutes = require("./routes/utilisateurRoutes");
const commandeRoutes = require("./routes/commandeRoutes");
const livraisonRoutes = require("./routes/livraisonRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const kpiRoutes = require("./routes/kpiRoutes");
const rapportRoutes = require("./routes/rapportRoutes");


// ======================================================
// CREATION DE L'APPLICATION EXPRESS
// ======================================================
const app = express();


// ======================================================
// MIDDLEWARES
// ======================================================

// Autoriser le frontend React à communiquer avec le backend
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);


// Permet à Express de lire les données JSON
app.use(express.json());


// ======================================================
// ACCES AUX RAPPORTS PDF
// ======================================================
// Permet d'ouvrir les fichiers du dossier backend/rapports
// depuis une URL comme :
// http://localhost:5000/rapports/nom-du-fichier.pdf

app.use(
  "/rapports",
  express.static(
    path.join(__dirname, "../rapports")
  )
);


// ======================================================
// ROUTE PRINCIPALE
// ======================================================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "SmartDelivery Sénégal API",
    status: "OK"
  });
});


// ======================================================
// TEST CONNEXION POSTGRESQL
// ======================================================
app.get("/api/test-db", async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT
        current_database() AS database,
        NOW() AS date_serveur
      `
    );


    return res.status(200).json({
      success: true,
      message: "Connexion PostgreSQL réussie",
      database: result.rows[0].database,
      date_serveur: result.rows[0].date_serveur
    });

  } catch (error) {

    console.error(
      "Erreur PostgreSQL :",
      error.message
    );


    return res.status(500).json({
      success: false,
      message: "Erreur de connexion à PostgreSQL",
      error: error.message
    });

  }
});


// ======================================================
// ROUTES AUTHENTIFICATION
// ======================================================
app.use(
  "/api/auth",
  authRoutes
);


// ======================================================
// ROUTES UTILISATEURS
// ======================================================
app.use(
  "/api/utilisateurs",
  utilisateurRoutes
);


// ======================================================
// ROUTES COMMANDES
// ======================================================
app.use(
  "/api/commandes",
  commandeRoutes
);


// ======================================================
// ROUTES LIVRAISONS
// ======================================================
app.use(
  "/api/livraisons",
  livraisonRoutes
);


// ======================================================
// ROUTES NOTIFICATIONS
// ======================================================
app.use(
  "/api/notifications",
  notificationRoutes
);


// ======================================================
// ROUTES KPI
// ======================================================
app.use(
  "/api/kpi",
  kpiRoutes
);


// ======================================================
// ROUTES RAPPORTS
// ======================================================
app.use(
  "/api/rapports",
  rapportRoutes
);


// ======================================================
// EXPORT DE L'APPLICATION
// ======================================================
module.exports = app;