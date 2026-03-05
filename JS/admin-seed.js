// /js/admin-seed.js
// ---------------------------------------------------------
// Esto "siembra" Firestore con tests demo (7 por nivel).
// Es una utilidad interna para el proyecto, no para usuarios.
// ---------------------------------------------------------

import { auth, db } from "./firebase.js";

// Importo funciones Firestore (SDK modular por CDN, en firebase.js ya está inicializado todo)
import {
  doc,
  collection,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------------------------------------------------------
// 1) Mini “seguridad” por email (simple para la demo)
//    - Cambia este email por el tuyo real.
//    - En un proyecto serio, esto iría con Custom Claims + reglas.
// ---------------------------------------------------------
const ADMIN_EMAILS = [
  "harukaaa.chan@gmail.com" // <-- CAMBIA ESTO por tu email
];

// ---------------------------------------------------------
// 2) Elementos de la UI
// ---------------------------------------------------------
const seedStatus = document.getElementById("seedStatus");
const btnSeed = document.getElementById("btnSeed");
const btnGoLogin = document.getElementById("btnGoLogin");

btnGoLogin.addEventListener("click", () => {
  // Esto lo hago para volver al login rápido
  window.location.href = "./index.html";
});

// Desactivo el botón hasta verificar sesión admin
btnSeed.disabled = true;

// ---------------------------------------------------------
// 3) Compruebo si hay usuario y si su email está en ADMIN_EMAILS
// ---------------------------------------------------------
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user) {
    setStatus("❌ No hay sesión iniciada. Inicia sesión con el email admin.", "danger");
    btnSeed.disabled = true;
    return;
  }

  const email = (user.email || "").toLowerCase();
  const allowed = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);

  if (!allowed) {
    setStatus(`❌ Sesión iniciada como ${user.email}, pero NO está permitido sembrar datos.`, "danger");
    btnSeed.disabled = true;
    return;
  }

  setStatus(`✅ Admin verificado: ${user.email}. Puedes cargar los tests demo.`, "success");
  btnSeed.disabled = false;
});

// ---------------------------------------------------------
// 4) Click para sembrar
// ---------------------------------------------------------
btnSeed.addEventListener("click", async () => {
  try {
    if (!currentUser) {
      setStatus("❌ No hay sesión. Inicia sesión primero.", "danger");
      return;
    }

    btnSeed.disabled = true;
    setStatus("⏳ Cargando tests demo… No cierres esta pestaña.", "info");

    // Preparo los datos (21 tests: 7 por nivel)
    const seedData = buildSeedData();

    // Uso batch para escribir todo en una sola “tanda”
    // (más rápido y menos probable que se quede a medias)
    const batch = writeBatch(db);

    // Recorro niveles y tests
    for (const level of Object.keys(seedData)) {
      const tests = seedData[level];

      for (const t of tests) {
        // Estructura:
        // tests/{level}/items/{testId}
        const testDocRef = doc(collection(db, "tests", level, "items"), t.testId);

        batch.set(testDocRef, {
          math: t.math,
          lex: t.lex,
          mem: t.mem,
          createdAt: serverTimestamp()
        });
      }
    }

    await batch.commit();

    setStatus("✅ Tests demo cargados correctamente (7 fácil + 7 medio + 7 difícil).", "success");
  } catch (err) {
    console.error(err);
    setStatus("❌ Error al cargar tests demo. Mira la consola (F12) para más detalles.", "danger");
  } finally {
    // Lo vuelvo a habilitar por si quieres re-seedear (aunque duplicará si cambias ids)
    btnSeed.disabled = false;
  }
});

// ---------------------------------------------------------
// 5) Función para mostrar mensajes bonitos y grandes
// ---------------------------------------------------------
function setStatus(text, type = "info") {
  // type: info | success | danger
  seedStatus.textContent = `Estado: ${text}`;
  seedStatus.classList.remove("alert-info", "alert-success", "alert-danger");

  if (type === "success") seedStatus.classList.add("alert-success");
  else if (type === "danger") seedStatus.classList.add("alert-danger");
  else seedStatus.classList.add("alert-info");
}

