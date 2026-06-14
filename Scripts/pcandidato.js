const API_URL = 'http://127.0.0.1:8000/api';
let perfilActual = {};
let idiomasSeleccionados = []; // Arreglo para guardar dinámicamente 

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    inicializarCatalogos();
    inicializarEventosEdicion();
    inicializarEventosExperienciaYReferencias();
    inicializarSubidaImagen();
});


const setTexto = (id, texto) => {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
};

const setValor = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
};

const getValor = (id) => {
    const el = document.getElementById(id);
    return (el && el.value.trim() !== '') ? el.value.trim() : null;
};

const getValorSelect = (id) => {
    const el = document.getElementById(id);
    return (el && el.value !== '') ? parseInt(el.value) : null;
};

// 1. CARGAR DATOS DEL PERFIL (INCLUYENDO EXPERIENCIA Y REFERENCIAS)

async function cargarDatosPerfil() {
    let token = localStorage.getItem('auth_token');
    if (!token) return window.location.href = "/index.html";

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            const refrescado = await intentarRefrescarToken();
            if (refrescado) return cargarDatosPerfil(); 
            else return window.location.href = "/index.html";
        }

        if (!response.ok) throw new Error("No se pudo cargar el perfil.");
        const data = await response.json();
        
        if (data.datos) {
            perfilActual = data.datos;
            
            // Textos Simples
            setTexto('lblNombre', `${data.datos.nombre || ''} ${data.datos.apellido || ''}`.trim() || 'Sin nombre');
            setTexto('lblCorreo', data.datos.correo || '...');
            setTexto('lblTelefono', data.datos.telefono || 'No especificado');
            setTexto('lblDireccion', data.datos.direccion || 'Dirección exacta no especificada');
            setTexto('lblTitulo', data.datos.titulo || 'Sin título profesional');
            setTexto('lblSobreMi', data.datos.sobre_mi || 'Aún no has añadido una descripción profesional.');
            
            // Textos de Catálogos
            setTexto('lblGenero', data.datos.genero_nombre || 'No especificado');
            setTexto('lblEstadoCivil', data.datos.estado_civil_nombre || 'No especificado');
            setTexto('lblNacionalidad', data.datos.nacionalidad_nombre || 'No especificada');
            setTexto('lblFechaNac', data.datos.fechanacimiento || data.datos.fecha_nacimiento || 'No especificada');
            setTexto('lblNivelEducativo', data.datos.nivel_educativo_nombre || 'No especificado');
            setTexto('lblUbicacion', [data.datos.municipio_nombre, data.datos.departamento_nombre].filter(Boolean).join(', ') || 'No especificada');

            // Renderizar Experiencias Laborales
            const listaExp = document.getElementById('listaExperiencia');
            if (listaExp) {
                listaExp.innerHTML = data.datos.experiencias?.length 
                    ? data.datos.experiencias.map(exp => `
                        <div class="cv-item" style="position:relative;">
                            <button onclick="eliminarExperiencia(${exp.experienciaid})" style="position:absolute; right:0; top:0; background:none; border:none; color:#dc3545; cursor:pointer;" title="Eliminar Experiencia"><i class="fas fa-trash"></i></button>
                            <h4 style="padding-right: 25px;">${exp.cargo}</h4>
                            <span class="cv-lugar">${exp.empresa} | ${exp.fechainicio} al ${exp.fechafin || 'Presente'}</span>
                            <p>${exp.descripcion || ''}</p>
                        </div>
                    `).join('')
                    : '<p style="color: #666; font-style: italic;">No hay experiencia laboral registrada.</p>';
            }

            // Renderizar Referencias
            const listaRef = document.getElementById('listaReferencias');
            if (listaRef) {
                listaRef.innerHTML = data.datos.referencias?.length 
                    ? data.datos.referencias.map(ref => `
                        <div class="cv-item" style="position:relative;">
                            <button onclick="eliminarReferencia(${ref.referenciaid})" style="position:absolute; right:0; top:0; background:none; border:none; color:#dc3545; cursor:pointer;" title="Eliminar Referencia"><i class="fas fa-trash"></i></button>
                            <h4 style="padding-right: 25px;">${ref.nombrecontacto}</h4>
                            <span class="cv-lugar">${ref.cargo || 'Cargo no especificado'} - ${ref.empresa || 'Empresa no especificada'}</span>
                            <p><i class="fas fa-phone"></i> ${ref.telefono} | <i class="fas fa-envelope"></i> ${ref.correo || 'Sin correo registrado'}</p>
                        </div>
                    `).join('')
                    : '<p style="color: #666; font-style: italic;">No hay referencias registradas.</p>';
            }

            // Renderizar Habilidades
            const listaHabs = document.getElementById('listaHabilidades');
            if (listaHabs) {
                listaHabs.innerHTML = data.datos.habilidades_nombres?.length 
                    ? data.datos.habilidades_nombres.map(h => `<li>${h}</li>`).join('')
                    : '<li style="background-color:transparent; color:#666; font-style:italic;">Sin habilidades</li>';
            }

            // Renderizar Idiomas con Nivel
            const listaIdio = document.getElementById('listaIdiomas');
            if (listaIdio) {
                listaIdio.innerHTML = data.datos.idiomas_datos?.length 
                    ? data.datos.idiomas_datos.map(i => `<li style="display:flex; justify-content:space-between; width:100%; border-bottom:1px solid #eee; padding:5px 0;"><span>${i.nombre}</span><span style="color:#666; font-size:14px;">${i.nivel}</span></li>`).join('')
                    : '<li style="border:none; color:#666; font-style:italic;">Sin idiomas registrados.</li>';
            }

            // Foto
            if (data.datos.foto_url) {
                document.getElementById('fotoPerfil').src = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://127.0.0.1:8000${data.datos.foto_url}`;
            }
        }
    } catch (error) { console.error('Error al cargar perfil:', error); }
}

