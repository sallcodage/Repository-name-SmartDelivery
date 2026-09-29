import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// ==========================================
// PAGES
// ==========================================

import Login from "./pages/Login";
import ClientDashboard from "./pages/ClientDashboard";
import NouvelleCommande from "./pages/NouvelleCommande";

// ==========================================
// COMPOSANTS
// ==========================================

import MesCommandes from "./components/MesCommandes";
import CarteSuivi from "./components/CarteSuivi";

// ==========================================
// STYLE
// ==========================================

import "./App.css";


// ==========================================
// APPLICATION
// ==========================================

function App() {
  return (
    <Routes>

      {/* ====================================== */}
      {/* CONNEXION */}
      {/* ====================================== */}

      <Route
        path="/"
        element={<Login />}
      />


      {/* ====================================== */}
      {/* ESPACE CLIENT */}
      {/* ====================================== */}

      <Route
        path="/client"
        element={<ClientDashboard />}
      />


      {/* ====================================== */}
      {/* NOUVELLE COMMANDE */}
      {/* ====================================== */}

      <Route
        path="/nouvelle-commande"
        element={<NouvelleCommande />}
      />


      {/* ====================================== */}
      {/* MES COMMANDES */}
      {/* ====================================== */}

      <Route
        path="/mes-commandes"
        element={<MesCommandes />}
      />


      {/* ====================================== */}
      {/* SUIVI GPS */}
      {/* ====================================== */}

      <Route
        path="/suivi/:commandeId"
        element={<CarteSuivi />}
      />


      {/* ====================================== */}
      {/* ESPACE LIVREUR */}
      {/* TEMPORAIRE */}
      {/* ====================================== */}

      <Route
        path="/livreur"
        element={
          <div
            style={{
              padding: "40px"
            }}
          >
            <h1>
              Espace Livreur
            </h1>

            <p>
              Gestion de vos livraisons.
            </p>
          </div>
        }
      />


      {/* ====================================== */}
      {/* ESPACE ADMINISTRATEUR */}
      {/* TEMPORAIRE */}
      {/* ====================================== */}

      <Route
        path="/admin"
        element={
          <div
            style={{
              padding: "40px"
            }}
          >
            <h1>
              Tableau de bord Administrateur
            </h1>

            <p>
              Administration de SmartDelivery Sénégal.
            </p>
          </div>
        }
      />


      {/* ====================================== */}
      {/* ROUTE INCONNUE */}
      {/* ====================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


// ==========================================
// EXPORT
// ==========================================

export default App;