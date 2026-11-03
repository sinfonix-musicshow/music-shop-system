/**
 * frontend-musicshow/js/facturacion.js
 * Lógica para Facturación Rápida en Mostrador (UC2): carrito, cálculo fiscal y emisión con ARCA/AFIP.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Guardia de Sesión ──────────────────────────────────────────────────
    if (localStorage.getItem('usuarioLogueado') !== 'true') {
        window.location.replace('login.html');
        return;
    }

    // Botón Cerrar Sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogueado');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'login.html';
        });
    }

    // ── 2. URLs de la API con Resiliencia ──────────────────────────────────────
    const URL_BASE_PRIMARY = 'https://localhost:7174/api';
    const URL_BASE_FALLBACK = 'http://localhost:5144/api';
    let urlBase = URL_BASE_PRIMARY;

    async function apiFetch(endpoint, options = {}) {
        try {
            return await fetch(`${urlBase}${endpoint}`, options);
        } catch (error) {
            if (urlBase === URL_BASE_PRIMARY) {
                console.warn("Fallo conectando a HTTPS. Intentando fallback HTTP...", error);
                urlBase = URL_BASE_FALLBACK;
                return await fetch(`${urlBase}${endpoint}`, options);
            }
            throw error;
        }
    }

    // ── 3. Estado Local de Facturación ─────────────────────────────────────────
    let productosCatalogo = [];
    let carrito = []; // [{ instrumentoId, codigo, nombre, marca, emoji, precioUnitario, cantidad, stockDisponible }]
    let categoriaFiltroActual = '';
    let metodoPagoActual = 'Efectivo';

    // Referencias DOM
    const contenedorProds = document.getElementById('contenedor-productos-pos');
    const inputBuscador = document.getElementById('buscador-pos');
    const contadorProds = document.getElementById('contador-productos');
    const contenedorCategorias = document.getElementById('contenedor-categorias');

    const inputClienteNombre = document.getElementById('clienteNombre');
    const inputClienteDoc = document.getElementById('clienteDocumento');
    const contenedorCarrito = document.getElementById('contenedor-items-carrito');
    const btnVaciar = document.getElementById('btn-vaciar-carrito');

    const txtSubtotalNeto = document.getElementById('txt-subtotal-neto');
    const txtIva = document.getElementById('txt-iva');
    const txtTotal = document.getElementById('txt-total');
    const btnEmitir = document.getElementById('btn-emitir-factura');
    const botonesMetodosPago = document.querySelectorAll('.metodo-pago-btn');

    // Modal Ticket
    const modalTicketEl = document.getElementById('modalTicket');
    const modalTicket = new bootstrap.Modal(modalTicketEl);
    const btnImprimir = document.getElementById('btn-imprimir-ticket');

    // ── 4. Cargar Catálogo de Instrumentos ─────────────────────────────────────
    async function cargarCatalogo() {
        try {
            const resp = await apiFetch('/Instrumentos');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            // Filtrar solo activos
            productosCatalogo = (Array.isArray(data) ? data : []).filter(p => p.activo !== false);
            renderizarCatalogo();
        } catch (error) {
            console.error("Error cargando instrumentos para facturación:", error);
            contenedorProds.innerHTML = `
                <div class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-triangle fs-2 d-block mb-2"></i>
                    No se pudo cargar el catálogo de productos.<br>
                    <small class="text-white-50">Verifica la conexión con el servidor backend.</small>
                </div>
            `;
        }
    }

    // ── 5. Renderizar Catálogo de la Izquierda ─────────────────────────────────
    function renderizarCatalogo() {
        const termino = inputBuscador.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const filtrados = productosCatalogo.filter(p => {
            const matchesCat = !categoriaFiltroActual || p.categoria === categoriaFiltroActual;
            const texto = `${p.codigo || ''} ${p.nombre || ''} ${p.marca || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const matchesTexto = !termino || texto.includes(termino);
            return matchesCat && matchesTexto;
        });

        contadorProds.textContent = `${filtrados.length} disponibles`;

        if (filtrados.length === 0) {
            contenedorProds.innerHTML = `
                <div class="text-center text-secondary py-5">
                    <i class="bi bi-search fs-2 d-block mb-2"></i>
                    No se encontraron productos coincidentes.
                </div>
            `;
            return;
        }

        let html = '<div class="row g-2">';
        filtrados.forEach(prod => {
            const precioARS = Number(prod.precio || 0).toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 2
            });

            const sinStock = (prod.stock || 0) <= 0;
            const stockBadge = sinStock
                ? `<span class="badge bg-danger bg-opacity-25 text-danger border border-danger">Agotado (0)</span>`
                : `<span class="badge bg-success bg-opacity-25 text-success border border-success">Stock: ${prod.stock}</span>`;

            html += `
                <div class="col-md-6 col-12">
                    <div class="producto-card-pos p-3 h-100 d-flex flex-column justify-content-between ${sinStock ? 'sin-stock' : ''}" 
                         ${!sinStock ? `onclick="window.agregarAlCarrito(${prod.id})"` : ''}
                         title="${sinStock ? 'Producto sin stock disponible' : 'Clic para agregar a la venta'}">
                        <div>
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="fs-3">${prod.emojiIcon || '🎸'}</span>
                                <span class="badge bg-dark border border-secondary text-warning font-monospace" style="font-size: 0.7rem;">
                                    ${prod.codigo}
                                </span>
                            </div>
                            <h6 class="fw-bold text-white mb-1 text-truncate" title="${prod.nombre}">${prod.nombre}</h6>
                            <div class="small text-white-50 mb-2">${prod.marca || ''} · <span class="text-secondary">${prod.categoria}</span></div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                            <span class="fw-bold text-white fs-6">${precioARS}</span>
                            ${stockBadge}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        contenedorProds.innerHTML = html;
    }

    // Buscador en vivo
    inputBuscador.addEventListener('input', renderizarCatalogo);

    // Filtros de categoría por píldoras
    contenedorCategorias.addEventListener('click', (e) => {
        if (e.target.classList.contains('categoria-pill')) {
            document.querySelectorAll('.categoria-pill').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            categoriaFiltroActual = e.target.dataset.categoria || '';
            renderizarCatalogo();
        }
    });

    // ── 6. Lógica del Carrito ─────────────────────────────────────────────────
    window.agregarAlCarrito = function(id) {
        const prod = productosCatalogo.find(p => p.id === id);
        if (!prod || prod.stock <= 0) return;

        const itemExistente = carrito.find(item => item.instrumentoId === id);

        if (itemExistente) {
            if (itemExistente.cantidad < prod.stock) {
                itemExistente.cantidad++;
            } else {
                alert(`Stock máximo alcanzado para "${prod.nombre}" (${prod.stock} unidades disponibles).`);
                return;
            }
        } else {
            carrito.push({
                instrumentoId: prod.id,
                codigo: prod.codigo,
                nombre: prod.nombre,
                marca: prod.marca,
                emoji: prod.emojiIcon || '🎸',
                precioUnitario: prod.precio,
                cantidad: 1,
                stockDisponible: prod.stock
            });
        }

        renderizarCarrito();
    };

    window.modificarCantidadCarrito = function(id, delta) {
        const item = carrito.find(i => i.instrumentoId === id);
        if (!item) return;

        const nuevaCant = item.cantidad + delta;
        if (nuevaCant <= 0) {
            window.quitarDelCarrito(id);
            return;
        }

        if (nuevaCant > item.stockDisponible) {
            alert(`No hay más stock disponible para este producto (Máximo: ${item.stockDisponible}).`);
            return;
        }

        item.cantidad = nuevaCant;
        renderizarCarrito();
    };

    window.quitarDelCarrito = function(id) {
        carrito = carrito.filter(i => i.instrumentoId !== id);
        renderizarCarrito();
    };

    btnVaciar.addEventListener('click', () => {
        if (carrito.length === 0) return;
        if (confirm("¿Vaciar todos los artículos del comprobante actual?")) {
            carrito = [];
            renderizarCarrito();
        }
    });

    // ── 7. Renderizar Carrito y Cálculos ──────────────────────────────────────
    function renderizarCarrito() {
        if (carrito.length === 0) {
            contenedorCarrito.innerHTML = `
                <div class="text-center text-white-50 py-5" id="carrito-vacio-msg">
                    <i class="bi bi-cart-x fs-1 d-block mb-2 text-secondary"></i>
                    El carrito está vacío.<br>
                    <small class="text-muted">Haz clic en un producto de la izquierda para agregarlo.</small>
                </div>
            `;
            txtSubtotalNeto.textContent = '$ 0,00';
            txtIva.textContent = '$ 0,00';
            txtTotal.textContent = '$ 0,00';
            btnEmitir.disabled = true;
            return;
        }

        let html = '';
        let totalGeneral = 0;

        carrito.forEach(item => {
            const subtotalItem = item.cantidad * item.precioUnitario;
            totalGeneral += subtotalItem;

            const subtotalARS = subtotalItem.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
            const unitarioARS = item.precioUnitario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

            html += `
                <div class="item-carrito-row d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2" style="max-width: 50%;">
                        <span class="fs-5">${item.emoji}</span>
                        <div>
                            <div class="text-white fw-semibold small text-truncate" style="max-width: 170px;" title="${item.nombre}">
                                ${item.nombre}
                            </div>
                            <div class="text-white-50" style="font-size: 0.72rem;">${unitarioARS} c/u</div>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-2">
                        <!-- Control de cantidad -->
                        <div class="d-inline-flex align-items-center bg-dark border border-secondary rounded-pill px-1">
                            <button class="btn btn-sm btn-link text-white text-decoration-none py-0 px-2" 
                                    onclick="window.modificarCantidadCarrito(${item.instrumentoId}, -1)">-</button>
                            <span class="fw-bold px-1 small text-white">${item.cantidad}</span>
                            <button class="btn btn-sm btn-link text-white text-decoration-none py-0 px-2" 
                                    onclick="window.modificarCantidadCarrito(${item.instrumentoId}, 1)">+</button>
                        </div>

                        <!-- Subtotal -->
                        <span class="fw-bold text-white small" style="min-width: 80px; text-align: right;">${subtotalARS}</span>

                        <!-- Botón Eliminar -->
                        <button class="btn btn-sm text-danger p-0 ms-1" title="Quitar ítem" 
                                onclick="window.quitarDelCarrito(${item.instrumentoId})">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        contenedorCarrito.innerHTML = html;

        // Cálculos Fiscales
        const subtotalNeto = Math.round((totalGeneral / 1.21) * 100) / 100;
        const iva = Math.round((totalGeneral - subtotalNeto) * 100) / 100;

        txtSubtotalNeto.textContent = subtotalNeto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        txtIva.textContent = iva.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        txtTotal.textContent = totalGeneral.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        btnEmitir.disabled = false;
    }

    // ── 8. Selección de Medio de Pago ─────────────────────────────────────────
    botonesMetodosPago.forEach(btn => {
        btn.addEventListener('click', () => {
            botonesMetodosPago.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            metodoPagoActual = btn.dataset.metodo;
        });
    });

    // ── 9. Emitir Comprobante (POST /api/Facturas) ─────────────────────────────
    btnEmitir.addEventListener('click', async () => {
        if (carrito.length === 0) return;

        const nombreCliente = inputClienteNombre.value.trim() || 'Consumidor Final';
        const docCliente = inputClienteDoc.value.trim() || null;

        const payload = {
            nombreCliente: nombreCliente,
            documentoCliente: docCliente,
            metodoPago: metodoPagoActual,
            items: carrito.map(item => ({
                instrumentoId: item.instrumentoId,
                cantidad: item.cantidad
            }))
        };

        btnEmitir.disabled = true;
        btnEmitir.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Autorizando con AFIP/ARCA...`;

        try {
            const resp = await apiFetch('/Facturas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.mensaje || `Error al emitir factura (HTTP ${resp.status})`);
            }

            const facturaEmitida = await resp.json();

            // Limpiar Carrito
            carrito = [];
            renderizarCarrito();

            // Recargar catálogo para actualizar los stocks en pantalla
            await cargarCatalogo();

            // Mostrar Ticket
            mostrarTicketFiscal(facturaEmitida);

        } catch (error) {
            console.error("Error al emitir factura:", error);
            alert(`⚠️ No se pudo emitir la factura:\n${error.message}`);
        } finally {
            btnEmitir.disabled = false;
            btnEmitir.innerHTML = `<i class="bi bi-send-check me-2"></i>Emitir Comprobante`;
        }
    });

    // ── 10. Mostrar Ticket Fiscal y QR ────────────────────────────────────────
    function mostrarTicketFiscal(fac) {
        document.getElementById('tkt-numero').textContent = fac.numeroComprobante || 'B-00005-00000000';
        
        const fecha = fac.fechaEmision ? new Date(fac.fechaEmision) : new Date();
        document.getElementById('tkt-fecha').textContent = fecha.toLocaleString('es-AR');

        document.getElementById('tkt-cliente').textContent = fac.nombreCliente || 'Consumidor Final';
        document.getElementById('tkt-doc').textContent = fac.documentoCliente || 'Sin Documento';
        document.getElementById('tkt-pago').textContent = fac.metodoPago || 'Efectivo';

        // Renderizar lista de ítems en el ticket
        const listaItemsEl = document.getElementById('tkt-items-lista');
        listaItemsEl.innerHTML = '';

        if (fac.detalles && fac.detalles.length > 0) {
            fac.detalles.forEach(d => {
                const subARS = Number(d.subtotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                const unitARS = Number(d.precioUnitario).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

                listaItemsEl.innerHTML += `
                    <div class="d-flex justify-content-between mb-1">
                        <div>
                            <div>${d.nombreInstrumento}</div>
                            <div class="text-white-50" style="font-size: 0.7rem;">${d.cantidad} x ${unitARS}</div>
                        </div>
                        <div class="fw-bold">${subARS}</div>
                    </div>
                `;
            });
        }

        // Totales
        const netoARS = Number(fac.subtotalNeto || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const ivaARS = Number(fac.iva || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const totalARS = Number(fac.total || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        document.getElementById('tkt-neto').textContent = netoARS;
        document.getElementById('tkt-iva').textContent = ivaARS;
        document.getElementById('tkt-total').textContent = totalARS;

        // Datos Fiscales CAE
        document.getElementById('tkt-cae').textContent = fac.cae || '74128956321458';
        const vtoFecha = fac.vencimientoCAE ? new Date(fac.vencimientoCAE).toLocaleDateString('es-AR') : '—';
        document.getElementById('tkt-vtocae').textContent = vtoFecha;

        // Generar QR visual
        const qrContainer = document.getElementById('tkt-qr-contenedor');
        const qrDataUrl = encodeURIComponent(fac.qrData || `https://www.afip.gob.ar/fe/qr/?n=${fac.numeroComprobante}&cae=${fac.cae}`);
        qrContainer.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=115x115&data=${qrDataUrl}&color=ffffff&bgcolor=111111" 
                 alt="Código QR Fiscal ARCA" 
                 class="border border-secondary p-1 rounded" 
                 width="115" height="115">
        `;

        modalTicket.show();
    }

    // Imprimir Ticket
    btnImprimir.addEventListener('click', () => {
        const contenido = document.getElementById('area-ticket-impresion').innerHTML;
        const ventana = window.open('', '_blank', 'height=600,width=450');
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir Comprobante - Music Show</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; color: #000; }
                    .text-center { text-align: center; }
                    .d-flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                    .fw-bold { font-weight: bold; }
                    img { filter: invert(1); }
                </style>
            </head>
            <body>
                ${contenido}
                <script>
                    window.onload = function() { window.print(); window.close(); };
                <\/script>
            </body>
            </html>
        `);
        ventana.document.close();
    });

    // ── Inicio ────────────────────────────────────────────────────────────────
    cargarCatalogo();
});
