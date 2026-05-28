// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCQ91hqjTeWLFLVJTh4J4Ncm5Cg7_4x3Ps",
  authDomain: "test-36f40.firebaseapp.com",
  projectId: "test-36f40",
  storageBucket: "test-36f40.firebasestorage.app",
  messagingSenderId: "1049642913690",
  appId: "1:1049642913690:web:7100b90c1891dda4ebb423",
  measurementId: "G-3KK6825BM7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Région Montréal pour tes Cloud Functions
export const functions = getFunctions(app, "northamerica-northeast1");

// Identifiant de CETTE app VS Code / Hosting
export const APP_ID = "planification";