document.addEventListener('DOMContentLoaded', () => {
    
    // 1. BASE DE DATOS SIMULADA (Próximamente vendrá de tu API/ARCA)
    const facturasBD = [
        { id: 'C 0001-00004521', fecha: '27/09/2026 16:40', cliente: 'ABELLESEN IGNACIO', dni: '47353590', detalle: '1x Guitarra Criolla', pago: 'Transferencia Bancaria', total: 200000 },
        { id: 'A 0001-00001104', fecha: '25/09/2026 10:15', cliente: 'ESTUDIO MUSICAL S.R.L.', dni: '30-71234567-8', detalle: '1x Batería Acústica Mapex, 2x Cables Canon', pago: 'Tarjeta de Crédito', total: 2580000 },
        { id: 'C 0001-00004520', fecha: '24/09/2026 18:30', cliente: 'CONSUMIDOR FINAL', dni: '00000000', detalle: 'Varios / Consumidor Final', pago: 'Efectivo', total: 15500 },
        { id: 'C 0001-00004519', fecha: '22/09/2026 11:20', cliente: 'JUAN PEREZ', dni: '35123456', detalle: '1x Funda Guitarra, 3x Púas', pago: 'Efectivo', total: 45000 },
        { id: 'B 0001-00002100', fecha: '20/09/2026 09:10', cliente: 'ESCUELA DE MÚSICA N1', dni: '30-99887766-5', detalle: '5x Flauta Dulce Yamaha', pago: 'Transferencia Bancaria', total: 75000 },
        { id: 'C 0001-00004518', fecha: '18/09/2026 14:05', cliente: 'MARIA GOMEZ', dni: '28999111', detalle: '1x Afinador Digital Korg', pago: 'Tarjeta de Débito', total: 22000 }
    ];

    // Variables de estado
    let facturasFiltradas = [...facturasBD];
    let limiteMostrar = 3; // Cuántas facturas mostramos inicialmente

    // Referencias al DOM
    const contenedorFacturas = document.getElementById('contenedorFacturas');
    const buscadorInput = document.getElementById('buscadorFacturas');
    const btnCargarMas = document.getElementById('btnCargarMas');

    // 2. FUNCIÓN PARA RENDERIZAR LAS TARJETAS
    function renderizarFacturas() {
        contenedorFacturas.innerHTML = ''; // Limpiamos el contenedor
        
        // Cortamos el array según el límite actual
        const facturasAMostrar = facturasFiltradas.slice(0, limiteMostrar);

        if (facturasAMostrar.length === 0) {
            contenedorFacturas.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-search fs-1 text-secondary mb-3 d-block"></i>
                    <p class="text-secondary fs-5">No se encontraron facturas con esa búsqueda.</p>
                </div>`;
            btnCargarMas.classList.add('d-none');
            return;
        }

        facturasAMostrar.forEach(fac => {
            const html = `
                <div class="invoice-card p-4 rounded-4">
                    <div class="row align-items-center g-3">
                        <div class="col-md-3">
                            <span class="d-block text-light fw-bold mb-1">Factura ${fac.id}</span>
                            <span class="text-secondary small"><i class="bi bi-calendar3 me-1"></i> ${fac.fecha}</span>
                        </div>
                        <div class="col-md-4">
                            <span class="d-block text-light fw-semibold mb-1 text-uppercase">${fac.cliente} (${fac.dni})</span>
                            <span class="text-secondary small text-truncate d-block">${fac.detalle}</span>
                        </div>
                        <div class="col-md-2">
                            <span class="text-secondary small d-block mb-1">Pago</span>
                            <span class="badge bg-dark border border-secondary text-light fw-normal px-2 py-1">${fac.pago}</span>
                        </div>
                        <div class="col-md-3 text-md-end d-flex flex-column align-items-md-end">
                            <span class="d-block fs-5 fw-bold text-white mb-2">$ ${fac.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                            <button class="btn btn-sm btn-pdf rounded-pill px-3" onclick="descargarPDF('${fac.id}')">
                                <i class="bi bi-file-earmark-pdf me-1"></i> Descargar pdf
                            </button>
                        </div>
                    </div>
                </div>
            `;
            contenedorFacturas.innerHTML += html;
        });

        // 3. CONTROLAR VISIBILIDAD DEL BOTÓN "CARGAR MÁS"
        if (facturasFiltradas.length > limiteMostrar) {
            btnCargarMas.classList.remove('d-none');
        } else {
            btnCargarMas.classList.add('d-none');
        }
    }

    // 4. LÓGICA DEL BUSCADOR
    buscadorInput.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Filtramos buscando coincidencias en el N° de factura, nombre o DNI
        facturasFiltradas = facturasBD.filter(fac => {
            const idLimpio = fac.id.toLowerCase();
            const clienteLimpio = fac.cliente.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            return idLimpio.includes(termino) || clienteLimpio.includes(termino) || fac.dni.includes(termino);
        });

        limiteMostrar = 3; // Si busca algo nuevo, reiniciamos el límite a 3
        renderizarFacturas();
    });

    // 5. LÓGICA DEL BOTÓN "CARGAR MÁS"
    btnCargarMas.addEventListener('click', () => {
        limiteMostrar += 3; // Agrega 3 tarjetas más al límite
        renderizarFacturas();
    });

    // 6. SIMULADOR DE DESCARGA PDF
    window.descargarPDF = function(idFactura) {
        alert(`Simulando descarga de la ${idFactura}...\n\nAcá se conectará con ARCA para traer el PDF oficial.`);
    }

    // Ejecutar al cargar la página
    renderizarFacturas();
});