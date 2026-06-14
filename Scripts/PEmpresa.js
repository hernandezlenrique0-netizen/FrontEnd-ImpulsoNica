const API_URL = 'http://127.0.0.1:8000/api';
let perfilActual = {};
let requisitosSeleccionados = [];
let empleoEditandoId = null; 

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    inicializarCatalogos();
    inicializarEventosEdicion();
    inicializarSubidaImagen();
    inicializarEventosVacantes();
    inicializarModalesAdicionales();
});

// funciones auxiliares
const setTexto = (id, texto) => { const el = document.getElementById(id); if (el) el.textContent = texto; };
const setValor = (id, valor) => { const el = document.getElementById(id); if (el) el.value = valor || ''; };
const getValor = (id) => { const el = document.getElementById(id); return (el && el.value.trim() !== '') ? el.value.trim() : null; };
const getValorSelect = (id) => { const el = document.getElementById(id); if (!el || !el.value || el.value === 'undefined') return null; return parseInt(el.value); };

//  Cargar datos perfil
async function cargarDatosPerfil() {
    let token = localStorage.getItem('auth_token');
    if (!token) return window.location.href = "/index.html";

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error("No se pudo cargar el perfil.");
        
        const data = await response.json();
        
        if (data.tipo === 'empresa' && data.datos) {
            perfilActual = data.datos;
            setTexto('lblNombreEmpresa', data.datos.nombreempresa || data.datos.NombreEmpresa || 'Nombre no definido');
            setTexto('lblCorreo', data.datos.correo || '...');
            setTexto('lblTelefono', data.datos.telefono || 'No especificado');
            setTexto('lblDireccion', data.datos.direccion || 'Dirección exacta no especificada');
            setTexto('lblSector', data.datos.sector_nombre || 'Sector no especificado');
            setTexto('lblTipoEmpresa', data.datos.tipo_empresa_nombre ? `Empresa ${data.datos.tipo_empresa_nombre}` : 'No especificado');
            setTexto('lblUbicacion', [data.datos.municipio_nombre, data.datos.departamento_nombre].filter(Boolean).join(', ') || 'Ubicación no especificada');

            if (data.datos.foto_url) document.getElementById('fotoPerfil').src = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://127.0.0.1:8000${data.datos.foto_url}`;
            
            cargarMisVacantes();
        } else if(data.tipo === 'candidato') {
            window.location.href = "/html/PCandidato.html";
        }
    } catch (error) { console.error('Error al cargar perfil de empresa:', error); }
}

// Catalogos y cascadas
async function inicializarCatalogos() {
    await cargarSelect(`${API_URL}/cat-sectores/`, 'editSector', 'Seleccione un Sector...');
    await cargarSelect(`${API_URL}/cat-tiposempresa/`, 'editTipoEmpresa', 'Seleccione Tipo de Empresa...');
    
    // Departamentos (Para Perfil y Para Vacante)
    await cargarSelect(`${API_URL}/departamentos/`, 'editDepartamento', 'Seleccione Departamento...');
    await cargarSelect(`${API_URL}/departamentos/`, 'vacDepartamento', 'Seleccione Departamento...');
    
    // Catalogos Vacantes
    await cargarSelect(`${API_URL}/cat-tiposempleo/`, 'vacTipoEmpleo', 'Seleccione Tipo de Empleo...');
    await cargarSelect(`${API_URL}/cat-modalidades/`, 'vacModalidad', 'Seleccione Modalidad...');
    await cargarSelect(`${API_URL}/cat-estados/`, 'vacEstado', 'Seleccione Estado...');

    // Cascada de Municipio (Perfil)
    document.getElementById('editDepartamento')?.addEventListener('change', (e) => cargarMunicipios(e.target.value, 'editMunicipio'));
    // Cascada de Municipio (Vacante)
    document.getElementById('vacDepartamento')?.addEventListener('change', (e) => cargarMunicipios(e.target.value, 'vacMunicipio'));
}

async function cargarMunicipios(deptoId, comboDestinoId) {
    const selectMuni = document.getElementById(comboDestinoId);
    if (!deptoId) {
        selectMuni.innerHTML = '<option value="">Seleccione un departamento primero</option>';
        selectMuni.disabled = true; return;
    }
    selectMuni.disabled = false; 
    selectMuni.innerHTML = '<option value="">Cargando municipios...</option>'; 
    await cargarSelect(`${API_URL}/municipios/?departamentoid=${deptoId}`, comboDestinoId, 'Seleccione un Municipio...');
}

