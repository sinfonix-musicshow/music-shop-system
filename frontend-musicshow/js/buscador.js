// frontend-musicshow/js/buscador.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos el input y el botón por sus clases
    const inputBuscador = document.querySelector('.input-buscador');
    const btnBuscar = document.querySelector('.btn-buscar-texto');

    function ejecutarBusqueda() {
        const termino = inputBuscador.value.trim();
        if (termino !== "") {
            // Verificamos si estamos en el index o en una página interna para ajustar la ruta
            const esIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
            
            const rutaCatalogo = esIndex 
                ? 'frontend-musicshow/vistas-publicas/catalogo.html' 
                : 'catalogo.html'; // Si ya estamos dentro de vistas-publicas
            
            // Redirigimos pasando el texto en la URL
            window.location.href = `${rutaCatalogo}?buscar=${encodeURIComponent(termino)}`;
        }
    }

    if (btnBuscar && inputBuscador) {
        // Ejecutar al hacer clic en el botón
        btnBuscar.addEventListener('click', ejecutarBusqueda);
        
        // Ejecutar al presionar la tecla Enter
        inputBuscador.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                ejecutarBusqueda();
            }
        });
    }
});