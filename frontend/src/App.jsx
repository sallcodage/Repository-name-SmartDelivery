import { Routes, Route } from "react-router-dom";
import CarteSuivi from "./components/CarteSuivi";
import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="header">
        <h1>SmartDelivery Sénégal</h1>
        <p>Suivi intelligent de vos livraisons</p>
      </header>

      <section className="contenu">
        <Routes>
          <Route
            path="/"
            element={
              <p>
                Bienvenue sur SmartDelivery Sénégal
              </p>
            }
          />

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