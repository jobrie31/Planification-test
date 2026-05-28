// src/pages/PageLogin.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";

function PageLogin() {
  const [modeActivation, setModeActivation] = useState(false);
  const [etapeActivation, setEtapeActivation] = useState(1);

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [codeActivation, setCodeActivation] = useState("");
  const [compteDejaExistant, setCompteDejaExistant] = useState(false);
  const [firstAppName, setFirstAppName] = useState("");
  const [activationTerminee, setActivationTerminee] = useState(false);
  const [messageActivation, setMessageActivation] = useState("");
  const [chargement, setChargement] = useState(false);

  const connecter = async (e) => {
    e.preventDefault();

    if (!email.trim() || !motDePasse.trim()) {
      alert("Entre ton email et ton mot de passe.");
      return;
    }

    setChargement(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        motDePasse
      );
    } catch (error) {
      console.error("Erreur login :", error);
      alert("Email ou mot de passe invalide.");
    } finally {
      setChargement(false);
    }
  };

  const verifierEmailActivation = async (e) => {
    e.preventDefault();

    const emailNettoye = email.trim().toLowerCase();

    if (!emailNettoye) {
      alert("Entre ton email.");
      return;
    }

    setChargement(true);

    try {
      const planificationCheckActivationEmail = httpsCallable(
        functions,
        "planificationCheckActivationEmail"
      );

      const result = await planificationCheckActivationEmail({
        email: emailNettoye,
      });

      setCompteDejaExistant(result.data?.compteDejaExistant === true);
      setFirstAppName(result.data?.firstAppName || "");
      setEtapeActivation(2);
    } catch (error) {
      console.error("Erreur vérification email activation :", error);

      const message =
        error?.message || "Erreur lors de la vérification de l’email.";

      alert(message);
    } finally {
      setChargement(false);
    }
  };

  const activerCompte = async (e) => {
    e.preventDefault();

    const emailNettoye = email.trim().toLowerCase();
    const codeNettoye = codeActivation.trim();

    if (!emailNettoye || !codeNettoye) {
      alert("Entre ton email et ton code d’activation.");
      return;
    }

    if (!compteDejaExistant && motDePasse.length < 6) {
      alert("Le mot de passe doit avoir au moins 6 caractères.");
      return;
    }

    setChargement(true);

    try {
      const planificationActivateInvitation = httpsCallable(
        functions,
        "planificationActivateInvitation"
      );

      const result = await planificationActivateInvitation({
        email: emailNettoye,
        codeActivation: codeNettoye,
        password: compteDejaExistant ? "" : motDePasse,
      });

      const dejaExistant = result.data?.compteDejaExistant === true;
      const appOrigine = result.data?.firstAppName || firstAppName;

      if (dejaExistant) {
        setActivationTerminee(true);
        setMessageActivation(
          `Ton accès à Planification est activé. Utilise le même mot de passe que dans l’application ${appOrigine}.`
        );
        return;
      }

      await signInWithEmailAndPassword(auth, emailNettoye, motDePasse);
    } catch (error) {
      console.error("Erreur activation :", error);

      const message = error?.message || "Erreur lors de l’activation du compte.";

      alert(message);
    } finally {
      setChargement(false);
    }
  };

  const ouvrirActivation = () => {
    setModeActivation(true);
    setEtapeActivation(1);
    setMotDePasse("");
    setCodeActivation("");
    setCompteDejaExistant(false);
    setFirstAppName("");
    setActivationTerminee(false);
    setMessageActivation("");
  };

  const retourConnexion = () => {
    setModeActivation(false);
    setEtapeActivation(1);
    setMotDePasse("");
    setCodeActivation("");
    setCompteDejaExistant(false);
    setFirstAppName("");
    setActivationTerminee(false);
    setMessageActivation("");
  };

  return (
    <div className="page-login">
      <div className="login-card">
        {!modeActivation ? (
          <>
            <h1>Connexion</h1>
            <p>Connecte-toi pour accéder à l’application Planification.</p>

            <form onSubmit={connecter} className="login-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Mot de passe"
                value={motDePasse}
                autoComplete="current-password"
                onChange={(e) => setMotDePasse(e.target.value)}
              />

              <button type="submit" disabled={chargement}>
                {chargement ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="login-separator">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="btn-mode-activation"
              onClick={ouvrirActivation}
            >
              Activer mon compte
            </button>
          </>
        ) : (
          <>
            {activationTerminee ? (
              <>
                <h1>Compte activé</h1>
                <p>{messageActivation}</p>

                <button
                  type="button"
                  className="btn-retour-login"
                  onClick={retourConnexion}
                >
                  Retour à la connexion
                </button>
              </>
            ) : (
              <>
                <h1>Activation</h1>

                {etapeActivation === 1 ? (
                  <>
                    <p>Entre ton email pour commencer l’activation.</p>

                    <form
                      onSubmit={verifierEmailActivation}
                      className="login-form"
                    >
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                      />

                      <button type="submit" disabled={chargement}>
                        {chargement ? "Vérification..." : "Continuer"}
                      </button>
                    </form>

                    <button
                      type="button"
                      className="btn-retour-login"
                      onClick={retourConnexion}
                    >
                      ← Retour à la connexion
                    </button>
                  </>
                ) : (
                  <>
                    {compteDejaExistant ? (
                      <p>
                        Ton compte existe déjà. Ton mot de passe est le même
                        que dans l’application{" "}
                        <strong>{firstAppName || "déjà activée"}</strong>.
                        Entre seulement ton code d’activation pour ajouter
                        l’accès à Planification.
                      </p>
                    ) : (
                      <p>
                        Entre ton code d’activation et choisis ton mot de
                        passe.
                      </p>
                    )}

                    <form onSubmit={activerCompte} className="login-form">
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        autoComplete="email"
                        disabled
                        onChange={(e) => setEmail(e.target.value)}
                      />

                      <input
                        type="text"
                        placeholder="Code d’activation"
                        value={codeActivation}
                        autoComplete="off"
                        onChange={(e) => setCodeActivation(e.target.value)}
                      />

                      {!compteDejaExistant && (
                        <input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={motDePasse}
                          autoComplete="new-password"
                          onChange={(e) => setMotDePasse(e.target.value)}
                        />
                      )}

                      <button type="submit" disabled={chargement}>
                        {chargement ? "Activation..." : "Activer mon compte"}
                      </button>
                    </form>

                    <button
                      type="button"
                      className="btn-retour-login"
                      onClick={() => {
                        setEtapeActivation(1);
                        setCodeActivation("");
                        setMotDePasse("");
                      }}
                    >
                      ← Modifier l’email
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PageLogin;