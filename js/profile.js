// =========================================
// profile.js (profile.html)
// - Lee el perfil del usuario (users/{uid})
// - Permite cambiar nivel
// - Lee resultados (results) y pinta gráfico con Chart.js
// - Tabs (math/lex/mem) para cambiar el gráfico
// =========================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ======================
// UI
// ======================
const msg = document.getElementById("msg");

const userEmail = document.getElementById("userEmail");
const userName = document.getElementById("userName");
const userGender = document.getElementById("userGender");
const userAge = document.getElementById("userAge");

const levelSelect = document.getElementById("levelSelect");
const saveLevelBtn = document.getElementById("saveLevelBtn");
const goTestBtn = document.getElementById("goTestBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Tabs (botones con class="tab" y data-topic="math|lex|mem")
const tabButtons = document.querySelectorAll(".tab");

// Canvas del gráfico
const canvas = document.getElementById("progressChart");

// ======================
// Estado
// ======================
let currentUser = null;
let profileData = null;
let resultsCache = []; // resultados del usuario para el gráfico
let currentTopic = "math";
let chartInstance = null;

// ======================
// Helpers UI
// ======================
function showMessage(text, type = "") {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + type; // ok / err / warn / etc.
}

// Calcular edad desde YYYY-MM-DD
function calcAge(birthISO) {
  if (!birthISO) return "-";
  try {
    const birth = new Date(birthISO + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : "-";
  } catch (e) {
    console.error("calcAge error:", e);
    return "-";
  }
}

// ======================
// Perfil (users/{uid})
// ======================
async function ensureProfile(uid) {
  // Esto lo hago para que SIEMPRE exista un doc de usuario
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();

  console.warn("⚠️ Perfil no existe. Creando estructura base completa (merge).");

  const base = {
    email: auth.currentUser?.email || "sin-email",
    name: "",
    gender: "",
    birth: "",
    level: "facil",
    createdAt: new Date().toISOString()
  };

  await setDoc(ref, base, { merge: true });
  const snap2 = await getDoc(ref);
  return snap2.data();
}

async function saveLevel(uid, newLevel) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { level: newLevel });
}

// ======================
// Resultados (results)
// ======================

// 💡 Esta función es "a prueba de cambios":
// - trae results del usuario
// - ordena por dateISO en JS (evita problemas de índices)
async function loadResults(uid) {
  const q = query(
    collection(db, "results"),
    where("uid", "==", uid)
  );

  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push(d.data()));

  list.sort((a, b) => (a.dateISO || "").localeCompare(b.dateISO || ""));
  return list;
}

