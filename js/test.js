// =========================================
// - 3 bloques: Matemáticas (10), Léxico (10), Memoria (2 fases)
// - Botón "Siguiente" controla el avance de preguntas
// - Matemáticas: Enter corrige/avanza
// - Léxico: eliges opción -> habilita Siguiente -> Siguiente avanza
// - Memoria: fase 1 (30s) -> fase 2 seleccionar 10 -> corregir -> Siguiente finaliza
// - Guarda resultados en Firestore: results {uid, dateISO, math, lex, mem}
// =========================================

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const msg = document.getElementById("msg");
const blockNum = document.getElementById("blockNum");
const questionNum = document.getElementById("questionNum");
const questionTotal = document.getElementById("questionTotal");
const blockTitle = document.getElementById("blockTitle");
const questionArea = document.getElementById("questionArea");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const backProfileBtn = document.getElementById("backProfileBtn");

// Helpers UI

function showMessage(text, type = "") {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + type;
}

function setFeedback(text, type = "") {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.className = "feedback " + type; // ok / err / warn
}

function clearFeedback() {
  setFeedback("", "");
}


// Helpers fecha

function pad2(n) {
  return String(n).padStart(2, "0");
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Devuelve true si ya hay un resultado guardado hoy para este usuario
async function alreadyDidTestToday(uid) {
  const today = todayISO();

  const q = query(
    collection(db, "results"),
    where("uid", "==", uid),
    where("dateISO", "==", today),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

// Mezcla (para memoria)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// Firebase helpers
async function loadUserLevel(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return "facil";
  return snap.data().level || "facil";
}

async function loadRandomTest(level) {
  const itemsRef = collection(db, "tests", level, "items");
  const snap = await getDocs(itemsRef);

  const arr = [];
  snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

  if (arr.length === 0) return null;

  const rand = Math.floor(Math.random() * arr.length);
  return arr[rand];
}

async function saveResults({ uid, math, lex, mem, level, testId }) {
  await addDoc(collection(db, "results"), {
    uid,
    dateISO: todayISO(),
    math,
    lex,
    mem,
    level: level || "facil",
    testId: testId || "sin-testId",
    createdAt: serverTimestamp()
  });
}

// Estado del test

let currentUser = null;
let currentLevel = "facil";
let currentTest = null;

let currentBlock = 0;     // 0=math, 1=lex, 2=mem
let currentIndex = 0;     // pregunta 0..9 dentro del bloque

let scoreMath = 0;
let scoreLex = 0;
let scoreMem = 0;

// estado por pregunta (para no sumar 2 veces)
let answered = false;

// Léxico: qué opción se eligió en la pregunta actual
let lexPickedIndex = null;

// Memoria: estado interno
let memPhase = 0; // 0=show 30s, 1=pick+correct
let memSelected = new Set();
let memCorrected = false; // para habilitar Siguiente tras corregir
let memTimerInterval = null;


// Render: progreso

function renderProgress(totalQuestions) {
  blockNum.textContent = String(currentBlock + 1);
  questionTotal.textContent = String(totalQuestions);
  questionNum.textContent = String(currentIndex + 1);
}


// Render: Matemáticas

function renderMathQuestion() {
  answered = false;
  clearFeedback();

  const q = currentTest.math[currentIndex];
  blockTitle.textContent = "Matemáticas";
  renderProgress(10);

  questionArea.innerHTML = `
    <p class="bigline">${q.text}</p>

    <input
      id="mathInput"
      class="input"
      type="number"
      inputmode="numeric"
      placeholder="Escribe el resultado"
    />

    <p class="small" style="margin-top:10px;">
      Pulsa <strong>Enter</strong> o <strong>Siguiente</strong>.
    </p>
  `;

  const input = document.getElementById("mathInput");
  input.focus();

  // solo habilito "Siguiente" cuando haya algo escrito
  nextBtn.disabled = true;

  input.addEventListener("input", () => {
    nextBtn.disabled = input.value.trim() === "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextBtn.disabled) return;
      handleNext(); // usa handler único del botón "Siguiente"
    }
  });
}

function checkMathAndScore() {
  if (answered) return;

  const q = currentTest.math[currentIndex];
  const input = document.getElementById("mathInput");

  const raw = (input?.value ?? "").trim();
  const userVal = Number(raw);
  const correctVal = Number(q.answer);

  // si no hay nada escrito, no corrijo
  if (raw === "" || !Number.isFinite(userVal)) {
    setFeedback("⚠️ Escribe un número para poder corregir.", "warn");
    return;
  }

  if (userVal === correctVal) {
    scoreMath += 10;
    setFeedback("✅ Correcto.", "ok");
  } else {
    setFeedback(`❌ Incorrecto. La respuesta correcta era ${correctVal}.`, "err");
  }

  answered = true;
}


// Render: Léxico

function renderLexQuestion() {
  answered = false;
  lexPickedIndex = null;
  clearFeedback();
  nextBtn.disabled = true;

  const q = currentTest.lex[currentIndex];
  blockTitle.textContent = "Léxico";
  renderProgress(10);

  const optionsHtml = (q.options || []).map((opt, i) => `
    <button type="button" class="btn opt-btn" data-i="${i}">${opt}</button>
  `).join("");

  questionArea.innerHTML = `
    <p class="bigline">${q.prompt}</p>
    <div class="options-grid" id="lexOptions">${optionsHtml}</div>
    <p class="small" style="margin-top:10px;">Elige una opción y pulsa <strong>Siguiente</strong>.</p>
  `;

  const wrap = document.getElementById("lexOptions");

  wrap.querySelectorAll(".opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".opt-btn").forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");

      // guardo como número real
      lexPickedIndex = Number(btn.dataset.i);

      nextBtn.disabled = false;
      setFeedback("Opción seleccionada.", ""); // neutral
    });
  });
}

