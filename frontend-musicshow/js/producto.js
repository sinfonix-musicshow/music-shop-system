document.addEventListener('DOMContentLoaded', () => {
    const parametrosURL = new URLSearchParams(window.location.search);
    const productoId = parametrosURL.get('id');

    if (!productoId) {
        document.getElementById('titulo-producto').textContent = "Producto no encontrado";
        return;
    }

    // Ruta correcta al archivo JSON dentro de la carpeta data
    fetch('data/producto.json')
        .then(respuesta => respuesta.json())
        .then(productos => {
            const producto = productos.find(p => p.id == productoId);

            if (producto) {
                document.getElementById('bread-modelo').textContent = producto.modelo;
                document.getElementById('titulo-producto').textContent = producto.modelo;
                document.getElementById('precio-producto').textContent = producto.precio;
                document.getElementById('desc-producto').textContent = producto.descripcion;
                
                const imgElement = document.getElementById('img-producto');
                imgElement.src = producto.imagen;
                imgElement.alt = producto.modelo;

                const specsContainer = document.getElementById('specs-producto');
                specsContainer.innerHTML = ''; 
                producto.especificaciones.forEach(especificacion => {
                    const li = document.createElement('li');
                    li.textContent = especificacion;
                    specsContainer.appendChild(li);
                });
            } else {
                document.getElementById('titulo-producto').textContent = "Producto no existe";
            }
        })
        .catch(error => console.error("Error cargando los productos:", error));
});