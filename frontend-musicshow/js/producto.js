document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el ID del producto desde la URL (ej: producto.html?id=1)
    const parametrosURL = new URLSearchParams(window.location.search);
    const idProducto = parametrosURL.get('id');

    if (!idProducto) {
        console.error("No se especificó un ID de producto en la URL.");
        return;
    }

    const apiUrl = `http://localhost:5000/api/instrumentos/${idProducto}`;


// 2. Fetch a la API de .NET
fetch(apiUrl)
    .then(respuesta => {
        if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);
        return respuesta.json();
    })
    .then(producto => {
        console.log("Producto recibido de la API:", producto);
        // Aquí agregas la lógica para mostrar los detalles del producto en la vista
    })
    .catch(error => {
        console.error("Error al conectar con la API:", error);


            // 3. Referencias a los IDs exactos de tu producto.html
            const elBreadModelo = document.getElementById('bread-modelo');
            const elTitulo = document.getElementById('titulo-producto');
            const elPrecio = document.getElementById('precio-producto');
            const elDesc = document.getElementById('desc-producto');
            const elImg = document.getElementById('img-producto');
            const elSpecs = document.getElementById('specs-producto');

            // Mapeo flexible para soportar tanto camelCase como PascalCase desde C#
            const nombre = producto.nombre || producto.Nombre || '';
            const marca = producto.marca || producto.Marca || '';
            const precio = producto.precio || producto.Precio || 0;
            const descripcion = producto.descripcion || producto.Descripcion || '';
            const urlImagen = producto.urlImagen || producto.UrlImagen || '';
            const categoria = producto.categoria || producto.Categoria || '';
            const stock = producto.stock ?? producto.Stock ?? 0;

            const nombreCompleto = `${marca} ${nombre}`.trim();

            // 4. Inyectar datos en el HTML
            if (elBreadModelo) elBreadModelo.textContent = nombreCompleto;
            if (elTitulo) elTitulo.textContent = nombreCompleto;
            
            if (elPrecio) {
                elPrecio.textContent = `$ ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            }

            if (elDesc) {
                elDesc.textContent = descripcion ? descripcion : 'Sin descripción disponible para este artículo.';
            }

            if (elImg) {
                if (urlImagen) {
                    elImg.src = urlImagen;
                    elImg.alt = nombreCompleto;
                } else {
                    elImg.src = '../img/music show.jpeg'; // Imagen por defecto si viene vacía
                }
            }

            if (elSpecs) {
                elSpecs.innerHTML = `
                    <li><strong>Categoría:</strong> ${categoria ? categoria.toUpperCase() : 'GENERAL'}</li>
                    <li><strong>Stock disponible:</strong> ${stock} unidades</li>
                    <li><strong>Garantía:</strong> 6 meses oficial</li>
                `;
            }
        })
        .catch(error => {
            console.error("Error al cargar detalle del producto:", error);
        });
});