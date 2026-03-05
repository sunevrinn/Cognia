// ============================================================
// firebase.js - Configuración y funciones de Firebase
// ============================================================
// Este archivo maneja toda la comunicación con Firebase:
// - Authentication (autenticación de usuarios)
// - Firestore (base de datos en tiempo real)
//
// Firebase es una plataforma de Google que proporciona:
// - Autenticación → Crear usuarios y verificar contraseñas
// - Firestore → Guardar datos de usuarios en la nube

// ============================================================
// IMPORTAR MÓDULOS DE FIREBASE
// ============================================================
// Estos módulos se cargan desde los servidores de Firebase (CDN)

// initializeApp: Inicializa la conexión con Firebase
// getAuth: Obtiene el servicio de autenticación
// createUserWithEmailAndPassword: Crea nueva cuenta
// signInWithEmailAndPassword: Inicia sesión
// signOut: Cierra sesión
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// getFirestore: Obtiene acceso a la base de datos
// collection: Accede a una colección de datos
// setDoc: Guarda un documento
// getDoc: Lee un documento
// getDocs: Lee múltiples documentos
// addDoc: Crea un nuevo documento
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// Estas credenciales conectan esta aplicación con el proyecto "cognia-4241e"
// en Firebase. Cada parámetro es necesario para la autenticación y acceso a datos.
const firebaseConfig = {
  apiKey: "AIzaSyDXZx_5z1uL_hyqUcci7JhugIuMjn1fuFk",           // Clave API del proyecto
  authDomain: "cognia-4241e.firebaseapp.com",                  // Dominio de autenticación
  projectId: "cognia-4241e",                                   // ID único del proyecto
  storageBucket: "cognia-4241e.firebasestorage.app",          // Almacenamiento en la nube
  messagingSenderId: "290599076501",                           // ID para mensajería
  appId: "1:290599076501:web:5b347d5651ea3f7158d19c",        // ID de la aplicación web
  measurementId: "G-LBJW595WGR"                                // Medición y analítica
};

// ============================================================
// INICIALIZAR FIREBASE
// ============================================================
// Variables globales para acceder a los servicios de Firebase en todo el archivo
let app;    // Instancia de la aplicación Firebase
let db;     // Instancia de Firestore (base de datos)
let auth;   // Instancia de Authentication (autenticación)

try {
    // Iniciar la app con las credenciales
    app = initializeApp(firebaseConfig);           // Conectar con Firebase
    db = getFirestore(app);                        // Obtener acceso a la base de datos
    auth = getAuth(app);                           // Obtener acceso a autenticación
    
    // Confirmar en consola que todo está listo
    console.log("✓ Firebase inicializado correctamente");
    console.log("Project ID:", firebaseConfig.projectId);
} catch (error) {
    // Si hay error, mostrar en consola para depuración
    console.error("✗ Error inicializando Firebase:", error);
    console.error("Verifica que las credenciales sean correctas en firebase.js");
}

// ============================================================
// FUNCIONES PRINCIPALES DE FIREBASE
// ============================================================
// Exportar significa que estas funciones pueden usarse en otros archivos (como auth.js)

// ============================================================
// 1. REGISTRAR USUARIO (Crear nueva cuenta)
// ============================================================
// Parámetros: email, nombre, contraseña, fecha de nacimiento, género
// Retorna: ID único del usuario creado
export async function registrarUsuario(email, nombre, password, fechaNacimiento, genero) {
    try {
        // PASO 1: Crear usuario en Firebase Authentication
        // Esto crea la cuenta que se usa para login/logout
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const usuarioID = userCredential.user.uid;  // ID único del usuario

        // PASO 2: Guardar los datos completos del usuario en Firestore (base de datos)
        // Esto almacena información adicional como nombre, género, fecha, etc.
        await setDoc(doc(db, "usuarios", usuarioID), {
            email: email,                           // Correo del usuario
            nombre: nombre,                         // Nombre de usuario
            genero: genero,                         // Género seleccionado
            fechaNacimiento: fechaNacimiento,       // Fecha de nacimiento
            fechaRegistro: new Date(),              // Fecha/hora del registro
            uid: usuarioID                          // ID del usuario para referencia
        });

        // Si todo va bien, mostrar en consola y retornar el ID
        console.log("Usuario registrado exitosamente:", usuarioID);
        return usuarioID;
    } catch (error) {
        // Si hay error, registrarlo en consola y relanzarlo para manejarlo en auth.js
        console.error("Error en registro:", error.message);
        throw error;
    }
}

