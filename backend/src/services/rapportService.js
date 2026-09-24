const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Génère un rapport SmartDelivery au format PDF.
 *
 * @param {Object} rapport Informations du rapport
 * @param {Object} statistiques Statistiques à afficher
 * @returns {Promise<Object>} Informations sur le PDF généré
 */
const genererRapportPDF = (rapport, statistiques = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // ==================================================
      // DOSSIER DES RAPPORTS
      // ==================================================
      const dossierRapports = path.join(
        __dirname,
        "../../rapports"
      );

      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(dossierRapports)) {
        fs.mkdirSync(dossierRapports, {
          recursive: true,
        });
      }

      // ==================================================
      // NOM DU FICHIER
      // ==================================================
      const dateDebut = rapport.periode_debut
        ? new Date(rapport.periode_debut)
            .toISOString()
            .split("T")[0]
        : "debut";

      const dateFin = rapport.periode_fin
        ? new Date(rapport.periode_fin)
            .toISOString()
            .split("T")[0]
        : "fin";

      const nomFichier =
        `rapport_${rapport.type}_${dateDebut}_${dateFin}_${rapport.id}.pdf`;

      const cheminFichier = path.join(
        dossierRapports,
        nomFichier
      );

      // ==================================================
      // CREATION DU DOCUMENT PDF
      // ==================================================
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const stream = fs.createWriteStream(
        cheminFichier
      );

      doc.pipe(stream);

      // ==================================================
      // TITRE
      // ==================================================
      doc
        .fontSize(22)
        .text(
          "SmartDelivery Sénégal",
          {
            align: "center",
          }
        );

      doc.moveDown(0.5);

      doc
        .fontSize(16)
        .text(
          "Rapport de performance des livraisons",
          {
            align: "center",
          }
        );

      doc.moveDown(2);

      // ==================================================
      // INFORMATIONS DU RAPPORT
      // ==================================================
      doc
        .fontSize(14)
        .text("Informations du rapport");

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(
          `Type : ${rapport.type || "Non renseigné"}`
        );

      doc.text(
        `Période : ${dateDebut} au ${dateFin}`
      );

      doc.text(
        `Date de génération : ${new Date().toLocaleString(
          "fr-FR"
        )}`
      );

      doc.moveDown(2);

      // ==================================================
      // STATISTIQUES
      // ==================================================
      doc
        .fontSize(14)
        .text("Indicateurs de performance");

      doc.moveDown();

      doc
        .fontSize(11)
        .text(
          `Nombre total de commandes : ${
            statistiques.total_commandes ?? 0
          }`
        );

      doc.text(
        `Commandes confirmées : ${
          statistiques.commandes_confirmees ??
          statistiques.confirmees ??
          0
        }`
      );

      doc.text(
        `Commandes annulées : ${
          statistiques.commandes_annulees ??
          statistiques.annulees ??
          0
        }`
      );

      doc.text(
        `Livraisons en cours : ${
          statistiques.livraisons_en_cours ?? 0
        }`
      );

      doc.text(
        `Nombre de livreurs : ${
          statistiques.total_livreurs ?? 0
        }`
      );

      doc.text(
        `Livreurs disponibles : ${
          statistiques.livreurs_disponibles ?? 0
        }`
      );

      const chiffreAffaires = Number(
        statistiques.chiffre_affaires || 0
      );

      doc.text(
        `Chiffre d'affaires : ${chiffreAffaires.toLocaleString(
          "fr-FR"
        )} FCFA`
      );

      doc.text(
        `Taux de réussite : ${
          statistiques.taux_reussite ?? 0
        } %`
      );

      doc.moveDown(3);

      // ==================================================
      // PIED DE PAGE
      // ==================================================
      doc
        .fontSize(9)
        .text(
          "Document généré automatiquement par SmartDelivery Sénégal.",
          {
            align: "center",
          }
        );

      // ==================================================
      // TERMINER LE PDF
      // ==================================================
      doc.end();

      stream.on("finish", () => {
        resolve({
          nomFichier,
          cheminFichier,

          // URL que nous enregistrerons dans PostgreSQL
          fichierUrl: `/rapports/${nomFichier}`,
        });
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  genererRapportPDF,
};