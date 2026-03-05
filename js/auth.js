// =========================================
// auth.js (index.html)
// - Maneja login y registro.
// - Guarda el perfil en Firestore: users/{uid}
// =========================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Referencias a la UI
const msg = document.getElementById("msg");

// Secciones
const welcomeSection = document.getElementById("welcomeSection");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

// Botones de navegación
const goLoginBtn = document.getElementById("goLoginBtn");
const goRegisterBtn = document.getElementById("goRegisterBtn");
const backFromLoginBtn = document.getElementById("backFromLoginBtn");
const backFromRegisterBtn = document.getElementById("backFromRegisterBtn");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");

const registerForm = document.getElementById("registerForm");
const regEmail = document.getElementById("regEmail");
const regPass = document.getElementById("regPass");
const regGender = document.getElementById("regGender");
const regBirth = document.getElementById("regBirth");
const regLevel = document.getElementById("regLevel");

// Esto lo hago para mostrar mensajes grandes y claros
function showMessage(text, type = "") {
  msg.textContent = text;
  msg.className = "msg " + type; // ok / err / etc.
}

// Función para cambiar de sección
function showSection(section) {
  welcomeSection.style.display = "none";
  loginSection.style.display = "none";
  registerSection.style.display = "none";
  section.style.display = "block";
  showMessage(""); // Limpiar mensaje
}

// Event listeners para navegación
goLoginBtn.addEventListener("click", () => showSection(loginSection));
goRegisterBtn.addEventListener("click", () => showSection(registerSection));
backFromLoginBtn.addEventListener("click", () => showSection(welcomeSection));
backFromRegisterBtn.addEventListener("click", () => showSection(welcomeSection));

// Si ya estoy logueada, no tiene sentido quedarme en index
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "./profile.html";
  }
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Entrando...", "");

  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPass.value);
    showMessage("✅ Sesión iniciada. Entrando al perfil...", "ok");

    // Pequeño delay para que el usuario lea el mensaje
    setTimeout(() => {
      window.location.href = "./profile.html";
    }, 500);
  } catch (err) {
    // Mensajes simples (los códigos de Firebase a veces son raros, lo simplifico)
    showMessage("❌ No se pudo iniciar sesión. Revisa el email y la contraseña.", "err");
    console.error(err);
  }
});

// REGISTRO
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Creando cuenta...", "");

  // Esto lo guardo porque luego lo necesito para el documento de usuario
  const email = regEmail.value.trim();
  const pass = regPass.value;
  const gender = regGender.value;
  const birth = regBirth.value;  // YYYY-MM-DD (string)
  const level = regLevel.value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Aquí guardo el perfil en Firestore (users/{uid})
    const userRef = doc(db, "users", cred.user.uid);
    await setDoc(userRef, {
      email,
      gender,
      birth,
      level,
      createdAt: serverTimestamp()
    });

    console.log("✅ Usuario creado:", cred.user.uid);
    console.log("✅ Perfil guardado en Firestore");

    showMessage("✅ Cuenta creada. Entrando al perfil...", "ok");
    setTimeout(() => {
      window.location.href = "./profile.html";
    }, 600);
  } catch (err) {
    console.error("❌ Error en registro:", err.code, err.message);
    showMessage("❌ No se pudo crear la cuenta. Puede que el email ya exista o la contraseña sea corta.", "err");
  }
});