// =========================================
// test.js (test.html)
// - Cada día: 1 prueba completa (math + lex + mem)
// - Carga un test aleatorio de Firestore según nivel
// - 1 pregunta por pantalla + feedback inmediato
// - Al finalizar, guarda results (1 por día)
// =========================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// UI
const msg = document.getElementById("msg");
const progressLine = document.getElementById("progressLine");
const blockNumEl = document.getElementById("blockNum");
const questionNumEl = document.getElementById("questionNum");
const questionTotalEl = document.getElementById("questionTotal");
const blockTitleEl = document.getElementById("blockTitle");
const questionArea = document.getElementById("questionArea");
const feedbackEl = document.getElementById("feedback");

const nextBtn = document.getElementById("nextBtn");
const backProfileBtn = document.getElementById("backProfileBtn");

// Estado de sesión
let currentUser = null;
let userLevel = "facil";

// Datos del test elegido
let chosenTest = null;   // aquí guardo {testId, math[], lex[], mem{...}}
let chosenTestId = null;

// Control del flujo
// 0=math, 1=lex, 2=mem
let currentBlockIndex = 0;

// Math / Lex: van por preguntas 0..9
let currentQuestionIndex = 0;

// Puntuaciones acumuladas
let scoreMath = 0;
let scoreLex = 0;
let scoreMem = 0;

// Para controlar que solo se pueda “Siguiente” después de responder
let answered = false;

// Memoria: fases
// phase "show" (mostrar palabras 30s) -> "pick" (seleccionar) -> "done"
let memPhase = "show";
let memCountdown = 30;
let memSelected = new Set();

// Utilidad: mensaje
function showMessage(text, type = "") {
  msg.textContent = text;
  msg.className = "msg " + type;
}

// Fecha ISO (YYYY-MM-DD) para la regla “1 al día”
function getTodayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Volver a perfil
backProfileBtn.addEventListener("click", () => {
  window.location.href = "./profile.html";
});

// Siguiente
nextBtn.addEventListener("click", () => {
  if (!answered) return;

  feedbackEl.textContent = "";
  answered = false;
  nextBtn.disabled = true;

  // Si estoy en memoria y en fase pick, el siguiente significa “terminé bloque”
  if (currentBlockIndex === 2) {
    // Memoria se controla diferente: aquí solo paso a guardar
    finishAll();
    return;
  }

  currentQuestionIndex++;

  if (currentQuestionIndex >= 10) {
    // Terminé bloque actual
    currentBlockIndex++;
    currentQuestionIndex = 0;

    if (currentBlockIndex >= 3) {
      finishAll();
      return;
    }
  }

  renderScreen();
});

