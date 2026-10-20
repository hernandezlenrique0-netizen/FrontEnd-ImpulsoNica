// =====================================================================
// GUARDIÁN DE RUTAS (Bloqueo instantáneo de vistas no autorizadas)
// =====================================================================
(function() {
    const ruta = window.location.pathname.toLowerCase();
    // Limpiamos espacios y pasamos a minúsculas para evitar fallos exactos
    const rol = localStorage.getItem('user_type')?.trim().toLowerCase(); 

    // 1. Proteger perfil de Candidato
    if ((ruta.includes('pcandidato.html') || ruta.includes('vercandidato.html')) && rol !== 'candidato' && rol !== 'empresa') {
        window.location.replace('/index.html');
    }
    
    // 2. Proteger perfil de Empresa
    if (ruta.includes('pempresa.html') && rol !== 'empresa') {
        window.location.replace(rol === 'candidato' ? '/html/PCandidato.html' : '/index.html');
    }

    // 3. Proteger Panel de Administrador (Dashboard DW) y Perfil Admin
    if ((ruta.includes('admin.html') || ruta.includes('padministrador.html')) && rol !== 'admin') { 
        if (rol === 'candidato') window.location.replace('/html/PCandidato.html');
        else if (rol === 'empresa') window.location.replace('/html/PEmpresa.html');
        else window.location.replace('/index.html');
    }
})();

// 👇 IP ACTUALIZADA PARA QUE FUNCIONE DESDE CUALQUIER CELULAR O PC 👇
const API_URL_AUTH = 'http://20.51.194.8:8000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. PRIMERO: Inyectamos los modales si no existen en la página
    await inyectarModalLogin();
    await inyectarModalRegistro();

    // 2. SEGUNDO: Inicializamos los botones mediante delegación de eventos
    inicializarEventosAuth();

    // 3. TERCERO: Actualizamos la barra de navegación
    actualizarMenuNavegacion();
});

// --- FUNCIÓN 1: Cargar HTML del Modal de Login ---
async function inyectarModalLogin() {
    if (document.getElementById('loginModal')) return; 

    const modalContainer = document.createElement('div');
    modalContainer.id = "auth-modal-container";
    document.body.appendChild(modalContainer);

    try {
        const response = await fetch('/html/login.html', { cache: 'no-cache' }); 
        if (!response.ok) throw new Error('No se pudo encontrar login.html');
        
        const html = await response.text();
        modalContainer.innerHTML = html;
    } catch (err) {
        console.error("Error al cargar el modal de login:", err);
    }
}

// --- FUNCIÓN 2: Cargar HTML del Modal de Registro ---
async function inyectarModalRegistro() {
    if (document.getElementById('registerModal')) return; 

    const modalContainer = document.createElement('div');
    modalContainer.id = "auth-register-container";
    document.body.appendChild(modalContainer);

    try {
        const response = await fetch('/html/registro.html', { cache: 'no-cache' }); 
        if (!response.ok) throw new Error('No se pudo encontrar registro.html');
        
        const html = await response.text();
        modalContainer.innerHTML = html;
    } catch (err) {
        console.error("Error al cargar el modal de registro:", err);
    }
}

// --- CAMBIO DE ETIQUETA DINÁMICA DEL REGISTRO (Candidato vs Empresa) ---
// --- CARGAR CATÁLOGOS PARA EL FORMULARIO DE SOLICITUD EMPRESARIAL ---
let catalogosRegistroCargados = false;
async function cargarCatalogosSolicitudEmpresa() {
    if (catalogosRegistroCargados) return;
    try {
        const [resSec, resTipo, resMuni] = await Promise.all([
            fetch(`${API_URL_AUTH}/cat-sectores/`),
            fetch(`${API_URL_AUTH}/cat-tiposempresa/`),
            fetch(`${API_URL_AUTH}/municipios/`)
        ]);
        const sectores = await resSec.json();
        const tipos = await resTipo.json();
        const municipios = await resMuni.json();

        const selSec = document.getElementById('regSectorEmpresa');
        const selTipo = document.getElementById('regTipoEmpresa');
        const selMuni = document.getElementById('regMunicipioEmpresa');

        if (selSec) sectores.forEach(s => selSec.add(new Option(s.nombre, s.sectorid || s.id)));
        if (selTipo) tipos.forEach(t => selTipo.add(new Option(t.nombre, t.tipoempresaid || t.id)));
        if (selMuni) municipios.forEach(m => selMuni.add(new Option(m.nombre, m.municipioid || m.id)));

        catalogosRegistroCargados = true;
    } catch (e) {
        console.error("Error cargando catálogos de solicitud empresarial:", e);
    }
}