// ============================================================
// 2. LOGIN DE USUARIO (Iniciar sesión)
// ============================================================
// Parámetros: email y contraseña
// Retorna: ID único del usuario autenticado
// Nota: Firebase verifica automáticamente que la contraseña sea correcta
export async function loginUsuario(email, password) {
    try {
        // Intentar autenticar el usuario con email y contraseña
        // Si fallan, Firebase lanza un error automáticamente
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Si todo va bien, retornar el ID del usuario
        return userCredential.user.uid;
    } catch (error) {
        // Si hay error (usuario no existe, contraseña incorrecta, etc.)
        console.error("Error en login:", error.message);
        throw error;  // Relanzar el error para manejarlo en auth.js
    }
}

// ============================================================
// 3. VERIFICAR SI UN CORREO EXISTE
// ============================================================
// Parámetros: correo a verificar
// Retorna: true si el correo está registrado, false si no
export async function verificarEmailExiste(email) {
    try {
        // Pedir a Firebase una lista de métodos de login para este email
        // Si el email está registrado, devuelve un array con métodos
        // Si no está registrado, devuelve array vacío
        const metodos = await fetchSignInMethodsForEmail(auth, email);
        console.log("Métodos para", email, ":", metodos);
        
        // Retornar true si hay al menos un método (el email existe)
        return metodos && metodos.length > 0;
    } catch (error) {
        // Si hay error, asumir que el email no existe
        console.error("Error verificando email:", error.message);
        return false;
    }
}

// ============================================================
// 4. OBTENER DATOS DEL USUARIO
// ============================================================
// Parámetros: ID del usuario
// Retorna: Objeto con los datos del usuario (nombre, género, etc.) o null si no existe
export async function obtenerDatosUsuario(usuarioID) {
    try {
        // Buscar el documento del usuario en Firestore
        const docSnap = await getDoc(doc(db, "usuarios", usuarioID));
        
        // Si el documento existe, retornar sus datos
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Si no existe el usuario
            console.log("Usuario no encontrado");
            return null;
        }
    } catch (error) {
        console.error("Error obteniendo datos:", error.message);
        throw error;
    }
}

// ============================================================
// 5. CERRAR SESIÓN (Logout)
// ============================================================
// Cierra la sesión del usuario actual y limpia el almacenamiento local
export async function logoutUsuario() {
    try {
        // Cerrar sesión en Firebase Authentication
        await signOut(auth);
        
        // Eliminar el ID del usuario del almacenamiento local
        localStorage.removeItem("usuarioID");
        
        console.log("Sesión cerrada");

    } catch (error) {
        console.error("Error en logout:", error.message);
        throw error;
    }
}

// ============================================================
// 6. GUARDAR PACK DIARIO (Registrar actividad completada)
// ============================================================
// Parámetros: ID del usuario y puntaje obtenido
// Guarda un registro de cada actividad completada con su puntaje
export async function guardarPackDiario(usuarioID, puntaje) {
    // Crear un nuevo documento en la subcolección "packs_diarios" del usuario
    await addDoc(collection(db, "usuarios", usuarioID, "packs_diarios"), {
        puntaje: puntaje,      // Puntos obtenidos en la actividad
        fecha: new Date()       // Fecha y hora del registro
    });
}

// ============================================================
// 7. OBTENER PACKS (Traer histórico de actividades)
// ============================================================
// Parámetros: ID del usuario
// Retorna: Array con todos los packs diarios completados por el usuario
export async function obtenerPacks(usuarioID) {
    // Obtener todos los documentos de la subcolección "packs_diarios"
    const snapshot = await getDocs(collection(db, "usuarios", usuarioID, "packs_diarios"));
    
    // Convertir los documentos en un array de datos
    // snapshot.docs es un array de documentos, .map extrae solo sus datos
    return snapshot.docs.map(doc => doc.data());
}

// ============================================================
// EXPORTAR SERVICIOS
// ============================================================
// Exportar la base de datos y autenticación para usarlas en otros archivos
// Aunque pueden usarse directamente en auth.js, se exportan para flexibilidad
export { db, auth };


