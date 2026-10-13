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