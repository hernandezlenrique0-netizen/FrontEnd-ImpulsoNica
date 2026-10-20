const API_URL = 'http://20.51.194.8:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    inicializarSubidaImagen();
    cargarSolicitudesEmpresas(); 
});

const setTexto = (id, texto) => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = texto; 
};

async function cargarDatosPerfil() {
    let token = localStorage.getItem('auth_token');
    if (!token) return window.location.href = "/index.html";

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) throw new Error("No se pudo cargar el perfil.");
        
        const data = await response.json();
        
        if (data.tipo === 'admin' && data.datos) {
            setTexto('lblNombreAdmin', `${data.datos.nombre || ''} ${data.datos.apellido || ''}`.trim() || 'Super Administrador');
            setTexto('lblCorreo', data.datos.correo || '...');
            setTexto('lblTelefono', data.datos.telefono || 'No especificado');

            if (data.datos.foto_url) {
                document.getElementById('fotoPerfil').src = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://20.51.194.8:8000${data.datos.foto_url}`;
            }
        } else {
            window.location.href = "/index.html";
        }
    } catch (error) { 
        console.error('Error:', error); 
    }
}

// =========================================================================
// GESTIÓN DE SOLICITUDES DE EMPRESAS (VALIDAR, APROBAR Y RECHAZAR)
// =========================================================================
window.cargarSolicitudesEmpresas = async function() {
    const contenedor = document.getElementById('contenedorSolicitudesEmpresas');
    const filtro = document.getElementById('filtroEstadoSolicitud')?.value || '';
    const token = localStorage.getItem('auth_token');

    if (!contenedor) return;
    contenedor.innerHTML = '<p style="text-align: center; color: #0066d5; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Consultando solicitudes...</p>';

    try {
        const url = filtro ? `${API_URL}/solicitudes-empresas/?estado=${filtro}` : `${API_URL}/solicitudes-empresas/`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error al obtener solicitudes");
        const solicitudes = await res.json();

        // Actualizar contador de pendientes si estamos viendo pendientes
        if (filtro === 'Pendiente') {
            setTexto('badgeContadorPendientes', solicitudes.length);
        }

        if (solicitudes.length === 0) {
            contenedor.innerHTML = `<p style="text-align: center; color: #666; font-style: italic; padding: 25px;">No hay solicitudes de empresas en estado "${filtro || 'Todas'}".</p>`;
            return;
        }

        contenedor.innerHTML = solicitudes.map(sol => {
            const fecha = sol.fechasolicitud ? sol.fechasolicitud.split('T')[0] : 'Reciente';
            const esPendiente = sol.estadosolicitud === 'Pendiente';
            const colorBadge = sol.estadosolicitud === 'Aprobada' ? '#198754' : (sol.estadosolicitud === 'Rechazada' ? '#dc3545' : '#d97706');
            const bgBadge = sol.estadosolicitud === 'Aprobada' ? '#d4edda' : (sol.estadosolicitud === 'Rechazada' ? '#f8d7da' : '#fff3cd');

            const botonesAccion = esPendiente ? `
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button onclick="aprobarSolicitudEmpresa(${sol.solicitudid}, '${sol.nombreempresa.replace(/'/g, "\\'")}')" class="btn-contratar" style="background: #198754; padding: 8px 18px; border-radius: 6px;">
                        <i class="fas fa-check-circle"></i> Validar y Crear Cuenta Empresa
                    </button>
                    <button onclick="rechazarSolicitudEmpresa(${sol.solicitudid}, '${sol.nombreempresa.replace(/'/g, "\\'")}')" class="btn-rechazar" style="padding: 8px 18px; border-radius: 6px;">
                        <i class="fas fa-times-circle"></i> Rechazar Solicitud
                    </button>
                </div>
            ` : `
                <p style="margin-top: 10px; font-size: 0.85rem; color: #555;">
                    <strong>Resolución:</strong> ${sol.motivoresolucion || 'Procesada'}
                </p>
            `;

            return `
                <div style="border: 1px solid #e2e8f0; border-left: 5px solid ${colorBadge}; border-radius: 10px; padding: 18px; margin-bottom: 15px; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h4 style="color: #0f2b5d; font-size: 1.2rem; margin: 0 0 5px 0;">
                                <i class="fas fa-building" style="color: #0066d5;"></i> ${sol.nombreempresa}
                            </h4>
                            <span style="font-size: 0.85rem; color: #666;"><strong>RUC:</strong> ${sol.ruc} | <strong>Fecha:</strong> ${fecha}</span>
                        </div>
                        <span style="background: ${bgBadge}; color: ${colorBadge}; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                            ${sol.estadosolicitud}
                        </span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 12px; font-size: 0.9rem; color: #333; background: #f8fafc; padding: 12px; border-radius: 8px;">
                        <div><i class="fas fa-envelope" style="color:#0066d5;"></i> <strong>Correo:</strong> ${sol.correo}</div>
                        <div><i class="fas fa-phone" style="color:#198754;"></i> <strong>Teléfono:</strong> ${sol.telefono}</div>
                        <div><i class="fas fa-industry" style="color:#0066d5;"></i> <strong>Sector:</strong> ${sol.sector_nombre || 'General'} (${sol.tipo_empresa_nombre || 'Empresa'})</div>
                        <div><i class="fas fa-map-marker-alt" style="color:#dc3545;"></i> <strong>Ubicación:</strong> ${sol.municipio_nombre || 'Nicaragua'} - ${sol.direccion || ''}</div>
                    </div>

                    ${botonesAccion}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="color: #dc3545; text-align: center;">No se pudieron cargar las solicitudes. Verifica que la tabla SolicitudesEmpresas esté creada en Azure SQL.</p>';
    }
};

window.aprobarSolicitudEmpresa = async function(id, nombreEmpresa) {
    const passPersonalizada = prompt(
        `Vas a APROBAR y crear el perfil oficial de "${nombreEmpresa}".\n\n` +
        `Escribe la contraseña que deseas asignarle (o déjalo en blanco para que el sistema genere una contraseña segura automáticamente):`,
        ""
    );

    if (passPersonalizada === null) return; // Canceló el prompt

    try {
        const res = await fetch(`${API_URL}/solicitudes-empresas/${id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                accion: 'aprobar',
                password: passPersonalizada.trim()
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo aprobar la solicitud.");

        // Mostrar modal con las credenciales listas para enviar
        mostrarModalNotificacion(
            "✅ ¡Cuenta de Empresa Creada!",
            `El perfil de "${data.credenciales.empresa}" ya está activo en ImpulsoNica. Envía las credenciales al representante:`,
            data.credenciales.correo,
            data.credenciales.telefono,
            "¡Cuenta de Empresa Aprobada! - Credenciales ImpulsoNica",
            data.credenciales.texto_notificacion
        );

        cargarSolicitudesEmpresas();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

window.rechazarSolicitudEmpresa = async function(id, nombreEmpresa) {
    const motivo = prompt(
        `Vas a RECHAZAR la solicitud de "${nombreEmpresa}".\n\n` +
        `Escribe el motivo del rechazo para notificárselo a la empresa:`,
        "No fue posible validar el número RUC o la identidad corporativa proporcionada."
    );

    if (motivo === null) return;

    try {
        const res = await fetch(`${API_URL}/solicitudes-empresas/${id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                accion: 'rechazar',
                motivo: motivo.trim()
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo rechazar la solicitud.");

        mostrarModalNotificacion(
            "❌ Solicitud Rechazada",
            `La solicitud de "${data.notificacion.empresa}" fue rechazada. Puedes enviar el aviso de resolución:`,
            data.notificacion.correo,
            data.notificacion.telefono,
            "Resolución de Solicitud Empresarial - ImpulsoNica",
            data.notificacion.texto_notificacion
        );

        cargarSolicitudesEmpresas();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

function mostrarModalNotificacion(titulo, subtitulo, correo, telefono, asuntoCorreo, textoMensaje) {
    setTexto('tituloModalNotificacion', titulo);
    setTexto('subtituloModalNotificacion', subtitulo);
    document.getElementById('textoCredencialesGeneradas').value = textoMensaje;

    // Configurar enlace mailto:
    const btnCorreo = document.getElementById('btnEnviarCorreoEmpresa');
    btnCorreo.href = `mailto:${correo}?subject=${encodeURIComponent(asuntoCorreo)}&body=${encodeURIComponent(textoMensaje)}`;

    // Configurar enlace WhatsApp:
    const btnWa = document.getElementById('btnEnviarWhatsappEmpresa');
    let numLimpio = (telefono || '').replace(/[^0-9]/g, '');
    if (numLimpio.length === 8) numLimpio = '505' + numLimpio;
    btnWa.href = `https://wa.me/${numLimpio}?text=${encodeURIComponent(textoMensaje)}`;

    document.getElementById('modalNotificacionEmpresa').style.display = 'flex';
}

window.copiarCredencialesPortapapeles = function() {
    const textarea = document.getElementById('textoCredencialesGeneradas');
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    alert("📋 ¡Mensaje copiado al portapapeles!");
};

function inicializarSubidaImagen() {
    document.getElementById('btnCambiarFoto')?.addEventListener('click', () => document.getElementById('inputFoto').click());
    document.getElementById('inputFoto')?.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (ev) => { document.getElementById('fotoPerfil').src = ev.target.result; };
        reader.readAsDataURL(archivo);

        const formData = new FormData();
        formData.append('imagen', archivo); 
        try {
            const res = await fetch(`${API_URL}/upload-imagen/`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, 
                body: formData 
            });
            if (!res.ok) throw new Error();
            alert("¡Foto de perfil actualizada!");
            cargarDatosPerfil(); 
        } catch (error) { alert("No se pudo subir la foto."); }
    });
}