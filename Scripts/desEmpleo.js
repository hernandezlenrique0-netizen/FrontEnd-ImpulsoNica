// URL base de tu API en Django
const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el ID de la vacante desde la URL (ej: ?id=3)
    const urlParams = new URLSearchParams(window.location.search);
    const empleoId = urlParams.get('id');

    if (empleoId) {
        cargarDetalleEmpleo(empleoId);
    } else {
        mostrarError("No se especificó ninguna vacante para mostrar.");
    }
});

// -------------------------------------------------------------
// CONEXIÓN CON LA API: CARGAR DETALLE DE UN EMPLEO
// -------------------------------------------------------------
async function cargarDetalleEmpleo(id) {
    const contenedor = document.querySelector('.vacante-container');
    
    // Estado de carga
    contenedor.innerHTML = `
        <div style="text-align: center; width: 100%; padding: 3rem;">
            <p style="color: #0066d5; font-weight: bold; font-size: 1.2rem;">Cargando detalles de la vacante... ⏳</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/empleos/${id}/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 404) throw new Error("La vacante ya no existe.");
            throw new Error('Error al conectar con el servidor.');
        }

        const empleo = await response.json();

        // Extraer nombre de la empresa
        let nombreEmpresa = "Empresa Desconocida";
        if (typeof empleo.empresaid === 'object' && empleo.empresaid !== null) {
            nombreEmpresa = empleo.empresaid.nombreempresa || empleo.empresaid.NombreEmpresa || `Empresa ID: ${empleo.empresaid.empresaid}`;
        } else {
            nombreEmpresa = `Empresa ID: ${empleo.empresaid}`;
        }

        // Construir el HTML con los datos reales
        contenedor.innerHTML = `
            <section class="vacante-header">
                <div class="Contenedor1">
                    <h2>${empleo.nombreempleo}</h2>
                    <img src="/imgn/CompanyA.webp" alt="Logo de la empresa" class="empresa-logo" style="object-fit: cover;">
                </div>
                <p><strong>Ubicación:</strong> Nicaragua</p>
                <p><strong>Empresa:</strong> ${nombreEmpresa}</p>
                <p><strong>Salario:</strong> C$ ${empleo.salario || 'A convenir'}</p>
            </section>
            <hr>
            <section class="vacante-info">
                <h3>Descripción de la Oferta</h3>
                <p>${empleo.descripcion || 'Sin descripción detallada.'}</p>
            </section>
            
            <div class="vacante-accion">
                <button class="btn-postular" id="btn-postular-real">Postularse</button>
            </div>
        `;

        // Una vez pintado el botón, le asignamos su lógica
        configurarPostulacion();

    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || "Error al cargar la vacante.");
    }
}

// Función auxiliar para mostrar errores
function mostrarError(mensaje) {
    const contenedor = document.querySelector('.vacante-container');
    contenedor.innerHTML = `
        <div style="text-align: center; color: #0f2b5d; padding: 2rem; border: 1px dashed #dc3545; border-radius: 12px; margin-top: 1rem;">
            <p style="color: #dc3545; font-weight: bold;">${mensaje} 🔌</p>
            <a href="/html/Empleos.html" style="display:inline-block; margin-top: 15px; padding: 10px 20px; background-color: #0066d5; color: white; border-radius: 5px; text-decoration: none;">Volver a Empleos</a>
        </div>
    `;
}

// -------------------------------------------------------------
// VALIDACIÓN DE LOGIN PARA POSTULARSE
// -------------------------------------------------------------
function configurarPostulacion() {
    const btnPostular = document.getElementById('btn-postular-real');
    
    if (btnPostular) {
        btnPostular.addEventListener('click', async () => {
            const token = localStorage.getItem('auth_token');
            const tipoUsuario = localStorage.getItem('user_type');

            if (!token) {
                alert("⚠️ Debes iniciar sesión para poder postularte a esta vacante.");
                window.location.href = "/index.html"; 
                return;
            }

            if (tipoUsuario !== 'candidato') {
                alert("❌ Solo los perfiles de tipo 'Candidato' pueden postularse a las vacantes.");
                return;
            }

            btnPostular.innerText = "Enviando...";
            btnPostular.disabled = true;

            setTimeout(() => {
                alert("✅ ¡Postulación enviada con éxito! Tu currículum ha sido enviado a la empresa.");
                btnPostular.innerText = "Postulado ✔️";
                btnPostular.style.backgroundColor = "#28a745"; 
            }, 1500);
        });
    }
}