function checkLexAndScore() {
  if (answered) return;

  const q = currentTest.lex[currentIndex];

  const picked = Number(lexPickedIndex);
  const correct = Number(q.correctIndex);

  if (!Number.isFinite(picked)) {
    setFeedback("⚠️ Elige una opción para poder corregir.", "warn");
    return;
  }

  if (picked === correct) {
    scoreLex += 10;
    setFeedback("✅ Correcto.", "ok");
  } else {
    const correctText = (q.options && q.options[correct]) ? q.options[correct] : "(respuesta correcta)";
    setFeedback(`❌ Incorrecto. Era: ${correctText}.`, "err");
  }

  answered = true;
  nextBtn.disabled = false; // ahora sirve para avanzar
}


// Render: Memoria (fase 1)

function renderMemShow() {
  answered = false;
  clearFeedback();
  nextBtn.disabled = true;

  memPhase = 0;
  memCorrected = false;
  memSelected.clear();

  // por si había interval anterior
  if (memTimerInterval) {
    clearInterval(memTimerInterval);
    memTimerInterval = null;
  }

  blockTitle.textContent = "Memoria";
  // En memoria el “contador” no va por preguntas 1..10, así que ponemos 1/2
  questionTotal.textContent = "2";
  questionNum.textContent = "1";

  const wordsHtml = currentTest.mem.showWords.map(w => `<span class="word-chip">${w}</span>`).join("");

  questionArea.innerHTML = `
    <p class="small">Memoriza estas 10 palabras. Tienes 30 segundos.</p>
    <div class="timer-big">Tiempo: <span id="memTimer">30</span>s</div>
    <div class="words-show">${wordsHtml}</div>
  `;

  let sec = 30;
  const timerEl = document.getElementById("memTimer");

  memTimerInterval = setInterval(() => {
    sec--;
    timerEl.textContent = String(sec);
    if (sec <= 0) {
      clearInterval(memTimerInterval);
      memTimerInterval = null;
      renderMemPick(); // pasamos a fase 2
    }
  }, 1000);
}


// Render: Memoria (fase 2)

