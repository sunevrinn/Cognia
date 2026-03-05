import { guardarPackDiario, obtenerDatosUsuario, logoutUsuario } from './firebase.js';

// Cargar información del usuario
async function cargarUsuario() {
    const usuarioID = localStorage.getItem("usuarioID");
    
    if (!usuarioID) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const datosUsuario = await obtenerDatosUsuario(usuarioID);
        if (datosUsuario) {
            document.getElementById('welcomeUser').textContent = `Hola, ${datosUsuario.nombre}`;
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
        document.getElementById('welcomeUser').textContent = 'Bienvenido';
    }
}

// Función para iniciar una actividad
async function iniciarActividad(tipoActividad) {
    const usuarioID = localStorage.getItem("usuarioID");
    
    if (!usuarioID) {
        alert('Por favor inicia sesión primero');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Simular una puntuación (esto será dinámico según la actividad)
        const puntaje = Math.floor(Math.random() * 100) + 50; // Entre 50 y 150 puntos

        alert(`¡Actividad ${tipoActividad} completada!\nPuntuación: ${puntaje}`);

        // Guardar en la base de datos
        await guardarPackDiario(usuarioID, {
            tipo: tipoActividad,
            puntos: puntaje,
            fecha: new Date().toISOString()
        });

        alert('¡Puntuación guardada exitosamente!');
        console.log(`Actividad guardada: ${tipoActividad} - ${puntaje} puntos`);
    } catch (error) {
        console.error('Error guardando actividad:', error);
        alert('Error al guardar la actividad');
    }
}

// Función para cerrar sesión
async function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        try {
            await logoutUsuario();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
        }
    }
}

// Hacer funciones globales
window.iniciarActividad = iniciarActividad;
window.cerrarSesion = cerrarSesion;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarUsuario);