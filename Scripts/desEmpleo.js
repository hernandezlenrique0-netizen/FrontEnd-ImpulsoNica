const API_URL = 'http://127.0.0.1:8000/api';
const params = new URLSearchParams(window.location.search);
const empleoId = params.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (!empleoId) {
        document.getElementById('contenidoVacante').innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 3rem;">
                <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                <p>No se encontró el empleo especificado.</p>
                <a href="/html/Empleos.html" class="btn-primary" style="text-decoration:none; display:inline-block; margin-top:15px;">Volver al buscador</a>
            </div>
        `;
        return;
    }
    cargarDetallesEmpleo();
});

async function cargarDetallesEmpleo() {
    const contenedor = document.getElementById('contenidoVacante');
    
    // 1. Obtenemos el token desde el inicio para autorizar todas nuestras peticiones
    const token = localStorage.getItem('auth_token');
    const userType = localStorage.getItem('user_type');
    
    const headersConfig = {};
    if (token) {
        headersConfig['Authorization'] = `Bearer ${token}`;
    }

    try {
        // 1. Obtener la información general del Empleo (Enviando el Token)
        const res = await fetch(`${API_URL}/empleos/${empleoId}/`, { headers: headersConfig });
        if (!res.ok) throw new Error("No se pudo cargar el empleo");
        const empleo = await res.json();

        // =========================================================
        // EXTRACCIÓN SEGURA A PRUEBA DE FALLOS (Anti-Errores)
        // =========================================================
        
        // Empresa
        const objEmpresa = empleo.empresaid || empleo.EmpresaId || {};
        const nombreEmpresa = objEmpresa.nombreempresa || objEmpresa.NombreEmpresa || "Empresa Confidencial";
        
        // Modalidad
        const objModalidad = empleo.modalidadid || empleo.ModalidadId || {};
        const modalidad = objModalidad.nombre || objModalidad.Nombre || "No especificada";
        
        // Tipo Empleo
        const objTipo = empleo.tipoempleoid || empleo.TipoEmpleoId || {};
        const tipoEmpleo = objTipo.nombre || objTipo.Nombre || "No especificado";

        // Salario
        const salario = empleo.salario || empleo.Salario || 'A convenir';

        // Descripción
        const descripcion = empleo.descripcion || empleo.Descripcion || 'Sin descripción detallada.';
        
        // Logo de la Empresa
        let logoUrl = "/imgn/CompanyA.webp"; 
        const fotoUrl = objEmpresa.fotoperfilurl || objEmpresa.FotoPerfilUrl;
        if (fotoUrl) {
            logoUrl = fotoUrl.startsWith('http') ? fotoUrl : `http://127.0.0.1:8000${fotoUrl}`;
        }

        // 2. Obtener ubicación (Municipio)
        let ubicacion = "Nicaragua";
        const idMuniObj = empleo.municipioid || empleo.MunicipioId;
        
        if (idMuniObj) {
            try {
                // Sacamos el ID asegurándonos de que sea un número
                const idMuni = typeof idMuniObj === 'object' ? (idMuniObj.municipioid || idMuniObj.id || idMuniObj.MunicipioId) : idMuniObj;
                
                if (idMuni) {
                    const muniRes = await fetch(`${API_URL}/municipios/${idMuni}/`, { headers: headersConfig });
                    if (muniRes.ok) {
                        const muniData = await muniRes.json();
                        const nombreMuni = muniData.nombre || muniData.Nombre || "Nicaragua";
                        ubicacion = `${nombreMuni}, Nicaragua`;
                    }
                }
            } catch(e) { console.warn("No se pudo cargar ubicación específica."); }
        }

        // =========================================================
        // CONSTRUCCIÓN DEL DISEÑO HTML (UI)
        // =========================================================
        let html = `
            <div style="background: #ffffff; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 250px;">
                        <h1 style="color: #0f2b5d; margin-top: 0; margin-bottom: 10px; font-size: 2rem;">${empleo.nombreempleo || empleo.NombreEmpleo || 'Vacante'}</h1>
                        <p style="margin: 5px 0; color: #444; font-size: 1.1rem;"><strong><i class="fas fa-building" style="color: #0066d5; width: 25px;"></i> Empresa:</strong> ${nombreEmpresa}</p>
                        <p style="margin: 5px 0; color: #444; font-size: 1.1rem;"><strong><i class="fas fa-map-marker-alt" style="color: #0066d5; width: 25px;"></i> Ubicación:</strong> ${ubicacion}</p>
                        <p style="margin: 5px 0; color: #444; font-size: 1.1rem;"><strong><i class="fas fa-money-bill-wave" style="color: #28a745; width: 25px;"></i> Salario:</strong> C$ ${salario}</p>
                        <p style="margin: 5px 0; color: #444; font-size: 1.1rem;"><strong><i class="fas fa-briefcase" style="color: #0066d5; width: 25px;"></i> Tipo:</strong> ${tipoEmpleo} - ${modalidad}</p>
                    </div>
                    <div>
                        <img src="${logoUrl}" alt="Logo Empresa" style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover; border: 2px solid #eef5fc; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    </div>
                </div>

                <hr style="border: none; border-top: 2px solid #eef5fc; margin: 2rem 0;">

                <h3 style="color: #0066d5; font-size: 1.4rem; margin-bottom: 1rem;"><i class="fas fa-align-left"></i> Descripción del Puesto</h3>
                <div style="color: #333; line-height: 1.8; font-size: 1.05rem; white-space: pre-wrap; margin-bottom: 2.5rem; text-align: justify;">${descripcion}</div>

                <h3 style="color: #0066d5; font-size: 1.4rem; margin-bottom: 1rem;"><i class="fas fa-list-check"></i> Requisitos</h3>
                <ul id="listaRequisitosPuesto" style="list-style-type: none; padding: 0; margin-bottom: 2.5rem;">
                    <li style="color: #666; font-style: italic;"><i class="fas fa-spinner fa-spin"></i> Cargando requisitos...</li>
                </ul>

                <hr style="border: none; border-top: 2px solid #eef5fc; margin: 2rem 0;">

                <div id="areaBotonPostular" style="text-align: center; margin-top: 2rem;">
                    <!-- El botón se inyecta dinámicamente según el rol -->
                </div>
            </div>
        `;
        contenedor.innerHTML = html;

        // 3. Cargar los requisitos del empleo (Enviando el Token)
        try {
            const resReq = await fetch(`${API_URL}/empleorequisitos/?empleoid=${empleoId}`, { headers: headersConfig });
            const listaReqUI = document.getElementById('listaRequisitosPuesto');
            if (resReq.ok) {
                const requisitos = await resReq.json();
                if (requisitos.length === 0) {
                    listaReqUI.innerHTML = '<li style="color: #666;">No se especificaron requisitos adicionales.</li>';
                } else {
                    listaReqUI.innerHTML = requisitos.map(r => `
                        <li style="margin-bottom: 10px; padding: 12px 15px; background: #f8fafc; border-left: 4px solid ${r.esobligatorio ? '#dc3545' : '#198754'}; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas ${r.esobligatorio ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="color: ${r.esobligatorio ? '#dc3545' : '#198754'};"></i>
                            <span style="font-size: 1.05rem;">${r.descripcion || r.Descripcion} <strong style="font-size: 0.9rem; color: ${r.esobligatorio ? '#dc3545' : '#198754'};">(${r.esobligatorio ? 'Obligatorio' : 'Deseable'})</strong></span>
                        </li>
                    `).join('');
                }
            } else {
                listaReqUI.innerHTML = '<li style="color: #dc3545;">No se pudieron cargar los requisitos (401 No Autorizado).</li>';
            }
        } catch (e) { console.warn("Error cargando requisitos", e); }

        // 4. Lógica de visualización del botón "Postularse"
        const areaBoton = document.getElementById('areaBotonPostular');

        if (!token) {
            // Usuario Visitante
            areaBoton.innerHTML = `
                <p style="color: #666; margin-bottom: 15px;">Para aplicar a esta oferta, necesitas una cuenta.</p>
                <a href="/index.html" class="btn-primary" style="text-decoration: none; padding: 15px 40px; font-size: 1.1rem; border-radius: 8px;"><i class="fas fa-sign-in-alt"></i> Iniciar Sesión / Registrarse</a>
            `;
        } else if (userType === 'empresa') {
            // Es una empresa
            areaBoton.innerHTML = `<p style="background: #eef5fc; color: #0f2b5d; padding: 15px; border-radius: 8px; display: inline-block; font-weight: bold;"><i class="fas fa-info-circle"></i> Estás navegando como Empresa. No puedes postularte a vacantes.</p>`;
        } else if (userType === 'candidato') {
            // Es un candidato: Verificamos si YA ESTÁ POSTULADO a este empleo
            areaBoton.innerHTML = `<p style="color: #0066d5;"><i class="fas fa-spinner fa-spin"></i> Verificando estado de tu postulación...</p>`;
            
            try {
                // Sacamos su ID de candidato
                const resPerfil = await fetch(`${API_URL}/mi-perfil/`, { headers: headersConfig });
                const dataPerfil = await resPerfil.json();
                const idCandidato = dataPerfil.datos?.candidatoid || dataPerfil.datos?.CandidatoId;

                if (idCandidato) {
                    // Descargamos todas las postulaciones de este empleo
                    const resPost = await fetch(`${API_URL}/postulaciones/?empleoid=${empleoId}`, { headers: headersConfig });
                    const todasLasPostulaciones = await resPost.json();
                    
                    // Buscamos si alguna de esas postulaciones le pertenece a ESTE candidato
                    const miPostulacion = todasLasPostulaciones.find(p => {
                        const idCandPostulado = p.candidatoid?.candidatoid || p.candidatoid?.id || p.candidatoid?.CandidatoId || p.candidatoid;
                        return idCandPostulado === idCandidato;
                    });

                    if (miPostulacion) {
                        // YA ESTÁ POSTULADO -> Mostramos mensaje verde
                        const nombreEstado = miPostulacion.estadoid?.nombre || miPostulacion.estadoid?.Nombre || "En Revisión";
                        areaBoton.innerHTML = `
                            <div style="background: #e8f5e9; border: 1px solid #28a745; color: #198754; padding: 20px; border-radius: 8px; display: inline-block;">
                                <h3 style="margin: 0 0 5px 0;"><i class="fas fa-check-circle"></i> ¡Ya te postulaste a esta vacante!</h3>
                                <p style="margin: 0; color: #555;">Estado actual de tu aplicación: <strong style="color: #0f2b5d;">${nombreEstado}</strong></p>
                            </div>
                        `;
                    } else {
                        // AÚN NO SE POSTULA -> Mostramos el botón azul
                        areaBoton.innerHTML = `
                            <button id="btnEjecutarPostulacion" onclick="postularCandidato()" class="btn-primary" style="padding: 15px 50px; font-size: 1.2rem; border-radius: 8px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 10px rgba(0, 102, 213, 0.3);">
                                <i class="fas fa-paper-plane"></i> Postularme Ahora
                            </button>
                        `;
                    }
                } else {
                    areaBoton.innerHTML = `<p style="color: #dc3545; font-weight: bold;"><i class="fas fa-exclamation-circle"></i> Por favor, completa la información de tu Perfil de Candidato para poder postularte.</p>`;
                }
            } catch(e) {
                console.warn("Fallo al verificar postulación", e);
                // Si falla la verificación, por si acaso, le mostramos el botón
                areaBoton.innerHTML = `<button id="btnEjecutarPostulacion" onclick="postularCandidato()" class="btn-primary" style="padding: 15px 50px; font-size: 1.2rem; border-radius: 8px;"><i class="fas fa-paper-plane"></i> Postularme Ahora</button>`;
            }
        }

    } catch (error) {
        contenedor.innerHTML = `<p style="color: red; text-align:center;">Hubo un error al cargar la vacante: ${error.message}</p>`;
    }
}