// ---------------------------------------------------------
// 6) Datos demo (21 tests)
//    IMPORTANTE:
//    - 7 tests por nivel: facil, medio, dificil
//    - Cada test trae: math(10), lex(10), mem(10+20+10)
// ---------------------------------------------------------
function buildSeedData() {
  return {
    facil: [
      makeTest("facil-1",
        makeMathEasySet1(),
        makeLexEasySet1(),
        makeMemSet(["casa","mesa","sol","pan","flor","perro","agua","libro","coche","mano"],
                   ["casa","mesa","sol","pan","flor","perro","agua","libro","coche","mano",
                    "silla","luna","pez","taza","arroz","llave","calle","vino","pato","nube"])
      ),
      makeTest("facil-2",
        makeMathEasySet2(),
        makeLexEasySet2(),
        makeMemSet(["gato","rio","sal","tren","hoja","nieve","cielo","leche","vino","zapato"],
                   ["gato","rio","sal","tren","hoja","nieve","cielo","leche","vino","zapato",
                    "piedra","cama","fuego","camisa","plato","reloj","puerta","plaza","piano","jabon"])
      ),
      makeTest("facil-3",
        makeMathEasySet3(),
        makeLexEasySet3(),
        makeMemSet(["fruta","foto","mar","carta","luz","pez","tierra","ojo","sopa","parque"],
                   ["fruta","foto","mar","carta","luz","pez","tierra","ojo","sopa","parque",
                    "banco","sombra","cuchar","caja","pino","miel","bota","tren","cinta","vino"])
      ),
      makeTest("facil-4",
        makeMathEasySet4(),
        makeLexEasySet4(),
        makeMemSet(["cafe","azul","naranja","silla","calor","jardin","radio","cinta","llave","cama"],
                   ["cafe","azul","naranja","silla","calor","jardin","radio","cinta","llave","cama",
                    "bici","pato","pelo","barco","sal","arena","pelota","pizarra","faro","mesa"])
      ),
      makeTest("facil-5",
        makeMathEasySet5(),
        makeLexEasySet5(),
        makeMemSet(["lunes","abril","boca","nariz","brazo","pierna","pan","queso","agua","sal"],
                   ["lunes","abril","boca","nariz","brazo","pierna","pan","queso","agua","sal",
                    "azucar","tomate","sopa","coche","motor","puerta","cuerda","piedra","rio","lago"])
      ),
      makeTest("facil-6",
        makeMathEasySet6(),
        makeLexEasySet6(),
        makeMemSet(["pato","pollo","vaca","oveja","caballo","burro","huevo","arroz","lenteja","miel"],
                   ["pato","pollo","vaca","oveja","caballo","burro","huevo","arroz","lenteja","miel",
                    "queso","leche","tigre","mono","raton","cielo","nube","silla","plato","casa"])
      ),
      makeTest("facil-7",
        makeMathEasySet7(),
        makeLexEasySet7(),
        makeMemSet(["rojo","verde","blanco","negro","gris","rosa","oro","plata","cobre","hierro"],
                   ["rojo","verde","blanco","negro","gris","rosa","oro","plata","cobre","hierro",
                    "madera","papel","agua","fuego","viento","cielo","tierra","lodo","nieve","sol"])
      )
    ],

    medio: [
      makeTest("medio-1",
        makeMathMediumSet1(),
        makeLexMediumSet1(),
        makeMemSet(["ventana","camino","fiesta","amigo","juego","musica","invierno","verano","toalla","jabón"],
                   ["ventana","camino","fiesta","amigo","juego","musica","invierno","verano","toalla","jabón",
                    "cuchara","tenedor","suerte","cansancio","montaña","pintura","sonrisa","cartel","ladrillo","cereza"])
      ),
      makeTest("medio-2",
        makeMathMediumSet2(),
        makeLexMediumSet2(),
        makeMemSet(["doctor","escuela","mercado","farmacia","familia","cocina","paraguas","chaqueta","piscina","pintor"],
                   ["doctor","escuela","mercado","farmacia","familia","cocina","paraguas","chaqueta","piscina","pintor",
                    "pueblo","ciudad","cartero","cinturon","guitarra","bosque","limon","tomillo","avion","barco"])
      ),
      makeTest("medio-3",
        makeMathMediumSet3(),
        makeLexMediumSet3(),
        makeMemSet(["montaña","valle","playa","isla","bosque","río","puente","carretera","tren","avión"],
                   ["montaña","valle","playa","isla","bosque","río","puente","carretera","tren","avión",
                    "túnel","semaforo","bicicleta","lápiz","cuadro","baúl","plaza","catedral","pimienta","azafrán"])
      ),
      makeTest("medio-4",
        makeMathMediumSet4(),
        makeLexMediumSet4(),
        makeMemSet(["agenda","carpeta","bolígrafo","mensaje","llamada","batería","pantalla","teclado","ratón","cable"],
                   ["agenda","carpeta","bolígrafo","mensaje","llamada","batería","pantalla","teclado","ratón","cable",
                    "impresora","estante","cortina","colchón","fregona","espejo","salón","cocina","plátano","tomate"])
      ),
      makeTest("medio-5",
        makeMathMediumSet5(),
        makeLexMediumSet5(),
        makeMemSet(["domingo","martes","jueves","enero","mayo","octubre","mañana","tarde","noche","medianoche"],
                   ["domingo","martes","jueves","enero","mayo","octubre","mañana","tarde","noche","medianoche",
                    "amanecer","atardecer","invierno","otoño","verano","primavera","calendario","reloj","brisa","tormenta"])
      ),
      makeTest("medio-6",
        makeMathMediumSet6(),
        makeLexMediumSet6(),
        makeMemSet(["receta","sartén","horno","ensalada","azúcar","harina","pimienta","aceite","vinagre","salero"],
                   ["receta","sartén","horno","ensalada","azúcar","harina","pimienta","aceite","vinagre","salero",
                    "cuchillo","tabla","cazo","sopa","pescado","carne","pollo","arroz","limón","canela"])
      ),
      makeTest("medio-7",
        makeMathMediumSet7(),
        makeLexMediumSet7(),
        makeMemSet(["alegría","tristeza","miedo","calma","orgullo","sorpresa","paciencia","prisa","duda","certeza"],
                   ["alegría","tristeza","miedo","calma","orgullo","sorpresa","paciencia","prisa","duda","certeza",
                    "enfado","cariño","vergüenza","rutina","viaje","tarea","sueño","hambre","sed","cansancio"])
      )
    ],

    dificil: [
      makeTest("dificil-1",
        makeMathHardSet1(),
        makeLexHardSet1(),
        makeMemSet(["biblioteca","electricidad","temperatura","calendario","medicina","carretera","organización","análisis","memoria","atención"],
                   ["biblioteca","electricidad","temperatura","calendario","medicina","carretera","organización","análisis","memoria","atención",
                    "arquitectura","fotografía","meditación","equilibrio","ventilador","cortafuegos","gasolina","pendiente","uniforme","monedero"])
      ),
      makeTest("dificil-2",
        makeMathHardSet2(),
        makeLexHardSet2(),
        makeMemSet(["responsabilidad","prioridad","consecuencia","oportunidad","experiencia","información","comunicación","motivación","solución","objetivo"],
                   ["responsabilidad","prioridad","consecuencia","oportunidad","experiencia","información","comunicación","motivación","solución","objetivo",
                    "presentación","investigación","pensamiento","transparencia","vinculación","herramienta","cucharilla","alfombra","parabrisas","escalera"])
      ),
      makeTest("dificil-3",
        makeMathHardSet3(),
        makeLexHardSet3(),
        makeMemSet(["precaución","disciplina","constancia","flexibilidad","creatividad","confianza","empatía","decisión","paciencia","esfuerzo"],
                   ["precaución","disciplina","constancia","flexibilidad","creatividad","confianza","empatía","decisión","paciencia","esfuerzo",
                    "angustia","molestia","amabilidad","serenidad","pereza","compromiso","cercanía","distancia","invierno","cereza"])
      ),
      makeTest("dificil-4",
        makeMathHardSet4(),
        makeLexHardSet4(),
        makeMemSet(["transporte","mantenimiento","presupuesto","facturación","estadística","porcentaje","promedio","resultado","proceso","revisión"],
                   ["transporte","mantenimiento","presupuesto","facturación","estadística","porcentaje","promedio","resultado","proceso","revisión",
                    "bocadillo","servilleta","escaparate","pulsera","mirador","caracol","mesita","tormenta","cazuela","cangrejo"])
      ),
      makeTest("dificil-5",
        makeMathHardSet5(),
        makeLexHardSet5(),
        makeMemSet(["concentración","coordinación","orientación","percepción","estimulación","aprendizaje","seguimiento","evaluación","mejora","práctica"],
                   ["concentración","coordinación","orientación","percepción","estimulación","aprendizaje","seguimiento","evaluación","mejora","práctica",
                    "telefonillo","pasamanos","probador","lavadora","grapadora","tornillo","chaleco","sandalia","naranjo","cuchillo"])
      ),
      makeTest("dificil-6",
        makeMathHardSet6(),
        makeLexHardSet6(),
        makeMemSet(["entrenamiento","rendimiento","resistencia","velocidad","equilibrio","recuperación","movilidad","fuerza","energía","hidratación"],
                   ["entrenamiento","rendimiento","resistencia","velocidad","equilibrio","recuperación","movilidad","fuerza","energía","hidratación",
                    "carpintero","ceramista","aguacate","candelabro","microondas","pasarela","paraguero","colibrí","cortacésped","cebollino"])
      ),
      makeTest("dificil-7",
        makeMathHardSet7(),
        makeLexHardSet7(),
        makeMemSet(["planificación","organigrama","documentación","implementación","validación","integración","seguridad","privacidad","accesibilidad","usabilidad"],
                   ["planificación","organigrama","documentación","implementación","validación","integración","seguridad","privacidad","accesibilidad","usabilidad",
                    "cascabel","mariposa","ventanilla","montacargas","caramelo","lavabo","columna","pajarito","saxofón","molinillo"])
      )
    ]
  };
}

