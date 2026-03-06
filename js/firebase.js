// =========================================
// firebase.js
// - Aquí centralizo Firebase para no repetirlo.
// - Uso SDK modular por CDN (funciona en hosting estático).
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDXZx_5z1uL_hyqUcci7JhugIuMjn1fuFk",
  authDomain: "cognia-4241e.firebaseapp.com",
  projectId: "cognia-4241e",
  storageBucket: "cognia-4241e.firebasestorage.app",
  messagingSenderId: "290599076501",
  appId: "1:290599076501:web:5b347d5651ea3f7158d19c",
  measurementId: "G-LBJW595WGR"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);