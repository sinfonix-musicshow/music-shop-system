// Al cargar la página, revisamos si el usuario ya había elegido un color antes
document.addEventListener('DOMContentLoaded', () => {
    const tarjetas = document.querySelectorAll('.tarjeta-cliqueable');

    tarjetas.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            const idProducto = tarjeta.getAttribute('data-id');
            if (idProducto) {
                window.location.href = `producto.html?id=${idProducto}`;
            }
        });
    });
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

/* -------------------------------------------------------------------------- */

// ==========================================
// CARGA Y FILTRADO DE PRODUCTOS (CATÁLOGO)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener parámetros desde la URL
    const parametrosURL = new URLSearchParams(window.location.search);
    const categoria = parametrosURL.get('categoria') || 'todos'; 
    const terminoBusqueda = parametrosURL.get('buscar'); // Capturamos lo que el usuario buscó

    // 2. Actualizar el título de la página dinámicamente
    const tituloElemento = document.getElementById('titulo-categoria');
    if (tituloElemento) {
        if (terminoBusqueda) {
            tituloElemento.textContent = `Resultados para: "${terminoBusqueda}"`;
        } else if (categoria !== 'todos') {
            tituloElemento.textContent = categoria.replace('-', ' ').toUpperCase();
        } else {
            tituloElemento.textContent = "TODOS LOS PRODUCTOS";
        }
    }

    // 3. Referencias al DOM
    const contenedorProductos = document.getElementById('contenedor-productos');

    // 4. Determinar la URL de la API
    // Si hay una búsqueda, traemos TODOS los productos para filtrarlos en el JS
    // Si no hay búsqueda, usamos la URL con categoría como estaba antes
    let apiUrl = 'http://localhost:5144/api/instrumentos';
    if (categoria !== 'todos' && !terminoBusqueda) {
        apiUrl = `http://localhost:5144/api/instrumentos?categoria=${categoria}`;
    }

    // 5. Consumir la API
    fetch(apiUrl)
        .then(respuesta => {
            if (!respuesta.ok) throw new Error("Error al conectar con el servidor");
            return respuesta.json();
        })
        .then(productos => {
            contenedorProductos.innerHTML = ""; // Limpiar el spinner de carga

// 6. Aplicar el filtro de BÚSQUEDA si el usuario escribió algo
            let productosAMostrar = productos;

            if (terminoBusqueda) {
                // Función interna para limpiar tildes y pasar a minúsculas
                const limpiarTexto = (texto) => {
                    return texto
                        .normalize("NFD") // Separa las letras de sus acentos
                        .replace(/[\u0300-\u036f]/g, "") // Borra los acentos
                        .toLowerCase(); // Pasa todo a minúsculas
                };

                const textoBuscado = limpiarTexto(terminoBusqueda);
                
                // Filtramos comparando el texto limpio con los datos limpios
                productosAMostrar = productos.filter(producto => {
                    const nombreLimpio = producto.nombre ? limpiarTexto(producto.nombre) : "";
                    const marcaLimpia = producto.marca ? limpiarTexto(producto.marca) : "";
                    const categoriaLimpia = producto.categoria ? limpiarTexto(producto.categoria) : "";

                    return nombreLimpio.includes(textoBuscado) ||
                        marcaLimpia.includes(textoBuscado) ||
                        categoriaLimpia.includes(textoBuscado);
                });
            }

            // 7. Validar si hay productos para mostrar
            if (productosAMostrar.length === 0) {
                contenedorProductos.innerHTML = `
                    <div class="col-12">
                        <p class="text-secondary text-center py-5 fs-5">
                            No encontramos productos que coincidan con tu búsqueda.
                        </p>
                    </div>`;
                return;
            }

            // 8. Dibujar cada producto filtrado con el diseño moderno
            productosAMostrar.forEach(producto => {
                const precioBase = producto.precio;
                const precioLista = precioBase * 1.15; 
                const descuento = 15; 
                const envioGratis = precioBase > 500000; 
                
                const tarjetaHTML = `
                    <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
                        <a href="producto.html?id=${producto.id}" class="text-decoration-none d-block">
                            <div class="card h-100 card-producto-moderna">
                                
                            <div class="img-container">
                                    ${producto.urlImagen 
                                        ? `<img src="${producto.urlImagen}" alt="${producto.nombre}" class="w-100 h-100" style="object-fit: cover;">` 
                                        : `<div class="emoji-placeholder w-100 h-100 d-flex align-items-center justify-content-center text-white" style="font-size: 5rem;">${producto.emojiIcon || '🎸'}</div>`
                                    }
                                    
                                    <div class="badges-container">
                                        <span class="badge-descuento">-${descuento}% OFF</span>
                                        ${envioGratis ? `<span class="badge-envio">ENVÍO GRATIS</span>` : ''}
                                    </div>
                                </div>
                                
                                <div class="card-body p-0">
                                    <h5 class="producto-titulo fw-bold text-uppercase">${producto.marca} ${producto.nombre}</h5>
                                    
                                    <div class="precios-container text-start">
                                        <div class="precio-tachado">$ ${precioLista.toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                                        <div class="precio-cash">Transferencia/cash: <strong>$ ${precioBase.toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong></div>
                                        <div class="precio-lista">Lista: $ ${precioLista.toLocaleString('es-AR', {minimumFractionDigits: 2})}</div>
                                    </div>
                                </div>
                                
                            </div>
                        </a>
                    </div>
                `;
                contenedorProductos.innerHTML += tarjetaHTML;
            });
        })
        .catch(error => {
            console.error("Error:", error);
            contenedorProductos.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    <p>No se pudo cargar el catálogo. Asegúrate de que la API del backend esté encendida.</p>
                </div>
            `;
        });
});