// ---------------------------------------------------------
// 7) Helpers de construcción (para que quede ordenado)
// ---------------------------------------------------------
function makeTest(testId, math, lex, mem) {
  return { testId, math, lex, mem };
}

function makeMemSet(showWords10, options20) {
  // En memoria, "correct" son exactamente las 10 palabras que se enseñaron.
  // options son 20 palabras en total (10 correctas + 10 nuevas).
  return {
    showWords: showWords10,
    options: options20,
    correct: showWords10
  };
}

// ---------------------------------------------------------
// 8) BLOQUE MATEMÁTICAS - FÁCIL (sumas/restas pequeñas)
// ---------------------------------------------------------
function makeMathEasySet1() {
  return [
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
  ];
}
function makeMathEasySet2() {
  return [
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
  ];
}
function makeMathEasySet3() {
  return [
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
  ];
}
function makeMathEasySet4() {
  return [
    { text: "8 + 2 = ?", answer: 10 },
    { text: "17 - 9 = ?", answer: 8 },
    { text: "6 + 6 = ?", answer: 12 },
    { text: "12 - 3 = ?", answer: 9 },
    { text: "9 + 5 = ?", answer: 14 },
    { text: "18 - 11 = ?", answer: 7 },
    { text: "7 + 1 = ?", answer: 8 },
    { text: "14 - 8 = ?", answer: 6 },
    { text: "3 + 3 = ?", answer: 6 },
    { text: "20 - 10 = ?", answer: 10 }
  ];
}
function makeMathEasySet5() {
  return [
    { text: "1 + 9 = ?", answer: 10 },
    { text: "19 - 7 = ?", answer: 12 },
    { text: "4 + 5 = ?", answer: 9 },
    { text: "16 - 6 = ?", answer: 10 },
    { text: "8 + 7 = ?", answer: 15 },
    { text: "13 - 2 = ?", answer: 11 },
    { text: "2 + 2 = ?", answer: 4 },
    { text: "11 - 9 = ?", answer: 2 },
    { text: "6 + 8 = ?", answer: 14 },
    { text: "15 - 5 = ?", answer: 10 }
  ];
}
function makeMathEasySet6() {
  return [
    { text: "7 + 7 = ?", answer: 14 },
    { text: "21 - 9 = ?", answer: 12 },
    { text: "5 + 8 = ?", answer: 13 },
    { text: "18 - 4 = ?", answer: 14 },
    { text: "9 + 2 = ?", answer: 11 },
    { text: "22 - 10 = ?", answer: 12 },
    { text: "3 + 7 = ?", answer: 10 },
    { text: "17 - 8 = ?", answer: 9 },
    { text: "6 + 9 = ?", answer: 15 },
    { text: "12 - 2 = ?", answer: 10 }
  ];
}
function makeMathEasySet7() {
  return [
    { text: "10 + 5 = ?", answer: 15 },
    { text: "25 - 10 = ?", answer: 15 },
    { text: "8 + 4 = ?", answer: 12 },
    { text: "19 - 3 = ?", answer: 16 },
    { text: "6 + 7 = ?", answer: 13 },
    { text: "20 - 8 = ?", answer: 12 },
    { text: "9 + 9 = ?", answer: 18 },
    { text: "16 - 9 = ?", answer: 7 },
    { text: "11 + 2 = ?", answer: 13 },
    { text: "14 - 7 = ?", answer: 7 }
  ];
}

