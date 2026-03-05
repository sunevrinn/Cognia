// Importar funciones desde firebase.js
import { loginUsuario } from './firebase.js';

// Código principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    const usuarioID = localStorage.getItem('usuarioID');
    
    if (!usuarioID) {
        // No hay sesión, redirigir a login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});
