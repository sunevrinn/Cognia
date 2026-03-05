// =========================================
// firebase.js
// - Aquí centralizo Firebase para no repetirlo.
// - OJO: tienes que pegar tu firebaseConfig real.
// - Uso SDK modular por CDN (funciona en hosting estático).
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Se pega la configuración de Firebase de la web
const firebaseConfig = {
  apiKey: "AIzaSyDXZx_5z1uL_hyqUcci7JhugIuMjn1fuFk",
  authDomain: "cognia-4241e.firebaseapp.com",
  projectId: "cognia-4241e",
  storageBucket: "cognia-4241e.firebasestorage.app",
  messagingSenderId: "290599076501",
  appId: "1:290599076501:web:5b347d5651ea3f7158d19c",
  measurementId: "G-LBJW595WGR"
};

// Para arrancar Firebase en la web
export const app = initializeApp(firebaseConfig);

// Auth para login/registro
export const auth = getAuth(app);

// Firestore para guardar perfiles, tests y resultados
export const db = getFirestore(app);