import { obtenerPacks, obtenerDatosUsuario, logoutUsuario } from './firebase.js';

async function cargarDatos() {
    const usuarioID = localStorage.getItem("usuarioID");

    if (!usuarioID) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Obtener datos del usuario
        const datosUsuario = await obtenerDatosUsuario(usuarioID);
        
        if (datosUsuario) {
            // Mostrar el nombre del usuario en el welcome
            const welcomeElement = document.getElementById('welcome');
            welcomeElement.textContent = `¡Hola, ${datosUsuario.nombre}!`;
            
            // Mostrar información adicional del usuario
            console.log('Datos del usuario:', datosUsuario);
        }

        // Obtener historial de packs
        const packs = await obtenerPacks(usuarioID);
        console.log("Historial de packs:", packs);

        // Aquí luego conectamos Chart.js para mostrar progreso
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('Error al cargar los datos');
    }
}

// Función para cerrar sesión
async function cerrarSesion() {
    try {
        await logoutUsuario();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Cargar datos al iniciar
cargarDatos();

// Exportar función de logout para usarla en el HTML si es necesario
window.cerrarSesion = cerrarSesion;
