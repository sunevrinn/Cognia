// =========================================
// /js/admin-seed.js
// - Crea 9 tests demo en Firestore (3 por nivel)
// - Estructura: tests/{level}/items/{testId}
// - Cada test incluye:
//   math: 10 preguntas (10 puntos por acierto)
//   lex:  10 preguntas (10 puntos por acierto)
//   mem:  10 palabras a mostrar (30s) + 20 opciones + 10 correctas (10 puntos por acierto)
// =========================================

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ✅ Pon tu email (el del login)
const ADMIN_EMAILS = ["harukaaa.chan@gmail.com"];

// UI (según tu admin-seed.html)
const msg = document.getElementById("msg");
const seedBtn = document.getElementById("seedBtn");
const goIndexBtn = document.getElementById("goIndexBtn");

function showMessage(text, type = "") {
  msg.textContent = text;
  msg.className = "msg " + type; // ok / err / warn (según tu CSS)
}

goIndexBtn.addEventListener("click", () => (window.location.href = "./index.html"));
seedBtn.disabled = true;

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user) {
    showMessage("❌ No hay sesión. Inicia sesión con el email admin.", "err");
    seedBtn.disabled = true;
    return;
  }

  const email = (user.email || "").toLowerCase();
  const allowed = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);

  if (!allowed) {
    showMessage(`❌ Sesión iniciada como ${user.email}, pero NO está permitido sembrar datos.`, "err");
    seedBtn.disabled = true;
    return;
  }

  showMessage(`✅ Admin verificado: ${user.email}. Pulsa “Cargar tests demo”.`, "ok");
  seedBtn.disabled = false;
});

// ===============================
// Datos: 9 tests (3 por nivel)
// ===============================

function makeMath10(list10) {
  // list10: [{text, answer}, ...] (10)
  return list10;
}

function makeLex10(list10) {
  // list10: [{prompt, options:[a,b,c], correctIndex}, ...] (10)
  return list10;
}

function makeMem(showWords10, options20) {
  // correct = exactamente las 10 mostradas
  return {
    showWords: showWords10,
    options: options20,
    correct: showWords10
  };
}