function renderMemPick() {
  answered = false;
  clearFeedback();

  memPhase = 1;
  memCorrected = false;
  memSelected.clear();

  // fase 2/2
  questionTotal.textContent = "2";
  questionNum.textContent = "2";

  // Siguiente bloqueado hasta corregir
  nextBtn.disabled = true;

  const options = shuffleArray(currentTest.mem.options);
  const correctSet = new Set(currentTest.mem.correct);

  questionArea.innerHTML = `
    <p class="bigline">Selecciona las <strong>10</strong> palabras que viste antes.</p>

    <div class="mem-hint" id="memCount">Seleccionadas: 0 / 10</div>

    <div class="words-grid" id="wordsGrid"></div>

    <div class="actions-compact" style="margin-top:12px;">
      <button id="memClearBtn" class="btn btn-secondary" type="button">Borrar</button>
      <button id="memCheckBtn" class="btn btn-primary" type="button" disabled>Corregir</button>
    </div>

    <p class="small" style="margin-top:10px;">Cuando corrijas, se activará <strong>Siguiente</strong>.</p>
  `;

  const grid = document.getElementById("wordsGrid");
  const countEl = document.getElementById("memCount");
  const clearBtn = document.getElementById("memClearBtn");
  const checkBtn = document.getElementById("memCheckBtn");

  function updateCount() {
    countEl.textContent = `Seleccionadas: ${memSelected.size} / 10`;
    checkBtn.disabled = memSelected.size !== 10;
  }

  options.forEach((word) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "word-btn";
    btn.textContent = word;
    btn.setAttribute("aria-pressed", "false");

    btn.addEventListener("click", () => {
      if (memCorrected) return; // después de corregir, no se cambia

      if (memSelected.has(word)) {
        memSelected.delete(word);
        btn.classList.remove("is-selected");
        btn.setAttribute("aria-pressed", "false");
      } else {
        if (memSelected.size >= 10) return;
        memSelected.add(word);
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      }
      updateCount();
    });

    grid.appendChild(btn);
  });

  clearBtn.addEventListener("click", () => {
    if (memCorrected) return;

    memSelected.clear();
    grid.querySelectorAll(".word-btn").forEach((b) => {
      b.classList.remove("is-selected");
      b.setAttribute("aria-pressed", "false");
    });
    updateCount();
  });

  checkBtn.addEventListener("click", () => {
    if (memCorrected) return;

    // puntúa SOLO al corregir
    let hits = 0;
    memSelected.forEach((w) => {
      if (correctSet.has(w)) hits++;
    });

    scoreMem = hits * 10;

    memCorrected = true;
    setFeedback(`✅ Memoria: ${hits}/10 · ${scoreMem}/100`, "ok");

    // Ya se deja “Siguiente”
    nextBtn.disabled = false;
  });

  updateCount();
}


// Pantalla final + guardar

async function finishAndSave() {
  blockTitle.textContent = "¡Test completado!";
  clearFeedback();

  questionArea.innerHTML = `
    <div class="card" style="margin-top:10px;">
      <p class="bigline">🎉 <strong>Enhorabuena</strong>. ¡Test completado!</p>

      <div class="profile-grid" style="margin-top:12px;">
        <div class="profile-item"><span>Matemáticas</span><strong>${scoreMath}/100</strong></div>
        <div class="profile-item"><span>Léxico</span><strong>${scoreLex}/100</strong></div>
        <div class="profile-item"><span>Memoria</span><strong>${scoreMem}/100</strong></div>
      </div>

      <div class="row" style="margin-top:14px;">
        <button id="saveBackBtn" class="btn btn-primary btn-large" type="button">
          Guardar y volver al perfil
        </button>
      </div>

      <div class="row" style="margin-top:10px;">
        <button id="backNoSaveBtn" class="btn btn-secondary btn-large" type="button">
          Volver al perfil (sin guardar)
        </button>
      </div>
    </div>
  `;

  // se oculta el botón siguiente de abajo
  nextBtn.disabled = true;

  document.getElementById("backNoSaveBtn").addEventListener("click", () => {
    window.location.href = "./profile.html";
  });

  document.getElementById("saveBackBtn").addEventListener("click", async () => {
    try {
      showMessage("Guardando resultados…", "");

      await saveResults({
        uid: currentUser.uid,
        math: scoreMath,
        lex: scoreLex,
        mem: scoreMem,
        level: currentLevel,
        testId: currentTest?.id
      });

      showMessage("✅ Guardado.", "ok");
      window.location.href = "./profile.html?saved=1";
    } catch (e) {
      console.error(e);
      showMessage("❌ No se pudieron guardar los resultados. Mira consola (F12).", "err");
    }
  });
}


