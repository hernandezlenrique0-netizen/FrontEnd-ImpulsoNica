const API_URL = 'http://127.0.0.1:8000/api';
let perfilActual = {};

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    inicializarCatalogos();
    inicializarEventosEdicion();
    inicializarSubidaImagen();
});

// =====================================================================
// FUNCIONES AUXILIARES (Previenen errores si falta algún ID en el HTML)
// =====================================================================
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
    return el ? el.value : '';
};

const getValorSelect = (id) => {
    const el = document.getElementById(id);
    return el && el.value ? el.value : null;
};

// =====================================================================
// 1. CARGAR DATOS DEL PERFIL
// =====================================================================
async function cargarDatosPerfil() {
    let token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = "/index.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            console.warn("Token expirado, intentando refrescar...");
            const refrescado = await intentarRefrescarToken();
            if (refrescado) return cargarDatosPerfil(); 
            else {
                alert("Tu sesión ha caducado. Por favor, inicia sesión de nuevo.");
                window.location.href = "/index.html";
                return;
            }
        }

        if (!response.ok) throw new Error("No se pudo cargar el perfil.");

        const data = await response.json();
        
        if (data.datos) {
            perfilActual = data.datos;
            
            // Textos Simples (Usando la función segura)
            const nombreCompleto = `${data.datos.nombre || ''} ${data.datos.apellido || ''}`.trim();
            setTexto('lblNombre', nombreCompleto || 'Usuario sin nombre');
            setTexto('lblCorreo', data.datos.correo || '...');
            setTexto('lblTelefono', data.datos.telefono || 'No especificado');
            setTexto('lblDireccion', data.datos.direccion || 'Dirección exacta no especificada');
            setTexto('lblTitulo', data.datos.titulo || 'Sin título profesional registrado');
            setTexto('lblSobreMi', data.datos.sobre_mi || 'Aún no has añadido una descripción profesional.');
            
            // Textos de Catálogos
            setTexto('lblGenero', data.datos.genero_nombre || 'Género no especificado');
            setTexto('lblNacionalidad', data.datos.nacionalidad_nombre || 'Nacionalidad no especificada');
            setTexto('lblFechaNac', data.datos.fecha_nacimiento || 'Fecha de Nac. no especificada');
            
            // Unimos Municipio y Departamento para la Ubicación (No incluimos país)
            let ubicacion = [data.datos.municipio_nombre, data.datos.departamento_nombre]
                .filter(Boolean).join(', ');
            setTexto('lblUbicacion', ubicacion || 'Ubicación no especificada');

            // Foto
            if (data.datos.foto_url) {
                const fotoUrl = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://127.0.0.1:8000${data.datos.foto_url}`;
                const imgEl = document.getElementById('fotoPerfil');
                if (imgEl) imgEl.src = fotoUrl;
            }
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
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
    } catch (e) { console.error("Error al refrescar token:", e); }
    return false;
}

// =====================================================================
// 2. LÓGICA DE CATÁLOGOS (Ajustada para Nicaragua)
// =====================================================================
async function inicializarCatalogos() {
    // Cargamos Nacionalidad, Género y Departamentos DE INMEDIATO y de forma independiente
    await cargarSelect(`${API_URL}/generos/`, 'editGenero', 'Seleccione su Género...');
    await cargarSelect(`${API_URL}/nacionalidades/`, 'editNacionalidad', 'Seleccione su Nacionalidad...');
    await cargarSelect(`${API_URL}/departamentos/`, 'editDepartamento', 'Seleccione un Departamento...');

    // La única dependencia que queda es que los Municipios dependen del Departamento elegido
    const selectDepto = document.getElementById('editDepartamento');
    const selectMuni = document.getElementById('editMunicipio');

    if (selectDepto) {
        selectDepto.addEventListener('change', async (e) => {
            const deptoId = e.target.value;
            
            if (!deptoId) {
                if(selectMuni) {
                    selectMuni.innerHTML = '<option value="">Seleccione un departamento primero</option>';
                    selectMuni.disabled = true;
                }
                return;
            }

            if(selectMuni) selectMuni.disabled = false;
            await cargarSelect(`${API_URL}/municipios/?departamento_id=${deptoId}`, 'editMunicipio', 'Seleccione un Municipio...');
        });
    }
}

async function cargarSelect(url, selectId, defaultText) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    const token = localStorage.getItem('auth_token');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar catálogo');
        
        const data = await response.json();
        
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        data.forEach(item => {
            const option = new Option(item.nombre || item.descripcion, item.id);
            selectElement.add(option);
        });
    } catch (error) {
        console.error(`Fallo al cargar catálogo desde ${url}:`, error);
        selectElement.innerHTML = `<option value="">Error al cargar opciones</option>`;
    }
}