function buildSeedData() {
  return {
    facil: [
      {
        testId: "facil-1",
        math: makeMath10([
          { text: "3 + 4 = ?", answer: 7 },
          { text: "10 - 6 = ?", answer: 4 },
          { text: "5 + 2 = ?", answer: 7 },
          { text: "9 - 3 = ?", answer: 6 },
          { text: "1 + 8 = ?", answer: 9 },
          { text: "7 - 5 = ?", answer: 2 },
          { text: "6 + 1 = ?", answer: 7 },
          { text: "8 - 2 = ?", answer: 6 },
          { text: "4 + 4 = ?", answer: 8 },
          { text: "12 - 7 = ?", answer: 5 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “feliz”", options: ["contento", "triste", "enfadado"], correctIndex: 0 },
          { prompt: "Antónimo de “frío”", options: ["caliente", "helado", "fresco"], correctIndex: 0 },
          { prompt: "Sinónimo de “rápido”", options: ["veloz", "lento", "pesado"], correctIndex: 0 },
          { prompt: "Antónimo de “grande”", options: ["pequeño", "alto", "ancho"], correctIndex: 0 },
          { prompt: "Sinónimo de “bonito”", options: ["hermoso", "feo", "sucio"], correctIndex: 0 },
          { prompt: "Antónimo de “viejo”", options: ["nuevo", "antiguo", "gastado"], correctIndex: 0 },
          { prompt: "Sinónimo de “ayuda”", options: ["apoyo", "daño", "miedo"], correctIndex: 0 },
          { prompt: "Antónimo de “día”", options: ["noche", "sol", "mañana"], correctIndex: 0 },
          { prompt: "Sinónimo de “fácil”", options: ["sencillo", "difícil", "raro"], correctIndex: 0 },
          { prompt: "Antónimo de “lleno”", options: ["vacío", "redondo", "duro"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["casa","mesa","sol","pan","flor","perro","agua","libro","coche","mano"],
          ["casa","mesa","sol","pan","flor","perro","agua","libro","coche","mano","silla","luna","pez","taza","arroz","llave","calle","vino","pato","nube"]
        )
      },
      {
        testId: "facil-2",
        math: makeMath10([
          { text: "2 + 6 = ?", answer: 8 },
          { text: "11 - 4 = ?", answer: 7 },
          { text: "7 + 3 = ?", answer: 10 },
          { text: "9 - 8 = ?", answer: 1 },
          { text: "5 + 5 = ?", answer: 10 },
          { text: "13 - 9 = ?", answer: 4 },
          { text: "6 + 2 = ?", answer: 8 },
          { text: "8 - 7 = ?", answer: 1 },
          { text: "3 + 9 = ?", answer: 12 },
          { text: "14 - 6 = ?", answer: 8 }
        ]),
        lex: makeLex10([
          { prompt: "Antónimo de “alegre”", options: ["triste", "rápido", "suave"], correctIndex: 0 },
          { prompt: "Sinónimo de “cansado”", options: ["agotado", "fuerte", "nuevo"], correctIndex: 0 },
          { prompt: "Antónimo de “alto”", options: ["bajo", "largo", "grueso"], correctIndex: 0 },
          { prompt: "Sinónimo de “empezar”", options: ["comenzar", "terminar", "romper"], correctIndex: 0 },
          { prompt: "Antónimo de “rápido”", options: ["lento", "ágil", "pronto"], correctIndex: 0 },
          { prompt: "Sinónimo de “cerca”", options: ["próximo", "lejos", "abierto"], correctIndex: 0 },
          { prompt: "Antónimo de “limpio”", options: ["sucio", "claro", "seco"], correctIndex: 0 },
          { prompt: "Sinónimo de “mirar”", options: ["ver", "romper", "cortar"], correctIndex: 0 },
          { prompt: "Antónimo de “encender”", options: ["apagar", "subir", "correr"], correctIndex: 0 },
          { prompt: "Sinónimo de “hablar”", options: ["conversar", "callar", "perder"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["gato","rio","sal","tren","hoja","nieve","cielo","leche","vino","zapato"],
          ["gato","rio","sal","tren","hoja","nieve","cielo","leche","vino","zapato","piedra","cama","fuego","camisa","plato","reloj","puerta","plaza","piano","jabón"]
        )
      },
      {
        testId: "facil-3",
        math: makeMath10([
          { text: "4 + 6 = ?", answer: 10 },
          { text: "15 - 8 = ?", answer: 7 },
          { text: "9 + 1 = ?", answer: 10 },
          { text: "7 - 2 = ?", answer: 5 },
          { text: "5 + 7 = ?", answer: 12 },
          { text: "16 - 10 = ?", answer: 6 },
          { text: "2 + 9 = ?", answer: 11 },
          { text: "13 - 5 = ?", answer: 8 },
          { text: "6 + 3 = ?", answer: 9 },
          { text: "10 - 1 = ?", answer: 9 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “valiente”", options: ["atrevido", "miedoso", "tímido"], correctIndex: 0 },
          { prompt: "Antónimo de “fuerte”", options: ["débil", "grande", "alto"], correctIndex: 0 },
          { prompt: "Sinónimo de “regalo”", options: ["obsequio", "castigo", "problema"], correctIndex: 0 },
          { prompt: "Antónimo de “entrar”", options: ["salir", "subir", "girar"], correctIndex: 0 },
          { prompt: "Sinónimo de “paz”", options: ["calma", "ruido", "prisa"], correctIndex: 0 },
          { prompt: "Antónimo de “duro”", options: ["blando", "fuerte", "serio"], correctIndex: 0 },
          { prompt: "Sinónimo de “rápidamente”", options: ["deprisa", "despacio", "nunca"], correctIndex: 0 },
          { prompt: "Antónimo de “luz”", options: ["oscuridad", "sol", "día"], correctIndex: 0 },
          { prompt: "Sinónimo de “ayudar”", options: ["asistir", "romper", "callar"], correctIndex: 0 },
          { prompt: "Antónimo de “lleno”", options: ["vacío", "duro", "alto"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["fruta","foto","mar","carta","luz","pez","tierra","ojo","sopa","parque"],
          ["fruta","foto","mar","carta","luz","pez","tierra","ojo","sopa","parque","banco","sombra","caja","pino","miel","bota","tren","cinta","vino","plato"]
        )
      }
    ],

    medio: [
      {
        testId: "medio-1",
        math: makeMath10([
          { text: "24 + 17 = ?", answer: 41 },
          { text: "50 - 18 = ?", answer: 32 },
          { text: "36 + 29 = ?", answer: 65 },
          { text: "80 - 35 = ?", answer: 45 },
          { text: "7 × 3 = ?", answer: 21 },
          { text: "6 × 4 = ?", answer: 24 },
          { text: "45 + 10 = ?", answer: 55 },
          { text: "90 - 27 = ?", answer: 63 },
          { text: "8 × 2 = ?", answer: 16 },
          { text: "63 - 19 = ?", answer: 44 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “tranquilo”", options: ["sereno", "furioso", "ruidoso"], correctIndex: 0 },
          { prompt: "Antónimo de “generoso”", options: ["egoísta", "amable", "alegre"], correctIndex: 0 },
          { prompt: "Sinónimo de “comenzar”", options: ["iniciar", "finalizar", "perder"], correctIndex: 0 },
          { prompt: "Antónimo de “mejorar”", options: ["empeorar", "ayudar", "avanzar"], correctIndex: 0 },
          { prompt: "Sinónimo de “intentar”", options: ["probar", "romper", "callar"], correctIndex: 0 },
          { prompt: "Antónimo de “permitir”", options: ["prohibir", "dejar", "dar"], correctIndex: 0 },
          { prompt: "Sinónimo de “respuesta”", options: ["solución", "pregunta", "problema"], correctIndex: 0 },
          { prompt: "Antónimo de “seguro”", options: ["peligroso", "firme", "claro"], correctIndex: 0 },
          { prompt: "Sinónimo de “revisar”", options: ["comprobar", "romper", "ocultar"], correctIndex: 0 },
          { prompt: "Antónimo de “posible”", options: ["imposible", "probable", "seguro"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["ventana","camino","fiesta","amigo","juego","musica","invierno","verano","toalla","jabón"],
          ["ventana","camino","fiesta","amigo","juego","musica","invierno","verano","toalla","jabón","cuchara","tenedor","montaña","pintura","sonrisa","cartel","ladrillo","cereza","pueblo","limón"]
        )
      },
      {
        testId: "medio-2",
        math: makeMath10([
          { text: "58 + 14 = ?", answer: 72 },
          { text: "100 - 46 = ?", answer: 54 },
          { text: "39 + 33 = ?", answer: 72 },
          { text: "75 - 28 = ?", answer: 47 },
          { text: "9 × 2 = ?", answer: 18 },
          { text: "5 × 6 = ?", answer: 30 },
          { text: "60 + 25 = ?", answer: 85 },
          { text: "88 - 40 = ?", answer: 48 },
          { text: "7 × 4 = ?", answer: 28 },
          { text: "92 - 37 = ?", answer: 55 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “alegría”", options: ["felicidad", "tristeza", "miedo"], correctIndex: 0 },
          { prompt: "Antónimo de “éxito”", options: ["fracaso", "aplauso", "premio"], correctIndex: 0 },
          { prompt: "Sinónimo de “cuidar”", options: ["proteger", "romper", "olvidar"], correctIndex: 0 },
          { prompt: "Antónimo de “aceptar”", options: ["rechazar", "apoyar", "ver"], correctIndex: 0 },
          { prompt: "Sinónimo de “cansancio”", options: ["fatiga", "energía", "calma"], correctIndex: 0 },
          { prompt: "Antónimo de “avanzar”", options: ["retroceder", "mover", "crecer"], correctIndex: 0 },
          { prompt: "Sinónimo de “importante”", options: ["relevante", "pequeño", "débil"], correctIndex: 0 },
          { prompt: "Antónimo de “público”", options: ["privado", "abierto", "amable"], correctIndex: 0 },
          { prompt: "Sinónimo de “cambiar”", options: ["modificar", "mantener", "parar"], correctIndex: 0 },
          { prompt: "Antónimo de “ordenado”", options: ["desordenado", "limpio", "bonito"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["doctor","escuela","mercado","farmacia","familia","cocina","paraguas","chaqueta","piscina","pintor"],
          ["doctor","escuela","mercado","farmacia","familia","cocina","paraguas","chaqueta","piscina","pintor","cartero","guitarra","bosque","avión","barco","ciudad","pueblo","limón","tomillo","cinturón"]
        )
      },
      {
        testId: "medio-3",
        math: makeMath10([
          { text: "47 + 28 = ?", answer: 75 },
          { text: "120 - 55 = ?", answer: 65 },
          { text: "66 + 19 = ?", answer: 85 },
          { text: "90 - 44 = ?", answer: 46 },
          { text: "8 × 5 = ?", answer: 40 },
          { text: "6 × 7 = ?", answer: 42 },
          { text: "35 + 48 = ?", answer: 83 },
          { text: "110 - 29 = ?", answer: 81 },
          { text: "9 × 3 = ?", answer: 27 },
          { text: "72 - 26 = ?", answer: 46 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “objetivo”", options: ["meta", "excusa", "duda"], correctIndex: 0 },
          { prompt: "Antónimo de “inocente”", options: ["culpable", "pacífico", "lento"], correctIndex: 0 },
          { prompt: "Sinónimo de “tarea”", options: ["trabajo", "descanso", "juego"], correctIndex: 0 },
          { prompt: "Antónimo de “abundante”", options: ["escaso", "rico", "grande"], correctIndex: 0 },
          { prompt: "Sinónimo de “revisar”", options: ["comprobar", "romper", "ocultar"], correctIndex: 0 },
          { prompt: "Antónimo de “correcto”", options: ["incorrecto", "claro", "serio"], correctIndex: 0 },
          { prompt: "Sinónimo de “urgente”", options: ["inmediato", "lento", "tranquilo"], correctIndex: 0 },
          { prompt: "Antónimo de “visible”", options: ["oculto", "claro", "alto"], correctIndex: 0 },
          { prompt: "Sinónimo de “consejo”", options: ["recomendación", "castigo", "silencio"], correctIndex: 0 },
          { prompt: "Antónimo de “optimista”", options: ["pesimista", "valiente", "rápido"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["montaña","valle","playa","isla","bosque","río","puente","carretera","tren","avión"],
          ["montaña","valle","playa","isla","bosque","río","puente","carretera","tren","avión","túnel","semaforo","bicicleta","lápiz","cuadro","baúl","plaza","catedral","pimienta","azafrán"]
        )
      }
    ],

    dificil: [
      {
        testId: "dificil-1",
        math: makeMath10([
          { text: "12 × 4 = ?", answer: 48 },
          { text: "56 ÷ 7 = ?", answer: 8 },
          { text: "18 × 3 = ?", answer: 54 },
          { text: "81 ÷ 9 = ?", answer: 9 },
          { text: "7 × 6 + 5 = ?", answer: 47 },
          { text: "30 + 24 ÷ 6 = ?", answer: 34 },
          { text: "(15 - 3) × 2 = ?", answer: 24 },
          { text: "90 ÷ 10 + 7 = ?", answer: 16 },
          { text: "6 × 5 - 8 = ?", answer: 22 },
          { text: "72 ÷ 8 = ?", answer: 9 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “atención”", options: ["concentración", "olvido", "prisa"], correctIndex: 0 },
          { prompt: "Antónimo de “preciso”", options: ["impreciso", "correcto", "seguro"], correctIndex: 0 },
          { prompt: "Sinónimo de “análisis”", options: ["evaluación", "fiesta", "descanso"], correctIndex: 0 },
          { prompt: "Antónimo de “responsabilidad”", options: ["irresponsabilidad", "trabajo", "orden"], correctIndex: 0 },
          { prompt: "Sinónimo de “organización”", options: ["planificación", "caos", "ruido"], correctIndex: 0 },
          { prompt: "Antónimo de “eficiente”", options: ["ineficiente", "rápido", "fácil"], correctIndex: 0 },
          { prompt: "Sinónimo de “solución”", options: ["respuesta", "problema", "error"], correctIndex: 0 },
          { prompt: "Antónimo de “privacidad”", options: ["exposición", "seguridad", "cuidado"], correctIndex: 0 },
          { prompt: "Sinónimo de “constancia”", options: ["perseverancia", "pereza", "duda"], correctIndex: 0 },
          { prompt: "Antónimo de “beneficioso”", options: ["perjudicial", "útil", "práctico"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["biblioteca","electricidad","temperatura","calendario","medicina","carretera","organización","análisis","memoria","atención"],
          ["biblioteca","electricidad","temperatura","calendario","medicina","carretera","organización","análisis","memoria","atención",
           "arquitectura","fotografía","meditación","equilibrio","ventilador","gasolina","pendiente","uniforme","monedero","escalera"]
        )
      },
      {
        testId: "dificil-2",
        math: makeMath10([
          { text: "14 × 3 = ?", answer: 42 },
          { text: "63 ÷ 9 = ?", answer: 7 },
          { text: "25 × 2 = ?", answer: 50 },
          { text: "96 ÷ 12 = ?", answer: 8 },
          { text: "8 × 7 - 6 = ?", answer: 50 },
          { text: "40 - 18 ÷ 3 = ?", answer: 34 },
          { text: "(20 + 10) ÷ 5 = ?", answer: 6 },
          { text: "9 × 5 + 10 = ?", answer: 55 },
          { text: "84 ÷ 7 = ?", answer: 12 },
          { text: "6 × (4 + 1) = ?", answer: 30 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “motivación”", options: ["incentivo", "cansancio", "miedo"], correctIndex: 0 },
          { prompt: "Antónimo de “transparencia”", options: ["opacidad", "claridad", "luz"], correctIndex: 0 },
          { prompt: "Sinónimo de “información”", options: ["datos", "silencio", "miedo"], correctIndex: 0 },
          { prompt: "Antónimo de “coherente”", options: ["incoherente", "ordenado", "claro"], correctIndex: 0 },
          { prompt: "Sinónimo de “consecuencia”", options: ["resultado", "inicio", "duda"], correctIndex: 0 },
          { prompt: "Antónimo de “objetivo”", options: ["subjetivo", "claro", "real"], correctIndex: 0 },
          { prompt: "Sinónimo de “experiencia”", options: ["práctica", "azar", "desorden"], correctIndex: 0 },
          { prompt: "Antónimo de “seguro”", options: ["arriesgado", "firme", "correcto"], correctIndex: 0 },
          { prompt: "Sinónimo de “prioridad”", options: ["importancia", "olvido", "pereza"], correctIndex: 0 },
          { prompt: "Antónimo de “oportunidad”", options: ["obstáculo", "posibilidad", "suerte"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["responsabilidad","prioridad","consecuencia","oportunidad","experiencia","información","comunicación","motivación","solución","objetivo"],
          ["responsabilidad","prioridad","consecuencia","oportunidad","experiencia","información","comunicación","motivación","solución","objetivo",
           "presentación","investigación","pensamiento","transparencia","vinculación","herramienta","alfombra","parabrisas","cucharilla","escalera"]
        )
      },
      {
        testId: "dificil-3",
        math: makeMath10([
          { text: "16 × 4 = ?", answer: 64 },
          { text: "99 ÷ 11 = ?", answer: 9 },
          { text: "35 × 2 = ?", answer: 70 },
          { text: "144 ÷ 12 = ?", answer: 12 },
          { text: "10 × 6 - 15 = ?", answer: 45 },
          { text: "60 ÷ 5 + 8 = ?", answer: 20 },
          { text: "(18 + 6) ÷ 3 = ?", answer: 8 },
          { text: "7 × 9 - 9 = ?", answer: 54 },
          { text: "120 ÷ 10 = ?", answer: 12 },
          { text: "5 × (8 - 3) = ?", answer: 25 }
        ]),
        lex: makeLex10([
          { prompt: "Sinónimo de “empatía”", options: ["comprensión", "egoísmo", "prisa"], correctIndex: 0 },
          { prompt: "Antónimo de “flexible”", options: ["rígido", "suave", "calmo"], correctIndex: 0 },
          { prompt: "Sinónimo de “precaución”", options: ["cautela", "prisa", "ruido"], correctIndex: 0 },
          { prompt: "Antónimo de “constante”", options: ["inconstante", "firme", "seguro"], correctIndex: 0 },
          { prompt: "Sinónimo de “disciplina”", options: ["orden", "caos", "suerte"], correctIndex: 0 },
          { prompt: "Antónimo de “confianza”", options: ["desconfianza", "alegría", "calma"], correctIndex: 0 },
          { prompt: "Sinónimo de “decisión”", options: ["determinación", "duda", "miedo"], correctIndex: 0 },
          { prompt: "Antónimo de “creatividad”", options: ["bloqueo", "imaginación", "arte"], correctIndex: 0 },
          { prompt: "Sinónimo de “esfuerzo”", options: ["dedicación", "pereza", "descanso"], correctIndex: 0 },
          { prompt: "Antónimo de “paciencia”", options: ["impaciencia", "calma", "silencio"], correctIndex: 0 }
        ]),
        mem: makeMem(
          ["precaución","disciplina","constancia","flexibilidad","creatividad","confianza","empatía","decisión","paciencia","esfuerzo"],
          ["precaución","disciplina","constancia","flexibilidad","creatividad","confianza","empatía","decisión","paciencia","esfuerzo",
           "angustia","molestia","amabilidad","serenidad","pereza","compromiso","cercanía","distancia","invierno","cereza"]
        )
      }
    ]
  };
}

// ===============================
// Seed button
// ===============================

seedBtn.addEventListener("click", async () => {
  try {
    if (!currentUser) {
      showMessage("❌ No hay sesión. Inicia sesión primero.", "err");
      return;
    }

    seedBtn.disabled = true;
    showMessage("⏳ Cargando 9 tests demo (3 por nivel)…", "warn");

    const seedData = buildSeedData();
    const batch = writeBatch(db);

    for (const level of Object.keys(seedData)) {
      for (const t of seedData[level]) {
        const ref = doc(db, "tests", level, "items", t.testId);
        batch.set(ref, { math: t.math, lex: t.lex, mem: t.mem }, { merge: true });
      }
    }

    await batch.commit();
    showMessage("✅ Listo. Ya tienes 9 tests en Firestore.", "ok");
  } catch (err) {
    console.error(err);
    showMessage("❌ Error al cargar tests (mira consola F12).", "err");
  } finally {
    seedBtn.disabled = false;
  }
});