// --- CAMBIO DE INTERFAZ DINÁMICA DEL REGISTRO (Candidato vs Solicitud de Empresa) ---
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'registerUserType') {
        const esEmpresa = e.target.value === 'empresa';
        const lblRegNombre = document.getElementById('lblRegNombre');
        const regNombreInput = document.getElementById('regNombre');
        const formGroupApellido = document.getElementById('groupRegApellido');
        const camposEmpresa = document.getElementById('camposSolicitudEmpresa');
        const camposPass = document.getElementById('camposPasswordCandidato');
        const avisoEmpresa = document.getElementById('avisoValidacionEmpresa');
        const btnRegister = document.getElementById('btnRegister');
        const tituloModal = document.getElementById('tituloModalRegistro');

        if (esEmpresa) {
            cargarCatalogosSolicitudEmpresa();
            if (tituloModal) tituloModal.innerHTML = '<i class="fas fa-building"></i> Solicitud de Empresa';
            if (lblRegNombre) lblRegNombre.innerHTML = 'Razón Social / Nombre de la Empresa <span style="color:#dc3545;">*</span>';
            if (regNombreInput) regNombreInput.placeholder = "Ej. Grupo Pellas S.A.";
            if (formGroupApellido) formGroupApellido.style.display = 'none';
            if (camposEmpresa) camposEmpresa.style.display = 'block';
            if (camposPass) camposPass.style.display = 'none';
            if (avisoEmpresa) avisoEmpresa.style.display = 'block';
            if (btnRegister) btnRegister.textContent = "Enviar Solicitud de Validación";
        } else {
            if (tituloModal) tituloModal.innerHTML = '<i class="fas fa-user-plus"></i> Crear Cuenta';
            if (lblRegNombre) lblRegNombre.innerHTML = 'Nombre <span style="color:#dc3545;">*</span>';
            if (regNombreInput) regNombreInput.placeholder = "Ej. Juan";
            if (formGroupApellido) formGroupApellido.style.display = 'block';
            if (camposEmpresa) camposEmpresa.style.display = 'none';
            if (camposPass) camposPass.style.display = 'block';
            if (avisoEmpresa) avisoEmpresa.style.display = 'none';
            if (btnRegister) btnRegister.textContent = "Registrarse";
        }
    }
});

function mostrarErrorRegistro(mensaje) {
    const alertError = document.getElementById('regAlertError');
    const alertText = document.getElementById('regAlertText');
    if (alertError && alertText) {
        alertText.textContent = mensaje;
        alertError.style.display = 'block';
    } else {
        alert(mensaje);
    }
}