// =====================================================================
// 3. LÓGICA DEL MODAL DE EDICIÓN
// =====================================================================
function inicializarEventosEdicion() {
    const modal = document.getElementById('modalEditarPerfil');
    const btnAbrir = document.getElementById('btnAbrirEdicion');
    const btnCerrar = document.getElementById('closeEditar');
    const formEditar = document.getElementById('formEditarPerfil');

    if (!modal || !btnAbrir || !btnCerrar || !formEditar) return;

    btnAbrir.addEventListener('click', async () => {
        // Llenar inputs de forma segura
        setValor('editNombre', perfilActual.nombre);
        setValor('editApellido', perfilActual.apellido);
        setValor('editTelefono', perfilActual.telefono);
        setValor('editDireccion', perfilActual.direccion);
        setValor('editFechaNac', perfilActual.fecha_nacimiento);
        setValor('editTitulo', perfilActual.titulo);
        setValor('editSobreMi', perfilActual.sobre_mi);
        
        // Llenar catálogos independientes
        setValor('editGenero', perfilActual.genero_id);
        setValor('editNacionalidad', perfilActual.nacionalidad_id);
        setValor('editDepartamento', perfilActual.departamento_id);
        
        // Cargar municipios si ya tiene un departamento asignado
        if (perfilActual.departamento_id) {
            const editMuni = document.getElementById('editMunicipio');
            if(editMuni) editMuni.disabled = false;
            
            await cargarSelect(`${API_URL}/municipios/?departamento_id=${perfilActual.departamento_id}`, 'editMunicipio', 'Seleccione un Municipio...');
            
            if (perfilActual.municipio_id) {
                setValor('editMunicipio', perfilActual.municipio_id);
            }
        } else {
            const editMuni = document.getElementById('editMunicipio');
            if(editMuni) {
                editMuni.innerHTML = '<option value="">Seleccione un departamento primero</option>';
                editMuni.disabled = true;
            }
        }

        modal.style.display = 'flex';
    });

    btnCerrar.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCambiosPerfil();
    });
}

// =====================================================================
// 4. GUARDAR CAMBIOS
// =====================================================================
async function guardarCambiosPerfil() {
    const token = localStorage.getItem('auth_token');
    const btnGuardar = document.getElementById('btnGuardarPerfil');
    if (!btnGuardar) return;
    
    // Recolectamos toda la info
    const datosActualizados = {
        nombre: getValor('editNombre'),
        apellido: getValor('editApellido'),
        telefono: getValor('editTelefono'),
        direccion: getValor('editDireccion'),
        fecha_nacimiento: getValor('editFechaNac'),
        titulo: getValor('editTitulo'),
        sobre_mi: getValor('editSobreMi'),
        
        // Llaves foráneas limpias
        genero_id: getValorSelect('editGenero'),
        nacionalidad_id: getValorSelect('editNacionalidad'),
        departamento_id: getValorSelect('editDepartamento'),
        municipio_id: getValorSelect('editMunicipio')
    };

    btnGuardar.textContent = "Guardando...";
    btnGuardar.disabled = true;

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(datosActualizados)
        });

        if (!response.ok) throw new Error("Error al actualizar el perfil.");

        alert("¡Perfil actualizado con éxito!");
        document.getElementById('modalEditarPerfil').style.display = 'none';
        cargarDatosPerfil(); 
    } catch (error) {
        alert("Hubo un problema al guardar los cambios.");
    } finally {
        btnGuardar.textContent = "Guardar Cambios";
        btnGuardar.disabled = false;
    }
}

// =====================================================================
// 5. SUBIDA DE IMAGEN
// =====================================================================
function inicializarSubidaImagen() {
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const inputFoto = document.getElementById('inputFoto');
    const imgPerfil = document.getElementById('fotoPerfil');

    if (!btnCambiarFoto || !inputFoto) return;

    btnCambiarFoto.addEventListener('click', () => inputFoto.click());

    inputFoto.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if(imgPerfil) imgPerfil.src = e.target.result;
        };
        reader.readAsDataURL(archivo);

        await subirArchivoAlServidor(archivo);
    });
}

async function subirArchivoAlServidor(archivo) {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('imagen', archivo); 

    try {
        const response = await fetch(`${API_URL}/upload-imagen/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error("Error en la subida.");
        alert("¡Foto de perfil actualizada con éxito!");
        cargarDatosPerfil(); 
    } catch (error) {
        console.error("Error al subir:", error);
        alert("No se pudo subir la imagen.");
    }
}