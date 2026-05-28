// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

setGlobalOptions({
  region: "northamerica-northeast1",
  maxInstances: 10,
});

admin.initializeApp();

const db = admin.firestore();

const APP_ID = "planification";
const APP_NAME = "Planification";
const ADMIN_EMAILS = ["jobrie31@hotmail.com"];

const CALLABLE_OPTIONS = {
  region: "northamerica-northeast1",
  cors: true,
  invoker: "public",
};

const APP_NAMES = {
  inventaire: "Inventaire",
  planification: "Planification",
  facturation: "Facturation",
};

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function generateInvitationId(email) {
  return normalizeEmail(email)
    .replaceAll(".", "_dot_")
    .replaceAll("@", "_at_");
}

function appRoot() {
  return db.collection("apps").doc(APP_ID);
}

function globalUserRef(uid) {
  return db.collection("globalUsers").doc(uid);
}

function assertAdmin(request) {
  const email = normalizeEmail(request.auth?.token?.email);

  if (!request.auth || !ADMIN_EMAILS.includes(email)) {
    throw new HttpsError(
      "permission-denied",
      "Tu dois être admin pour faire cette action."
    );
  }
}

async function getUserByEmailOrNull(email) {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }

    console.error("Erreur getUserByEmail:", error);
    throw new HttpsError(
      "internal",
      "Erreur lors de la vérification du compte."
    );
  }
}

async function getFirstAppNameForUser(uid) {
  const globalSnap = await globalUserRef(uid).get();

  if (globalSnap.exists) {
    const data = globalSnap.data();
    const firstAppId = data?.firstAppId || "";
    return data?.firstAppName || APP_NAMES[firstAppId] || firstAppId || "une autre application";
  }

  // Fallback pour les comptes déjà créés avant globalUsers
  const knownApps = ["inventaire", "planification", "facturation"];

  for (const appId of knownApps) {
    const appUserSnap = await db
      .collection("apps")
      .doc(appId)
      .collection("users")
      .doc(uid)
      .get();

    if (appUserSnap.exists && appUserSnap.data()?.actif === true) {
      return APP_NAMES[appId] || appId;
    }
  }

  return "une autre application";
}

exports.planificationCreateInvitation = onCall(
  CALLABLE_OPTIONS,
  async (request) => {
    assertAdmin(request);

    const email = normalizeEmail(request.data?.email);
    const codeActivation = String(request.data?.codeActivation || "").trim();
    const role = String(request.data?.role || "employe").trim();

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Email invalide.");
    }

    if (codeActivation.length < 4) {
      throw new HttpsError(
        "invalid-argument",
        "Le code d’activation doit avoir au moins 4 caractères."
      );
    }

    const existingUser = await getUserByEmailOrNull(email);

    if (existingUser) {
      const existingAppUserRef = appRoot()
        .collection("users")
        .doc(existingUser.uid);

      const existingAppUserSnap = await existingAppUserRef.get();

      if (
        existingAppUserSnap.exists &&
        existingAppUserSnap.data()?.actif === true
      ) {
        throw new HttpsError(
          "already-exists",
          "Ce compte a déjà accès à cette application."
        );
      }
    }

    const invitationId = generateInvitationId(email);
    const invitationRef = appRoot()
      .collection("invitations")
      .doc(invitationId);

    const invitationSnap = await invitationRef.get();

    if (invitationSnap.exists && invitationSnap.data()?.utilise === false) {
      throw new HttpsError(
        "already-exists",
        "Une invitation active existe déjà pour cet email."
      );
    }

    await invitationRef.set({
      email,
      codeHash: sha256(codeActivation),
      role,
      appId: APP_ID,
      appName: APP_NAME,
      apps: {
        [APP_ID]: true,
      },
      utilise: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      createdByEmail: normalizeEmail(request.auth.token.email),
    });

    return {
      ok: true,
      message: "Invitation créée.",
      path: `/apps/${APP_ID}/invitations/${invitationId}`,
    };
  }
);

