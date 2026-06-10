// URL base de tu API en Django
const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica del Menú Hamburguesa (Global)
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 2. Cargar todos los empleos al entrar a la página
    const contenedorTodasVacantes = document.querySelector('.vacantes-container');
    if (contenedorTodasVacantes) {
        cargarTodosLosEmpleos();
    }
});

// -------------------------------------------------------------
// CONEXIÓN CON LA API: CARGAR TODOS LOS EMPLEOS (Empleos.html)
// -------------------------------------------------------------
async function cargarTodosLosEmpleos() {
    const contenedor = document.querySelector('.vacantes-container');
    // Guardamos la barra de búsqueda para no borrarla al limpiar el contenedor
    const formBusqueda = contenedor.querySelector('.contenedor-busqueda') ? contenedor.querySelector('.contenedor-busqueda').outerHTML : '';

    // Mostramos estado de carga (evita el parpadeo de datos estáticos)
    contenedor.innerHTML = formBusqueda + `
        <div style="text-align: center; width: 100%; padding: 3rem;">
            <p style="color: #0066d5; font-weight: bold; font-size: 1.2rem;">Cargando todas las vacantes... ⏳</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/empleos/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Error al obtener los empleos');

        const data = await response.json();
        let html = formBusqueda; 

        if (data.length === 0) {
            html += '<p style="text-align:center; margin-top:20px; font-weight:bold; color:#1b2d56;">No hay vacantes publicadas por el momento.</p>';
        } else {
            data.forEach(empleo => {
                // Solución para mostrar el nombre correcto de la Empresa
                let nombreEmpresa = "Empresa Desconocida";
                if (typeof empleo.empresaid === 'object' && empleo.empresaid !== null) {
                    nombreEmpresa = empleo.empresaid.nombreempresa || empleo.empresaid.NombreEmpresa || `Empresa ID: ${empleo.empresaid.empresaid}`;
                } else {
                    nombreEmpresa = `Empresa ID: ${empleo.empresaid}`;
                }

                // Generamos la tarjeta de la vacante
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
        
        // Inyectamos el HTML final
        contenedor.innerHTML = html;
        
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = formBusqueda + `
            <div style="text-align: center; color: #0f2b5d; padding: 2rem; border: 1px dashed #dc3545; border-radius: 12px; margin-top: 1rem;">
                <p style="color: #dc3545; font-weight: bold;">Error al cargar las vacantes desde el servidor. 🔌</p>
            </div>
        `;
    }
}