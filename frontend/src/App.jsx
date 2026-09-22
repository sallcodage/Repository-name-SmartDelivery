import { Routes, Route, Link } from "react-router-dom";

import CarteSuivi from "./components/CarteSuivi";
import MesCommandes from "./components/MesCommandes";

import "./App.css";


function App() {
  return (
    <main className="app">

      {/* ============================================== */}
      {/* EN-TETE */}
      {/* ============================================== */}

      <header className="header">

        <h1>
          SmartDelivery Sénégal
        </h1>

        <p>
          Suivi intelligent de vos livraisons
        </p>


        {/* ============================================ */}
        {/* NAVIGATION */}
        {/* ============================================ */}

        <nav
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "20px",
          }}
        >

          <Link to="/">
            Accueil
          </Link>

          <Link to="/mes-commandes">
            Mes commandes
          </Link>

        </nav>

      </header>


      {/* ============================================== */}
      {/* CONTENU */}
      {/* ============================================== */}

      <section className="contenu">

        <Routes>

          {/* ========================================== */}
          {/* PAGE D'ACCUEIL */}
          {/* ========================================== */}

          <Route
            path="/"
            element={
              <div>

                <h2>
                  Bienvenue sur SmartDelivery Sénégal
                </h2>

                <p>
                  Gérez et suivez vos livraisons
                  simplement.
                </p>

              </div>
            }
          />


          {/* ========================================== */}
          {/* COMMANDES DU CLIENT */}
          {/* ========================================== */}

          <Route
            path="/mes-commandes"
            element={<MesCommandes />}
          />


          {/* ========================================== */}
          {/* SUIVI D'UNE COMMANDE */}
          {/* ========================================== */}

          <Route
            path="/suivi/:commandeId"
            element={<CarteSuivi />}
          />

        </Routes>

      </section>

    </main>
  );
}

export default App;