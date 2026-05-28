// src/pages/PageReglages.jsx
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

function PageReglages({ onRetour }) {
  const [email, setEmail] = useState("");
  const [codeActivation, setCodeActivation] = useState("");
  const [role, setRole] = useState("employe");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  const creerInvitation = async (e) => {
    e.preventDefault();

    const emailNettoye = email.trim().toLowerCase();
    const codeNettoye = codeActivation.trim();

    if (!emailNettoye || !codeNettoye) {
      alert("Entre un email et un code d’activation.");
      return;
    }

    if (codeNettoye.length < 4) {
      alert("Le code d’activation doit avoir au moins 4 caractères.");
      return;
    }

    setChargement(true);
    setMessage("");

    try {
      const planificationCreateInvitation = httpsCallable(
        functions,
        "planificationCreateInvitation"
      );

      await planificationCreateInvitation({
        email: emailNettoye,
        codeActivation: codeNettoye,
        role,
      });

      setMessage(`Invitation créée pour ${emailNettoye}.`);
      setEmail("");
      setCodeActivation("");
      setRole("employe");
    } catch (error) {
      console.error("Erreur création invitation :", error);

      const texte =
        error?.message || "Erreur lors de la création de l’invitation.";

      alert(texte);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="page-reglages">
      <div className="reglages-card">
        <div className="reglages-header">
          <button type="button" className="btn-retour" onClick={onRetour}>
            ← Retour
          </button>

          <div>
            <h1>Réglages</h1>
            <p>Créer une invitation pour activer un nouveau compte.</p>
          </div>
        </div>

        <form className="reglages-form" onSubmit={creerInvitation}>
          <label>
            Email de la personne
            <input
              type="email"
              placeholder="exemple@email.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Code d’activation
            <input
              type="text"
              placeholder="Ex: ABC123"
              value={codeActivation}
              autoComplete="off"
              onChange={(e) => setCodeActivation(e.target.value)}
            />
          </label>

          <label>
            Rôle
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="employe">Employé</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button type="submit" disabled={chargement}>
            {chargement ? "Création..." : "Créer l’invitation"}
          </button>
        </form>

        {message && <div className="message-succes">{message}</div>}

        <div className="reglages-info">
          <h2>Comment la personne active son compte?</h2>
          <ol>
            <li>Elle va sur la page de connexion.</li>
            <li>Elle clique sur « Activer mon compte ».</li>
            <li>
              Elle entre son email, son code d’activation et son mot de passe.
            </li>
            <li>
              Son compte est créé ou son accès est ajouté à Planification.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default PageReglages;