// ---------------------------------------------------------
// 9) BLOQUE MATEMÁTICAS - MEDIO
//    (sumas/restas más grandes + multiplicación simple)
// ---------------------------------------------------------
function makeMathMediumSet1() {
  return [
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
  ];
}
function makeMathMediumSet2() {
  return [
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
  ];
}
function makeMathMediumSet3() {
  return [
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
  ];
}
function makeMathMediumSet4() {
  return [
    { text: "99 + 12 = ?", answer: 111 },
    { text: "150 - 68 = ?", answer: 82 },
    { text: "40 + 57 = ?", answer: 97 },
    { text: "130 - 49 = ?", answer: 81 },
    { text: "7 × 8 = ?", answer: 56 },
    { text: "4 × 9 = ?", answer: 36 },
    { text: "62 + 31 = ?", answer: 93 },
    { text: "105 - 36 = ?", answer: 69 },
    { text: "8 × 3 = ?", answer: 24 },
    { text: "84 - 58 = ?", answer: 26 }
  ];
}
function makeMathMediumSet5() {
  return [
    { text: "73 + 19 = ?", answer: 92 },
    { text: "200 - 125 = ?", answer: 75 },
    { text: "56 + 44 = ?", answer: 100 },
    { text: "160 - 79 = ?", answer: 81 },
    { text: "9 × 5 = ?", answer: 45 },
    { text: "7 × 6 = ?", answer: 42 },
    { text: "68 + 27 = ?", answer: 95 },
    { text: "140 - 66 = ?", answer: 74 },
    { text: "6 × 8 = ?", answer: 48 },
    { text: "98 - 39 = ?", answer: 59 }
  ];
}
function makeMathMediumSet6() {
  return [
    { text: "85 + 36 = ?", answer: 121 },
    { text: "170 - 92 = ?", answer: 78 },
    { text: "49 + 51 = ?", answer: 100 },
    { text: "155 - 47 = ?", answer: 108 },
    { text: "8 × 7 = ?", answer: 56 },
    { text: "5 × 8 = ?", answer: 40 },
    { text: "74 + 18 = ?", answer: 92 },
    { text: "190 - 75 = ?", answer: 115 },
    { text: "9 × 4 = ?", answer: 36 },
    { text: "130 - 88 = ?", answer: 42 }
  ];
}
function makeMathMediumSet7() {
  return [
    { text: "64 + 28 = ?", answer: 92 },
    { text: "210 - 99 = ?", answer: 111 },
    { text: "88 + 15 = ?", answer: 103 },
    { text: "175 - 63 = ?", answer: 112 },
    { text: "7 × 9 = ?", answer: 63 },
    { text: "6 × 6 = ?", answer: 36 },
    { text: "52 + 49 = ?", answer: 101 },
    { text: "160 - 80 = ?", answer: 80 },
    { text: "8 × 4 = ?", answer: 32 },
    { text: "120 - 45 = ?", answer: 75 }
  ];
}