exports.planificationCheckActivationEmail = onCall(
  CALLABLE_OPTIONS,
  async (request) => {
    const email = normalizeEmail(request.data?.email);

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Email invalide.");
    }

    const invitationId = generateInvitationId(email);
    const invitationRef = appRoot()
      .collection("invitations")
      .doc(invitationId);

    const invitationSnap = await invitationRef.get();

    if (!invitationSnap.exists) {
      throw new HttpsError(
        "not-found",
        "Aucune invitation trouvée pour cet email."
      );
    }

    const invitation = invitationSnap.data();

    if (invitation.utilise === true) {
      throw new HttpsError(
        "failed-precondition",
        "Cette invitation est déjà utilisée."
      );
    }

    if (invitation.email !== email) {
      throw new HttpsError("permission-denied", "Email invalide.");
    }

    const existingUser = await getUserByEmailOrNull(email);

    if (!existingUser) {
      return {
        ok: true,
        email,
        compteDejaExistant: false,
        firstAppName: null,
      };
    }

    const existingAppUserSnap = await appRoot()
      .collection("users")
      .doc(existingUser.uid)
      .get();

    if (
      existingAppUserSnap.exists &&
      existingAppUserSnap.data()?.actif === true
    ) {
      throw new HttpsError(
        "already-exists",
        "Ce compte a déjà accès à cette application."
      );
    }

    const firstAppName = await getFirstAppNameForUser(existingUser.uid);

    return {
      ok: true,
      email,
      compteDejaExistant: true,
      firstAppName,
    };
  }
);

exports.planificationActivateInvitation = onCall(
  CALLABLE_OPTIONS,
  async (request) => {
    const email = normalizeEmail(request.data?.email);
    const codeActivation = String(request.data?.codeActivation || "").trim();
    const password = String(request.data?.password || "");

    if (!email || !email.includes("@")) {
      throw new HttpsError("invalid-argument", "Email invalide.");
    }

    if (codeActivation.length < 4) {
      throw new HttpsError("invalid-argument", "Code d’activation invalide.");
    }

    const invitationId = generateInvitationId(email);
    const invitationRef = appRoot()
      .collection("invitations")
      .doc(invitationId);

    const invitationSnap = await invitationRef.get();

    if (!invitationSnap.exists) {
      throw new HttpsError("not-found", "Aucune invitation trouvée.");
    }

    const invitation = invitationSnap.data();

    if (invitation.utilise === true) {
      throw new HttpsError(
        "failed-precondition",
        "Cette invitation est déjà utilisée."
      );
    }

    if (invitation.email !== email) {
      throw new HttpsError("permission-denied", "Email invalide.");
    }

    if (invitation.codeHash !== sha256(codeActivation)) {
      throw new HttpsError("permission-denied", "Code d’activation invalide.");
    }

    let userRecord = await getUserByEmailOrNull(email);
    let compteDejaExistant = false;
    let firstAppName = null;

    if (userRecord) {
      compteDejaExistant = true;
      firstAppName = await getFirstAppNameForUser(userRecord.uid);
    } else {
      if (password.length < 6) {
        throw new HttpsError(
          "invalid-argument",
          "Le mot de passe doit avoir au moins 6 caractères."
        );
      }

      try {
        userRecord = await admin.auth().createUser({
          email,
          password,
          emailVerified: false,
          disabled: false,
        });
      } catch (error) {
        console.error("Erreur createUser:", error);
        throw new HttpsError(
          "internal",
          "Erreur lors de la création du compte."
        );
      }

      firstAppName = APP_NAME;

      await globalUserRef(userRecord.uid).set(
        {
          uid: userRecord.uid,
          email,
          firstAppId: APP_ID,
          firstAppName: APP_NAME,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const userAppRef = appRoot().collection("users").doc(userRecord.uid);
    const userAppSnap = await userAppRef.get();

    if (userAppSnap.exists && userAppSnap.data()?.actif === true) {
      throw new HttpsError(
        "already-exists",
        "Ce compte a déjà accès à cette application."
      );
    }

    await userAppRef.set(
      {
        uid: userRecord.uid,
        email,
        role: invitation.role || "employe",
        appId: APP_ID,
        appName: APP_NAME,
        apps: invitation.apps || {
          [APP_ID]: true,
        },
        actif: true,
        compteDejaExistant,
        firstAppName,
        createdAt: userAppSnap.exists
          ? userAppSnap.data().createdAt ||
            admin.firestore.FieldValue.serverTimestamp()
          : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await globalUserRef(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        apps: {
          [APP_ID]: true,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await invitationRef.update({
      utilise: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedByUid: userRecord.uid,
      compteDejaExistant,
      firstAppName,
    });

    return {
      ok: true,
      message: compteDejaExistant
        ? `Accès ajouté à ${APP_NAME}. Utilise le même mot de passe que dans ${firstAppName}.`
        : "Compte créé et activé.",
      email,
      uid: userRecord.uid,
      compteDejaExistant,
      firstAppName,
      path: `/apps/${APP_ID}/users/${userRecord.uid}`,
    };
  }
);