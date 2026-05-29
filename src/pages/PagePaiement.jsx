// src/pages/PagePaiement.jsx

const LIEN_STRIPE_PLANIFICATION =
  "https://buy.stripe.com/test_9B66oJ77o7d37gY79W0sU00";

function PagePaiement() {
  const ouvrirStripe = () => {
    window.open(LIEN_STRIPE_PLANIFICATION, "_blank", "noopener,noreferrer");
  };

  const ouvrirSiteStripe = () => {
    window.open("https://stripe.com", "_blank", "noopener,noreferrer");
  };

  const styles = {
    page: {
      minHeight: "calc(100vh - 72px)",
      background: "#f6f8fb",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "46px 16px 32px",
      boxSizing: "border-box",
    },

    card: {
      width: "100%",
      maxWidth: "520px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "20px",
      padding: "0",
      boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
      boxSizing: "border-box",
      overflow: "hidden",
    },

    stripeHeader: {
      background: "#635bff",
      padding: "20px 24px",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
    },

    stripeLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },

    stripeLogo: {
      fontSize: "1.6rem",
      fontWeight: 900,
      letterSpacing: "-0.05em",
      lineHeight: 1,
    },

    stripeSite: {
      background: "transparent",
      border: "none",
      padding: 0,
      margin: 0,
      color: "rgba(255, 255, 255, 0.88)",
      fontSize: "0.82rem",
      fontWeight: 700,
      lineHeight: 1.1,
      textAlign: "left",
      cursor: "pointer",
      width: "fit-content",
    },

    stripeBadge: {
      padding: "7px 10px",
      borderRadius: "999px",
      background: "rgba(255, 255, 255, 0.16)",
      border: "1px solid rgba(255, 255, 255, 0.22)",
      fontSize: "0.75rem",
      fontWeight: 800,
      whiteSpace: "nowrap",
    },

    content: {
      padding: "34px",
      boxSizing: "border-box",
      textAlign: "center",
    },

    badge: {
      display: "inline-block",
      marginBottom: "18px",
      padding: "6px 11px",
      borderRadius: "999px",
      background: "#f0efff",
      color: "#635bff",
      fontSize: "0.78rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    },

    topLine: {
      width: "48px",
      height: "4px",
      borderRadius: "999px",
      background: "#635bff",
      margin: "0 auto 24px",
    },

    appLabel: {
      margin: "0 0 10px",
      color: "#64748b",
      fontSize: "0.9rem",
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },

    title: {
      margin: "0 0 50px",
      color: "#0f172a",
      fontSize: "2rem",
      lineHeight: 1.1,
      letterSpacing: "-0.04em",
    },

    button: {
      width: "100%",
      border: "none",
      borderRadius: "14px",
      padding: "15px 18px",
      background: "#635bff",
      color: "#ffffff",
      fontSize: "1rem",
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 24px rgba(99, 91, 255, 0.24)",
    },

    note: {
      margin: "14px 0 0",
      color: "#94a3b8",
      fontSize: "0.82rem",
      lineHeight: 1.4,
      textAlign: "center",
    },

    mobileStyle: `
      @media (max-width: 520px) {
        .paiement-page {
          padding-top: 24px !important;
        }

        .paiement-content {
          padding: 26px 20px !important;
        }

        .paiement-title {
          font-size: 1.65rem !important;
          margin-bottom: 42px !important;
        }

        .stripe-header {
          padding: 18px 20px !important;
        }

        .stripe-logo {
          font-size: 1.45rem !important;
        }

        .stripe-site {
          font-size: 0.76rem !important;
        }

        .stripe-badge {
          font-size: 0.68rem !important;
          padding: 6px 8px !important;
        }
      }
    `,
  };

  return (
    <main className="paiement-page" style={styles.page}>
      <style>{styles.mobileStyle}</style>

      <section style={styles.card}>
        <div className="stripe-header" style={styles.stripeHeader}>
          <div style={styles.stripeLeft}>
            <div className="stripe-logo" style={styles.stripeLogo}>
              stripe
            </div>

            <button
              type="button"
              className="stripe-site"
              style={styles.stripeSite}
              onClick={ouvrirSiteStripe}
            >
              stripe.com
            </button>
          </div>

          <div className="stripe-badge" style={styles.stripeBadge}>
            Paiement en ligne sécurisé
          </div>
        </div>

        <div className="paiement-content" style={styles.content}>
          <div style={styles.badge}>Abonnement</div>

          <div style={styles.topLine}></div>

          <p style={styles.appLabel}>Application</p>

          <h1 className="paiement-title" style={styles.title}>
            Planification
          </h1>

          <button type="button" style={styles.button} onClick={ouvrirStripe}>
            Continuer vers Stripe
          </button>

          <p style={styles.note}>
            Vous serez redirigé vers Stripe afin de compléter le paiement de
            façon sécurisée.
          </p>
        </div>
      </section>
    </main>
  );
}

export default PagePaiement;