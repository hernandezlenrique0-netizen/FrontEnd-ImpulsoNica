// URL base de tu API en Django
const API_URL = 'http://127.0.0.1:8000/api';

// Variables globales de estado de paginación
let paginaActual = 1;
let tamanoPagina = 10;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Lógica del Menú Hamburguesa (Global)
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 2. Cargar opciones del buscador dinámicamente
    await cargarOpcionesBusqueda();

    // 3. Leer la URL por si venimos desde el Index buscando algo
    const urlParams = new URLSearchParams(window.location.search);
    const rubroId = urlParams.get('rubro') || '';
    const ubicacionId = urlParams.get('ubicacion') || '';

    const selectRubro = document.getElementById('searchRubro');
    const selectUbi = document.getElementById('searchUbicacion');
    if (selectRubro) selectRubro.value = rubroId;
    if (selectUbi) selectUbi.value = ubicacionId;

    // 4. Configurar el evento de buscar (reinicia a la página 1)
    const formBusqueda = document.getElementById('formBusquedaEmpleos');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', (e) => {
            e.preventDefault();
            cargarTodosLosEmpleos(1, true); // Página 1 y guardar en historial NoSQL
        });
    }

    // 5. Cargar la primera página de empleos al entrar
    const contenedorLista = document.getElementById('contenedorListaEmpleos');
    if (contenedorLista) {
        cargarTodosLosEmpleos(1, false);
    }
});

// --- FUNCIÓN PARA CARGAR DROPDOWNS DINÁMICOS ---
async function cargarOpcionesBusqueda() {
    try {
        const [resSectores, resMunicipios] = await Promise.all([
            fetch(`${API_URL}/cat-sectores/`),
            fetch(`${API_URL}/municipios/`)
        ]);

        const sectores = await resSectores.json();
        const municipios = await resMunicipios.json();

        const selectRubro = document.getElementById('searchRubro');
        const selectUbi = document.getElementById('searchUbicacion');

        if (selectRubro) {
            sectores.forEach(s => {
                const id = s.id || s.sectorid || Object.values(s)[0];
                const nombre = s.nombre || Object.values(s)[1];
                selectRubro.add(new Option(nombre, id));
            });
        }

        if (selectUbi) {
            municipios.forEach(m => {
                const id = m.id || m.municipioid || Object.values(m)[0];
                const nombre = m.nombre || Object.values(m)[1];
                selectUbi.add(new Option(nombre, id));
            });
        }
    } catch (e) {
        console.error("Error cargando opciones de búsqueda", e);
    }
}

