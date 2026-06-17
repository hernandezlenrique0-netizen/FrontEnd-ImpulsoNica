// URL base de tu API en Django
const API_URL = 'http://20.10.8.172:8000/api';

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

    // Si había parámetros, preseleccionamos los selects
    const selectRubro = document.getElementById('searchRubro');
    const selectUbi = document.getElementById('searchUbicacion');
    if (selectRubro) selectRubro.value = rubroId;
    if (selectUbi) selectUbi.value = ubicacionId;

    // 4. Configurar el evento de buscar (filtro local)
    const formBusqueda = document.getElementById('formBusquedaEmpleos');
    if (formBusqueda) {
        formBusqueda.addEventListener('submit', (e) => {
            e.preventDefault();
            cargarTodosLosEmpleos(); // Volvemos a consultar la API con los nuevos filtros
        });
    }

    // 5. Cargar todos los empleos (o los filtrados) al entrar a la página
    const contenedorLista = document.getElementById('contenedorListaEmpleos');
    if (contenedorLista) {
        cargarTodosLosEmpleos();
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
// CONEXIÓN CON LA API: CARGAR Y FILTRAR EMPLEOS
// -------------------------------------------------------------
async function cargarTodosLosEmpleos() {
    const contenedor = document.getElementById('contenedorListaEmpleos');
    if (!contenedor) return; // Si no existe el contenedor, salimos
    
    // Obtenemos qué seleccionó el usuario
    const rubroSeleccionado = document.getElementById('searchRubro')?.value || '';
    const ubicacionSeleccionada = document.getElementById('searchUbicacion')?.value || '';

    // Mostramos estado de carga
    contenedor.innerHTML = `
        <div style="text-align: center; width: 100%; padding: 3rem;">
            <p style="color: #0066d5; font-weight: bold; font-size: 1.2rem;">Buscando vacantes... ⏳</p>
        </div>
    `;

    try {
        // CONSTRUIMOS LA RUTA CON LOS FILTROS
        let queryParams = '?';
        if (rubroSeleccionado) queryParams += `empresaid__sectorid=${rubroSeleccionado}&`;
        if (ubicacionSeleccionada) queryParams += `empresaid__municipioid=${ubicacionSeleccionada}&`;

        const response = await fetch(`${API_URL}/empleos/${queryParams}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error al obtener los empleos');

        const data = await response.json();
        let html = ''; 

        if (data.length === 0) {
            html += '<p style="text-align:center; margin-top:20px; font-weight:bold; color:#1b2d56;">No hay vacantes publicadas que coincidan con tu búsqueda.</p>';
        } else {
            data.forEach(empleo => {
                // Extraemos nombre de empresa
                let nombreEmpresa = "Empresa Desconocida";
                if (typeof empleo.empresaid === 'object' && empleo.empresaid !== null) {
                    nombreEmpresa = empleo.empresaid.nombreempresa || empleo.empresaid.NombreEmpresa || `Empresa ID: ${empleo.empresaid.empresaid}`;
                } else {
                    nombreEmpresa = `Empresa ID: ${empleo.empresaid}`;
                }

                // Generamos la tarjeta
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