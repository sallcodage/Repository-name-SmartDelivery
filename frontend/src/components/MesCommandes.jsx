import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const navigate = useNavigate();

  // ====================================================
  // RECUPERER LES COMMANDES DU CLIENT
  // ====================================================
  useEffect(() => {
    const recupererCommandes = async () => {
      try {
        setErreur("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Aucun token trouvé. Veuillez vous connecter."
          );
        }

        const response = await fetch(
          "http://localhost:5000/api/commandes/mes-commandes",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const resultat = await response.json();

        if (!response.ok) {
          throw new Error(
            resultat.message ||
              "Impossible de récupérer vos commandes."
          );
        }

        setCommandes(
          resultat.data?.commandes || []
        );

      } catch (error) {
        console.error(
          "Erreur récupération commandes :",
          error
        );

        setErreur(error.message);

      } finally {
        setChargement(false);
      }
    };

    recupererCommandes();

  }, []);


  // ====================================================
  // OUVRIR LE SUIVI D'UNE COMMANDE
  // ====================================================
  const suivreLivraison = (commandeId) => {
    navigate(`/suivi/${commandeId}`);
  };


  // ====================================================
  // CHARGEMENT
  // ====================================================
  if (chargement) {
    return (
      <div>
        <h2>Mes commandes</h2>

        <p>
          Chargement de vos commandes...
        </p>
      </div>
    );
  }


  // ====================================================
  // ERREUR
  // ====================================================
  if (erreur) {
    return (
      <div>
        <h2>Mes commandes</h2>

        <p>{erreur}</p>
      </div>
    );
  }


  // ====================================================
  // AUCUNE COMMANDE
  // ====================================================
  if (commandes.length === 0) {
    return (
      <div>
        <h2>Mes commandes</h2>

        <p>
          Vous n'avez aucune commande pour le moment.
        </p>
      </div>
    );
  }


  // ====================================================
  // AFFICHAGE DES COMMANDES
  // ====================================================
  return (
    <div>

      <h2>Mes commandes</h2>

      <p>
        Retrouvez ici toutes vos commandes.
      </p>


      <div
        style={{
          display: "grid",
          gap: "20px",
          marginTop: "25px",
        }}
      >

        {commandes.map((commande) => (

          <div
            key={commande.id}
            style={{
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >

            <p>
              <strong>Départ :</strong>{" "}
              {commande.adresse_depart}
            </p>

            <p>
              <strong>Destination :</strong>{" "}
              {commande.adresse_arrivee}
            </p>

            <p>
              <strong>Montant :</strong>{" "}
              {Number(
                commande.montant || 0
              ).toLocaleString("fr-FR")} FCFA
            </p>

            <p>
              <strong>Statut :</strong>{" "}
              {commande.statut}
            </p>


            {/* ======================================== */}
            {/* BOUTON SUIVI */}
            {/* ======================================== */}

            {[
              "LIVREUR_AFFECTE",
              "ACCEPTEE",
              "EN_COURS",
              "LIVREE",
              "CONFIRMEE",
            ].includes(commande.statut) && (

              <button
                type="button"
                onClick={() =>
                  suivreLivraison(commande.id)
                }
                style={{
                  marginTop: "10px",
                  padding: "10px 18px",
                  cursor: "pointer",
                }}
              >
                Suivre la livraison
              </button>

            )}

          </div>

        ))}

      </div>

    </div>
  );
}

export default MesCommandes;