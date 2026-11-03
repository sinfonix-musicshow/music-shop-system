document.addEventListener('DOMContentLoaded', () => {
    // 1. VARIABLES GLOBALES Y REFERENCIAS
    const apiUrl = 'http://localhost:5144/api/instrumentos';
    let productosBD = [];       // Todos los productos de la base de datos
    let carritoVenta = [];      // Ítems agregados a la factura actual
    let productoSeleccionado = null; // Producto temporalmente seleccionado en el buscador

    // Referencias DOM - Buscador y Carga
    const inputBuscar = document.getElementById('inputBuscarProd');
    const listaSugerencias = document.getElementById('sugerenciasProd');
    const inputPrecio = document.getElementById('inputPrecioProd');
    const inputCant = document.getElementById('inputCant');
    const btnAgregar = document.getElementById('btnAgregarProd');
    
    // Referencias DOM - Tablas y Totales
    const cuerpoTabla = document.getElementById('cuerpoTablaVenta');
    const totalCobrarFinal = document.getElementById('totalCobrarFinal');
    const btnEmitir = document.getElementById('btnEmitirFactura');

    // 2. CARGAR PRODUCTOS DESDE LA API
    function cargarProductos() {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                productosBD = data;
            })
            .catch(err => console.error("Error al cargar productos para la venta:", err));
    }

    // 3. LÓGICA DEL BUSCADOR PREDICTIVO (AUTOCOMPLETADO)
    inputBuscar.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        listaSugerencias.innerHTML = ''; // Limpiar sugerencias anteriores
        productoSeleccionado = null;
        inputPrecio.value = '';

        if (termino.length < 2) {
            listaSugerencias.classList.add('d-none');
            return;
        }

        // Filtrar productos
        const filtrados = productosBD.filter(prod => {
            const nombreCompleto = `${prod.marca || ''} ${prod.nombre || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return nombreCompleto.includes(termino) && prod.stock > 0; // Solo mostrar si hay stock
        });

        if (filtrados.length > 0) {
            listaSugerencias.classList.remove('d-none');
            filtrados.forEach(prod => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-action bg-transparent text-light border-secondary';
                li.textContent = `${prod.marca || ''} ${prod.nombre} - Stock: ${prod.stock}`;
                
                // Al hacer clic en una sugerencia
                li.addEventListener('click', () => {
                    seleccionarProducto(prod);
                });
                
                listaSugerencias.appendChild(li);
            });
        } else {
            listaSugerencias.classList.add('d-none');
        }
    });

    // Ocultar sugerencias si se hace clic fuera del buscador
    document.addEventListener('click', (e) => {
        if (!inputBuscar.contains(e.target) && !listaSugerencias.contains(e.target)) {
            listaSugerencias.classList.add('d-none');
        }
    });

    function seleccionarProducto(prod) {
        productoSeleccionado = prod;
        inputBuscar.value = `${prod.marca || ''} ${prod.nombre}`.trim();
        inputPrecio.value = `$ ${prod.precio.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
        listaSugerencias.classList.add('d-none');
        inputCant.focus();
    }

// 4. AGREGAR AL CARRITO (FLEXIBLE: DE INVENTARIO O MANUAL)
    btnAgregar.addEventListener('click', () => {
        const cantidad = parseInt(inputCant.value);
        let precioManual = parseFloat(inputPrecio.value);
        let descripcionItem = inputBuscar.value.trim();

        if (isNaN(cantidad) || cantidad <= 0) {
            alert("Ingrese una cantidad válida.");
            return;
        }

        // Si NO seleccionaron nada de la lista, pero pusieron un precio, es una VENTA MANUAL
        if (!productoSeleccionado) {
            if (isNaN(precioManual) || precioManual <= 0) {
                alert("Para un ítem manual, escribí una descripción y un precio válido.");
                return;
            }
            
            if (descripcionItem === "") {
                descripcionItem = "Varios / Consumidor Final";
            }

            // Agregamos el ítem manual al carrito
            carritoVenta.push({
                id: 'manual-' + Date.now(), // ID temporal para ítems sueltos
                descripcion: descripcionItem,
                precioUnitario: precioManual,
                cantidad: cantidad,
                esManual: true // Marca para saber que no descuenta stock
            });

        } else {
            // Es un producto DEL INVENTARIO
            if (cantidad > productoSeleccionado.stock) {
                alert(`Stock insuficiente. Solo quedan ${productoSeleccionado.stock} unidades.`);
                return;
            }

            // Si cambiaron el precio a mano, respetamos el nuevo precio
            const precioFinal = (!isNaN(precioManual) && precioManual > 0) ? precioManual : productoSeleccionado.precio;

            const itemExistente = carritoVenta.find(item => item.id === productoSeleccionado.id);
            
            if (itemExistente) {
                if (itemExistente.cantidad + cantidad > productoSeleccionado.stock) {
                    alert(`Stock insuficiente para agregar más de este producto.`);
                    return;
                }
                itemExistente.cantidad += cantidad;
                itemExistente.precioUnitario = precioFinal; // Actualiza precio por si hubo descuento
            } else {
                carritoVenta.push({
                    id: productoSeleccionado.id,
                    descripcion: `${productoSeleccionado.marca || ''} ${productoSeleccionado.nombre}`.trim(),
                    precioUnitario: precioFinal,
                    cantidad: cantidad,
                    esManual: false
                });
            }
        }

        // Limpiar inputs después de agregar
        productoSeleccionado = null;
        inputBuscar.value = '';
        inputPrecio.value = '';
        inputCant.value = 1;
        inputBuscar.focus();

        actualizarInterfazVenta();
    });
    
    // 5. RENDERIZAR TABLA Y TICKET
    function actualizarInterfazVenta() {
        cuerpoTabla.innerHTML = '';
        let total = 0;

        if (carritoVenta.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">No hay productos agregados.</td></tr>`;
            totalCobrarFinal.textContent = '$ 0,00';
            actualizarTicketPreview([]); // Limpia el ticket
            return;
        }

        carritoVenta.forEach((item, index) => {
            const subtotal = item.precioUnitario * item.cantidad;
            total += subtotal;

            const fila = `
                <tr>
                    <td>${item.cantidad}</td>
                    <td class="fw-semibold text-light">${item.descripcion}</td>
                    <td>$ ${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                    <td class="text-center">
                        <button class="btn-accion delete p-0" title="Quitar" onclick="quitarDelCarrito(${index})">
                            <i class="bi bi-x-lg text-danger fs-5"></i>
                        </button>
                    </td>
                </tr>
            `;
            cuerpoTabla.innerHTML += fila;
        });

        // Actualizar total gigante
        totalCobrarFinal.textContent = `$ ${total.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
        
        // Actualizar ticket
        actualizarTicketPreview(carritoVenta, total);
    }

    // 6. QUITAR DEL CARRITO
    window.quitarDelCarrito = function(index) {
        carritoVenta.splice(index, 1);
        actualizarInterfazVenta();
    }

    // 7. ACTUALIZAR VISTA PREVIA DEL TICKET DERECHO
    function actualizarTicketPreview(carrito, total = 0) {
        // Buscamos los contenedores dentro del ticket donde se inyectan los items y el total
        const contenedorItemsTicket = document.getElementById('ticketItemsContainer');
        const contenedorTotalTicket = document.getElementById('ticketTotalContainer');

        if (!contenedorItemsTicket || !contenedorTotalTicket) return; // Si no les pusiste ID, ignoramos esto por ahora

        contenedorItemsTicket.innerHTML = ''; // Limpiamos ítems anteriores

        carrito.forEach(item => {
            const subtotal = item.precioUnitario * item.cantidad;
            contenedorItemsTicket.innerHTML += `
                <div class="d-flex justify-content-between mb-1 small text-light">
                    <span>${item.cantidad}x ${item.descripcion}</span>
                    <span>$ ${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                </div>
            `;
        });

        contenedorTotalTicket.textContent = `$ ${total.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    }

// 8. SIMULAR EMISIÓN DE FACTURA (ARCA PENDIENTE)
    if (btnEmitir) {
        btnEmitir.addEventListener('click', () => {
            if (carritoVenta.length === 0) {
                alert("Agregue al menos un producto para emitir la factura.");
                return;
            }

            // Cambiar botón a estado de carga
            btnEmitir.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Conectando con ARCA...`;
            btnEmitir.disabled = true;

            setTimeout(() => {
                // 1. Mostrar el ticket real y ocultar el placeholder
                document.getElementById('estadoEsperaTicket').classList.add('d-none');
                document.getElementById('ticketGenerado').classList.remove('d-none');
                
                // 2. Llenar los datos del cliente en el ticket
                const dniInput = document.getElementById('inputDni').value || "00000000";
                document.getElementById('ticketDniCli').textContent = dniInput;
                
                // Setear fecha y hora actual
                const ahora = new Date();
                document.getElementById('ticketFecha').textContent = `FECHA: ${ahora.toLocaleDateString()}`;
                document.getElementById('ticketHora').textContent = `HORA: ${ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                // 3. Restaurar botón de emitir (aunque ya se emitió)
                btnEmitir.innerHTML = `<i class="bi bi-check-circle me-2"></i> Factura Emitida`;
                btnEmitir.classList.replace('btn-naranja', 'btn-success'); // Opcional si tienes clase success
                btnEmitir.style.backgroundColor = '#198754'; 
                
            }, 2000); // Simula 2 segundos de conexión con la AFIP
        });
    }

    // 9. REINICIAR PARA NUEVA VENTA
    const btnNuevaVenta = document.getElementById('btnNuevaVenta');
    if (btnNuevaVenta) {
        btnNuevaVenta.addEventListener('click', () => {
            // Limpiar carrito
            carritoVenta = [];
            actualizarInterfazVenta();
            
            // Limpiar inputs
            document.getElementById('inputDni').value = '';
            
            // Volver a estado inicial visual
            document.getElementById('estadoEsperaTicket').classList.remove('d-none');
            document.getElementById('ticketGenerado').classList.add('d-none');
            
            // Restaurar botón de emitir
            btnEmitir.innerHTML = `<i class="bi bi-cloud-arrow-up me-2"></i> Autorizar en ARCA y Emitir`;
            btnEmitir.style.backgroundColor = 'var(--color-naranja)';
            btnEmitir.disabled = false;
        });
    }
});

