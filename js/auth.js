// ============================================================
// auth.js - Lógica de autenticación (Login y Registro)
// ============================================================
// Este archivo maneja toda la lógica de:
// - Validación de formularios
// - Alternancia entre formularios (login ↔ registro)
// - Manejo de errores y mensajes
// - Integración con Firebase Authentication

// Importar funciones de Firebase desde firebase.js
import { registrarUsuario, loginUsuario } from './firebase.js';

// ============================================================
// VARIABLES DE DOM - Elementos del formulario
// ============================================================

// Formularios principales
const loginForm = document.getElementById('loginForm');          // Formulario de inicio de sesión
const registerForm = document.getElementById('registerForm');    // Formulario de registro
const toggleToRegister = document.getElementById('toggleToRegister');  // Botón para ir a registro
const toggleToLogin = document.getElementById('toggleToLogin');        // Botón para ir a login
const loading = document.getElementById('loading');              // Indicador de carga
const successMsg = document.getElementById('successMsg');        // Mensaje de éxito

// Campos del formulario de LOGIN
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginEmailError = document.getElementById('loginEmailError');
const loginPasswordError = document.getElementById('loginPasswordError');

// Campos del formulario de REGISTRO
const registerName = document.getElementById('registerName');
const registerGenero = document.getElementById('registerGenero');
const registerEmail = document.getElementById('registerEmail');
const registerDate = document.getElementById('registerDate');
const registerPassword = document.getElementById('registerPassword');
const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
const registerNameError = document.getElementById('registerNameError');
const registerGeneroError = document.getElementById('registerGeneroError');
const registerEmailError = document.getElementById('registerEmailError');
const registerDateError = document.getElementById('registerDateError');
const registerPasswordError = document.getElementById('registerPasswordError');
const registerPasswordConfirmError = document.getElementById('registerPasswordConfirmError');

// ============================================================
// ALTERNANCIA DE FORMULARIOS
// ============================================================

// Mostrar formulario de REGISTRO y ocultar LOGIN
toggleToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');         // Oculta formulario de login
    registerForm.classList.remove('hidden');   // Muestra formulario de registro
    limpiarErrores();                           // Limpia mensajes de error previos
});

// Mostrar formulario de LOGIN y ocultar REGISTRO
toggleToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');      // Oculta formulario de registro
    loginForm.classList.remove('hidden');      // Muestra formulario de login
    limpiarErrores();                           // Limpia mensajes de error previos
});

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

// Limpiar todos los mensajes de error de la pantalla
function limpiarErrores() {
    const errors = document.querySelectorAll('.error');
    errors.forEach(error => error.classList.remove('show'));
}

// Mostrar un mensaje de error en un elemento específico
function mostrarError(elemento, mensaje) {
    elemento.textContent = mensaje;      // Establece el texto del error
    elemento.classList.add('show');      // Lo hace visible
}

// Ocultar un mensaje de error específico
function ocultarError(elemento) {
    elemento.classList.remove('show');   // Lo hace invisible
}

// Mostrar o ocultar el indicador de carga (spinner)
function mostrarLoading(show = true) {
    loading.style.display = show ? 'block' : 'none';
}

// Mostrar un mensaje de éxito que desaparece después de 5 segundos
function mostrarExito(mensaje) {
    successMsg.textContent = mensaje;
    successMsg.classList.add('show');
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 5000);
}

// ============================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================

// Validar que el email tenga formato correcto (con @)
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validar que la contraseña tenga mínimo 6 caracteres
function validarContraseña(password) {
    return password.length >= 6;
}

// Validar que el nombre tenga mínimo 3 caracteres
function validarNombre(nombre) {
    return nombre.trim().length >= 3;
}

// Validar que la edad sea mínimo 13 años
function validarFechaNacimiento(fecha) {
    if (!fecha) return false;
    const date = new Date(fecha);
    const hoy = new Date();
    const edad = hoy.getFullYear() - date.getFullYear();
    return edad >= 13;
}