// Intento leer la puntuación aunque tu test.js use nombres distintos
function getScoreFromResult(r, topic) {
  // Formatos típicos:
  // r.math / r.lex / r.mem
  // r.mathScore / r.lexScore / r.memScore
  // r.scores = { math, lex, mem }
  const mathVal = r.math ?? r.mathScore ?? r.scores?.math ?? 0;
  const lexVal = r.lex ?? r.lexScore ?? r.scores?.lex ?? 0;
  const memVal = r.mem ?? r.memScore ?? r.scores?.mem ?? 0;

  const v =
    topic === "math" ? mathVal :
    topic === "lex" ? lexVal :
    memVal;

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getChartData(topic) {
  const labels = resultsCache.map(r => r.dateISO || "-");
  const values = resultsCache.map(r => getScoreFromResult(r, topic));

  const title =
    topic === "math" ? "Matemáticas" :
    topic === "lex" ? "Léxico" :
    "Memoria";

  return { labels, values, title };
}

// ======================
// Chart.js
// ======================
function renderChart(topic) {
  if (typeof Chart === "undefined") {
    showMessage("❌ Chart.js no está cargado (revisa profile.html).", "err");
    return;
  }
  if (!canvas) {
    showMessage("❌ No encuentro #progressChart en profile.html", "err");
    return;
  }

  // Datos (tuyos)
  const { labels, values } = getChartData(topic);

  // Últimas 5
  const lastN = 5;
  const start = Math.max(0, labels.length - lastN);
  const labels5 = labels.slice(start);
  const values5 = values.slice(start);

  // Mensaje arriba
  if (labels5.length === 0) {
    showMessage("Aún no tienes resultados. Haz una prueba 🙂", "warn");
  } else {
    const last = values5[values5.length - 1] ?? 0;
    showMessage(`Último resultado: ${last}/100`, "ok");
  }

  // Destruir anterior
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Formato de fechas más corto: "YYYY-MM-DD" -> "DD/MM"
  const shortLabels = labels5.map((d) => {
    if (!d || d === "-") return "-";
    // d ejemplo: 2026-03-05
    const parts = String(d).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return d;
  });

  // Tamaños adaptativos según ancho (móvil/tablet/pc)
  const w = canvas.parentElement?.clientWidth || window.innerWidth;
  const isMobile = w < 480;

  const fontTick = isMobile ? 14 : 16;
  const fontValue = isMobile ? 16 : 18;
  const barSize = isMobile ? 0.85 : 0.75;

  // Plugin para poner el número encima (grande y legible)
  const valueLabelsPlugin = {
    id: "valueLabelsPlugin",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      const dataset = chart.data.datasets[0];

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = `800 ${fontValue}px system-ui`;
      ctx.fillStyle = "#f3f4f6";

      meta.data.forEach((bar, i) => {
        const val = dataset.data[i];
        // si no hay valor, no escribo nada
        if (val === null || val === undefined) return;
        ctx.fillText(String(val), bar.x, bar.y - 6);
      });

      ctx.restore();
    }
  };

  chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: shortLabels,
      datasets: [
        {
          // ❌ Quitamos label para que NO salga leyenda / ni cuadradito
          data: values5,
          borderWidth: 0,
          barPercentage: barSize,
          categoryPercentage: 0.9,
          borderRadius: 10 // barras más “amables”
        }
      ]
    },
    plugins: [valueLabelsPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,

      // ✅ Sin leyenda = no hay “cuadrado clicable”
      plugins: {
        legend: { display: false },

        // ✅ Sin título dentro de la gráfica (queda más limpio)
        title: { display: false },

        tooltip: {
          enabled: true,
          titleFont: { size: isMobile ? 14 : 16 },
          bodyFont: { size: isMobile ? 16 : 18 },
          callbacks: {
            label: (ctx) => `Puntos: ${ctx.parsed.y}/100`
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#e5e7eb",
            font: { size: fontTick, weight: "600" }
          },
          grid: { display: false } // menos ruido visual
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: "#e5e7eb",
            font: { size: fontTick, weight: "600" },
            stepSize: 20
          },
          grid: { color: "rgba(255,255,255,0.10)" }
        }
      }
    }
  });
}

// ======================
// Tabs: cambiar tema
// ======================
function setupTabs() {
  if (!tabButtons || tabButtons.length === 0) {
    console.warn("⚠️ No hay .tab en el HTML (no pasa nada, solo no habrá pestañas).");
    return;
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Marco activo visual
      tabButtons.forEach(b => b.classList.remove("tab--active"));
      btn.classList.add("tab--active");

      // Accesibilidad aria-selected
      tabButtons.forEach(b => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");

      // Tema
      currentTopic = btn.dataset.topic || "math";
      renderChart(currentTopic);
    });
  });
}

// ======================
// Botones principales
// ======================
saveLevelBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  try {
    showMessage("Guardando nivel...", "");
    await saveLevel(currentUser.uid, levelSelect.value);
    showMessage("✅ Nivel guardado.", "ok");
  } catch (e) {
    console.error(e);
    showMessage("❌ No se pudo guardar el nivel.", "err");
  }
});

goTestBtn?.addEventListener("click", () => {
  window.location.href = "./test.html";
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "./index.html";
});

// Si venimos del test con ?saved=1
function checkSavedParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("saved") === "1") {
    showMessage("✅ Resultados guardados.", "ok");
    window.history.replaceState({}, "", "./profile.html");
  }
}

// ======================
// Arranque
// ======================
setupTabs();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;
  checkSavedParam();

  try {
    // 1) Perfil
    profileData = await ensureProfile(user.uid);

    // Pinto datos en el HTML
    userEmail.textContent = profileData.email || user.email || "sin email";
    userName.textContent = profileData.name || "-";
    userGender.textContent = profileData.gender || "-";
    userAge.textContent = calcAge(profileData.birth);
    levelSelect.value = profileData.level || "facil";

    // 2) Resultados
    resultsCache = await loadResults(user.uid);

    // Debug útil
    console.log("✅ resultsCache:", resultsCache);

    // 3) Gráfico inicial
    renderChart(currentTopic);

  } catch (e) {
    console.error("❌ Error cargando perfil:", e);
    showMessage("❌ Error cargando el perfil. Mira consola (F12).", "err");
  }
});