async function intentarRefrescarToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
        const response = await fetch(`${API_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.access);
            return true;
        }
    } catch (e) {} return false;
}


// 2. LÓGICA DE CATÁLOGOS E IDIOMAS DINÁMICOS

async function inicializarCatalogos() {
    await cargarSelect(`${API_URL}/generos/`, 'editGenero', 'Seleccione su Género...');
    await cargarSelect(`${API_URL}/estadosciviles/`, 'editEstadoCivil', 'Seleccione su Estado Civil...'); // NUEVO CATALOGO
    await cargarSelect(`${API_URL}/nacionalidades/`, 'editNacionalidad', 'Seleccione su Nacionalidad...');
    await cargarSelect(`${API_URL}/departamentos/`, 'editDepartamento', 'Seleccione un Departamento...');
    await cargarSelect(`${API_URL}/cat-niveleseducativos/`, 'editNivelEducativo', 'Seleccione su Nivel...');
    await cargarSelect(`${API_URL}/cat-idiomas/`, 'selectIdiomaNuevo', 'Seleccione un idioma...');
    await cargarCheckboxesHabilidades();

    document.getElementById('editDepartamento')?.addEventListener('change', async (e) => {
        const deptoId = e.target.value;
        const selectMuni = document.getElementById('editMunicipio');
        if (!deptoId) {
            selectMuni.innerHTML = '<option value="">Seleccione un departamento primero</option>';
            selectMuni.disabled = true; return;
        }
        selectMuni.disabled = false; selectMuni.innerHTML = '<option value="">Cargando municipios...</option>'; 
        await cargarSelect(`${API_URL}/municipios/?departamentoid=${deptoId}`, 'editMunicipio', 'Seleccione un Municipio...');
    });
}

async function cargarSelect(url, selectId, defaultText) {
    const el = document.getElementById(selectId);
    if (!el) return;
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
        const data = await res.json();
        el.innerHTML = `<option value="">${defaultText}</option>`;
        data.forEach(item => {
            const id = item.id || item.departamentoid || item.municipioid || item.nacionalidadid || item.generoid || item.estadocivilid || item.niveleducativoid || item.idiomaid || Object.values(item)[0];
            const nombre = item.nombre || item.descripcion || Object.values(item)[1];
            el.add(new Option(nombre, id));
        });
    } catch (error) { el.innerHTML = `<option value="">Error</option>`; }
}

async function cargarCheckboxesHabilidades() {
    const container = document.getElementById('contenedorHabilidades');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/cat-habilidades/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }});
        const data = await res.json();
        container.innerHTML = '';
        data.forEach(item => {
            const id = item.id || item.habilidadid || Object.values(item)[0];
            const nombre = item.nombre || Object.values(item)[1];
            container.innerHTML += `<label style="display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer;"><input type="checkbox" name="habs_candidato" value="${id}" style="width:auto; margin:0;"> ${nombre}</label>`;
        });
    } catch (error) { container.innerHTML = `<p style="color:red;">Error al cargar habilidades.</p>`; }
}

function renderizarIdiomasModal() {
    const lista = document.getElementById('listaIdiomasModal');
    if(!lista) return;
    lista.innerHTML = '';
    if (idiomasSeleccionados.length === 0) {
        lista.innerHTML = '<li style="color:#666; font-style:italic;">No hay idiomas seleccionados.</li>';
        return;
    }
    idiomasSeleccionados.forEach((idioma, index) => {
        lista.innerHTML += `
            <li style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 12px; border:1px solid #e5e7eb; border-radius:6px;">
                <span><strong>${idioma.nombre}</strong> - ${idioma.nivel}</span>
                <button type="button" onclick="eliminarIdioma(${index})" style="background:transparent; border:none; color:#dc3545; cursor:pointer; font-size:16px;"><i class="fas fa-trash"></i></button>
            </li>
        `;
    });
}

window.eliminarIdioma = function(index) {
    idiomasSeleccionados.splice(index, 1);
    renderizarIdiomasModal();
}

document.getElementById('btnAgregarIdioma')?.addEventListener('click', () => {
    const selectIdiom = document.getElementById('selectIdiomaNuevo');
    const selectNivel = document.getElementById('selectNivelNuevo');
    
    if (!selectIdiom.value) return alert("Por favor seleccione un idioma.");

    const id = parseInt(selectIdiom.value);
    const nombre = selectIdiom.options[selectIdiom.selectedIndex].text;
    const nivel = selectNivel.value;

    if (idiomasSeleccionados.find(i => i.id === id)) {
        return alert("Este idioma ya está en tu lista.");
    }

    idiomasSeleccionados.push({ id, nombre, nivel });
    renderizarIdiomasModal();
    selectIdiom.value = ""; 
});

// 3. LÓGICA DE MODALES: EXPERIENCIA Y REFERENCIAS

function inicializarEventosExperienciaYReferencias() {
    // Abrir Modales con verificación de seguridad
    document.getElementById('btnAgregarExperiencia')?.addEventListener('click', () => {
        const formExp = document.getElementById('formExperiencia');
        if (formExp) formExp.reset();
        
        const modalExp = document.getElementById('modalExperiencia');
        if (modalExp) modalExp.style.display = 'flex';
        else alert("Falta el HTML del modal de experiencia en PCandidato.html");
    });
    
    document.getElementById('btnAgregarReferencia')?.addEventListener('click', () => {
        const formRef = document.getElementById('formReferencia');
        if (formRef) formRef.reset();
        
        const modalRef = document.getElementById('modalReferencia');
        if (modalRef) modalRef.style.display = 'flex';
        else alert("Falta el HTML del modal de referencias en PCandidato.html");
    });

    // Cerrar Modales de forma segura
    document.getElementById('closeExperiencia')?.addEventListener('click', () => {
        const modal = document.getElementById('modalExperiencia');
        if(modal) modal.style.display = 'none';
    });
    
    document.getElementById('closeReferencia')?.addEventListener('click', () => {
        const modal = document.getElementById('modalReferencia');
        if(modal) modal.style.display = 'none';
    });

    // Cerrar al clickear fuera
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalExperiencia')) document.getElementById('modalExperiencia').style.display = 'none';
        if (e.target === document.getElementById('modalReferencia')) document.getElementById('modalReferencia').style.display = 'none';
    });

    // Submits de formularios
    document.getElementById('formExperiencia')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!perfilActual.curriculum_id) return alert("Error: No se encontró tu ID de Currículum. Guarda tu perfil primero.");
        
        const payload = {
            curriculumid: perfilActual.curriculum_id,
            empresa: getValor('expEmpresa'),
            cargo: getValor('expCargo'),
            fechainicio: getValor('expFechaInicio'),
            fechafin: getValor('expFechaFin'),
            descripcion: getValor('expDescripcion')
        };
        
        try {
            const res = await fetch(`${API_URL}/experiencialaboral/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Error al guardar.");
            document.getElementById('modalExperiencia').style.display = 'none';
            cargarDatosPerfil();
        } catch (err) { alert("Error al guardar la experiencia."); }
    });

    document.getElementById('formReferencia')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!perfilActual.curriculum_id) return alert("Error: No se encontró tu ID de Currículum. Guarda tu perfil primero.");
        
        const payload = {
            curriculumid: perfilActual.curriculum_id,
            nombrecontacto: getValor('refNombre'),
            cargo: getValor('refCargo'),
            empresa: getValor('refEmpresa'),
            telefono: getValor('refTelefono'),
            correo: getValor('refCorreo')
        };
        
        try {
            const res = await fetch(`${API_URL}/referencias/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Error al guardar.");
            document.getElementById('modalReferencia').style.display = 'none';
            cargarDatosPerfil();
        } catch (err) { alert("Error al guardar la referencia."); }
    });
}

// Funciones para Eliminar (Llamadas globalmente desde los botones renderizados en HTML)
window.eliminarExperiencia = async function(id) {
    if (!confirm("¿Estás seguro de eliminar esta experiencia?")) return;
    try {
        const res = await fetch(`${API_URL}/experiencialaboral/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!res.ok) throw new Error("Error al eliminar.");
        cargarDatosPerfil();
    } catch (err) { alert("Error al eliminar la experiencia."); }
};