// ---------------------------------------------------------
// 10) BLOQUE MATEMÁTICAS - DIFÍCIL
//     (multiplicación/división simple + combinadas básicas)
// ---------------------------------------------------------
function makeMathHardSet1() {
  return [
    { text: "12 × 4 = ?", answer: 48 },
    { text: "56 ÷ 7 = ?", answer: 8 },
    { text: "18 × 3 = ?", answer: 54 },
    { text: "81 ÷ 9 = ?", answer: 9 },
    { text: "7 × 6 + 5 = ?", answer: 47 },     // 42 + 5
    { text: "30 + 24 ÷ 6 = ?", answer: 34 },   // 24/6=4 => 30+4
    { text: "(15 - 3) × 2 = ?", answer: 24 },
    { text: "90 ÷ 10 + 7 = ?", answer: 16 },   // 9 + 7
    { text: "6 × 5 - 8 = ?", answer: 22 },     // 30 - 8
    { text: "72 ÷ 8 = ?", answer: 9 }
  ];
}
function makeMathHardSet2() {
  return [
    { text: "14 × 3 = ?", answer: 42 },
    { text: "63 ÷ 9 = ?", answer: 7 },
    { text: "25 × 2 = ?", answer: 50 },
    { text: "96 ÷ 12 = ?", answer: 8 },
    { text: "8 × 7 - 6 = ?", answer: 50 },     // 56-6
    { text: "40 - 18 ÷ 3 = ?", answer: 34 },   // 18/3=6 => 40-6
    { text: "(20 + 10) ÷ 5 = ?", answer: 6 },
    { text: "9 × 5 + 10 = ?", answer: 55 },
    { text: "84 ÷ 7 = ?", answer: 12 },
    { text: "6 × (4 + 1) = ?", answer: 30 }
  ];
}
function makeMathHardSet3() {
  return [
    { text: "16 × 4 = ?", answer: 64 },
    { text: "99 ÷ 11 = ?", answer: 9 },
    { text: "35 × 2 = ?", answer: 70 },
    { text: "144 ÷ 12 = ?", answer: 12 },
    { text: "10 × 6 - 15 = ?", answer: 45 },
    { text: "60 ÷ 5 + 8 = ?", answer: 20 },   // 12+8
    { text: "(18 + 6) ÷ 3 = ?", answer: 8 },
    { text: "7 × 9 - 9 = ?", answer: 54 },
    { text: "120 ÷ 10 = ?", answer: 12 },
    { text: "5 × (8 - 3) = ?", answer: 25 }
  ];
}
function makeMathHardSet4() {
  return [
    { text: "13 × 5 = ?", answer: 65 },
    { text: "72 ÷ 9 = ?", answer: 8 },
    { text: "21 × 3 = ?", answer: 63 },
    { text: "150 ÷ 5 = ?", answer: 30 },
    { text: "9 × 8 + 4 = ?", answer: 76 },
    { text: "100 - 48 ÷ 6 = ?", answer: 92 }, // 48/6=8 => 100-8
    { text: "(24 - 4) × 2 = ?", answer: 40 },
    { text: "96 ÷ 8 + 1 = ?", answer: 13 },
    { text: "11 × 4 - 10 = ?", answer: 34 },
    { text: "81 ÷ 3 = ?", answer: 27 }
  ];
}
function makeMathHardSet5() {
  return [
    { text: "15 × 6 = ?", answer: 90 },
    { text: "84 ÷ 12 = ?", answer: 7 },
    { text: "27 × 2 = ?", answer: 54 },
    { text: "132 ÷ 11 = ?", answer: 12 },
    { text: "8 × 9 - 20 = ?", answer: 52 },
    { text: "45 + 36 ÷ 6 = ?", answer: 51 }, // 36/6=6 => 45+6
    { text: "(30 - 10) ÷ 4 = ?", answer: 5 },
    { text: "7 × 7 + 2 = ?", answer: 51 },
    { text: "144 ÷ 9 = ?", answer: 16 },
    { text: "6 × (10 - 4) = ?", answer: 36 }
  ];
}
function makeMathHardSet6() {
  return [
    { text: "18 × 5 = ?", answer: 90 },
    { text: "108 ÷ 9 = ?", answer: 12 },
    { text: "32 × 3 = ?", answer: 96 },
    { text: "160 ÷ 8 = ?", answer: 20 },
    { text: "12 × 4 + 6 = ?", answer: 54 },
    { text: "90 - 30 ÷ 5 = ?", answer: 84 }, // 30/5=6 => 90-6
    { text: "(28 + 12) ÷ 5 = ?", answer: 8 },
    { text: "9 × 6 - 7 = ?", answer: 47 },
    { text: "200 ÷ 10 = ?", answer: 20 },
    { text: "5 × (12 - 7) = ?", answer: 25 }
  ];
}
function makeMathHardSet7() {
  return [
    { text: "17 × 4 = ?", answer: 68 },
    { text: "96 ÷ 6 = ?", answer: 16 },
    { text: "45 × 2 = ?", answer: 90 },
    { text: "121 ÷ 11 = ?", answer: 11 },
    { text: "10 × 8 + 12 = ?", answer: 92 },
    { text: "70 - 24 ÷ 3 = ?", answer: 62 }, // 24/3=8 => 70-8
    { text: "(50 - 20) ÷ 6 = ?", answer: 5 },
    { text: "8 × 8 - 9 = ?", answer: 55 },
    { text: "180 ÷ 12 = ?", answer: 15 },
    { text: "6 × (7 + 3) = ?", answer: 60 }
  ];
}