// ============================================================
// EVENTO: ENVÍO DE FORMULARIO DE LOGIN
// ============================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();  // Evita recargar la página

    // Limpiar errores previos antes de validar de nuevo
    limpiarErrores();

    // Obtener valores del formulario
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    // VALIDACIÓN: Verificar que los datos sean válidos
    let esValido = true;

    // Validar que el email tenga formato correcto
    if (!validarEmail(email)) {
        mostrarError(loginEmailError, 'Por favor ingresa un correo válido');
        esValido = false;
    } else {
        ocultarError(loginEmailError);
    }

    // Validar que haya ingresado una contraseña
    if (!password) {
        mostrarError(loginPasswordError, 'Por favor ingresa tu contraseña');
        esValido = false;
    } else {
        ocultarError(loginPasswordError);
    }

    // Si hay errores de validación, detenerse aquí
    if (!esValido) return;

    // Mostrar indicador de carga mientras procesa
    mostrarLoading(true);

    try {
        // INTENTAR LOGIN: Llamar a Firebase para autenticar al usuario
        const usuarioID = await loginUsuario(email, password);
        mostrarExito('¡Sesión iniciada correctamente!');
        
        // Guardar el ID del usuario en localStorage (almacenamiento local del navegador)
        localStorage.setItem('usuarioID', usuarioID);
        
        // Esperar 1.5 segundos y luego redirigir a la página de actividades
        setTimeout(() => {
            window.location.href = 'activities.html';
        }, 1500);
    } catch (error) {
        // MANEJO DE ERRORES: Si el login falla, mostrar mensaje de error
        console.error('Error en login:', error);
        console.error('Código de error:', error.code);
        
        // Verificar el tipo de error y mostrar mensaje apropiado
        if (error.code === 'auth/invalid-email') {
            // Email con formato incorrecto
            mostrarError(loginEmailError, 'Formato de correo inválido');
        } else if (error.code === 'auth/too-many-requests') {
            // Demasiados intentos fallidos - protección contra ataques
            mostrarError(loginPasswordError, 'Demasiados intentos. Intenta más tarde');
        } else {
            // Email o contraseña incorrectos (no especificar cuál por seguridad)
            mostrarError(loginPasswordError, 'Contraseña o email incorrectos. ¡Inténtalo de nuevo!');
        }
        
        // Preservar los valores que el usuario escribió (no limpiar los campos)
        loginEmail.value = email;
        loginPassword.value = password;
    } finally {
        // Siempre: Ocultar el indicador de carga, haya error o no
        mostrarLoading(false);
    }
});

// ============================================================
// EVENTO: ENVÍO DE FORMULARIO DE REGISTRO
// ============================================================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();  // Evita recargar la página

    // Limpiar errores previos antes de validar de nuevo
    limpiarErrores();

    // Obtener valores del formulario
    const nombre = registerName.value.trim();
    const email = registerEmail.value.trim();
    const fechaNacimiento = registerDate.value;
    const password = registerPassword.value;
    const passwordConfirm = registerPasswordConfirm.value;

    // Validaciones
    let esValido = true;

    if (!validarNombre(nombre)) {
        mostrarError(registerNameError, 'El nombre de usuario debe tener al menos 3 caracteres');
        esValido = false;
    } else {
        ocultarError(registerNameError);
    }

    const genero = registerGenero.value;
    if (!genero) {
        mostrarError(registerGeneroError, 'Por favor selecciona un género');
        esValido = false;
    } else {
        ocultarError(registerGeneroError);
    }

    if (!validarEmail(email)) {
        mostrarError(registerEmailError, 'Por favor ingresa un correo válido');
        esValido = false;
    } else {
        ocultarError(registerEmailError);
    }

    if (!validarFechaNacimiento(fechaNacimiento)) {
        mostrarError(registerDateError, 'Debes tener al menos 13 años');
        esValido = false;
    } else {
        ocultarError(registerDateError);
    }

    if (!validarContraseña(password)) {
        mostrarError(registerPasswordError, 'La contraseña debe tener al mínimo 6 caracteres');
        esValido = false;
    } else {
        ocultarError(registerPasswordError);
    }

    if (password !== passwordConfirm) {
        mostrarError(registerPasswordConfirmError, 'Las contraseñas no coinciden');
        esValido = false;
    } else {
        ocultarError(registerPasswordConfirmError);
    }

    if (!esValido) return;

    mostrarLoading(true);

    try {
        const usuarioID = await registrarUsuario(email, nombre, password, fechaNacimiento, genero);
        mostrarExito('¡Cuenta creada exitosamente!');
        
        localStorage.setItem('usuarioID', usuarioID);
        setTimeout(() => {
            window.location.href = 'activities.html';
        }, 1500);
    } catch (error) {
        console.error('Error en registro:', error);
        console.error('Código de error:', error.code);
        
        // Mapeo de errores mejorado
        const errorMap = {
            'auth/configuration-not-found': 'Firebase Authentication NO está habilitado. Abre: http://localhost:8000/diagnostico.html',
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/weak-password': 'La contraseña es muy débil. Usa mínimo 6 caracteres',
            'auth/invalid-email': 'Formato de correo inválido',
            'auth/unauthorized-domain': 'Tu dominio no está autorizado. Añade "localhost" a Firebase Console',
            'auth/internal-error': 'Error interno de Firebase. Verifica que esté bien configurado',
            'auth/invalid-api-key': 'Las credenciales de Firebase no son válidas'
        };
        
        const mensajeError = errorMap[error.code] || error.message || 'Error al crear la cuenta';
        mostrarError(registerEmailError, mensajeError);
        
        // Preservar valores para que no se borren
        registerName.value = nombre;
        registerGenero.value = genero;
        registerEmail.value = email;
        registerDate.value = fechaNacimiento;
        registerPassword.value = password;
        registerPasswordConfirm.value = passwordConfirm;
    } finally {
        mostrarLoading(false);
    }
});
