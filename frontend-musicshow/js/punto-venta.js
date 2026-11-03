document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // 1. VARIABLES GLOBALES Y REFERENCIAS DOM
    // =========================================
    const apiUrl = 'http://localhost:5144/api/instrumentos';
    let productosBD = [];           // Productos traídos desde la API
    let carritoVenta = [];          // Ítems agregados a la venta actual
    let productoSeleccionado = null; // Producto temporal del buscador

    // Inputs de Venta y Carga
    const inputBuscar = document.getElementById('inputBuscarProd');
    const listaSugerencias = document.getElementById('sugerenciasProd');
    const inputPrecio = document.getElementById('inputPrecioProd');
    const inputCant = document.getElementById('inputCant');
    const btnAgregar = document.getElementById('btnAgregarProd');
    
    // Tablas y Totales
    const cuerpoTabla = document.getElementById('cuerpoTablaVenta');
    const totalCobrarFinal = document.getElementById('totalCobrarFinal');
    const btnEmitir = document.getElementById('btnEmitirFactura');

    // Datos del Cliente
    const inputDni = document.getElementById('inputDni');
    const nombreCliente = document.getElementById('nombreCliente');
    const ivaCliente = document.getElementById('ivaCliente');
    const selectFactura = document.getElementById('selectFactura');

    // Botones de Acción del Ticket
    const btnImprimirTicket = document.getElementById('btnImprimirTicket');
    const btnDescargarPdfVenta = document.getElementById('btnDescargarPdfVenta');
    const btnNuevaVenta = document.getElementById('btnNuevaVenta');

    // =========================================
    // 2. CARGAR PRODUCTOS DESDE LA API (.NET)
    // =========================================
    function cargarProductos() {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                productosBD = data;
            })
            .catch(err => console.error("Error al cargar productos para la venta:", err));
    }

    // =========================================
    // 3. DETECCIÓN AUTOMÁTICA DE DNI / CUIT
    // =========================================
    if (inputDni) {
        inputDni.addEventListener('input', (e) => {
            // Limpiar todo lo que no sea número
            let numeroDocumento = e.target.value.replace(/\D/g, ''); 
            e.target.value = numeroDocumento;

            if (numeroDocumento.length === 0) {
                nombreCliente.textContent = 'CONSUMIDOR FINAL';
                ivaCliente.textContent = 'Consumidor Final';
                selectFactura.value = 'C';
                return;
            }

            if (numeroDocumento.length > 0 && numeroDocumento.length < 8) {
                nombreCliente.textContent = 'Buscando datos...';
                ivaCliente.textContent = '...';
                return;
            }

            if (numeroDocumento.length === 8) {
                nombreCliente.textContent = 'CLIENTE REGISTRADO (SIMULACIÓN)';
                ivaCliente.textContent = 'Consumidor Final';
                selectFactura.value = 'C';
                return;
            }

            if (numeroDocumento.length === 11) {
                nombreCliente.textContent = 'EMPRESA DE EJEMPLO S.R.L.';
                ivaCliente.textContent = 'Responsable Inscripto';
                selectFactura.value = 'A'; // Cambia automáticamente a Factura A
                return;
            }
        });
    }

    // =========================================
    // 4. BUSCADOR PREDICTIVO DE PRODUCTOS
    // =========================================
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            listaSugerencias.innerHTML = ''; 
            productoSeleccionado = null;
            inputPrecio.value = '';

            if (termino.length < 2) {
                listaSugerencias.classList.add('d-none');
                return;
            }

            const filtrados = productosBD.filter(prod => {
                const nombreCompleto = `${prod.marca || ''} ${prod.nombre || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nombreCompleto.includes(termino) && prod.stock > 0;
            });

            if (filtrados.length > 0) {
                listaSugerencias.classList.remove('d-none');
                filtrados.forEach(prod => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item list-group-item-action bg-transparent text-light border-secondary';
                    li.textContent = `${prod.marca || ''} ${prod.nombre} - Stock: ${prod.stock}`;
                    
                    li.addEventListener('click', () => {
                        seleccionarProducto(prod);
                    });
                    
                    listaSugerencias.appendChild(li);
                });
            } else {
                listaSugerencias.classList.add('d-none');
            }
        });
    }

    // Ocultar sugerencias al hacer clic afuera
    document.addEventListener('click', (e) => {
        if (inputBuscar && listaSugerencias && !inputBuscar.contains(e.target) && !listaSugerencias.contains(e.target)) {
            listaSugerencias.classList.add('d-none');
        }
    });

    function seleccionarProducto(prod) {
        productoSeleccionado = prod;
        inputBuscar.value = `${prod.marca || ''} ${prod.nombre}`.trim();
        inputPrecio.value = prod.precio;
        listaSugerencias.classList.add('d-none');
        inputCant.focus();
    }

    // =========================================
    // 5. AGREGAR AL CARRITO (FLEXIBLE: INVENTARIO O MANUAL)
    // =========================================
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            const cantidad = parseInt(inputCant.value);
            let precioManual = parseFloat(inputPrecio.value);
            let descripcionItem = inputBuscar.value.trim();

            if (isNaN(cantidad) || cantidad <= 0) {
                alert("Ingrese una cantidad válida.");
                return;
            }

            // VENTA MANUAL (sin seleccionar de la lista)
            if (!productoSeleccionado) {
                if (isNaN(precioManual) || precioManual <= 0) {
                    alert("Para un ítem manual, escribí una descripción y un precio válido.");
                    return;
                }
                
                if (descripcionItem === "") {
                    descripcionItem = "Varios / Consumidor Final";
                }

                carritoVenta.push({
                    id: 'manual-' + Date.now(),
                    descripcion: descripcionItem,
                    precioUnitario: precioManual,
                    cantidad: cantidad,
                    esManual: true
                });

            } else {
                // PRODUCTO DEL INVENTARIO
                if (cantidad > productoSeleccionado.stock) {
                    alert(`Stock insuficiente. Solo quedan ${productoSeleccionado.stock} unidades.`);
                    return;
                }

                const precioFinal = (!isNaN(precioManual) && precioManual > 0) ? precioManual : productoSeleccionado.precio;
                const itemExistente = carritoVenta.find(item => item.id === productoSeleccionado.id);
                
                if (itemExistente) {
                    if (itemExistente.cantidad + cantidad > productoSeleccionado.stock) {
                        alert(`Stock insuficiente para agregar más de este producto.`);
                        return;
                    }
                    itemExistente.cantidad += cantidad;
                    itemExistente.precioUnitario = precioFinal;
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

            // Limpiar inputs
            productoSeleccionado = null;
            inputBuscar.value = '';
            inputPrecio.value = '';
            inputCant.value = 1;
            inputBuscar.focus();

            actualizarInterfazVenta();
        });
    }

    // =========================================
    // 6. RENDERIZAR TABLA Y TICKET DERECHO
    // =========================================
    function actualizarInterfazVenta() {
        cuerpoTabla.innerHTML = '';
        let total = 0;

        if (carritoVenta.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="4" class="text-center text-secondary py-3">No hay productos agregados.</td></tr>`;
            totalCobrarFinal.textContent = '$ 0,00';
            actualizarTicketPreview([]);
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

        totalCobrarFinal.textContent = `$ ${total.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
        actualizarTicketPreview(carritoVenta, total);
    }

    // Quitar ítem del carrito
    window.quitarDelCarrito = function(index) {
        carritoVenta.splice(index, 1);
        actualizarInterfazVenta();
    }

    function actualizarTicketPreview(carrito, total = 0) {
        const contenedorItemsTicket = document.getElementById('ticketItemsContainer');
        const contenedorTotalTicket = document.getElementById('ticketTotalContainer');

        if (!contenedorItemsTicket || !contenedorTotalTicket) return;

        contenedorItemsTicket.innerHTML = '';

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

    // =========================================
    // 7. SIMULAR EMISIÓN EN ARCA
    // =========================================
    if (btnEmitir) {
        btnEmitir.addEventListener('click', () => {
            if (carritoVenta.length === 0) {
                alert("Agregue al menos un producto para emitir la factura.");
                return;
            }

            btnEmitir.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Conectando con ARCA...`;
            btnEmitir.disabled = true;

            setTimeout(() => {
                document.getElementById('estadoEsperaTicket').classList.add('d-none');
                document.getElementById('ticketGenerado').classList.remove('d-none');
                
                const dniInput = document.getElementById('inputDni').value || "00000000";
                const nomCli = document.getElementById('nombreCliente').textContent || "CONSUMIDOR FINAL";
                const condIva = document.getElementById('ivaCliente').textContent || "Consumidor Final";

                document.getElementById('ticketDniCli').textContent = dniInput;
                document.getElementById('ticketNombreCli').textContent = nomCli;
                document.getElementById('ticketIvaCli').textContent = condIva;
                
                const ahora = new Date();
                document.getElementById('ticketFecha').textContent = `FECHA: ${ahora.toLocaleDateString()}`;
                document.getElementById('ticketHora').textContent = `HORA: ${ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

                btnEmitir.innerHTML = `<i class="bi bi-check-circle me-2"></i> Factura Emitida`;
                btnEmitir.style.backgroundColor = '#198754'; 
            }, 2000);
        });
    }

    // =========================================
    // 8. REINICIAR PARA NUEVA VENTA
    // =========================================
    if (btnNuevaVenta) {
        btnNuevaVenta.addEventListener('click', () => {
            carritoVenta = [];
            actualizarInterfazVenta();
            
            document.getElementById('inputDni').value = '';
            nombreCliente.textContent = 'CONSUMIDOR FINAL';
            ivaCliente.textContent = 'Consumidor Final';
            selectFactura.value = 'C';
            
            document.getElementById('estadoEsperaTicket').classList.remove('d-none');
            document.getElementById('ticketGenerado').classList.add('d-none');
            
            btnEmitir.innerHTML = `<i class="bi bi-cloud-arrow-up me-2"></i> Autorizar en ARCA y Emitir`;
            btnEmitir.style.backgroundColor = 'var(--color-naranja)';
            btnEmitir.disabled = false;
        });
    }

// =========================================
    // 9. FUNCIONALIDAD DE IMPRIMIR Y DESCARGAR
    // =========================================
    if (btnImprimirTicket) {
        btnImprimirTicket.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnDescargarPdfVenta) {
        btnDescargarPdfVenta.addEventListener('click', () => {
            const nroFactura = "0001-00004582";
            const cliente = (document.getElementById('ticketNombreCli')?.textContent || "CONSUMIDOR_FINAL").trim().replace(/\s+/g, '_');
            const total = document.getElementById('ticketTotalContainer')?.textContent || "$ 0,00";
            const fecha = document.getElementById('ticketFecha')?.textContent || "";
            const hora = document.getElementById('ticketHora')?.textContent || "";

            // Contenido simulado del archivo
            const datosComprobante = `========================================
MUSIC SHOW - COMPROBANTE DE VENTA
========================================
Factura C N°: ${nroFactura}
${fecha} | ${hora}
Cliente: ${cliente}
Total: ${total}
CAE ARCA: 73489274928374
========================================`;

            // 1. Crear el archivo en memoria (Blob)
            const blob = new Blob([datosComprobante], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            // 2. Crear un enlace invisible y forzar el clic de descarga nativo
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `Factura_${nroFactura}_${cliente}.pdf`;
            document.body.appendChild(enlace);
            enlace.click();
            
            // 3. Limpieza de memoria
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        });
    }
});