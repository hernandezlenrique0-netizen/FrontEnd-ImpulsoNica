const API_URL = 'http://127.0.0.1:8000/api';
const params = new URLSearchParams(window.location.search);
const candidatoId = params.get('id');
const postulacionId = params.get('post');

document.addEventListener('DOMContentLoaded', () => {
    if (!candidatoId) {
        document.getElementById('cvContainer').innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 3rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h2><i class="fas fa-user-slash"></i> Error</h2>
                <p>No se especificó ningún candidato para visualizar.</p>
                <a href="/html/PEmpresa.html" class="btn-primary" style="text-decoration:none; display:inline-block; margin-top:15px;">Volver a mi perfil</a>
            </div>
        `;
        return;
    }
    cargarPerfilCompletoCandidato();
});

async function cargarPerfilCompletoCandidato() {
    const contenedor = document.getElementById('cvContainer');
    const token = localStorage.getItem('auth_token');
    const headersConfig = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const res = await fetch(`${API_URL}/candidatos/${candidatoId}/`, { headers: headersConfig });
        
        if (!res.ok) {
            throw new Error(res.status === 401 || res.status === 403 
                ? "No tienes permisos para ver este perfil." 
                : "No se pudo encontrar el perfil del candidato.");
        }
        
        const cand = await res.json();

        // Extracción segura de datos
        const userObj = cand.usuarioid || cand.UsuarioId || {};
        const nombre = cand.nombre || cand.Nombre || userObj.first_name || "Candidato";
        const apellido = cand.apellido || cand.Apellido || userObj.last_name || "";
        const nombreCompleto = `${nombre} ${apellido}`.trim();

        const correo = cand.correo || cand.Correo || userObj.email || "Correo no visible";
        const telefono = cand.telefono || cand.Telefono || "No especificado";
        const direccion = cand.direccion || cand.Direccion || "No especificada";
        
        const genero = cand.generoid?.nombre || cand.generoid?.Nombre || "No especificado";
        const fechaNac = cand.fechanacimiento || cand.FechaNacimiento || "No especificada";

        // Intentamos sacar datos del currículum (si vienen anidados)
        const curriculum = cand.curriculum || cand.curriculum_set?.[0] || {};
        let titulo = curriculum.titulo || curriculum.Titulo || "Profesional en búsqueda de oportunidades";
        let sobreMi = curriculum.sobre_mi || curriculum.SobreMi || cand.sobre_mi || cand.SobreMi || "Este candidato aún no ha redactado su resumen profesional.";
        
        // Foto de Perfil
        let fotoUrl = "/imgn/cv.png"; 
        const urlBD = cand.fotoperfilurl || cand.FotoPerfilUrl;
        if (urlBD) {
            fotoUrl = urlBD.startsWith('http') ? urlBD : `http://127.0.0.1:8000${urlBD}`;
        }

        // Buscar el ID real del Currículum
        let curriculumId = null;
        if (cand.curriculumid && typeof cand.curriculumid === 'object') {
            curriculumId = cand.curriculumid.curriculumid || cand.curriculumid.id;
        } else {
            curriculumId = cand.curriculumid || cand.CurriculumId;
        }

        let experiencias = [];
        let referencias = [];
        let habIds = [];
        let idioData = [];

        if (curriculumId) {
            try {
                // Hacemos las 5 peticiones (Mantenemos el ?curriculumid por buenas prácticas)
                const [resCv, resExp, resRef, resHab, resIdio] = await Promise.all([
                    fetch(`${API_URL}/curriculum/${curriculumId}/`, { headers: headersConfig }),
                    fetch(`${API_URL}/experiencialaboral/?curriculumid=${curriculumId}`, { headers: headersConfig }),
                    fetch(`${API_URL}/referencias/?curriculumid=${curriculumId}`, { headers: headersConfig }),
                    fetch(`${API_URL}/curriculumhabilidades/?curriculumid=${curriculumId}`, { headers: headersConfig }),
                    fetch(`${API_URL}/curriculumidiomas/?curriculumid=${curriculumId}`, { headers: headersConfig })
                ]);

                if(resCv.ok) { 
                    const cv = await resCv.json(); 
                    titulo = cv.profesion || cv.Profesion || titulo; 
                    if(cv.sobre_mi || cv.SobreMi) sobreMi = cv.sobre_mi || cv.SobreMi; 
                }

                // 🔥 ESCUDO DE SEGURIDAD: Filtro estricto en el Frontend 🔥
                // Esto garantiza que, aunque Django envíe la tabla entera, solo usemos los del candidato.
                const perteneceAlCV = (item) => {
                    const idItemCv = item.curriculumid?.curriculumid || item.curriculumid?.id || item.curriculumid || item.CurriculumId;
                    return parseInt(idItemCv) === parseInt(curriculumId);
                };

                if(resExp.ok) {
                    const data = await resExp.json();
                    experiencias = data.filter(perteneceAlCV);
                }
                if(resRef.ok) {
                    const data = await resRef.json();
                    referencias = data.filter(perteneceAlCV);
                }
                if(resHab.ok) { 
                    const data = await resHab.json(); 
                    const misHabilidades = data.filter(perteneceAlCV);
                    habIds = [...new Set(misHabilidades.map(x => x.habilidadid?.habilidadid || x.habilidadid?.id || x.habilidadid || x.HabilidadId))]; 
                }
                if(resIdio.ok) {
                    const data = await resIdio.json();
                    const misIdiomas = data.filter(perteneceAlCV);
                    const mapIdios = new Map();
                    misIdiomas.forEach(x => {
                        const id = x.idiomaid?.idiomaid || x.idiomaid?.id || x.idiomaid || x.IdiomaId;
                        mapIdios.set(id, x);
                    });
                    idioData = Array.from(mapIdios.values());
                }

            } catch(e) { console.warn("Error cargando detalles forzados", e); }
        }

        let catHabs = []; let catIdios = [];
        try {
            const [rCatHab, rCatIdio] = await Promise.all([
                fetch(`${API_URL}/cat-habilidades/`, { headers: headersConfig }),
                fetch(`${API_URL}/cat-idiomas/`, { headers: headersConfig })
            ]);
            if(rCatHab.ok) catHabs = await rCatHab.json();
            if(rCatIdio.ok) catIdios = await rCatIdio.json();
        } catch(e){}

        const habilidadesNombres = habIds.map(id => {
            const h = catHabs.find(c => parseInt(c.habilidadid || c.id || c.HabilidadId) === parseInt(id));
            return h ? (h.nombre || h.Nombre) : null;
        }).filter(Boolean);

        const idiomasCompletos = idioData.map(idio => {
            const idIdioma = idio.idiomaid?.idiomaid || idio.idiomaid?.id || idio.idiomaid || idio.IdiomaId;
            const cat = catIdios.find(c => parseInt(c.idiomaid || c.id || c.IdiomaId) === parseInt(idIdioma));
            return { 
                nombre: cat ? (cat.nombre || cat.Nombre) : 'Desconocido', 
                nivel: idio.nivel || idio.Nivel || 'Básico' 
            };
        });

        let htmlExperiencias = '<p style="color: #666; font-style: italic;">Sin experiencia registrada.</p>';
        if (experiencias.length > 0) {
            htmlExperiencias = experiencias.map(exp => `
                <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #0066d5;">
                    <h4 style="color: #0f2b5d; margin: 0 0 5px 0;">${exp.cargo || exp.Cargo}</h4>
                    <p style="margin: 0 0 8px 0; color: #555; font-weight: bold;">
                        <i class="fas fa-building"></i> ${exp.empresa || exp.Empresa} | 
                        <i class="fas fa-calendar-alt"></i> ${exp.fechainicio || exp.FechaInicio} al ${exp.fechafin || exp.FechaFin || 'Presente'}
                    </p>
                    <p style="margin: 0; color: #444; text-align: justify; font-size: 0.95rem;">${exp.descripcion || exp.Descripcion || ''}</p>
                </div>
            `).join('');
        }

        let htmlReferencias = '<p style="color: #666; font-style: italic;">Sin referencias registradas.</p>';
        if (referencias.length > 0) {
            htmlReferencias = referencias.map(ref => `
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #eef5fc;">
                    <h4 style="margin: 0 0 5px 0; color: #0f2b5d;"><i class="fas fa-user-check"></i> ${ref.nombrecontacto || ref.NombreContacto}</h4>
                    <p style="margin: 0 0 5px 0; color: #666;">${ref.cargo || ref.Cargo} en ${ref.empresa || ref.Empresa}</p>
                    <p style="margin: 0; font-size: 0.9rem; color: #444;">
                        <i class="fas fa-phone"></i> ${ref.telefono || ref.Telefono} | 
                        <i class="fas fa-envelope"></i> ${ref.correo || ref.Correo || 'N/A'}
                    </p>
                </div>
            `).join('');
        }

        let htmlHabilidades = '<p style="color: #666; font-style: italic;">Sin habilidades registradas.</p>';
        if (habilidadesNombres.length > 0) {
            htmlHabilidades = `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px;">` + 
                habilidadesNombres.map(h => `<span style="background: #eef5fc; color: #0066d5; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; border: 1px solid #d0e3f7;">${h}</span>`).join('') +
            `</div>`;
        }

        let htmlIdiomas = '<p style="color: #666; font-style: italic;">Sin idiomas registrados.</p>';
        if (idiomasCompletos.length > 0) {
            htmlIdiomas = `<ul style="list-style: none; padding: 0; margin-bottom: 30px;">` +
                idiomasCompletos.map(i => `<li style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 8px 0; margin: 0;"><strong>${i.nombre}</strong> <span style="color: #0066d5; font-weight: bold; font-size: 0.9rem;">${i.nivel}</span></li>`).join('') +
            `</ul>`;
        }

        let botonesAccionHtml = '';
        if (telefono && telefono !== "No especificado") {
            let phoneNum = telefono.replace(/[^0-9]/g, '');
            if(phoneNum.length === 8) phoneNum = '505' + phoneNum;
            const msj = encodeURIComponent(`Hola ${nombre}, me comunico de parte de la empresa respecto a tu postulación en ImpulsoNica...`);
            botonesAccionHtml += `
                <a href="https://wa.me/${phoneNum}?text=${msj}" target="_blank" class="btn-whatsapp">
                    <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> WhatsApp
                </a>
            `;
        }
        if (postulacionId) {
            botonesAccionHtml += `
                <button onclick="cambiarEstadoPostulacion('Seleccionado')" class="btn-contratar">
                    <i class="fas fa-check-circle"></i> Contratar / Aceptar
                </button>
                <button onclick="cambiarEstadoPostulacion('Rechazado')" class="btn-rechazar">
                    <i class="fas fa-times-circle"></i> Rechazar
                </button>
            `;
        }

        // =========================================================
        // 4. CONSTRUCCIÓN DEL DISEÑO DEL CV (UI)
        // =========================================================
        const htmlCV = `
            <div class="cv-card">
                
                <div class="cv-header">
                    <img src="${fotoUrl}" alt="Foto Candidato" class="cv-avatar">
                    <div class="cv-header-info">
                        <h1>${nombreCompleto}</h1>
                        <h3>${titulo}</h3>
                        <div class="cv-contact-bar">
                            <span><i class="fas fa-envelope"></i> ${correo}</span>
                            <span><i class="fas fa-phone"></i> ${telefono}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${direccion}</span>
                        </div>
                    </div>
                </div>

                <div class="cv-body">
                    <!-- COLUMNA IZQUIERDA -->
                    <div>
                        <h3 class="cv-section-title"><i class="fas fa-user"></i> Perfil Profesional</h3>
                        <p class="cv-text-block">${sobreMi}</p>

                        <h3 class="cv-section-title"><i class="fas fa-briefcase"></i> Experiencia Laboral</h3>
                        ${htmlExperiencias}

                        <h3 class="cv-section-title" style="margin-top: 35px;"><i class="fas fa-users"></i> Referencias</h3>
                        ${htmlReferencias}
                    </div>

                    <!-- COLUMNA DERECHA -->
                    <div>
                        <h3 class="cv-section-title"><i class="fas fa-info-circle"></i> Datos Generales</h3>
                        <ul class="cv-list">
                            <li><strong>Género:</strong> ${genero}</li>
                            <li><strong>Fecha de Nacimiento:</strong> ${fechaNac.split('T')[0]}</li>
                        </ul>

                        <h3 class="cv-section-title"><i class="fas fa-tools"></i> Habilidades</h3>
                        ${htmlHabilidades}

                        <h3 class="cv-section-title"><i class="fas fa-language"></i> Idiomas</h3>
                        ${htmlIdiomas}
                    </div>
                </div>

                <div class="cv-actions-bar">
                    ${botonesAccionHtml}
                </div>
            </div>
        `;

        contenedor.innerHTML = htmlCV;

    } catch (error) {
        console.error(error);contenedor.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 3rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h2><i class="fas fa-times-circle"></i> Ups...</h2>
                <p>${error.message}</p>
                <a href="/html/PEmpresa.html" class="btn-primary" style="text-decoration:none; display:inline-block; margin-top:15px;">Volver a mi perfil</a>
            </div>
        `;
    }
}

window.cambiarEstadoPostulacion = async function(estadoDeseado) {
    if(!postulacionId) return alert("Error: No se ha identificado la postulación.");
    if(!confirm(`¿Estás completamente seguro que deseas marcar a este candidato como: ${estadoDeseado.toUpperCase()}?`)) return;

    const token = localStorage.getItem('auth_token');
    
    try {
        const resEst = await fetch(`${API_URL}/cat-estados/`, { headers: { 'Authorization': `Bearer ${token}` }});
        const estados = await resEst.json();
        
        const estadoObj = estados.find(e => e.nombre.toLowerCase() === estadoDeseado.toLowerCase() || (e.Nombre && e.Nombre.toLowerCase() === estadoDeseado.toLowerCase()));
        if(!estadoObj) throw new Error("No se encontró el estado en el sistema.");
        const idEstado = estadoObj.estadoid || estadoObj.id || estadoObj.EstadoId;

        const resPut = await fetch(`${API_URL}/postulaciones/${postulacionId}/`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estadoid: idEstado })
        });
        
        if(!resPut.ok) throw new Error("Ocurrió un error en el servidor al intentar actualizar.");
        
        alert(`✅ ¡El candidato ha sido ${estadoDeseado} exitosamente!`);
        window.location.href = "/html/PEmpresa.html";

    } catch(error) {
        console.error(error);
        alert("Error: " + error.message);
    }
}