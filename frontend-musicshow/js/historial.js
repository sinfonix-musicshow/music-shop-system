/**
 * frontend-musicshow/js/historial.js
 * Lógica interactiva para la consulta de ventas, filtros y reimpresión de comprobantes fiscales.
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

    // ── 2. Conexión Resiliente con la API ─────────────────────────────────────
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

    // ── 3. Estado Local ───────────────────────────────────────────────────────
    let comprobantesCache = [];

    // Referencias DOM
    const cuerpoTabla = document.getElementById('cuerpo-tabla-historial');
    const inputTexto = document.getElementById('filtro-texto');
    const inputFechaDesde = document.getElementById('filtro-fecha-desde');
    const inputFechaHasta = document.getElementById('filtro-fecha-hasta');
    const selectMedioPago = document.getElementById('filtro-medio-pago');
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    const btnRefrescar = document.getElementById('btn-refrescar-historial');

    // Métricas
    const statTotalFacturado = document.getElementById('stat-total-facturado');
    const statCantComprobantes = document.getElementById('stat-cant-comprobantes');
    const statTicketPromedio = document.getElementById('stat-ticket-promedio');

    // Modal
    const modalDetalleEl = document.getElementById('modalDetalleFactura');
    const modalDetalle = new bootstrap.Modal(modalDetalleEl);
    const modalCuerpo = document.getElementById('modalDetalleCuerpo');
    const btnReimprimir = document.getElementById('btn-reimprimir-ticket');

    // ── 4. Cargar Historial ───────────────────────────────────────────────────
    async function cargarHistorial() {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-white-50 py-5">
                    <div class="spinner-border spinner-border-sm me-2 text-warning" role="status"></div>
                    Cargando historial de facturas...
                </td>
            </tr>
        `;

        try {
            const resp = await apiFetch('/Facturas');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            comprobantesCache = Array.isArray(data) ? data : [];
            aplicarFiltros();
        } catch (error) {
            console.error("Error cargando historial de facturas:", error);
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-5">
                        <i class="bi bi-wifi-off display-6 d-block mb-2"></i>
                        No se pudo conectar con el servicio en <code>${urlBase}</code>.<br>
                        <small class="text-white-50">Verifica que la API en .NET esté activa.</small>
                    </td>
                </tr>
            `;
        }
    }

    // ── 5. Renderizar Tabla y Métricas ────────────────────────────────────────
    function renderizarTabla(items) {
        cuerpoTabla.innerHTML = '';

        // Calcular Métricas sobre los elementos filtrados
        const totalSum = items.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        const cantidad = items.length;
        const promedio = cantidad > 0 ? (totalSum / cantidad) : 0;

        statTotalFacturado.textContent = totalSum.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        statCantComprobantes.textContent = cantidad;
        statTicketPromedio.textContent = promedio.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        if (items.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-secondary py-5">
                        <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                        No se registraron ventas con los filtros aplicados.
                    </td>
                </tr>
            `;
            return;
        }

        items.forEach(fac => {
            const tr = document.createElement('tr');

            // Formato de fecha
            const fechaObj = fac.fechaEmision ? new Date(fac.fechaEmision) : new Date();
            const fechaFormateada = fechaObj.toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const horaFormateada = fechaObj.toLocaleTimeString('es-AR', {
                hour: '2-digit', minute: '2-digit'
            });

            // Formato de Total
            const totalARS = Number(fac.total || 0).toLocaleString('es-AR', {
                style: 'currency', currency: 'ARS', minimumFractionDigits: 2
            });

            // Badge de medio de pago
            const metodo = fac.metodoPago || 'Efectivo';
            let badgePagoClass = 'badge-pago-otro';
            let pagoIcon = 'bi-credit-card';
            if (metodo.toLowerCase().includes('efectivo')) {
                badgePagoClass = 'badge-pago-efectivo';
                pagoIcon = 'bi-cash-stack';
            } else if (metodo.toLowerCase().includes('mercado')) {
                badgePagoClass = 'badge-pago-mp';
                pagoIcon = 'bi-phone';
            } else if (metodo.toLowerCase().includes('personal')) {
                badgePagoClass = 'badge-pago-pp';
                pagoIcon = 'bi-wallet2';
            }

            // Estado
            const estadoHtml = (fac.estado || 'Autorizada').toLowerCase() === 'autorizada'
                ? `<span class="badge bg-success bg-opacity-25 text-success border border-success">Autorizada</span>`
                : `<span class="badge bg-secondary bg-opacity-25 text-secondary border border-secondary">${fac.estado}</span>`;

            tr.innerHTML = `
                <td>
                    <span class="badge bg-dark border border-secondary font-monospace text-warning px-2 py-1 fs-6">
                        ${fac.numeroComprobante || `ID-${fac.id}`}
                    </span>
                </td>
                <td>
                    <div class="text-white">${fechaFormateada}</div>
                    <div class="small text-white-50">${horaFormateada} hs</div>
                </td>
                <td>
                    <div class="fw-semibold text-white">${fac.nombreCliente || 'Consumidor Final'}</div>
                </td>
                <td>
                    <span class="badge ${badgePagoClass} px-2 py-1">
                        <i class="bi ${pagoIcon} me-1"></i>${metodo}
                    </span>
                </td>
                <td class="fw-bold fs-6 text-white">${totalARS}</td>
                <td class="text-center">${estadoHtml}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning rounded-pill px-3 py-1" 
                            title="Ver detalle del comprobante" 
                            onclick="window.abrirDetalleFactura(${fac.id})">
                        <i class="bi bi-eye me-1"></i>Ver
                    </button>
                </td>
            `;

            cuerpoTabla.appendChild(tr);
        });
    }

    // ── 6. Lógica de Filtrado ─────────────────────────────────────────────────
    function aplicarFiltros() {
        const texto = inputTexto.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fechaDesdeVal = inputFechaDesde.value; // YYYY-MM-DD
        const fechaHastaVal = inputFechaHasta.value; // YYYY-MM-DD
        const medioPagoSel = selectMedioPago.value;

        const filtrados = comprobantesCache.filter(item => {
            // Filtro texto (Comprobante o Cliente)
            const txtCompleto = `${item.numeroComprobante || ''} ${item.nombreCliente || ''}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const matchTexto = !texto || txtCompleto.includes(texto);

            // Filtro fechas
            let matchFecha = true;
            if (item.fechaEmision) {
                const itemFecha = new Date(item.fechaEmision);
                
                if (fechaDesdeVal) {
                    const dDesde = new Date(`${fechaDesdeVal}T00:00:00`);
                    if (itemFecha < dDesde) matchFecha = false;
                }

                if (fechaHastaVal) {
                    const dHasta = new Date(`${fechaHastaVal}T23:59:59`);
                    if (itemFecha > dHasta) matchFecha = false;
                }
            }

            // Filtro medio de pago
            let matchMedio = true;
            if (medioPagoSel && item.metodoPago) {
                matchMedio = item.metodoPago.toLowerCase() === medioPagoSel.toLowerCase();
            }

            return matchTexto && matchFecha && matchMedio;
        });

        renderizarTabla(filtrados);
    }

    inputTexto.addEventListener('input', aplicarFiltros);
    inputFechaDesde.addEventListener('change', aplicarFiltros);
    inputFechaHasta.addEventListener('change', aplicarFiltros);
    selectMedioPago.addEventListener('change', aplicarFiltros);

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = '';
        inputFechaDesde.value = '';
        inputFechaHasta.value = '';
        selectMedioPago.value = '';
        aplicarFiltros();
    });

    btnRefrescar.addEventListener('click', cargarHistorial);

    // ── 7. Modal de Detalle de Factura / Reimpresión ───────────────────────────
    window.abrirDetalleFactura = async function(id) {
        modalCuerpo.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-warning" role="status"></div>
                <div class="small text-white-50 mt-2">Consultando comprobante en la base de datos...</div>
            </div>
        `;
        modalDetalle.show();

        try {
            const resp = await apiFetch(`/Facturas/${id}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const fac = await resp.json();

            renderizarTicketModal(fac);
        } catch (error) {
            console.error("Error al obtener detalle de la factura:", error);
            modalCuerpo.innerHTML = `
                <div class="alert alert-danger py-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>No se pudo recuperar el detalle de la factura.
                </div>
            `;
        }
    };

    function renderizarTicketModal(fac) {
        const fecha = fac.fechaEmision ? new Date(fac.fechaEmision) : new Date();
        const vtoCAE = fac.vencimientoCAE ? new Date(fac.vencimientoCAE).toLocaleDateString('es-AR') : '—';

        // Filas de ítems
        let itemsHtml = '';
        if (fac.detalles && fac.detalles.length > 0) {
            fac.detalles.forEach(d => {
                const subARS = Number(d.subtotal).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                const unitARS = Number(d.precioUnitario).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                itemsHtml += `
                    <div class="d-flex justify-content-between mb-1">
                        <div>
                            <div>${d.nombreInstrumento || d.codigoInstrumento}</div>
                            <div class="text-white-50" style="font-size: 0.72rem;">${d.cantidad} un. x ${unitARS}</div>
                        </div>
                        <div class="fw-bold">${subARS}</div>
                    </div>
                `;
            });
        } else {
            itemsHtml = `<div class="text-white-50">Sin ítems detallados</div>`;
        }

        const netoARS = Number(fac.subtotalNeto || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const ivaARS = Number(fac.iva || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const totalARS = Number(fac.total || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        const qrDataUrl = encodeURIComponent(fac.qrData || `https://www.afip.gob.ar/fe/qr/?n=${fac.numeroComprobante}&cae=${fac.cae}`);

        modalCuerpo.innerHTML = `
            <div class="ticket-fiscal-modal shadow" id="area-ticket-historial">
                <div class="text-center border-bottom border-secondary pb-3 mb-3">
                    <h4 class="fw-bold mb-1 tracking-wider text-white">MUSIC SHOW</h4>
                    <div class="small text-white-50">Batalla de Ayacucho 247</div>
                    <div class="small text-white-50">San Miguel de Tucumán, Tucumán</div>
                    <div class="small text-white-50">CUIT: 30-71234567-8 | IVA Resp. Inscripto</div>
                    <div class="badge bg-secondary text-white mt-2 px-3 py-1">${fac.tipoComprobante || 'FACTURA B'} (Cod. 006)</div>
                </div>

                <div class="small border-bottom border-secondary pb-2 mb-2">
                    <div class="d-flex justify-content-between">
                        <span>COMPROBANTE:</span>
                        <strong class="text-warning">${fac.numeroComprobante}</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>FECHA Y HORA:</span>
                        <span>${fecha.toLocaleString('es-AR')}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>CLIENTE:</span>
                        <span>${fac.nombreCliente || 'Consumidor Final'}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>DOC / CUIT:</span>
                        <span>${fac.documentoCliente || 'Sin Documento'}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>MEDIO DE PAGO:</span>
                        <strong>${fac.metodoPago || 'Efectivo'}</strong>
                    </div>
                </div>

                <div class="border-bottom border-secondary py-2 mb-2">
                    <div class="d-flex justify-content-between small text-white-50 mb-1 fw-bold">
                        <span>DESCRIPCIÓN</span>
                        <span>SUBTOTAL</span>
                    </div>
                    <div class="small">${itemsHtml}</div>
                </div>

                <div class="small border-bottom border-secondary pb-2 mb-3">
                    <div class="d-flex justify-content-between text-white-50">
                        <span>Subtotal Neto:</span>
                        <span>${netoARS}</span>
                    </div>
                    <div class="d-flex justify-content-between text-white-50">
                        <span>IVA (21%):</span>
                        <span>${ivaARS}</span>
                    </div>
                    <div class="d-flex justify-content-between fs-5 fw-bold text-white mt-1">
                        <span>TOTAL FACTURADO:</span>
                        <span style="color: var(--color-naranja);">${totalARS}</span>
                    </div>
                </div>

                <div class="text-center pt-1">
                    <div class="fw-bold small text-warning mb-1">AUTORIZADO POR ARCA (AFIP)</div>
                    <div class="small text-white-50">CAE N°: <span class="font-monospace text-white fw-bold">${fac.cae || '74128956321458'}</span></div>
                    <div class="small text-white-50 mb-2">Vto. CAE: <span>${vtoCAE}</span></div>
                    <div class="my-2">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=115x115&data=${qrDataUrl}&color=ffffff&bgcolor=111111" 
                             alt="Código QR Fiscal ARCA" 
                             class="border border-secondary p-1 rounded" 
                             width="115" height="115">
                    </div>
                    <div class="text-white-50" style="font-size: 0.65rem;">Comprobante Electrónico Válido como Factura Oficial</div>
                </div>
            </div>
        `;
    }

    // ── 8. Reimprimir Ticket ──────────────────────────────────────────────────
    btnReimprimir.addEventListener('click', () => {
        const ticketArea = document.getElementById('area-ticket-historial');
        if (!ticketArea) return;

        const ventana = window.open('', '_blank', 'height=650,width=450');
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reimprimir Comprobante - Music Show</title>
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
                ${ticketArea.innerHTML}
                <script>
                    window.onload = function() { window.print(); window.close(); };
                <\/script>
            </body>
            </html>
        `);
        ventana.document.close();
    });

    // ── Inicio ────────────────────────────────────────────────────────────────
    cargarHistorial();
});
