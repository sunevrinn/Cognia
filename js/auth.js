// =========================================
// auth.js (index.html)
// - Registro: Auth -> Firestore users/{uid} -> verificar -> redirigir
// - Login: Auth -> redirigir
// =========================================

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// UI
const msg = document.getElementById("msg");

// Secciones
const welcomeSection = document.getElementById("welcomeSection");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

// Botones
document.getElementById("goLoginBtn").addEventListener("click", () => showSection(loginSection));
document.getElementById("goRegisterBtn").addEventListener("click", () => showSection(registerSection));
document.getElementById("backFromLoginBtn").addEventListener("click", () => showSection(welcomeSection));
document.getElementById("backFromRegisterBtn").addEventListener("click", () => showSection(welcomeSection));

// Login refs
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");

// Register refs
const registerForm = document.getElementById("registerForm");
const regEmail = document.getElementById("regEmail");
const regName = document.getElementById("regName");
const regPass = document.getElementById("regPass");
const regGender = document.getElementById("regGender");
const regBirth = document.getElementById("regBirth");
const regLevel = document.getElementById("regLevel");

function showMessage(text, type = "") {
  msg.textContent = text;
  msg.className = "msg " + type;
}

function showSection(section) {
  welcomeSection.style.display = "none";
  loginSection.style.display = "none";
  registerSection.style.display = "none";
  section.style.display = "block";
  showMessage("");
}

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Entrando...", "");

  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPass.value);
    showMessage("✅ Sesión iniciada. Entrando al perfil...", "ok");
    window.location.href = "./profile.html";
  } catch (err) {
    console.error(err);
    showMessage("❌ No se pudo iniciar sesión.", "err");
  }
});

// REGISTRO
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Creando cuenta...", "");

  const email = regEmail.value.trim();
  const name = regName.value.trim();
  const pass = regPass.value;
  const gender = regGender.value;
  const birth = regBirth.value;
  const level = regLevel.value;

  console.log("🧾 Valores leídos del formulario:", { email, name, gender, birth, level });

  if (!email || !name || !pass || !gender || !birth || !level) {
    showMessage("❌ Revisa todos los campos.", "err");
    return;
  }

  try {
    // 1) Crear Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;
    console.log("✅ Auth creado UID:", uid);

    // 2) Guardar Firestore
    const userRef = doc(db, "users", uid);
    const profileData = { email, name, gender, birth, level, createdAt: serverTimestamp() };

    console.log("💾 Voy a guardar en Firestore:", profileData);
    await setDoc(userRef, profileData, { merge: true });

    // 3) Verificar inmediatamente
    const savedSnap = await getDoc(userRef);
    console.log("🔎 exists:", savedSnap.exists(), "data:", savedSnap.data());

    if (!savedSnap.exists()) {
      showMessage("❌ No se creó el documento en Firestore. Mira consola (F12).", "err");
      return;
    }

    // 4) Redirigir SOLO si existe
    showMessage("✅ Cuenta creada. Entrando al perfil...", "ok");
    window.location.href = "./profile.html";
  } catch (err) {
    console.error("❌ Registro error:", err);
    showMessage("❌ Error creando la cuenta.", "err");
  }
});