// -------------------------------------------------------------
// CONEXIÓN CON LA API: CARGAR Y PAGINAR EMPLEOS DE 10 EN 10
// -------------------------------------------------------------
async function cargarTodosLosEmpleos(pagina = 1, registrarBusquedaNoSQL = false) {
    const contenedor = document.getElementById('contenedorListaEmpleos');
    if (!contenedor) return;

    paginaActual = pagina;

    const rubroSeleccionado = document.getElementById('searchRubro')?.value || '';
    const ubicacionSeleccionada = document.getElementById('searchUbicacion')?.value || '';

    contenedor.innerHTML = `
        <div style="text-align: center; width: 100%; padding: 3rem;">
            <p style="color: #0066d5; font-weight: bold; font-size: 1.2rem;">Cargando página ${paginaActual} de vacantes... ⏳</p>
        </div>
    `;

    try {
        let queryParams = `?page=${paginaActual}&page_size=${tamanoPagina}&`;
        if (rubroSeleccionado) queryParams += `empresaid__sectorid=${rubroSeleccionado}&`;
        if (ubicacionSeleccionada) queryParams += `empresaid__municipioid=${ubicacionSeleccionada}&`;

        const response = await fetch(`${API_URL}/empleos/${queryParams}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error al obtener los empleos');

        const data = await response.json();

        // Soporte híbrido: funciona con respuesta paginada (data.results) o lista plana
        const listaEmpleos = Array.isArray(data) ? data : (data.results || []);
        const totalVacantes = Array.isArray(data) ? data.length : (data.count || 0);
        const totalPaginas = Math.ceil(totalVacantes / tamanoPagina) || 1;

        // --- LÓGICA NOSQL: GUARDAR HISTORIAL EN COSMOS DB SOLO AL BUSCAR ---
        if (registrarBusquedaNoSQL && (rubroSeleccionado || ubicacionSeleccionada)) {
            const userId = localStorage.getItem('usuario_sql_id') || null;
            const selectRubro = document.getElementById('searchRubro');
            const selectUbi = document.getElementById('searchUbicacion');

            const nombreSector = rubroSeleccionado ? selectRubro.options[selectRubro.selectedIndex].text : "Todos";
            const nombreMunicipio = ubicacionSeleccionada ? selectUbi.options[selectUbi.selectedIndex].text : "Todos";

            const payload = {
                termino_principal: 'Búsqueda por Filtros Avanzados',
                filtros_aplicados: {
                    sector_id: rubroSeleccionado ? parseInt(rubroSeleccionado) : null,
                    sector_nombre: nombreSector,
                    municipio_id: ubicacionSeleccionada ? parseInt(ubicacionSeleccionada) : null,
                    municipio_nombre: nombreMunicipio
                },
                resultados_encontrados: totalVacantes
            };

            if (userId) payload.usuario_sql_id = parseInt(userId);

            fetch('http://127.0.0.1:8000/api/v1/historial-busqueda/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error("❌ Error al guardar en Cosmos DB:", err));
        }

        let html = '';

        if (listaEmpleos.length === 0) {
            html = '<p style="text-align:center; margin-top:20px; font-weight:bold; color:#1b2d56;">No hay vacantes publicadas que coincidan con tu búsqueda.</p>';
        } else {
            // Barra superior con contador de resultados y selector de cantidad por página (10, 20, 50)
            const inicioRango = (paginaActual - 1) * tamanoPagina + 1;
            const finRango = Math.min(paginaActual * tamanoPagina, totalVacantes);

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 5px; flex-wrap: wrap; gap: 10px;">
                    <span style="color: #0f2b5d; font-weight: 600; font-size: 0.95rem;">
                        Mostrando <strong>${inicioRango} - ${finRango}</strong> de <strong>${totalVacantes}</strong> vacantes disponibles
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label for="selectPageSize" style="font-size: 0.9rem; color: #555; font-weight: bold;">Mostrar:</label>
                        <select id="selectPageSize" onchange="cambiarTamanoPagina(this.value)" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #004b87; color: #0f2b5d; font-weight: bold; cursor: pointer;">
                            <option value="10" ${tamanoPagina === 10 ? 'selected' : ''}>10 por página</option>
                            <option value="20" ${tamanoPagina === 20 ? 'selected' : ''}>20 por página</option>
                            <option value="50" ${tamanoPagina === 50 ? 'selected' : ''}>50 por página</option>
                        </select>
                    </div>
                </div>
            `;

            // Tarjetas de vacantes
            listaEmpleos.forEach(empleo => {
                let nombreEmpresa = "Empresa Desconocida";
                if (typeof empleo.empresaid === 'object' && empleo.empresaid !== null) {
                    nombreEmpresa = empleo.empresaid.nombreempresa || empleo.empresaid.NombreEmpresa || `Empresa ID: ${empleo.empresaid.empresaid}`;
                } else {
                    nombreEmpresa = `Empresa ID: ${empleo.empresaid}`;
                }

                html += `
                    <div class="vacante">
                        <h2>${empleo.nombreempleo}</h2>
                        <p><strong>Empresa:</strong> ${nombreEmpresa}</p>
                        <p><strong>Salario:</strong> C$ ${empleo.salario || 'A convenir'}</p>
                        <div class="vacante-footer">
                            <a href="/html/DesEmpleo.html?id=${empleo.empleoid}" class="btn-ver">Ver más…</a>
                        </div>
                    </div>
                `;
            });

            // Controles de navegación de páginas (abajo)
            if (totalPaginas > 1) {
                html += construirControlesPaginacion(paginaActual, totalPaginas);
            }
        }

        contenedor.innerHTML = html;

    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = `
            <div style="text-align: center; color: #0f2b5d; padding: 2rem; border: 1px dashed #dc3545; border-radius: 12px; margin-top: 1rem;">
                <p style="color: #dc3545; font-weight: bold;">Error al cargar las vacantes desde el servidor. 🔌</p>
            </div>
        `;
    }
}

// --- FUNCIÓN PARA GENERAR LOS BOTONES DE PÁGINA (1, 2, 3...) ---
function construirControlesPaginacion(actual, total) {
    let botonesHtml = '';

    // Botón Anterior
    const prevDisabled = actual <= 1;
    botonesHtml += `
        <button onclick="irAPagina(${actual - 1})" ${prevDisabled ? 'disabled' : ''} 
            style="padding: 8px 16px; border-radius: 8px; border: 1px solid #0066d5; background: ${prevDisabled ? '#e9ecef' : '#ffffff'}; color: ${prevDisabled ? '#999' : '#0066d5'}; font-weight: bold; cursor: ${prevDisabled ? 'not-allowed' : 'pointer'};">
            &laquo; Anterior
        </button>
    `;

    // Rango inteligente de números de página (máximo 5 botones visibles alrededor de la actual)
    let inicio = Math.max(1, actual - 2);
    let fin = Math.min(total, inicio + 4);
    if (fin - inicio < 4) {
        inicio = Math.max(1, fin - 4);
    }

    for (let i = inicio; i <= fin; i++) {
        const esActiva = i === actual;
        botonesHtml += `
            <button onclick="irAPagina(${i})" 
                style="padding: 8px 14px; border-radius: 8px; border: 1px solid #0066d5; background: ${esActiva ? '#0066d5' : '#ffffff'}; color: ${esActiva ? '#ffffff' : '#0066d5'}; font-weight: bold; cursor: pointer;">
                ${i}
            </button>
        `;
    }

    // Botón Siguiente
    const nextDisabled = actual >= total;
    botonesHtml += `
        <button onclick="irAPagina(${actual + 1})" ${nextDisabled ? 'disabled' : ''} 
            style="padding: 8px 16px; border-radius: 8px; border: 1px solid #0066d5; background: ${nextDisabled ? '#e9ecef' : '#ffffff'}; color: ${nextDisabled ? '#999' : '#0066d5'}; font-weight: bold; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'};">
            Siguiente &raquo;
        </button>
    `;

    return `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 25px; margin-bottom: 15px; flex-wrap: wrap;">
            ${botonesHtml}
        </div>
    `;
}

// Funciones globales llamadas por los botones
window.irAPagina = function(nuevaPagina) {
    cargarTodosLosEmpleos(nuevaPagina, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cambiarTamanoPagina = function(nuevoTamano) {
    tamanoPagina = parseInt(nuevoTamano);
    cargarTodosLosEmpleos(1, false);
};