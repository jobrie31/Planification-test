// src/App.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { APP_ID, auth, db } from "./firebase";
import PagePlanification from "./pages/PagePlanification";
import PageLogin from "./pages/PageLogin";
import PageReglages from "./pages/PageReglages";
import "./App.css";

const ADMIN_EMAILS = ["jobrie31@hotmail.com"];

function App() {
  const [user, setUser] = useState(null);
  const [profilApp, setProfilApp] = useState(null);
  const [chargementAuth, setChargementAuth] = useState(true);
  const [chargementAcces, setChargementAcces] = useState(false);
  const [page, setPage] = useState("planification");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfilApp(null);

      if (!firebaseUser) {
        setPage("planification");
        setChargementAuth(false);
        return;
      }

      setChargementAuth(false);
      setChargementAcces(true);

      try {
        const profilRef = doc(db, "apps", APP_ID, "users", firebaseUser.uid);
        const profilSnap = await getDoc(profilRef);

        if (profilSnap.exists()) {
          setProfilApp({
            id: profilSnap.id,
            ...profilSnap.data(),
          });
        } else {
          setProfilApp(null);
        }
      } catch (error) {
        console.error("Erreur vérification accès app :", error);
        setProfilApp(null);
      } finally {
        setChargementAcces(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const deconnecter = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfilApp(null);
      setPage("planification");
    } catch (error) {
      console.error("Erreur déconnexion :", error);
      alert("Erreur lors de la déconnexion.");
    }
  };

  const isMasterAdmin = user?.email
    ? ADMIN_EMAILS.includes(user.email.toLowerCase())
    : false;

  const aAccesPlanification =
    isMasterAdmin ||
    (profilApp?.actif === true && profilApp?.apps?.[APP_ID] === true);

  const isAdmin =
    isMasterAdmin ||
    (aAccesPlanification && profilApp?.role === "admin");

  if (chargementAuth || chargementAcces) {
    return (
      <div className="page-loading">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <PageLogin />;
  }

  if (!aAccesPlanification) {
    return (
      <div className="page-refus">
        <div className="refus-card">
          <h1>Accès refusé</h1>
          <p>
            Ton compte est connecté, mais il n’est pas activé pour l’application{" "}
            <strong>Planification</strong>.
          </p>

          <p className="refus-note">
            Il faut qu’un admin crée une invitation pour cette application.
          </p>

          <button type="button" onClick={deconnecter}>
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="topbar">
        <div>
          <strong>Planification</strong>
          <span>{user.email}</span>
        </div>

        <div className="topbar-actions">
          <button type="button" onClick={() => setPage("planification")}>
            Planification
          </button>

          {isAdmin && (
            <button type="button" onClick={() => setPage("reglages")}>
              Réglages
            </button>
          )}

          <button type="button" onClick={deconnecter}>
            Déconnexion
          </button>
        </div>
      </header>

      {page === "planification" && <PagePlanification />}

      {page === "reglages" && isAdmin && (
        <PageReglages onRetour={() => setPage("planification")} />
      )}
    </div>
  );
}

export default App;