// =====================================================================
// FUNCIÓN PARA ENVIAR LA POSTULACIÓN A DJANGO
// =====================================================================
window.postularCandidato = async function() {
    const btn = document.getElementById('btnEjecutarPostulacion');
    const token = localStorage.getItem('auth_token');
    
    if (!confirm("¿Estás seguro que deseas enviar tu perfil y CV a esta empresa?")) return;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando postulación...';
    btn.disabled = true;

    try {
        // 1. Obtener el ID real del Candidato consultando el perfil actual
        const resPerfil = await fetch(`${API_URL}/mi-perfil/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataPerfil = await resPerfil.json();
        
        if(!dataPerfil.datos || (!dataPerfil.datos.candidatoid && !dataPerfil.datos.CandidatoId)) {
            throw new Error("No se pudo obtener la información de tu perfil.");
        }
        
        const idCandidato = dataPerfil.datos.candidatoid || dataPerfil.datos.CandidatoId;

        // 2. Obtener un estado por defecto (ej. En Revisión)
        let idEstado = 1; 
        try {
            const resEst = await fetch(`${API_URL}/cat-estados/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const estados = await resEst.json();
            if(estados.length > 0) idEstado = estados[0].estadoid || estados[0].id || estados[0].EstadoId;
        } catch(e) { console.warn("No se pudo cargar estado, usando default."); }

        // 3. Crear la postulación
        const payload = {
            fechapostulacion: new Date().toISOString(),
            estadoid: idEstado,
            candidatoid: idCandidato,
            empleoid: empleoId
        };

        const resPost = await fetch(`${API_URL}/postulaciones/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (!resPost.ok) {
            throw new Error("Ya te has postulado a esta vacante o hubo un error en el servidor.");
        }

        // 4. Éxito
        const areaBoton = document.getElementById('areaBotonPostular');
        areaBoton.innerHTML = `
            <div style="background: #e8f5e9; border: 1px solid #28a745; color: #198754; padding: 20px; border-radius: 8px; display: inline-block;">
                <h3 style="margin: 0 0 5px 0;"><i class="fas fa-check-circle"></i> ¡Postulación Enviada Exitosamente!</h3>
                <p style="margin: 0; color: #555;">La empresa ya ha recibido tu perfil.</p>
            </div>
        `;
        alert("¡Felicidades! La empresa ha recibido tu perfil.");

    } catch (error) {
        console.error(error);
        alert(error.message);
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Postularme Ahora';
        btn.disabled = false;
    }
}