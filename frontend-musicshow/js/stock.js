/**
 * frontend-musicshow/js/stock.js
 * Lógica interactiva para la gestión de inventario y stock de instrumentos.
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

    // ── 2. Configuración de API ──────────────────────────────────────────────
    // URL principal solicitada por el usuario, con fallback si hay problemas de SSL/puerto
    const API_PRIMARY = 'https://localhost:7174/api/Instrumentos';
    const API_FALLBACK = 'http://localhost:5144/api/Instrumentos';
    let apiBase = API_PRIMARY;

    let instrumentosCache = [];
    let editandoId = null;

    // Referencias DOM
    const cuerpoTabla = document.getElementById('cuerpo-tabla-stock');
    const inputBuscador = document.getElementById('buscador-stock');
    const selectCategoria = document.getElementById('filtro-categoria');
    const btnNuevo = document.getElementById('btn-nuevo-instrumento');
    const modalElemento = document.getElementById('modalInstrumento');
    const modalBootstrap = new bootstrap.Modal(modalElemento);
    const modalTitulo = document.getElementById('modalInstrumentoTitulo');
    const alertaModal = document.getElementById('alertaModalInstrumento');
    const btnGuardar = document.getElementById('btnGuardarInstrumento');

    // Inputs del Modal
    const inputId = document.getElementById('instrumentoId');
    const inputCodigo = document.getElementById('instCodigo');
    const inputNombre = document.getElementById('instNombre');
    const inputMarca = document.getElementById('instMarca');
    const inputCategoria = document.getElementById('instCategoria');
    const inputPrecio = document.getElementById('instPrecio');
    const inputStock = document.getElementById('instStock');
    const selectEmoji = document.getElementById('instEmoji');
    const contenedorStockInicial = document.getElementById('contenedorStockInicial');

    // Métricas
    const statTotal = document.getElementById('stat-total');
    const statConStock = document.getElementById('stat-con-stock');
    const statCritico = document.getElementById('stat-critico');
    const statAgotados = document.getElementById('stat-agotados');

    // ── 3. Helper Fetch con Resiliencia ───────────────────────────────────────
    async function apiFetch(endpoint, options = {}) {
        try {
            const resp = await fetch(`${apiBase}${endpoint}`, options);
            return resp;
        } catch (error) {
            // Si falló usando el puerto primario, intentamos fallback transparente
            if (apiBase === API_PRIMARY) {
                console.warn("Fallo conectando a HTTPS. Intentando fallback HTTP...", error);
                apiBase = API_FALLBACK;
                return await fetch(`${apiBase}${endpoint}`, options);
            }
            throw error;
        }
    }

    // ── 4. Cargar Instrumentos ────────────────────────────────────────────────
    async function cargarInstrumentos() {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-white-50 py-5">
                    <div class="spinner-border spinner-border-sm me-2 text-warning" role="status"></div>
                    Cargando inventario desde la API...
                </td>
            </tr>
        `;

        try {
            const respuesta = await apiFetch('');
            if (!respuesta.ok) {
                throw new Error(`Error del servidor HTTP: ${respuesta.status}`);
            }
            const data = await respuesta.json();
            instrumentosCache = Array.isArray(data) ? data : [];
            actualizarMetricas(instrumentosCache);
            aplicarFiltros();
        } catch (error) {
            console.error("Error al cargar instrumentos:", error);
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-5">
                        <i class="bi bi-wifi-off display-6 d-block mb-2"></i>
                        No se pudo conectar con el servicio en <code>${apiBase}</code>.<br>
                        <small class="text-white-50">Asegúrate de que la API en .NET esté ejecutándose.</small>
                    </td>
                </tr>
            `;
        }
    }

    // ── 5. Actualizar Métricas ────────────────────────────────────────────────
    function actualizarMetricas(items) {
        const total = items.length;
        const conStock = items.filter(i => i.stock > 3).length;
        const critico = items.filter(i => i.stock > 0 && i.stock <= 3).length;
        const agotados = items.filter(i => i.stock <= 0).length;

        if (statTotal) statTotal.textContent = total;
        if (statConStock) statConStock.textContent = conStock;
        if (statCritico) statCritico.textContent = critico;
        if (statAgotados) statAgotados.textContent = agotados;
    }

    // ── 6. Renderizar Tabla ───────────────────────────────────────────────────
    function renderizarTabla(items) {
        cuerpoTabla.innerHTML = '';

        if (items.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-secondary py-5">
                        <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                        No se encontraron instrumentos con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        items.forEach(inst => {
            const tr = document.createElement('tr');

            // Determinar estilo de badge de stock
            let stockBadgeClass = 'stock-disponible';
            let stockTexto = `${inst.stock} u.`;
            if (inst.stock <= 0) {
                stockBadgeClass = 'stock-agotado';
                stockTexto = '0 (Agotado)';
            } else if (inst.stock <= 3) {
                stockBadgeClass = 'stock-critico';
                stockTexto = `${inst.stock} u. (Crítico)`;
            }

            // Estado
            const estadoHtml = inst.activo !== false
                ? `<span class="badge bg-success bg-opacity-25 text-success border border-success">Activo</span>`
                : `<span class="badge bg-secondary bg-opacity-25 text-secondary border border-secondary">Inactivo</span>`;

            // Formato de precio ARS
            const precioARS = Number(inst.precio || 0).toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 2
            });

            const emoji = inst.emojiIcon || '🎸';

            tr.innerHTML = `
                <td>
                    <span class="badge bg-dark border border-secondary font-monospace text-warning px-2 py-1">
                        ${inst.codigo || `ID-${inst.id}`}
                    </span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="fs-4">${emoji}</span>
                        <div>
                            <div class="fw-bold text-white">${inst.nombre}</div>
                            <div class="small text-white-50">${inst.marca || 'Genérica'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-categoria px-2 py-1">${inst.categoria || 'General'}</span>
                </td>
                <td class="fw-semibold text-light">${precioARS}</td>
                <td class="text-center">
                    <div class="d-inline-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2 text-white" 
                                title="Descontar 1 unidad" 
                                onclick="window.ajustarStockRapido(${inst.id}, -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="stock-tag ${stockBadgeClass}">${stockTexto}</span>
                        <button class="btn btn-sm btn-outline-secondary py-0 px-2 text-white" 
                                title="Ingresar 1 unidad" 
                                onclick="window.ajustarStockRapido(${inst.id}, 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </td>
                <td class="text-center">${estadoHtml}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning rounded-circle p-2 me-1" 
                            title="Editar instrumento" 
                            onclick="window.abrirModalEditar(${inst.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-circle p-2" 
                            title="Baja lógica" 
                            onclick="window.eliminarInstrumento(${inst.id}, '${inst.nombre}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            cuerpoTabla.appendChild(tr);
        });
    }

    // ── 7. Filtrado y Búsqueda ────────────────────────────────────────────────
    function aplicarFiltros() {
        const termino = inputBuscador.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const categoriaSel = selectCategoria.value;

        const filtrados = instrumentosCache.filter(item => {
            const matchesCategoria = !categoriaSel || item.categoria === categoriaSel;
            
            const textoCompleto = `${item.codigo || ''} ${item.nombre || ''} ${item.marca || ''} ${item.categoria || ''}`
                .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const matchesTexto = !termino || textoCompleto.includes(termino);

            return matchesCategoria && matchesTexto;
        });

        renderizarTabla(filtrados);
    }

    inputBuscador.addEventListener('input', aplicarFiltros);
    selectCategoria.addEventListener('change', aplicarFiltros);

    // ── 8. Ajuste Rápido de Stock (+ / -) ──────────────────────────────────────
    window.ajustarStockRapido = async function(id, delta) {
        try {
            const resp = await apiFetch(`/${id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ esAbsoluto: false, valor: delta })
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                alert(errData.mensaje || "No se pudo ajustar el stock. Verifique que no quede negativo.");
                return;
            }

            // Actualizar stock localmente
            const actualizado = await resp.json();
            const index = instrumentosCache.findIndex(i => i.id === id);
            if (index !== -1) {
                instrumentosCache[index].stock = actualizado.stock;
                actualizarMetricas(instrumentosCache);
                aplicarFiltros();
            }
        } catch (error) {
            console.error("Error ajustando stock:", error);
            alert("Error de conexión al ajustar stock.");
        }
    };

    // ── 9. Eliminar (Baja Lógica) ──────────────────────────────────────────────
    window.eliminarInstrumento = async function(id, nombre) {
        if (!confirm(`¿Estás seguro de que deseas dar de baja el instrumento "${nombre}"?`)) {
            return;
        }

        try {
            const resp = await apiFetch(`/${id}`, { method: 'DELETE' });
            if (resp.ok) {
                // Eliminar o marcar inactivo
                instrumentosCache = instrumentosCache.filter(i => i.id !== id);
                actualizarMetricas(instrumentosCache);
                aplicarFiltros();
            } else {
                const errData = await resp.json().catch(() => ({}));
                alert(errData.mensaje || "Error al dar de baja el instrumento.");
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    // ── 10. Modal Alta / Edición ──────────────────────────────────────────────
    btnNuevo.addEventListener('click', () => {
        editandoId = null;
        document.getElementById('formInstrumento').reset();
        modalTitulo.innerHTML = `<i class="bi bi-plus-circle me-2" style="color: var(--color-naranja);"></i>Nuevo Instrumento`;
        inputCodigo.disabled = false;
        contenedorStockInicial.style.display = 'block';
        alertaModal.classList.add('d-none');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i class="bi bi-check2 me-1"></i>Guardar Instrumento`;
        modalBootstrap.show();
    });

    window.abrirModalEditar = function(id) {
        const item = instrumentosCache.find(i => i.id === id);
        if (!item) return;

        editandoId = id;
        inputId.value = item.id;
        inputCodigo.value = item.codigo;
        inputCodigo.disabled = true; // El código no se modifica en edición
        inputNombre.value = item.nombre;
        inputMarca.value = item.marca || '';
        inputCategoria.value = item.categoria;
        inputPrecio.value = item.precio;
        selectEmoji.value = item.emojiIcon || '🎸';

        // Ocultar stock inicial en edición (se gestiona vía PATCH)
        contenedorStockInicial.style.display = 'none';

        modalTitulo.innerHTML = `<i class="bi bi-pencil-square me-2" style="color: var(--color-naranja);"></i>Editar Instrumento`;
        alertaModal.classList.add('d-none');
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i class="bi bi-check2 me-1"></i>Actualizar Cambios`;
        modalBootstrap.show();
    };

    // Guardar (Submit del Modal)
    btnGuardar.addEventListener('click', async () => {
        alertaModal.classList.add('d-none');

        const codigo = inputCodigo.value.trim();
        const nombre = inputNombre.value.trim();
        const marca = inputMarca.value.trim();
        const categoria = inputCategoria.value;
        const precio = parseFloat(inputPrecio.value);
        const stock = parseInt(inputStock.value) || 0;
        const emojiIcon = selectEmoji.value;

        // Validaciones básicas
        if (!nombre || !marca || !categoria || isNaN(precio) || precio <= 0) {
            alertaModal.textContent = "Por favor completa todos los campos requeridos con valores válidos.";
            alertaModal.classList.remove('d-none');
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Guardando...`;

        try {
            if (editandoId === null) {
                // ALTA (POST)
                if (!codigo) {
                    alertaModal.textContent = "El código de instrumento es obligatorio.";
                    alertaModal.classList.remove('d-none');
                    btnGuardar.disabled = false;
                    btnGuardar.innerHTML = `<i class="bi bi-check2 me-1"></i>Guardar Instrumento`;
                    return;
                }

                const payload = {
                    codigo,
                    nombre,
                    marca,
                    categoria,
                    stock: Math.max(0, stock),
                    precio,
                    emojiIcon
                };

                const resp = await apiFetch('', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    throw new Error(err.mensaje || `Error al registrar instrumento (HTTP ${resp.status})`);
                }

                modalBootstrap.hide();
                await cargarInstrumentos();
            } else {
                // MODIFICACIÓN (PUT)
                const payload = {
                    nombre,
                    marca,
                    categoria,
                    precio,
                    emojiIcon
                };

                const resp = await apiFetch(`/${editandoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}));
                    throw new Error(err.mensaje || `Error al actualizar instrumento (HTTP ${resp.status})`);
                }

                modalBootstrap.hide();
                await cargarInstrumentos();
            }
        } catch (error) {
            console.error("Error guardando instrumento:", error);
            alertaModal.textContent = error.message;
            alertaModal.classList.remove('d-none');
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = editandoId ? `<i class="bi bi-check2 me-1"></i>Actualizar Cambios` : `<i class="bi bi-check2 me-1"></i>Guardar Instrumento`;
        }
    });

    // ── Inicio ────────────────────────────────────────────────────────────────
    cargarInstrumentos();
});
