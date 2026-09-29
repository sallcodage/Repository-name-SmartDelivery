const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/database");


// ======================================================
// IMPORT DES ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const utilisateurRoutes =
  require("./routes/utilisateurRoutes");
const commandeRoutes =
  require("./routes/commandeRoutes");
const livraisonRoutes =
  require("./routes/livraisonRoutes");
const notificationRoutes =
  require("./routes/notificationRoutes");
const kpiRoutes =
  require("./routes/kpiRoutes");
const rapportRoutes =
  require("./routes/rapportRoutes");
const assistantIARoutes =
  require("./routes/assistantIARoutes");


// ======================================================
// CREATION DE L'APPLICATION EXPRESS
// ======================================================

const app = express();


// ======================================================
// CONFIGURATION CORS
// ======================================================

// Ports utilisés par Vite en développement
const originesAutorisees = [
  "http://localhost:5173",
  "http://localhost:5174"
];

app.use(
  cors({
    origin: function (origin, callback) {

      // Autorise les requêtes sans origine
      // comme Postman ou curl
      if (!origin) {
        return callback(null, true);
      }

      // Vérifie si le frontend est autorisé
      if (originesAutorisees.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Origine CORS non autorisée : ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);


// ======================================================
// JSON
// ======================================================

app.use(express.json());


// ======================================================
// ACCES AUX RAPPORTS PDF
// ======================================================

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
  return res.status(200).json({
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
      message:
        "Erreur de connexion à PostgreSQL",
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
// ROUTES ASSISTANT IA
// ======================================================

app.use(
  "/api/assistant-ia",
  assistantIARoutes
);


// ======================================================
// ROUTE INTROUVABLE
// ======================================================

app.use((req, res) => {

  return res.status(404).json({
    success: false,
    message: "Route API introuvable."
  });

});


// ======================================================
// GESTION DES ERREURS
// ======================================================

app.use((error, req, res, next) => {

  console.error(
    "Erreur serveur :",
    error.message
  );

  return res.status(500).json({
    success: false,
    message:
      "Une erreur interne est survenue."
  });

});


// ======================================================
// EXPORT
// ======================================================

module.exports = app;