// Compruebo si hoy ya hay resultado (1 por día)
async function alreadyDidToday(uid) {
  const today = getTodayISO();

  // Busco 1 documento con uid + dateISO
  const q = query(
    collection(db, "results"),
    where("uid", "==", uid),
    where("dateISO", "==", today),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

// Leer nivel del usuario desde users/{uid}
async function loadUserLevel(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return "facil";
  const data = snap.data();
  return data.level || "facil";
}

// Cargar un test aleatorio de Firestore según nivel
async function loadRandomTest(level) {
  // Estructura: tests/{level}/items/{testId}
  const itemsRef = collection(db, "tests", level, "items");
  const snap = await getDocs(itemsRef);

  const arr = [];
  snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

  if (arr.length === 0) return null;

  // Aleatorio simple
  const rand = Math.floor(Math.random() * arr.length);
  return arr[rand];
}

// Actualizar barra de progreso (Bloque/Pregunta)
function updateProgressUI() {
  blockNumEl.textContent = String(currentBlockIndex + 1);

  // En memoria, no es “pregunta 1..10” como tal, pero lo mantenemos simple:
  if (currentBlockIndex === 2) {
    progressLine.textContent = "Bloque 3 / 3 · Memoria (2 pasos)";
    return;
  }

  questionNumEl.textContent = String(currentQuestionIndex + 1);
  questionTotalEl.textContent = "10";
  progressLine.textContent = `Bloque ${currentBlockIndex + 1} / 3 · Pregunta ${currentQuestionIndex + 1} de 10`;
}

// Render principal según bloque
function renderScreen() {
  updateProgressUI();

  // Limpio la zona
  questionArea.innerHTML = "";
  feedbackEl.textContent = "";

  if (currentBlockIndex === 0) renderMath();
  else if (currentBlockIndex === 1) renderLex();
  else renderMem();
}

/* ==========================
   BLOQUE 1: MATEMÁTICAS
   ========================== */
function renderMath() {
  blockTitleEl.textContent = "Matemáticas: resuelve la operación";

  const q = chosenTest.math[currentQuestionIndex];

  // Texto grande y simple
  const p = document.createElement("p");
  p.className = "bigline";
  p.textContent = q.text;
  questionArea.appendChild(p);

  const label = document.createElement("label");
  label.className = "label";
  label.setAttribute("for", "mathAnswer");
  label.textContent = "Tu respuesta:";
  questionArea.appendChild(label);

  const input = document.createElement("input");
  input.id = "mathAnswer";
  input.className = "input";
  input.type = "number";
  input.inputMode = "numeric"; // ayuda en móvil
  input.placeholder = "Escribe un número";
  questionArea.appendChild(input);

  const btn = document.createElement("button");
  btn.className = "btn btn-secondary";
  btn.textContent = "Comprobar";
  questionArea.appendChild(btn);

  // Aquí controlo que solo se pueda avanzar tras responder
  btn.addEventListener("click", () => {
    if (answered) return;

    const userVal = Number(input.value);
    const correct = Number(q.answer);

    if (Number.isNaN(userVal) || input.value === "") {
      feedbackEl.textContent = "⚠️ Escribe un número para responder.";
      return;
    }

    answered = true;
    nextBtn.disabled = false;

    if (userVal === correct) {
      scoreMath += 10;
      feedbackEl.textContent = "✅ Correcto";
    } else {
      feedbackEl.textContent = `❌ Incorrecto. La respuesta correcta era ${correct}.`;
    }
  });
}

/* ==========================
   BLOQUE 2: LÉXICO
   - 3 botones (no se escribe)
   ========================== */
function renderLex() {
  blockTitleEl.textContent = "Léxico: elige la opción correcta";

  const q = chosenTest.lex[currentQuestionIndex];

  const p = document.createElement("p");
  p.className = "bigline";
  p.textContent = q.prompt;
  questionArea.appendChild(p);

  const wrap = document.createElement("div");
  wrap.className = "options";
  questionArea.appendChild(wrap);

  // 3 opciones como botones grandes
  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "btn btn-secondary optionBtn";
    b.textContent = opt;

    b.addEventListener("click", () => {
      if (answered) return;

      answered = true;
      nextBtn.disabled = false;

      if (i === q.correctIndex) {
        scoreLex += 10;
        feedbackEl.textContent = "✅ Correcto";
      } else {
        const correctText = q.options[q.correctIndex];
        feedbackEl.textContent = `❌ Incorrecto. La respuesta correcta era: ${correctText}.`;
      }
    });

    wrap.appendChild(b);
  });
}

/* ==========================
   BLOQUE 3: MEMORIA (2 fases)
   - Fase 1: ver 10 palabras (30s)
   - Fase 2: elegir las correctas (20 botones)
   - Puntuación: +10 por palabra correcta seleccionada (hasta 100)
   ========================== */
function renderMem() {
  blockTitleEl.textContent = "Memoria: sigue los pasos";

  const mem = chosenTest.mem;

  if (memPhase === "show") {
    renderMemShow(mem);
  } else if (memPhase === "pick") {
    renderMemPick(mem);
  }
}

// Fase 1: mostrar palabras durante 30 segundos
function renderMemShow(mem) {
  const p = document.createElement("p");
  p.className = "bigline";
  p.textContent = "Paso 1: Mira estas palabras y trata de recordarlas.";
  questionArea.appendChild(p);

  const timer = document.createElement("div");
  timer.className = "msg";
  timer.textContent = `⏳ Tiempo: ${memCountdown} segundos`;
  questionArea.appendChild(timer);

  const list = document.createElement("div");
  list.className = "panel";
  questionArea.appendChild(list);

  // Pongo las palabras grandes y en columnas simples
  const ul = document.createElement("ul");
  ul.style.margin = "0";
  ul.style.paddingLeft = "20px";
  ul.style.columnCount = "2";
  ul.style.fontSize = "20px";
  mem.showWords.forEach(w => {
    const li = document.createElement("li");
    li.textContent = w;
    ul.appendChild(li);
  });
  list.appendChild(ul);

  // Bloqueo el botón siguiente aquí (en esta fase se pasa solo)
  nextBtn.disabled = true;
  answered = false;

  // Cuenta atrás sencilla
  const interval = setInterval(() => {
    memCountdown--;
    timer.textContent = `⏳ Tiempo: ${memCountdown} segundos`;

    if (memCountdown <= 0) {
      clearInterval(interval);

      // Paso a fase 2
      memPhase = "pick";
      renderScreen();
    }
  }, 1000);
}

