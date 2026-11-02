document.addEventListener('DOMContentLoaded', () => {
    // 1. VARIABLES Y REFERENCIAS AL DOM
    const apiUrl = 'http://localhost:5144/api/instrumentos';
    let inventarioDatos = []; // Memoria local para las búsquedas

    const cuerpoTabla = document.getElementById('cuerpo-tabla-inventario');
    const inputBuscador = document.getElementById('buscador-inventario');
    
    // Modal y Formulario
    const modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
    const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
    const btnGuardar = document.getElementById('btn-guardar-producto');
    const modalTitulo = document.getElementById('modalProductoTitulo');
    
    // Inputs del formulario
    const inputId = document.getElementById('productoId');
    const inputNombre = document.getElementById('productoNombre');
    const inputCategoria = document.getElementById('productoCategoria');
    const inputPrecio = document.getElementById('productoPrecio');
    const inputStock = document.getElementById('productoStock');
    const inputImagen = document.getElementById('productoImagen');

    // 2. CARGAR Y MOSTRAR INVENTARIO
    function cargarInventario() {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                inventarioDatos = data;
                renderizarTabla(inventarioDatos);
            })
            .catch(error => {
                console.error("Error cargando inventario:", error);
                cuerpoTabla.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>`;
            });
    }

    function renderizarTabla(productos) {
        cuerpoTabla.innerHTML = ''; // Limpiamos la tabla

        if (productos.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="5" class="text-center text-secondary py-4">No se encontraron productos.</td></tr>`;
            return;
        }

        productos.forEach(prod => {
            // Se asume que tu API devuelve {id, nombre, marca, precio, stock, etc.}
            const nombreCompleto = prod.marca ? `${prod.marca} ${prod.nombre}` : prod.nombre;
            const stockActual = prod.stock !== undefined ? prod.stock : 0;
            const codigoDisplay = String(prod.id).padStart(8, '0'); // Rellena con ceros para que parezca un código

            const filaHTML = `
                <tr>
                    <td><span class="text-secondary font-monospace">${codigoDisplay}</span></td>
                    <td class="fw-semibold text-light">${nombreCompleto}</td>
                    <td>$ ${prod.precio.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                    <td class="text-center">
                        <div class="control-stock">
                            <button class="btn-stock" onclick="ajustarStock(${prod.id}, -1)"><i class="bi bi-dash"></i></button>
                            <input type="number" class="input-stock" value="${stockActual}" readonly>
                            <button class="btn-stock" onclick="ajustarStock(${prod.id}, 1)"><i class="bi bi-plus"></i></button>
                        </div>
                    </td>
                    <td class="text-center">
                        <button class="btn-accion me-2" title="Editar" onclick="abrirModalEditar(${prod.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn-accion delete" title="Eliminar" onclick="eliminarProducto(${prod.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
            cuerpoTabla.innerHTML += filaHTML;
        });
    }

    // 3. BUSCADOR EN TIEMPO REAL
    inputBuscador.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtrados = inventarioDatos.filter(prod => {
            const nombreCompleto = `${prod.marca || ''} ${prod.nombre || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const codigoStr = String(prod.id).padStart(8, '0');
            return nombreCompleto.includes(termino) || codigoStr.includes(termino);
        });
        
        renderizarTabla(filtrados);
    });

    // 4. ELIMINAR PRODUCTO
    window.eliminarProducto = function(id) {
        if(confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) {
            fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
                .then(res => {
                    if(res.ok) cargarInventario(); // Recargar tabla
                    else alert("Error al eliminar el producto.");
                })
                .catch(err => console.error(err));
        }
    }

    // 5. GESTIÓN DEL MODAL (NUEVO / EDITAR)
    btnNuevoProducto.addEventListener('click', () => {
        document.getElementById('formProducto').reset();
        inputId.value = ''; // Limpiar ID oculto
        modalTitulo.textContent = 'Nuevo Producto';
        modalProducto.show();
    });

    window.abrirModalEditar = function(id) {
        const prod = inventarioDatos.find(p => p.id === id);
        if(!prod) return;

        inputId.value = prod.id;
        inputNombre.value = prod.marca ? `${prod.marca} ${prod.nombre}` : prod.nombre;
        inputCategoria.value = prod.categoria || '';
        inputPrecio.value = prod.precio;
        inputStock.value = prod.stock || 0;
        inputImagen.value = prod.urlImagen || '';

        modalTitulo.textContent = 'Modificar Producto';
        modalProducto.show();
    }

    // 6. GUARDAR (POST para Nuevo, PUT para Editar)
    btnGuardar.addEventListener('click', () => {
        const idActual = inputId.value;
        const metodo = idActual ? 'PUT' : 'POST';
        const urlDestino = idActual ? `${apiUrl}/${idActual}` : apiUrl;

        // Separar marca y nombre temporalmente (asumiendo que escriben "Yamaha Guitarra")
        const partesNombre = inputNombre.value.trim().split(' ');
        const marca = partesNombre.length > 1 ? partesNombre[0] : 'Genérica';
        const nombreReal = partesNombre.length > 1 ? partesNombre.slice(1).join(' ') : partesNombre[0];

        const payload = {
            id: idActual ? parseInt(idActual) : 0,
            nombre: nombreReal,
            marca: marca,
            categoria: inputCategoria.value.toLowerCase().replace(' ', '-'),
            precio: parseFloat(inputPrecio.value),
            stock: parseInt(inputStock.value),
            urlImagen: inputImagen.value
        };

        fetch(urlDestino, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if(res.ok) {
                modalProducto.hide();
                cargarInventario(); // Refrescar vista
            } else {
                alert("Error al guardar los datos.");
            }
        })
        .catch(err => console.error(err));
    });

    // 7. AJUSTAR STOCK RÁPIDO (+ / -)
    window.ajustarStock = function(id, cantidad) {
        const prod = inventarioDatos.find(p => p.id === id);
        if(!prod) return;

        let nuevoStock = (prod.stock || 0) + cantidad;
        if(nuevoStock < 0) nuevoStock = 0; // Evitar stock negativo

        const payload = { ...prod, stock: nuevoStock };

        fetch(`${apiUrl}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if(res.ok) cargarInventario(); // Refrescar visualmente
        })
        .catch(err => console.error(err));
    }

    // Iniciar
    cargarInventario();
});