async function cargarSelect(url, selectId, defaultText) {
    const el = document.getElementById(selectId);
    if (!el) return;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
        const data = await res.json();
        el.innerHTML = `<option value="">${defaultText}</option>`;
        data.forEach(item => {
            const keyId = Object.keys(item).find(k => k.toLowerCase().includes('id'));
            const keyNombre = Object.keys(item).find(k => ['nombre', 'descripcion', 'contexto'].includes(k.toLowerCase()));
            el.add(new Option(item[keyNombre] || Object.values(item)[1], item[keyId] || Object.values(item)[0]));
        });
    } catch (error) { console.error("Error cargando select:", selectId); }
}

//modal de edicion e imagen
function inicializarEventosEdicion() {
    const modal = document.getElementById('modalEditarPerfil');
    const btnAbrir = document.getElementById('btnAbrirEdicion');
    if (!modal || !btnAbrir) return;

    btnAbrir.addEventListener('click', async () => {
        setValor('editNombreEmpresa', perfilActual.nombreempresa || perfilActual.NombreEmpresa);
        setValor('editTelefono', perfilActual.telefono);
        setValor('editDireccion', perfilActual.direccion);
        if (perfilActual.sectorid) setValor('editSector', perfilActual.sectorid);
        if (perfilActual.tipoempresaid) setValor('editTipoEmpresa', perfilActual.tipoempresaid);
        
        const idDepto = perfilActual.departamento_id || perfilActual.departamentoid;
        if (idDepto) {
            setValor('editDepartamento', idDepto);
            await cargarMunicipios(idDepto, 'editMunicipio');
            const idMuni = perfilActual.municipioid || perfilActual.municipio_id;
            if (idMuni) setValor('editMunicipio', idMuni);
        }
        modal.style.display = 'flex';
    });

    document.getElementById('closeEditar').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('formEditarPerfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        const datosActualizados = {
            nombreempresa: getValor('editNombreEmpresa'),
            telefono: getValor('editTelefono'),
            direccion: getValor('editDireccion'),
            sectorid: getValorSelect('editSector'),
            tipoempresaid: getValorSelect('editTipoEmpresa'),
            municipioid: getValorSelect('editMunicipio')
        };
        Object.keys(datosActualizados).forEach(k => { if (datosActualizados[k] === null) delete datosActualizados[k]; });

        const btn = document.getElementById('btnGuardarPerfil');
        btn.textContent = "Guardando..."; btn.disabled = true;
        try {
            const res = await fetch(`${API_URL}/mi-perfil/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(datosActualizados)
            });
            if (!res.ok) throw new Error();
            alert("¡Perfil de empresa actualizado con éxito!");
            modal.style.display = 'none';
            cargarDatosPerfil(); 
        } catch (error) { alert("Hubo un problema al guardar."); } finally { btn.textContent = "Guardar Cambios"; btn.disabled = false; }
    });
}

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
            const res = await fetch(`${API_URL}/upload-imagen/`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: formData });
            if (!res.ok) throw new Error();
            cargarDatosPerfil(); 
        } catch (error) { alert("No se pudo subir el logo."); }
    });
}

// La l[ogica] de vacantes y requisitos
function inicializarEventosVacantes() {
    const modalVacante = document.getElementById('modalVacante');
    const btnAbrir = document.getElementById('btnAbrirVacante');

    // Requisitos Dinámicos
    document.getElementById('btnAgregarRequisito')?.addEventListener('click', () => {
        const selectText = document.getElementById('vacRequisitoText');
        const esObligatorio = document.getElementById('vacReqObligatorio').checked;
        if(!selectText.value) return alert("Selecciona un requisito válido.");
        requisitosSeleccionados.push({ descripcion: selectText.value, obligatorio: esObligatorio });
        renderizarRequisitos();
        selectText.value = ""; 
    });

    // abrir modal para crear (limpiar todo)
    btnAbrir?.addEventListener('click', () => {
        empleoEditandoId = null;
        document.getElementById('formNuevaVacante').reset();
        document.getElementById('tituloModalVacante').innerHTML = '<i class="fas fa-briefcase"></i> Publicar Nueva Vacante';
        document.getElementById('btnGuardarVacante').textContent = "Publicar Vacante";
        requisitosSeleccionados = [];
        renderizarRequisitos();
        modalVacante.style.display = 'flex';
    });

    // eenviar formulario (empleo -> Vacante  -> Requisitos)   (La "->" es una flechita)
    document.getElementById('formNuevaVacante')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnGuardar = document.getElementById('btnGuardarVacante');
        const idEmpresa = perfilActual.empresaid || perfilActual.id;
        btnGuardar.textContent = "Guardando..."; btnGuardar.disabled = true;

        try {
            // a= Crear, actualizar empleo
            const payloadEmpleo = {
                nombreempleo: getValor('vacNombre'),
                descripcion: getValor('vacDescripcion'),
                salario: getValor('vacSalario'),
                tipoempleoid: getValorSelect('vacTipoEmpleo'),
                modalidadid: getValorSelect('vacModalidad'),
                estadoid: getValorSelect('vacEstado'),
                fechapublicacion: new Date().toISOString(),
                fechacierre: getValor('vacFechaCierre'),
                municipioid: getValorSelect('vacMunicipio'),
                empresaid: idEmpresa
            };
            Object.keys(payloadEmpleo).forEach(key => { if (payloadEmpleo[key] === null) delete payloadEmpleo[key]; });

            let urlEmpleo = `${API_URL}/empleos/`;
            let metodoEmpleo = 'POST';
            if (empleoEditandoId) {
                urlEmpleo = `${API_URL}/empleos/${empleoEditandoId}/`;
                metodoEmpleo = 'PUT';
            }

            const resEmpleo = await fetch(urlEmpleo, {
                method: metodoEmpleo,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(payloadEmpleo)
            });
            if(!resEmpleo.ok) throw new Error("Fallo al guardar Empleo");
            const dataEmpleo = await resEmpleo.json();
            const idEmpleoGenerado = empleoEditandoId || dataEmpleo.empleoid;

            // b= crear,actualizar Vacante (limites y cantidad)

            const cantPostulantes = getValor('vacCantidad');
            if(cantPostulantes) {
                const payloadVacante = {
                    empleoid: idEmpleoGenerado,
                    cantidad: parseInt(cantPostulantes),
                    fechainicio: new Date().toISOString(),
                    estadoid: getValorSelect('vacEstado')
                };
                
                let metodoVac = 'POST';
                let urlVac = `${API_URL}/vacantes/`;
                if(empleoEditandoId) {
                    const resBusquedaVac = await fetch(`${API_URL}/vacantes/?empleoid=${empleoEditandoId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
                    const vacs = await resBusquedaVac.json();
                    if(vacs.length > 0) { urlVac = `${API_URL}/vacantes/${vacs[0].vacanteid}/`; metodoVac = 'PUT'; }
                }

                await fetch(urlVac, {
                    method: metodoVac,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: JSON.stringify(payloadVacante)
                });
            }

            // c= Guardar Requisitos (lógica con borrado previo)
            if (empleoEditandoId) {
                try {
                    // Si estamos editando, borramos todos los requisitos viejos para no duplicarlos
                    const resViejos = await fetch(`${API_URL}/empleorequisitos/?empleoid=${idEmpleoGenerado}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
                    if (resViejos.ok) {
                        const viejos = await resViejos.json();
                        for (let r of viejos) {
                            const reqId = r.requisitoid || r.id;
                            await fetch(`${API_URL}/empleorequisitos/${reqId}/`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                            });
                        }
                    }
                } catch(e) { console.warn("No se pudieron limpiar requisitos anteriores."); }
            }

            // ensertamos los requisitos seleccionados actualmente
            for (let req of requisitosSeleccionados) {
                const resReq = await fetch(`${API_URL}/empleorequisitos/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                    body: JSON.stringify({ empleoid: idEmpleoGenerado, descripcion: req.descripcion, esobligatorio: req.obligatorio })
                });
                if (!resReq.ok) {
                    console.warn(`Fallo al guardar requisito: ${req.descripcion}`);
                }
            }

            alert("¡Vacante guardada con éxito!");
            modalVacante.style.display = 'none';
            cargarMisVacantes();
        } catch (error) {
            alert("Error al guardar la vacante.");
            console.error(error);
        } finally {
            btnGuardar.textContent = "Publicar Vacante"; btnGuardar.disabled = false;
        }
    });
}