// ---------------------------------------------------------
// 11) BLOQUE LÉXICO - FÁCIL (sinónimos y antónimos simples)
// ---------------------------------------------------------
function makeLexEasySet1() {
  return [
    { prompt: "Selecciona el sinónimo de “feliz”", options: ["contento", "triste", "enfadado"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “frío”", options: ["caliente", "helado", "fresco"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “rápido”", options: ["veloz", "lento", "pesado"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “grande”", options: ["pequeño", "alto", "ancho"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “bonito”", options: ["hermoso", "feo", "sucio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “viejo”", options: ["nuevo", "antiguo", "gastado"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “ayuda”", options: ["apoyo", "daño", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “día”", options: ["noche", "sol", "mañana"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “fácil”", options: ["sencillo", "difícil", "raro"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “lleno”", options: ["vacío", "redondo", "duro"], correctIndex: 0 }
  ];
}
function makeLexEasySet2() {
  return [
    { prompt: "Selecciona el antónimo de “alegre”", options: ["triste", "rápido", "suave"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cansado”", options: ["agotado", "fuerte", "nuevo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “alto”", options: ["bajo", "largo", "grueso"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “empezar”", options: ["comenzar", "terminar", "romper"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “rápido”", options: ["lento", "ágil", "pronto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cerca”", options: ["próximo", "lejos", "abierto"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “limpio”", options: ["sucio", "claro", "seco"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “mirar”", options: ["ver", "romper", "cortar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “encender”", options: ["apagar", "subir", "correr"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “hablar”", options: ["conversar", "callar", "perder"], correctIndex: 0 }
  ];
}
function makeLexEasySet3() {
  return [
    { prompt: "Selecciona el sinónimo de “valiente”", options: ["atrevido", "miedoso", "tímido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “fuerte”", options: ["débil", "grande", "alto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “regalo”", options: ["obsequio", "castigo", "problema"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “feliz”", options: ["triste", "contento", "alegre"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “enojado”", options: ["enfadado", "tranquilo", "lento"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “entrar”", options: ["salir", "subir", "girar"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “paz”", options: ["calma", "ruido", "prisa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “duro”", options: ["blando", "fuerte", "serio"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “rápidamente”", options: ["deprisa", "despacio", "nunca"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “luz”", options: ["oscuridad", "sol", "día"], correctIndex: 0 }
  ];
}
function makeLexEasySet4() {
  return [
    { prompt: "Selecciona el sinónimo de “rico” (comida)", options: ["sabroso", "pobre", "amargo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “fácil”", options: ["difícil", "simple", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “bonito”", options: ["precioso", "feo", "malo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “abierto”", options: ["cerrado", "alto", "ancho"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “asustado”", options: ["con miedo", "contento", "enfado"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “mojado”", options: ["seco", "frío", "fácil"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “gritar”", options: ["chillar", "susurrar", "dormir"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “nuevo”", options: ["viejo", "claro", "bajo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “camino”", options: ["ruta", "puerta", "mesa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “calma”", options: ["nervios", "silencio", "paz"], correctIndex: 0 }
  ];
}
function makeLexEasySet5() {
  return [
    { prompt: "Selecciona el sinónimo de “terminar”", options: ["acabar", "empezar", "mirar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “arriba”", options: ["abajo", "dentro", "cerca"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “pequeño”", options: ["chico", "enorme", "alto"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “cerca”", options: ["lejos", "próximo", "junto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “enfermo”", options: ["malo", "sano", "rápido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “subir”", options: ["bajar", "correr", "ver"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “ayudar”", options: ["asistir", "romper", "callar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “claro”", options: ["oscuro", "brillante", "blanco"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “caliente”", options: ["ardiente", "frío", "mojado"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “rápido”", options: ["lento", "veloz", "ágil"], correctIndex: 0 }
  ];
}
function makeLexEasySet6() {
  return [
    { prompt: "Selecciona el sinónimo de “encontrar”", options: ["hallar", "perder", "romper"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “dulce”", options: ["amargo", "suave", "rico"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cuidar”", options: ["proteger", "dañar", "olvidar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “vacío”", options: ["lleno", "abierto", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “viento”", options: ["brisa", "humo", "fuego"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “largo”", options: ["corto", "alto", "grande"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “contestar”", options: ["responder", "preguntar", "olvidar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “tranquilo”", options: ["nervioso", "callado", "calmo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “casa”", options: ["hogar", "calle", "mar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “fuerte”", options: ["débil", "duro", "alto"], correctIndex: 0 }
  ];
}
function makeLexEasySet7() {
  return [
    { prompt: "Selecciona el sinónimo de “saltar”", options: ["brincar", "parar", "dormir"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “rápido”", options: ["lento", "pronto", "veloz"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “miedo”", options: ["temor", "alegría", "paz"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “reír”", options: ["llorar", "jugar", "hablar"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “bonita”", options: ["guapa", "fea", "rara"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “silencio”", options: ["ruido", "calma", "paz"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “sucio”", options: ["manchado", "limpio", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “frío”", options: ["calor", "nieve", "hielo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “fácil”", options: ["simple", "difícil", "pesado"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “mejor”", options: ["peor", "bueno", "grande"], correctIndex: 0 }
  ];
}

// ---------------------------------------------------------
// 12) BLOQUE LÉXICO - MEDIO (palabras un poco más “de adulto”)
// ---------------------------------------------------------
function makeLexMediumSet1() {
  return [
    { prompt: "Selecciona el sinónimo de “rápido”", options: ["veloz", "torpe", "serio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “generoso”", options: ["egoísta", "amable", "alegre"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “tranquilo”", options: ["sereno", "furioso", "ruidoso"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “valiente”", options: ["cobarde", "fuerte", "feliz"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “comenzar”", options: ["iniciar", "finalizar", "perder"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “mejorar”", options: ["empeorar", "ayudar", "avanzar"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “intentar”", options: ["probar", "romper", "callar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “permitir”", options: ["prohibir", "dejar", "dar"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “respuesta”", options: ["solución", "pregunta", "problema"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “seguro”", options: ["peligroso", "firme", "claro"], correctIndex: 0 }
  ];
}
function makeLexMediumSet2() {
  return [
    { prompt: "Selecciona el sinónimo de “alegría”", options: ["felicidad", "tristeza", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “éxito”", options: ["fracaso", "aplauso", "premio"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cuidar”", options: ["proteger", "romper", "olvidar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “aceptar”", options: ["rechazar", "apoyar", "ver"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cansancio”", options: ["fatiga", "energía", "calma"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “avanzar”", options: ["retroceder", "mover", "crecer"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “importante”", options: ["relevante", "pequeño", "débil"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “público”", options: ["privado", "abierto", "amable"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “rápidamente”", options: ["enseguida", "tarde", "nunca"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “ordenado”", options: ["desordenado", "limpio", "bonito"], correctIndex: 0 }
  ];
}
function makeLexMediumSet3() {
  return [
    { prompt: "Selecciona el sinónimo de “objetivo”", options: ["meta", "excusa", "duda"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “inocente”", options: ["culpable", "pacífico", "lento"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “ayuda”", options: ["asistencia", "daño", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “abundante”", options: ["escaso", "rico", "grande"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “tarea”", options: ["trabajo", "descanso", "juego"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “calma”", options: ["tensión", "paz", "silencio"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “revisar”", options: ["comprobar", "romper", "ocultar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “posible”", options: ["imposible", "probable", "seguro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cambiar”", options: ["modificar", "mantener", "parar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “sencillo”", options: ["complicado", "claro", "suave"], correctIndex: 0 }
  ];
}
function makeLexMediumSet4() {
  return [
    { prompt: "Selecciona el sinónimo de “consejo”", options: ["recomendación", "castigo", "silencio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “optimista”", options: ["pesimista", "valiente", "rápido"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “error”", options: ["fallo", "acierto", "premio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “visible”", options: ["oculto", "grande", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “dificultad”", options: ["problema", "alegría", "fiesta"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “permitido”", options: ["prohibido", "posible", "abierto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “preparar”", options: ["organizar", "romper", "perder"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “aumentar”", options: ["disminuir", "subir", "crecer"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “urgente”", options: ["inmediato", "lento", "tranquilo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “correcto”", options: ["incorrecto", "claro", "serio"], correctIndex: 0 }
  ];
}
function makeLexMediumSet5() {
  return [
    { prompt: "Selecciona el sinónimo de “aprender”", options: ["estudiar", "olvidar", "romper"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “amable”", options: ["grosero", "bonito", "tranquilo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “cansado”", options: ["agotado", "fresco", "nuevo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “beneficio”", options: ["pérdida", "premio", "ganancia"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “decidir”", options: ["elegir", "dudar", "parar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “fácil”", options: ["difícil", "simple", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “ayudar”", options: ["colaborar", "dañar", "romper"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “cercano”", options: ["lejano", "próximo", "junto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “mejorar”", options: ["progresar", "empeorar", "dormir"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “seguridad”", options: ["riesgo", "orden", "calma"], correctIndex: 0 }
  ];
}
function makeLexMediumSet6() {
  return [
    { prompt: "Selecciona el sinónimo de “preciso”", options: ["exacto", "vago", "torpe"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “activo”", options: ["pasivo", "rápido", "alto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “comenzar”", options: ["iniciar", "acabar", "perder"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “acuerdo”", options: ["desacuerdo", "paz", "orden"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “tranquilidad”", options: ["serenidad", "prisa", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “abierto”", options: ["cerrado", "alto", "ancho"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “explicar”", options: ["aclarar", "ocultar", "cortar"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “complicado”", options: ["sencillo", "difícil", "pesado"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “objetivo”", options: ["propósito", "problema", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “optimista”", options: ["pesimista", "valiente", "alegre"], correctIndex: 0 }
  ];
}
function makeLexMediumSet7() {
  return [
    { prompt: "Selecciona el sinónimo de “prioridad”", options: ["preferencia", "olvido", "torpeza"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “paciencia”", options: ["impaciencia", "calma", "alegría"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “duda”", options: ["incertidumbre", "certeza", "alegría"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “valorar”", options: ["despreciar", "cuidar", "mirar"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “certeza”", options: ["seguridad", "miedo", "prisa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “calma”", options: ["ansiedad", "silencio", "paz"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “esfuerzo”", options: ["empeño", "pereza", "descanso"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “orgullo”", options: ["humildad", "fuerza", "alegría"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “prisa”", options: ["urgencia", "calma", "sueño"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “decisión”", options: ["indecisión", "valentía", "cambio"], correctIndex: 0 }
  ];
}

// ---------------------------------------------------------
// 13) BLOQUE LÉXICO - DIFÍCIL (más abstracto, pero claro)
// ---------------------------------------------------------
function makeLexHardSet1() {
  return [
    { prompt: "Selecciona el sinónimo de “atención”", options: ["concentración", "olvido", "prisa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “preciso”", options: ["impreciso", "correcto", "seguro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “análisis”", options: ["evaluación", "fiesta", "descanso"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “responsabilidad”", options: ["irresponsabilidad", "trabajo", "orden"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “organización”", options: ["planificación", "caos", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “beneficioso”", options: ["perjudicial", "útil", "práctico"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “constancia”", options: ["perseverancia", "pereza", "duda"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “eficiente”", options: ["ineficiente", "rápido", "fácil"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “solución”", options: ["respuesta", "problema", "error"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “privacidad”", options: ["exposición", "seguridad", "cuidado"], correctIndex: 0 }
  ];
}
function makeLexHardSet2() {
  return [
    { prompt: "Selecciona el sinónimo de “motivación”", options: ["incentivo", "cansancio", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “oportunidad”", options: ["obstáculo", "posibilidad", "suerte"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “consecuencia”", options: ["resultado", "inicio", "duda"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “transparencia”", options: ["opacidad", "claridad", "luz"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “información”", options: ["datos", "silencio", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “coherente”", options: ["incoherente", "ordenado", "claro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “prioridad”", options: ["importancia", "olvido", "pereza"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “objetivo”", options: ["subjetivo", "claro", "real"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “experiencia”", options: ["práctica", "azar", "desorden"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “seguro”", options: ["arriesgado", "firme", "correcto"], correctIndex: 0 }
  ];
}
function makeLexHardSet3() {
  return [
    { prompt: "Selecciona el sinónimo de “empatía”", options: ["comprensión", "egoísmo", "prisa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “flexible”", options: ["rígido", "suave", "calmo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “precaución”", options: ["cautela", "prisa", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “constante”", options: ["inconstante", "firme", "seguro"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “disciplina”", options: ["orden", "caos", "suerte"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “confianza”", options: ["desconfianza", "alegría", "calma"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “decisión”", options: ["determinación", "duda", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “creatividad”", options: ["bloqueo", "imaginación", "arte"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “esfuerzo”", options: ["dedicación", "pereza", "descanso"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “paciencia”", options: ["impaciencia", "calma", "silencio"], correctIndex: 0 }
  ];
}
function makeLexHardSet4() {
  return [
    { prompt: "Selecciona el sinónimo de “porcentaje”", options: ["proporción", "distancia", "altura"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “promedio”", options: ["extremo", "normal", "habitual"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “presupuesto”", options: ["plan de gastos", "juego", "canción"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “mantenimiento”", options: ["abandono", "cuidado", "arreglo"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “proceso”", options: ["procedimiento", "final", "error"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “revisión”", options: ["descuido", "control", "mirada"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “resultado”", options: ["conclusión", "inicio", "duda"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “exactitud”", options: ["aproximación", "precisión", "acierto"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “estadística”", options: ["datos", "cuento", "carta"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “facturación”", options: ["devolución", "cobro", "pago"], correctIndex: 0 }
  ];
}
function makeLexHardSet5() {
  return [
    { prompt: "Selecciona el sinónimo de “percepción”", options: ["sensación", "olvido", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “aprendizaje”", options: ["desconocimiento", "estudio", "práctica"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “evaluación”", options: ["valoración", "fiesta", "cansancio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “mejora”", options: ["empeoramiento", "avance", "progreso"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “seguimiento”", options: ["control", "olvido", "descanso"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “coordinación”", options: ["descoordinación", "orden", "equilibrio"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “práctica”", options: ["ejercicio", "teoría", "duda"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “estimulación”", options: ["inactividad", "energía", "ayuda"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “orientación”", options: ["dirección", "confusión", "sorpresa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “concentración”", options: ["distracción", "atención", "cuidado"], correctIndex: 0 }
  ];
}
function makeLexHardSet6() {
  return [
    { prompt: "Selecciona el sinónimo de “rendimiento”", options: ["desempeño", "olvido", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “resistencia”", options: ["debilidad", "fuerza", "energía"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “recuperación”", options: ["mejoría", "pérdida", "daño"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “equilibrio”", options: ["inestabilidad", "calma", "orden"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “movilidad”", options: ["desplazamiento", "quietud", "silencio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “fuerza”", options: ["fragilidad", "energía", "potencia"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “hidratación”", options: ["aportación de agua", "sequedad", "calor"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “velocidad”", options: ["lentitud", "prisa", "rapidez"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “energía”", options: ["vitalidad", "cansancio", "pereza"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “entrenamiento”", options: ["sedentarismo", "práctica", "ejercicio"], correctIndex: 0 }
  ];
}
function makeLexHardSet7() {
  return [
    { prompt: "Selecciona el sinónimo de “accesibilidad”", options: ["facilidad de uso", "dificultad", "ruido"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “seguridad”", options: ["vulnerabilidad", "protección", "cuidado"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “usabilidad”", options: ["comodidad de uso", "peligro", "miedo"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “privacidad”", options: ["exposición", "cuidado", "orden"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “validación”", options: ["comprobación", "duda", "error"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “integración”", options: ["separación", "unión", "mezcla"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “implementación”", options: ["puesta en práctica", "olvido", "cansancio"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “planificación”", options: ["improvisación", "orden", "calma"], correctIndex: 0 },
    { prompt: "Selecciona el sinónimo de “documentación”", options: ["registro", "ruido", "prisa"], correctIndex: 0 },
    { prompt: "Selecciona el antónimo de “coherencia”", options: ["contradicción", "claridad", "luz"], correctIndex: 0 }
  ];
}