// Fase 2: elegir palabras vistas antes
function renderMemPick(mem) {
  const p = document.createElement("p");
  p.className = "bigline";
  p.textContent = "Paso 2: Selecciona las palabras que estaban en la lista anterior.";
  questionArea.appendChild(p);

  const info = document.createElement("p");
  info.className = "small";
  info.textContent = "Puedes seleccionar varias. Luego pulsa “Confirmar selección”.";
  questionArea.appendChild(info);

  const wrap = document.createElement("div");
  wrap.className = "options";
  questionArea.appendChild(wrap);

  // Botones de palabras (20 opciones)
  mem.options.forEach((w) => {
    const b = document.createElement("button");
    b.className = "btn btn-secondary optionBtn";
    b.textContent = w;

    // Esto lo hago para marcar visualmente qué está seleccionado
    function refreshStyle() {
      if (memSelected.has(w)) {
        b.style.borderColor = "var(--focus)";
      } else {
        b.style.borderColor = "transparent";
      }
    }

    b.addEventListener("click", () => {
      if (memSelected.has(w)) memSelected.delete(w);
      else memSelected.add(w);
      refreshStyle();
    });

    refreshStyle();
    wrap.appendChild(b);
  });

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn btn-primary";
  confirmBtn.textContent = "Confirmar selección";
  questionArea.appendChild(confirmBtn);

  confirmBtn.addEventListener("click", () => {
    if (answered) return;

    // Calculo puntuación: +10 por cada palabra correcta seleccionada
    const correctSet = new Set(mem.correct);
    let correctCount = 0;

    memSelected.forEach((w) => {
      if (correctSet.has(w)) correctCount++;
    });

    scoreMem = Math.min(100, correctCount * 10);

    answered = true;
    nextBtn.disabled = false;

    feedbackEl.textContent = `✅ Memoria: has acertado ${correctCount} palabra(s). Puntuación: ${scoreMem}/100.`;
  });
}

// Guardar resultados y volver al perfil
async function finishAll() {
  try {
    showMessage("Guardando resultados...", "");
    nextBtn.disabled = true;

    const dateISO = getTodayISO();

    // results/{autoId}
    await addDoc(collection(db, "results"), {
      uid: currentUser.uid,
      dateISO,
      math: scoreMath,
      lex: scoreLex,
      mem: scoreMem,
      testId: chosenTestId,
      level: userLevel
    });

    // Voy al perfil con un parámetro para mostrar “Resultados guardados”
    window.location.href = "./profile.html?saved=1";
  } catch (err) {
    console.error(err);
    showMessage("❌ No se pudo guardar el resultado.", "err");
    nextBtn.disabled = false;
  }
}

// Arranque: comprobar sesión, regla “1 al día”, cargar test y empezar
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;

  try {
    // 1) Ver si ya hizo la prueba hoy
    const done = await alreadyDidToday(user.uid);
    if (done) {
      showMessage("⚠️ Ya has hecho la prueba hoy. Vuelve mañana 🙂", "warn");
      // Desactivo controles para que no pueda seguir
      nextBtn.disabled = true;
      questionArea.innerHTML = "<p class='bigline'>No puedes repetir la prueba hoy.</p>";
      return;
    }

    // 2) Cargar nivel desde el perfil
    userLevel = await loadUserLevel(user.uid);

    // 3) Cargar test aleatorio del nivel
    chosenTest = await loadRandomTest(userLevel);
    if (!chosenTest) {
      showMessage("❌ No hay tests en Firestore para tu nivel. Usa admin-seed.html para cargarlos.", "err");
      return;
    }

    chosenTestId = chosenTest.id;

    // 4) Reset de estado
    currentBlockIndex = 0;
    currentQuestionIndex = 0;

    scoreMath = 0;
    scoreLex = 0;
    scoreMem = 0;

    answered = false;
    nextBtn.disabled = true;

    // Memoria reseteada
    memPhase = "show";
    memCountdown = 30;
    memSelected = new Set();

    showMessage(`Nivel: ${userLevel}. Test cargado: ${chosenTestId}`, "ok");

    // 5) Render primera pantalla
    renderScreen();
  } catch (err) {
    console.error(err);
    showMessage("❌ Error preparando la prueba.", "err");
  }
});