window.eliminarReferencia = async function(id) {
    if (!confirm("¿Estás seguro de eliminar esta referencia?")) return;
    try {
        const res = await fetch(`${API_URL}/referencias/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (!res.ok) throw new Error("Error al eliminar.");
        cargarDatosPerfil();
    } catch (err) { alert("Error al eliminar la referencia."); }
};


// 4. LÓGICA DEL MODAL DE EDICIÓN DEL PERFIL GENERAL

function inicializarEventosEdicion() {
    const modal = document.getElementById('modalEditarPerfil');
    const btnAbrir = document.getElementById('btnAbrirEdicion');
    
    if (!modal || !btnAbrir) return;

    btnAbrir.addEventListener('click', async () => {
        setValor('editNombre', perfilActual.nombre);
        setValor('editApellido', perfilActual.apellido);
        setValor('editTelefono', perfilActual.telefono);
        setValor('editDireccion', perfilActual.direccion);
        setValor('editTitulo', perfilActual.titulo);
        setValor('editSobreMi', perfilActual.sobre_mi); // Se llena si existe en BD
        setValor('editFechaNac', perfilActual.fechanacimiento || perfilActual.fecha_nacimiento);
        
        if (perfilActual.generoid || perfilActual.genero_id) setValor('editGenero', perfilActual.generoid || perfilActual.genero_id);
        if (perfilActual.estadocivilid || perfilActual.estado_civil_id) setValor('editEstadoCivil', perfilActual.estadocivilid || perfilActual.estado_civil_id);
        if (perfilActual.nacionalidadid || perfilActual.nacionalidad_id) setValor('editNacionalidad', perfilActual.nacionalidadid || perfilActual.nacionalidad_id);
        if (perfilActual.nivel_educativo_id || perfilActual.niveleducativoid) setValor('editNivelEducativo', perfilActual.nivel_educativo_id || perfilActual.niveleducativoid); 
        
        const idDepto = perfilActual.departamentoid || perfilActual.departamento_id;
        if (idDepto) {
            setValor('editDepartamento', idDepto);
            const editMuni = document.getElementById('editMunicipio');
            if(editMuni) {
                editMuni.disabled = false;
                await cargarSelect(`${API_URL}/municipios/?departamentoid=${idDepto}`, 'editMunicipio', 'Seleccione un Municipio...');
                const idMuni = perfilActual.municipioid || perfilActual.municipio_id;
                if (idMuni) setValor('editMunicipio', idMuni);
            }
        }

        const checkboxesHabs = document.querySelectorAll('input[name="habs_candidato"]');
        checkboxesHabs.forEach(cb => cb.checked = perfilActual.habilidades && perfilActual.habilidades.includes(parseInt(cb.value)));

        idiomasSeleccionados = perfilActual.idiomas_datos ? [...perfilActual.idiomas_datos] : [];
        renderizarIdiomasModal();

        modal.style.display = 'flex';
    });

    document.getElementById('closeEditar').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('formEditarPerfil').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCambiosPerfil();
    });
}


// 5. GUARDAR CAMBIOS (PERFIL)

async function guardarCambiosPerfil() {
    const btnGuardar = document.getElementById('btnGuardarPerfil');
    const habsSeleccionadas = Array.from(document.querySelectorAll('input[name="habs_candidato"]:checked')).map(cb => parseInt(cb.value));
    const idiomasListosParaEnvio = idiomasSeleccionados.map(i => ({ id: i.id, nivel: i.nivel }));

    const datosActualizados = {
        nombre: getValor('editNombre'),
        apellido: getValor('editApellido'),
        telefono: getValor('editTelefono'),
        direccion: getValor('editDireccion'),
        fechanacimiento: getValor('editFechaNac'),
        titulo: getValor('editTitulo'),
        sobre_mi: getValor('editSobreMi'), // Ahora se envía correctamente
        generoid: getValorSelect('editGenero'),
        estadocivilid: getValorSelect('editEstadoCivil'), // NUEVO CATÁLOGO DE ESTADO CIVIL ENVIADO
        nacionalidadid: getValorSelect('editNacionalidad'),
        municipioid: getValorSelect('editMunicipio'),
        nivel_educativo_id: getValorSelect('editNivelEducativo'),
        habilidades: habsSeleccionadas,
        idiomas: idiomasListosParaEnvio
    };

    Object.keys(datosActualizados).forEach(key => { if (datosActualizados[key] === null) delete datosActualizados[key]; });

    btnGuardar.textContent = "Guardando..."; btnGuardar.disabled = true;

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) throw new Error("Error al actualizar el perfil.");

        alert("¡Perfil actualizado con éxito!");
        document.getElementById('modalEditarPerfil').style.display = 'none';
        cargarDatosPerfil(); 
    } catch (error) { alert("Hubo un problema al guardar los cambios."); } 
    finally { btnGuardar.textContent = "Guardar Cambios"; btnGuardar.disabled = false; }
}


// 6. SUBIDA DE IMAGEN

function inicializarSubidaImagen() {
    document.getElementById('btnCambiarFoto')?.addEventListener('click', () => document.getElementById('inputFoto').click());
    document.getElementById('inputFoto')?.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (e) => { document.getElementById('fotoPerfil').src = e.target.result; };
        reader.readAsDataURL(archivo);

        const formData = new FormData();
        formData.append('imagen', archivo); 
        try {
            await fetch(`${API_URL}/upload-imagen/`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, body: formData });
            cargarDatosPerfil(); 
        } catch (error) { alert("No se pudo subir la imagen."); }
    });
}