function renderizarRequisitos() {
    const lista = document.getElementById('listaRequisitosModal');
    if(requisitosSeleccionados.length === 0) {
        lista.innerHTML = '<li style="color:#666; font-style:italic; font-size: 0.9rem;">Sin requisitos añadidos.</li>';
        return;
    }
    lista.innerHTML = requisitosSeleccionados.map((r, i) => `
        <li style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:6px 12px; border:1px solid #ccc; border-radius:4px; font-size:14px;">
            <span>${r.descripcion} <strong style="color:${r.obligatorio ? '#dc3545' : '#198754'}">(${r.obligatorio ? 'Obligatorio' : 'Opcional'})</strong></span>
            <button type="button" onclick="eliminarRequisito(${i})" style="border:none; background:none; color:#dc3545; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </li>
    `).join('');
}
window.eliminarRequisito = function(index) { requisitosSeleccionados.splice(index, 1); renderizarRequisitos(); }

// 4= mostrar las vacantes 
async function cargarMisVacantes() {
    const idEmpresa = perfilActual.empresaid || perfilActual.id;
    const lista = document.getElementById('listaMisVacantes');
    
    try {
        const res = await fetch(`${API_URL}/empleos/?empresaid=${idEmpresa}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) return lista.innerHTML = '<p style="color: #666; font-style: italic;">Aún no has publicado vacantes.</p>';

            lista.innerHTML = data.map(v => `
                <div class="cv-item" style="position:relative; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eef5fc;">
                    <h4 style="color: #0f2b5d; margin-bottom: 5px; font-size: 1.1rem;">${v.nombreempleo}</h4>
                    <p style="font-size: 0.85rem; color: #444; line-height: 1.4; margin-bottom: 10px;">${v.descripcion ? v.descripcion.substring(0, 100) + '...' : 'Sin descripción.'}</p>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="editarVacante(${v.empleoid})" class="btn-editar" style="font-size: 0.8rem; padding: 5px 10px;"><i class="fas fa-edit"></i> Editar</button>
                        <button onclick="verPostulantes(${v.empleoid})" class="btn-primary" style="font-size: 0.8rem; padding: 5px 10px;"><i class="fas fa-users"></i> Postulantes</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

// la logica de edicion segura
window.editarVacante = async function(id) {
    empleoEditandoId = id;
    const modal = document.getElementById('modalVacante');
    document.getElementById('tituloModalVacante').innerHTML = '<i class="fas fa-edit"></i> Editar Vacante';
    document.getElementById('btnGuardarVacante').textContent = "Guardar Cambios";
    
    try {
        // 1 cargar empleo principal
        const res = await fetch(`${API_URL}/empleos/${id}/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
        if (!res.ok) throw new Error("Fallo al descargar el empleo.");
        const emp = await res.json();
        
        setValor('vacNombre', emp.nombreempleo);
        setValor('vacDescripcion', emp.descripcion);
        setValor('vacSalario', emp.salario);
        setValor('vacFechaCierre', emp.fechacierre ? emp.fechacierre.split('T')[0] : '');
        
        // asignación inteligente para evitar errores con serializers anidados
        setValor('vacTipoEmpleo', emp.tipoempleoid?.tipoempleoid || emp.tipoempleoid?.id || emp.tipoempleoid);
        setValor('vacModalidad', emp.modalidadid?.modalidadid || emp.modalidadid?.id || emp.modalidadid);
        setValor('vacEstado', emp.estadoid?.estadoid || emp.estadoid?.id || emp.estadoid);
        
        // 2 = cargar Cascada de Municipio
        if(emp.municipioid) {
            try {
                const idMuni = emp.municipioid?.municipioid || emp.municipioid?.id || emp.municipioid;
                const munRes = await fetch(`${API_URL}/municipios/${idMuni}/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
                const munData = await munRes.json();
                
                const deptoId = munData.departamentoid?.departamentoid || munData.departamentoid?.id || munData.departamentoid;
                if(deptoId) {
                    setValor('vacDepartamento', deptoId);
                    await cargarMunicipios(deptoId, 'vacMunicipio');
                    setValor('vacMunicipio', idMuni);
                }
            } catch(e) { console.warn("No se pudo pre-cargar la ubicación", e); }
        }

        // 3 cargar vacante (para sacar el Limite de Cantidad)
        try {
            const resVac = await fetch(`${API_URL}/vacantes/?empleoid=${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
            if (resVac.ok) {
                const vacs = await resVac.json();
                if(vacs.length > 0) setValor('vacCantidad', vacs[0].cantidad);
            }
        } catch(e) { console.warn("No se pudo pre-cargar límite de cantidad", e); }

        // 4 = argar lo reequisitos
        try {
            const resReq = await fetch(`${API_URL}/empleorequisitos/?empleoid=${id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
            if (resReq.ok) {
                const reqs = await resReq.json();
                requisitosSeleccionados = reqs.map(r => ({ descripcion: r.descripcion, obligatorio: r.esobligatorio }));
            } else {
                console.warn("Ruta de requisitos no encontrada (404) o sin permisos.");
            }
        } catch(e) { console.warn("No se pudieron cargar los requisitos", e); }

        renderizarRequisitos();
        modal.style.display = 'flex';

    } catch (e) { 
        console.error(e);
        alert("Error al cargar la vacante para editar. Revisa la consola para más detalles."); 
    }
}

// 5 = ver postulantes 

function inicializarModalesAdicionales() {
    document.getElementById('closeVacante')?.addEventListener('click', () => document.getElementById('modalVacante').style.display = 'none');
    document.getElementById('closePostulantes')?.addEventListener('click', () => document.getElementById('modalPostulantes').style.display = 'none');
    window.addEventListener('click', (e) => { 
        if (e.target === document.getElementById('modalVacante')) document.getElementById('modalVacante').style.display = 'none'; 
        if (e.target === document.getElementById('modalPostulantes')) document.getElementById('modalPostulantes').style.display = 'none'; 
    });
}

window.verPostulantes = async function(empleoId) {
    const modal = document.getElementById('modalPostulantes');
    const lista = document.getElementById('listaPostulantesUI');
    lista.innerHTML = '<p>Buscando talento...</p>';
    modal.style.display = 'flex';

    try {
        const res = await fetch(`${API_URL}/postulaciones/?empleoid=${empleoId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
        const postulaciones = await res.json();

        if(postulaciones.length === 0) {
            lista.innerHTML = '<p style="color:#666; font-style:italic;">Aún no hay postulantes para esta vacante.</p>';
            return;
        }

        lista.innerHTML = postulaciones.map(p => {
            // 1 extracción "A prueba de balas" del nombre del candidato
            let candidatoNombre = "Candidato Desconocido";
            let candidatoID = null;

            if (p.candidatoid && typeof p.candidatoid === 'object') {
                // Busca el nombre en minúscula, mayúscula o incluso anidado en el usuario
                let n = p.candidatoid.nombre || p.candidatoid.Nombre || (p.candidatoid.usuarioid ? p.candidatoid.usuarioid.first_name : '') || '';
                let a = p.candidatoid.apellido || p.candidatoid.Apellido || (p.candidatoid.usuarioid ? p.candidatoid.usuarioid.last_name : '') || '';
                
                candidatoNombre = `${n} ${a}`.trim();
                
                // Si todo está vacio mostramos el ID
                if (!candidatoNombre) candidatoNombre = `Candidato ID: ${p.candidatoid.candidatoid || p.candidatoid.id || p.candidatoid.CandidatoId}`;
                
                candidatoID = p.candidatoid.candidatoid || p.candidatoid.id || p.candidatoid.CandidatoId;
            } else if (p.candidatoid) {
                candidatoNombre = `Candidato ID: ${p.candidatoid}`;
                candidatoID = p.candidatoid;
            }

            // 2 extrae el estado (ejmplo "En Revisión")
            let nombreEstado = "En Revisión";
            if (p.estadoid && typeof p.estadoid === 'object') {
                nombreEstado = p.estadoid.nombre || p.estadoid.Nombre || nombreEstado;
            }

            // 3 dibujar la tarjeta con el botón funcionando
            return `
                <div style="border: 1px solid #ccc; padding: 10px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="color:#0f2b5d; margin:0;"><i class="fas fa-user-circle"></i> ${candidatoNombre}</h4>
                        <p style="margin: 3px 0 0 0; font-size: 0.85rem; color:#666;">Fecha Postulación: ${p.fechapostulacion ? p.fechapostulacion.split('T')[0] : 'N/A'}</p>
                        <span style="font-size: 0.75rem; background: #eef5fc; color: #0066d5; padding: 3px 8px; border-radius: 12px; display:inline-block; margin-top:5px; font-weight:bold;">${nombreEstado}</span>
                    </div>
                    <button onclick="window.location.href='/html/VerCandidato.html?id=${candidatoID}'" class="btn-primary" style="padding: 8px 15px; font-size: 0.85rem; cursor: pointer;">
                        <i class="fas fa-file-alt"></i> Ver Perfil / CV
                    </button>
                </div>
            `;
        }).join('');

    } catch (e) {
        lista.innerHTML = '<p style="color:red;">Hubo un error cargando los postulantes.</p>';
    }
}