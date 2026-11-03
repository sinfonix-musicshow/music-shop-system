document.addEventListener('DOMContentLoaded', () => {
    const parametrosURL = new URLSearchParams(window.location.search);
    const productoId = parametrosURL.get('id');

    if (!productoId) {
        document.getElementById('titulo-producto').textContent = "Producto no encontrado";
        return;
    }

    // Petición directa a tu API en C# (.NET)
    fetch(`https://localhost:7174/api/Instrumentos/${productoId}`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error("Producto no encontrado en la base de datos");
            }
            return respuesta.json();
        })
        .then(producto => {
            // Mapeo de propiedades devueltas por la API en C#
            const nombreMostrar = producto.nombre || producto.modelo;

            document.getElementById('bread-modelo').textContent = nombreMostrar;
            document.getElementById('titulo-producto').textContent = nombreMostrar;

            // Formateo del precio a Pesos Argentinos
            document.getElementById('precio-producto').textContent = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                maximumFractionDigits: 0
            }).format(producto.precio);

            document.getElementById('desc-producto').textContent = producto.descripcion || "Sin descripción disponible.";

            const imgElement = document.getElementById('img-producto');
            imgElement.src = producto.imagenUrl || "../img/placeholder.jpg";
            imgElement.alt = nombreMostrar;

            // Carga de especificaciones desde los campos del DTO (Marca, Categoría, Stock)
            const specsContainer = document.getElementById('specs-producto');
            specsContainer.innerHTML = '';

            const listaSpecs = [
                `Marca: ${producto.marca || 'N/A'}`,
                `Categoría: ${producto.categoria || 'N/A'}`,
                `Stock disponible: ${producto.stock} unidades`
            ];

            listaSpecs.forEach(especificacion => {
                const li = document.createElement('li');
                li.textContent = especificacion;
                specsContainer.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error cargando el producto desde la API:", error);
            document.getElementById('titulo-producto').textContent = "Producto no existe";
        });
});