// --- FUNCIÓN 3: Darle vida a los botones (Delegación de Eventos) ---
function inicializarEventosAuth() {
    // Escuchamos TODOS los clics de la página
    document.addEventListener('click', async (e) => {
        
        // --- 1. ABRIR Y CERRAR MODAL DE LOGIN ---
        if (e.target.closest('#linkLogin')) {
            e.preventDefault();
            const modal = document.getElementById('loginModal');
            if (modal) modal.style.display = 'flex';
        }

        const modalLogin = document.getElementById('loginModal');
        if (modalLogin) {
            if (e.target.closest('.close') && e.target.closest('#loginModal')) modalLogin.style.display = 'none';
            if (e.target === modalLogin) modalLogin.style.display = 'none';
        }

        // --- 2. ABRIR Y CERRAR MODAL DE REGISTRO ---
        if (e.target.closest('#btnOpenRegister')) {
            e.preventDefault();
            const regModal = document.getElementById('registerModal');
            if (regModal) {
                regModal.style.display = 'flex';
                const selectTipo = document.getElementById('registerUserType');
                if (selectTipo) selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        const regModal = document.getElementById('registerModal');
        if (regModal) {
            if (e.target.closest('.close') && e.target.closest('#registerModal')) regModal.style.display = 'none';
            if (e.target === regModal) regModal.style.display = 'none';
        }

        // --- 3. LÓGICA DE INICIO DE SESIÓN ---
        if (e.target.closest('#btnLogin')) {
            
            e.preventDefault();
            const btnLogin = e.target.closest('#btnLogin');
            
            const usuario = document.getElementById("loginCorreo")?.value || document.getElementById("correo")?.value;
            const clave = document.getElementById("loginPassword")?.value || document.getElementById("password")?.value;

            if (!usuario || !clave) {
                alert("Por favor, ingresa tu correo y contraseña.");
                return;
            }

            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            btnLogin.disabled = true;

            try {
                const response = await fetch(`${API_URL_AUTH}/token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usuario, password: clave })
                });

                const data = await response.json();

                if (response.ok) {
                    const rolBruto = data.rol || data.tipo || "candidato"; 
                    const rolDetectado = rolBruto.trim().toLowerCase();

                    localStorage.setItem('auth_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('user_type', rolDetectado);
                    if (data.usuario_sql_id) {
                        localStorage.setItem('usuario_sql_id', data.usuario_sql_id);
                    }

                    if(modalLogin) modalLogin.style.display = "none";
                    actualizarMenuNavegacion();

                    // Redirecciones actualizadas
                    if (rolDetectado === "candidato") window.location.href = "/html/PCandidato.html";
                    else if (rolDetectado === "empresa") window.location.href = "/html/PEmpresa.html";
                    else if (rolDetectado === "admin") window.location.href = "/html/PAdministrador.html";
                    else window.location.reload();

                } else {
                    alert("Error al iniciar sesión: Revisa tus credenciales.");
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert("Error de conexión con el servidor.");
            } finally {
                btnLogin.innerText = "Entrar";
                btnLogin.disabled = false;
            }
        }

        // --- 4. LÓGICA DE REGISTRO (CANDIDATO) O SOLICITUD DE VALIDACIÓN (EMPRESA) ---
        if (e.target.closest('#btnRegister')) {
            e.preventDefault();
            const btnRegister = e.target.closest('#btnRegister');
            
            // Recolectar datos
            const tipo = document.getElementById('registerUserType')?.value;
            const nombre = document.getElementById('regNombre')?.value.trim();
            const correo = document.getElementById('regCorreo')?.value.trim();

            const alertError = document.getElementById('regAlertError');
            if (alertError) alertError.style.display = 'none';

            let payload = {
                tipo: tipo,
                correo: correo,
                email: correo,
                nombre: nombre
            };

            if (tipo === 'candidato') {
                const apellido = document.getElementById('regApellido')?.value.trim();
                const password = document.getElementById('regPassword')?.value;
                const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;

                if (!nombre || !apellido || !correo || !password || !passwordConfirm) {
                    return mostrarErrorRegistro("Por favor, completa todos los campos obligatorios.");
                }
                if (password !== passwordConfirm) {
                    return mostrarErrorRegistro("Las contraseñas no coinciden.");
                }
                payload.apellido = apellido;
                payload.password = password;
            } else {
                // Validación de campos del formulario de Solicitud de Empresa
                const ruc = document.getElementById('regRUC')?.value.trim();
                const telefono = document.getElementById('regTelefonoEmpresa')?.value.trim();
                const sectorid = document.getElementById('regSectorEmpresa')?.value;
                const tipoempresaid = document.getElementById('regTipoEmpresa')?.value;
                const municipioid = document.getElementById('regMunicipioEmpresa')?.value;
                const direccion = document.getElementById('regDireccionEmpresa')?.value.trim();

                if (!nombre || !ruc || !telefono || !sectorid || !tipoempresaid || !municipioid || !direccion || !correo) {
                    return mostrarErrorRegistro("Por favor, completa todos los datos corporativos para que el Administrador pueda validar tu empresa.");
                }
                payload.ruc = ruc;
                payload.telefono = telefono;
                payload.sectorid = parseInt(sectorid);
                payload.tipoempresaid = parseInt(tipoempresaid);
                payload.municipioid = parseInt(municipioid);
                payload.direccion = direccion;
            }

            btnRegister.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btnRegister.disabled = true;
            
            try {
                const response = await fetch(`${API_URL_AUTH}/registro/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Ocurrió un error al procesar la solicitud.");
                }

                if (tipo === 'empresa') {
                    alert("✅ ¡Solicitud Enviada a ImpulsoNica!\n\n" + data.mensaje);
                    if (regModal) regModal.style.display = 'none';
                } else {
                    alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión en ImpulsoNica.");
                    if (regModal) regModal.style.display = 'none';
                    if (modalLogin) modalLogin.style.display = "flex";
                }

                // Limpiar campos
                ['regNombre', 'regApellido', 'regCorreo', 'regPassword', 'regPasswordConfirm', 'regRUC', 'regTelefonoEmpresa', 'regDireccionEmpresa'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });

            } catch (error) {
                mostrarErrorRegistro(error.message);
            } finally {
                btnRegister.textContent = tipo === 'empresa' ? "Enviar Solicitud de Validación" : "Registrarse";
                btnRegister.disabled = false;
            }
        }
    });
}

// =================================================================
// REFRESCAR TOKEN SILENCIOSAMENTE (Magia anti-cierres automáticos)
// =================================================================
async function intentarRefrescarTokenAuth() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    try {
        const response = await fetch(`${API_URL_AUTH}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('auth_token', data.access);
            return true;
        }
    } catch (e) { 
        console.error("Error al refrescar token:", e); 
    } 
    return false;
}

// =================================================================
// 4. BARRA DE NAVEGACIÓN Y PERFIL (PREVIENE CACHÉ Y EXPULSIONES)
// =================================================================
async function actualizarMenuNavegacion() {
    let token = localStorage.getItem('auth_token');
    const rol = localStorage.getItem('user_type')?.trim().toLowerCase();
    
    const menuDestino = document.querySelector('.menu') || document.querySelector('.nav-links') || document.querySelector('.navbar');
    const linkLogin = document.getElementById('linkLogin');
    const btnOpenRegister = document.getElementById('btnOpenRegister');

    if (token && rol) {
        if (linkLogin) linkLogin.style.display = 'none';
        if (btnOpenRegister) btnOpenRegister.style.display = 'none';

        const isProfilePage = window.location.pathname.toLowerCase().includes('pcandidato.html') || 
                              window.location.pathname.toLowerCase().includes('pempresa.html') || 
                              window.location.pathname.toLowerCase().includes('admin.html') ||
                              window.location.pathname.toLowerCase().includes('padministrador.html');

        if (isProfilePage) {
            return; 
        } else if (menuDestino) {
            if (!document.getElementById('profileDropdownContainer')) {
                
                let profileLink = '/html/PCandidato.html';
                let roleName = 'Candidato';
                let extraAdminLink = ''; 
                
                if (rol === 'admin') {
                    // 👇 CAMBIO AQUÍ: Ahora Mi Perfil apunta a PAdministrador.html y el botón de DW se crea 👇
                    profileLink = '/html/PAdministrador.html'; 
                    roleName = 'Administrador';
                    extraAdminLink = `<a href="/html/admin.html" style="color: #4ea8de; font-weight: bold;"><i class="fas fa-chart-line"></i> Panel Gerencial (DW)</a>`;
                } else if (rol === 'empresa') {
                    profileLink = '/html/PEmpresa.html';
                    roleName = 'Empresa';
                }
                
                const defaultAvatar = "/imgn/cv.png"; 

                const profileDiv = document.createElement('div');
                profileDiv.id = 'profileDropdownContainer';
                profileDiv.className = 'user-profile-container';
                profileDiv.innerHTML = `
                    <img src="${defaultAvatar}" alt="Perfil" class="profile-avatar" id="navAvatarBtn" onclick="toggleProfileMenu(event)">
                    <div class="profile-dropdown" id="profileDropdown">
                        <div class="dropdown-header">
                            <img src="${defaultAvatar}" alt="Perfil" id="dropAvatarImg">
                            <div class="drop-info">
                                <h4 id="dropUserName">Cargando perfil...</h4>
                                <p>${roleName}</p>
                            </div>
                        </div>
                        <hr class="drop-divider">
                        <!-- Inyectamos el botón de Dashboard si existe -->
                        ${extraAdminLink}
                        <a href="${profileLink}"><i class="fas fa-user-circle"></i> Mi Perfil</a>
                        <a href="#" onclick="cerrarSesionApp(event)"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a>
                    </div>
                `;
                menuDestino.appendChild(profileDiv);

                try {
                    let response = await fetch(`${API_URL_AUTH}/mi-perfil/`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-cache'
                    });

                    // Si el token expiró (401), intentamos salvar la sesión con el refresh
                    if (response.status === 401) {
                        const refrescado = await intentarRefrescarTokenAuth();
                        if (refrescado) {
                            token = localStorage.getItem('auth_token'); 
                            response = await fetch(`${API_URL_AUTH}/mi-perfil/`, {
                                headers: { 'Authorization': `Bearer ${token}` },
                                cache: 'no-cache'
                            });
                        }
                    }

                    if (response.ok) {
                        const data = await response.json();
                        if (data.datos) {
                            if (data.datos.foto_url) {
                                const fullUrl = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://127.0.0.1:8000${data.datos.foto_url}`;
                                document.getElementById('navAvatarBtn').src = fullUrl;
                                document.getElementById('dropAvatarImg').src = fullUrl;
                            }
                            const fullName = data.datos.nombre ? `${data.datos.nombre} ${data.datos.apellido}` : (data.datos.nombreempresa || 'Usuario ImpulsoNica');
                            document.getElementById('dropUserName').textContent = fullName;
                        }
                    } else if (response.status === 401) {
                        // Solo destruimos la sesión si es un error estricto de autorización
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_type');
                        localStorage.removeItem('refresh_token');
                        window.location.reload(); 
                    }
                } catch (error) {
                    console.error("Error obteniendo datos del perfil para el navbar:", error);
                }
            }
        }
    }
}

// Funciones globales de UI de la sesión
window.toggleProfileMenu = function(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if(dropdown) dropdown.classList.toggle('active');
};

window.cerrarSesionApp = function(event) {
    event.preventDefault();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    window.location.href = "/index.html";
};

window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdown');
    const profileDiv = document.querySelector('.user-profile-container');
    if (profileDiv && dropdown && !profileDiv.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});