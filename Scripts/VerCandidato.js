const API_URL = 'http://127.0.0.1:8000/api';

const params = new URLSearchParams(window.location.search);
const candidatoId = params.get('id');

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
        // 1 = descargamos la información basica del candidato
        const res = await fetch(`${API_URL}/candidatos/${candidatoId}/`, { headers: headersConfig });
        
        if (!res.ok) {
            throw new Error(res.status === 401 || res.status === 403 
                ? "No tienes permisos para ver este perfil." 
                : "No se pudo encontrar el perfil del candidato.");
        }
        
        const cand = await res.json();

        // 2 = extracción segura de los datos(tolerante a mayúsculas, minúsculas y objetos anidados)
        const userObj = cand.usuarioid || cand.UsuarioId || {};
        
        const nombre = cand.nombre || cand.Nombre || userObj.first_name || "Candidato";
        const apellido = cand.apellido || cand.Apellido || userObj.last_name || "";
        const nombreCompleto = `${nombre} ${apellido}`.trim();

        const correo = cand.correo || cand.Correo || userObj.email || "Correo no visible";
        const telefono = cand.telefono || cand.Telefono || "No especificado";
        const direccion = cand.direccion || cand.Direccion || "No especificada";
        
        const genero = cand.generoid?.nombre || cand.generoid?.Nombre || "No especificado";
        const fechaNac = cand.fechanacimiento || cand.FechaNacimiento || "No especificada";

        // intentamos sacar datos del curriculum (si vienen anidados)
        const curriculum = cand.curriculum || cand.curriculum_set?.[0] || {};
        const titulo = curriculum.titulo || curriculum.Titulo || "Profesional en búsqueda de oportunidades";
        const sobreMi = curriculum.sobre_mi || curriculum.SobreMi || "Este candidato aún no ha redactado su resumen profesional.";
        
        // La foto de Perfil
        let fotoUrl = "/imgn/cv.png"; // Foto por defecto
        const urlBD = cand.fotoperfilurl || cand.FotoPerfilUrl;


        if (urlBD) {
            fotoUrl = urlBD.startsWith('http') ? urlBD : `http://127.0.0.1:8000${urlBD}`;
        }

        // 3 = extracción de experiencias y referencias (Si vienen  incluidas)
        let htmlExperiencias = '<p style="color: #666; font-style: italic;">Sin experiencia registrada.</p>' ;

        if (curriculum.experiencias && curriculum.experiencias.length > 0){
            htmlExperiencias = curriculum.experiencias.map(exp => `
                <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #0066d5;">
                    <h4 style="color: #0f2b5d; margin: 0 0 5px 0;">${exp.cargo || exp.Cargo}</h4>
                    <p style="margin: 0 0 8px 0; color: #555; font-weight: bold;">
                        <i class="fas fa-building"></i> ${exp.empresa || exp.Empresa} | 
                        <i class="fas fa-calendar-alt"></i> ${exp.fechainicio || exp.FechaInicio} - ${exp.fechafin || exp.FechaFin || 'Presente'}
                    </p>
                    <p style="margin: 0; color: #444; text-align: justify; font-size: 0.95rem;">${exp.descripcion || exp.Descripcion || ''}</p>
                </div>
            `).join('');
        }

        let htmlReferencias = '<p style="color: #666; font-style: italic;">Sin referencias registradas.</p>';

        if (curriculum.referencias && curriculum.referencias.length > 0) {
            htmlReferencias = curriculum.referencias.map(ref => `
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

      
// 4= Construccion del diseño de curriculum (UI)

        const htmlCV = `
            <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.08); overflow: hidden;">
                
                <!-- encabezado del cv -->

                <div style="background: linear-gradient(135deg, #0f2b5d, #0066d5); padding: 40px; color: white; display: flex; align-items: center; gap: 30px; flex-wrap: wrap;">
                    <img src="${fotoUrl}" alt="Foto Candidato" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    <div style="flex: 1; min-width: 250px;">
                        <h1 style="margin: 0 0 10px 0; font-size: 2.5rem; letter-spacing: 1px;">${nombreCompleto}</h1>
                        <h3 style="margin: 0 0 15px 0; font-weight: 300; font-size: 1.4rem; color: #e0f2fe;">${titulo}</h3>
                        
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.95rem;">
                            <span><i class="fas fa-envelope"></i> ${correo}</span>
                            <span><i class="fas fa-phone"></i> ${telefono}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${direccion}</span>
                        </div>
                    </div>
                </div>

                <!-- cuerpoo del curriculum -->
                <div style="padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
                    
                    <!-- columna primcipal (izquierda)-->

                    <div>
                        <h3 style="color: #0066d5; border-bottom: 2px solid #eef5fc; padding-bottom: 10px; margin-bottom: 20px;"><i class="fas fa-user"></i> Perfil Profesional</h3>
                        <p style="color: #444; line-height: 1.8; text-align: justify; margin-bottom: 40px;">${sobreMi}</p>

                        <h3 style="color: #0066d5; border-bottom: 2px solid #eef5fc; padding-bottom: 10px; margin-bottom: 20px;"><i class="fas fa-briefcase"></i> Experiencia Laboral</h3>
                        ${htmlExperiencias}
                    </div>

                    <!-- columna secundaria(derecha)-->

                    <div>
                        <h3 style="color: #0066d5; border-bottom: 2px solid #eef5fc; padding-bottom: 10px; margin-bottom: 20px;"><i class="fas fa-info-circle"></i> Datos Generales</h3>
                        <ul style="list-style: none; padding: 0; color: #555; line-height: 2;">
                            <li><strong>Género:</strong> ${genero}</li>
                            <li><strong>Fecha de Nacimiento:</strong> ${fechaNac.split('T')[0]}</li>
                        </ul>

                        <h3 style="color: #0066d5; border-bottom: 2px solid #eef5fc; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px;"><i class="fas fa-users"></i> Referencias</h3>
                        ${htmlReferencias}
                    </div>

                </div>
            </div>
        `;

        contenedor.innerHTML = htmlCV;

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = `
            <div style="text-align: center; color: #dc3545; padding: 3rem; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h2><i class="fas fa-times-circle"></i> Ups...</h2>
                <p>${error.message}</p>
                <a href="/html/PEmpresa.html" class="btn-primary" style="text-decoration:none; display:inline-block; margin-top:15px;">Volver a mi perfil</a>
            </div>


        `;


    }


}