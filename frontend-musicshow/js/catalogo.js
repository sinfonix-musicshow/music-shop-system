// Al cargar la página, revisamos si el usuario ya había elegido un color antes
document.addEventListener("DOMContentLoaded", () => {
    const temaGuardado = localStorage.getItem("musicShowTema") || "dark";
    aplicarTema(temaGuardado);
});

function alternarTema() {
    const htmlElement = document.documentElement;
    const temaActual = htmlElement.getAttribute("data-bs-theme");
    const nuevoTema = temaActual === "dark" ? "light" : "dark";
    
    aplicarTema(nuevoTema);
    // Guardar la elección en el navegador
    localStorage.setItem("musicShowTema", nuevoTema);
}

function aplicarTema(tema) {
    const htmlElement = document.documentElement;
    const iconoTema = document.getElementById("iconoTema");
    
    htmlElement.setAttribute("data-bs-theme", tema);
    
    // Cambiar el ícono: Sol para modo oscuro (cambiar a claro), Luna para modo claro (cambiar a oscuro)
    if (tema === "dark") {
        iconoTema.className = "bi bi-sun-fill";
        iconoTema.style.color = "#ffc107"; // Sol amarillo
    } else {
        iconoTema.className = "bi bi-moon-stars-fill";
        iconoTema.style.color = "#ffffff"; // Luna blanca
    }
}

/* --------------------------------------------------------------------------------- */

// ==========================================
// ANIMACIÓN AL HACER SCROLL (RECURRENTE)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Configuramos el observador
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Cuando la sección ENTRA en pantalla, aparece
                entry.target.classList.add('visible');
            } else {
                // Cuando la sección SALE de la pantalla (al subir o bajar mucho), desaparece
                entry.target.classList.remove('visible');
            }
        });
    }, { 
        threshold: 0.10 // Se activa apenas el 10% de la sección entra en el campo de visión
    });

    // Buscamos todas las secciones que tengan la clase animacion-scroll
    const elementosAnimados = document.querySelectorAll('.animacion-scroll');
    elementosAnimados.forEach(el => observer.observe(el));
});

// ==========================================
// NAVEGACIÓN DEL CARRUSEL DE PRODUCTOS
// ==========================================
function moverCarrusel(direccion) {
    const carrusel = document.getElementById('carruselDestacados');
    // Ancho de la tarjeta (310px) + gap de Bootstrap (aprox 24px) = 334px
    const distancia = 334; 
    
    // Scrollear hacia la izquierda (-1) o derecha (1)
    carrusel.scrollBy({ 
        left: distancia * direccion, 
        behavior: 'smooth' 
    });
}

// Función universal para mover CUALQUIER carrusel pasándole su ID
function moverCarruselUniversal(idCarrusel, direccion) {
    const carrusel = document.getElementById(idCarrusel);
    if (!carrusel) return; // Si no lo encuentra, no hace nada
    
    const distancia = 334; 
    
    carrusel.scrollBy({ 
        left: distancia * direccion, 
        behavior: 'smooth' 
    });
}