// =========================================
// profile.js (profile.html)
// - Lee el perfil del usuario (users/{uid})
// - Permite cambiar nivel
// - Lee resultados (results) y pinta gráfico con Chart.js
// =========================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// UI
const msg = document.getElementById("msg");
const userEmail = document.getElementById("userEmail");
const userGender = document.getElementById("userGender");
const userAge = document.getElementById("userAge");
const levelSelect = document.getElementById("levelSelect");
const saveLevelBtn = document.getElementById("saveLevelBtn");
const goTestBtn = document.getElementById("goTestBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Tabs
const tabButtons = document.querySelectorAll(".tab");
const canvas = document.getElementById("progressChart");

// Estado en memoria
let currentUser = null;
let profileData = null;
let resultsCache = []; // aquí guardo los resultados para no pedirlos mil veces
let currentTopic = "math";
let chartInstance = null;

// Mensajes
function showMessage(text, type = "") {
  msg.textContent = text;
  msg.className = "msg " + type;
}

// Calcular edad desde fecha YYYY-MM-DD
function calcAge(birthISO) {
  if (!birthISO) return "-";
  const birth = new Date(birthISO + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Leer perfil de Firestore
async function loadProfile(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      console.warn("Documento no existe, intentando crear uno vacío...");
      // Si no existe, creo un documento básico
      await setDoc(ref, {
        email: auth.currentUser?.email || "sin-email",
        gender: "-",
        birth: "",
        level: "facil",
        createdAt: new Date().toISOString()
      });
      console.log("Documento creado correctamente");
      return await getDoc(ref).then(s => s.data());
    }
    return snap.data();
  } catch (err) {
    console.error("Error en loadProfile:", err);
    throw err;
  }
}

// Guardar nivel en Firestore
async function saveLevel(uid, newLevel) {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { level: newLevel });
  } catch (err) {
    console.error("Error guardando nivel:", err);
    throw err;
  }
}

// Cargar resultados del usuario (ordenados por fecha)
async function loadResults(uid) {
  // Nota: guardo resultados en colección "results" con campo uid y dateISO
  const q = query(
    collection(db, "results"),
    where("uid", "==", uid),
    orderBy("dateISO", "asc")
  );

  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push(d.data()));
  return list;
}

// Preparar datos para Chart.js según tema (math / lex / mem)
function getChartData(topic) {
  const labels = resultsCache.map(r => r.dateISO);
  const values = resultsCache.map(r => {
    if (topic === "math") return r.math ?? 0;
    if (topic === "lex") return r.lex ?? 0;
    return r.mem ?? 0;
  });

  const title =
    topic === "math" ? "Matemáticas" :
    topic === "lex" ? "Léxico" :
    "Memoria";

  return { labels, values, title };
}

// Pintar (o repintar) el gráfico
function renderChart(topic) {
  const { labels, values, title } = getChartData(topic);

  // Si no hay resultados, muestro algo claro
  if (labels.length === 0) {
    showMessage("Aún no tienes resultados. Haz tu primera prueba 🙂", "");
  }

  // Si ya hay un chart, lo destruyo para no solapar
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Puntuación (${title})`,
        data: values,
        // Importante: no fijo colores “raros”; Chart.js pone uno por defecto
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#f3f4f6", font: { size: 16 } }
        },
        title: {
          display: true,
          text: `Progreso - ${title}`,
          color: "#f3f4f6",
          font: { size: 18, weight: "bold" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1", font: { size: 14 } },
          grid: { color: "rgba(255,255,255,0.06)" }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: "#cbd5e1", font: { size: 14 }, stepSize: 10 },
          grid: { color: "rgba(255,255,255,0.06)" }
        }
      }
    }
  });
}

// Tabs: cambio de tema
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("tab--active"));
    btn.classList.add("tab--active");

    currentTopic = btn.dataset.topic;

    // Actualizo aria-selected (detalle de accesibilidad)
    tabButtons.forEach(b => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");

    renderChart(currentTopic);
  });
});

// Botón guardar nivel
saveLevelBtn.addEventListener("click", async () => {
  if (!currentUser) return;
  const newLevel = levelSelect.value;

  try {
    showMessage("Guardando nivel...", "");
    await saveLevel(currentUser.uid, newLevel);
    showMessage("✅ Nivel guardado.", "ok");
  } catch (err) {
    console.error(err);
    showMessage("❌ No se pudo guardar el nivel.", "err");
  }
});

// Ir al test
goTestBtn.addEventListener("click", () => {
  window.location.href = "./test.html";
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});

// Mensaje “Resultados guardados” si venimos del test con ?saved=1
function checkSavedParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("saved") === "1") {
    showMessage("✅ Resultados guardados.", "ok");

    // Limpio la URL para que no vuelva a salir al recargar
    window.history.replaceState({}, "", "./profile.html");
  }
}

// Arranque: comprobar sesión y cargar todo
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log("No hay usuario autenticado, redirigiendo a login");
    window.location.href = "./index.html";
    return;
  }

  console.log("✅ Usuario autenticado:", user.uid);
  currentUser = user;
  checkSavedParam();

  try {
    console.log("Cargando perfil para UID:", user.uid);
    profileData = await loadProfile(user.uid);
    
    if (!profileData) {
      showMessage("⚠️ No se pudo cargar el perfil. Intenta recargar.", "err");
      console.error("Perfil vacío para UID:", user.uid);
      return;
    }

    console.log("✅ Perfil cargado:", profileData);

    // Pinto datos
    userEmail.textContent = profileData.email || user.email;
    userGender.textContent = profileData.gender || "-";
    userAge.textContent = calcAge(profileData.birth);
    levelSelect.value = profileData.level || "facil";

    // Cargo resultados y pinto gráfico inicial
    resultsCache = await loadResults(user.uid);
    renderChart(currentTopic);
    
    console.log("✅ Perfil cargado completamente");
  } catch (err) {
    console.error("❌ Error cargando el perfil:", err);
    const errorMsg = err.message || "Error desconocido";
    showMessage(`❌ Error cargando el perfil: ${errorMsg}`, "err");
  }
});