// Navegación: render bloque actual

function renderCurrent() {
  // reset botón siguiente a “bloqueado” si hace falta, cada render lo gestiona
  nextBtn.disabled = true;

  if (currentBlock === 0) renderMathQuestion();
  else if (currentBlock === 1) renderLexQuestion();
  else renderMemShow(); // memoria arranca en fase 1
}


// Botón Siguiente: handler único para todo

function handleNext() {
  // Bloque 0: Matemáticas
if (currentBlock === 0) {
  // 1) Si aún no está corregida esta pregunta -> corrijo y me quedo aquí
  if (!answered) {
    checkMathAndScore(); // mostrará el feedback
    // Importante: no avanzo todavía
    return;
  }

  // 2) Si ya estaba corregida -> ahora sí avanzo a la siguiente
  currentIndex++;

  if (currentIndex >= 10) {
    currentBlock = 1;
    currentIndex = 0;
    renderCurrent();
  } else {
    renderMathQuestion();
  }

  return;
}

 // Bloque 1: Léxico
if (currentBlock === 1) {

  // Si aún no está corregida esta pregunta -> corrijo y me quedo aquí
  if (!answered) {
    checkLexAndScore();
    return;
  }

  // Si YA estaba corregida -> ahora sí avanzo
  currentIndex++;

  if (currentIndex >= 10) {
    currentBlock = 2;
    currentIndex = 0;
    renderCurrent(); // pasa a memoria
  } else {
    renderLexQuestion();
  }

  return;
}

  // Bloque 2: Memoria
  if (currentBlock === 2) {
    // Si estamos en fase 1, no debería poder pulsar (está deshabilitado)
    // Si estamos en fase 2, solo dejamos avanzar si ya corrigió
    if (!memCorrected) return;


    finishAndSave();
  }
}


// Eventos

nextBtn.addEventListener("click", handleNext);

backProfileBtn.addEventListener("click", () => {
  window.location.href = "./profile.html";
});


// Inicio

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;

  // Solo 1 test al día
  const doneToday = await alreadyDidTestToday(user.uid);

  if (doneToday) {
    showMessage("⚠️ Ya has realizado la prueba hoy. Vuelve mañana.", "warn");

    blockTitle.textContent = "Prueba del día";
    questionArea.innerHTML = `
      <p class="bigline">Hoy ya hiciste la prueba.</p>
      <p class="small">Solo se permite <strong>1 prueba al día</strong>.</p>
    `;

    nextBtn.disabled = true;
    return;
  }

  try {
    showMessage("Preparando prueba…", "");
    currentLevel = await loadUserLevel(user.uid);
    currentTest = await loadRandomTest(currentLevel);

    if (!currentTest) {
      showMessage("❌ No hay tests en Firestore para tu nivel. Usa admin-seed.html.", "err");
      blockTitle.textContent = "Sin tests";
      questionArea.innerHTML = `<p class="bigline">No hay tests cargados.</p>`;
      return;
    }

    showMessage("", "");
    currentBlock = 0;
    currentIndex = 0;

    // Estado UI inicial
    blockTitle.textContent = "Cargando…";
    renderCurrent();
  } catch (e) {
    console.error(e);
    showMessage("❌ Error preparando la prueba. Mira consola (F12).", "err");
  }

});
