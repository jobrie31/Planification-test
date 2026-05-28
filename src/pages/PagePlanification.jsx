// src/pages/PagePlanification.jsx
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { APP_ID, db } from "../firebase";

function PagePlanification() {
  const [nomProjet, setNomProjet] = useState("");
  const [client, setClient] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [statut, setStatut] = useState("À planifier");
  const [projets, setProjets] = useState([]);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const projetsRef = collection(db, "apps", APP_ID, "projets");
    const q = query(projetsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liste = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setProjets(liste);
      },
      (error) => {
        console.error("Erreur lecture planification :", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const ajouterProjet = async (e) => {
    e.preventDefault();

    const nomNettoye = nomProjet.trim();
    const clientNettoye = client.trim();

    if (!nomNettoye) {
      alert("Entre un nom de projet.");
      return;
    }

    setChargement(true);

    try {
      await addDoc(collection(db, "apps", APP_ID, "projets"), {
        nom: nomNettoye,
        client: clientNettoye,
        dateDebut,
        dateFin,
        statut,
        appId: APP_ID,
        createdAt: serverTimestamp(),
      });

      setNomProjet("");
      setClient("");
      setDateDebut("");
      setDateFin("");
      setStatut("À planifier");
    } catch (error) {
      console.error("Erreur ajout projet :", error);
      alert("Erreur lors de l’ajout du projet.");
    } finally {
      setChargement(false);
    }
  };

  const supprimerProjet = async (projetId) => {
    const confirmation = window.confirm(
      "Veux-tu vraiment supprimer ce projet?"
    );

    if (!confirmation) return;

    try {
      await deleteDoc(doc(db, "apps", APP_ID, "projets", projetId));
    } catch (error) {
      console.error("Erreur suppression projet :", error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="page-planification">
      <div className="planification-card">
        <div className="planification-header">
          <h1>Planification</h1>
          <p>
            Cette application écrit dans{" "}
            <strong>/apps/{APP_ID}/projets</strong>
          </p>
        </div>

        <form className="planification-form" onSubmit={ajouterProjet}>
          <input
            type="text"
            placeholder="Nom du projet"
            value={nomProjet}
            onChange={(e) => setNomProjet(e.target.value)}
          />

          <input
            type="text"
            placeholder="Client / lieu"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />

          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />

          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />

          <select value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="À planifier">À planifier</option>
            <option value="Planifié">Planifié</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
          </select>

          <button type="submit" disabled={chargement}>
            {chargement ? "Ajout..." : "Ajouter"}
          </button>
        </form>

        <div className="planification-liste">
          <h2>Projets planifiés</h2>

          {projets.length === 0 ? (
            <p className="planification-vide">
              Aucun projet pour l’instant.
            </p>
          ) : (
            projets.map((projet) => (
              <div className="planification-projet" key={projet.id}>
                <div className="projet-info">
                  <strong>{projet.nom}</strong>

                  <p>
                    Client / lieu :{" "}
                    <span>{projet.client || "Non défini"}</span>
                  </p>

                  <p>
                    Dates :{" "}
                    <span>
                      {projet.dateDebut || "?"} au {projet.dateFin || "?"}
                    </span>
                  </p>

                  <p>
                    Statut : <span>{projet.statut || "À planifier"}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-supprimer"
                  onClick={() => supprimerProjet(projet.id)}
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PagePlanification;