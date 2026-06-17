<<<<<<< HEAD
(function protegerRutasPrivadas() {
    const path = window.location.pathname.toLowerCase();
    const token = localStorage.getItem('auth_token');
    const userType = localStorage.getItem('user_type');

    const esPerfilCandidato = path.includes('pcandidato.html');
    const esPerfilEmpresa = path.includes('pempresa.html');

    // 1. Si NO hay sesión y trata de entrar a cualquier perfil, lo sacamos al inicio
    if ((esPerfilCandidato || esPerfilEmpresa) && !token) {
        window.location.replace('/index.html');
        return;
    }

    // 2. Si es EMPRESA intentando entrar al perfil de CANDIDATO
    if (esPerfilCandidato && userType === 'empresa') {
        window.location.replace('/html/PEmpresa.html');
        return;
    }

    // 3. Si es CANDIDATO intentando entrar al perfil de EMPRESA
    if (esPerfilEmpresa && userType === 'candidato') {
        window.location.replace('/html/PCandidato.html');
        return;
    }
})();


const API_URL_AUTH = 'http://127.0.0.1:8000/api';
=======
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
const API_URL_AUTH = 'http://20.10.8.172:8000/api';
>>>>>>> DeveloperJuan

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

<<<<<<< HEAD
=======
// --- CAMBIO DE ETIQUETA DINÁMICA DEL REGISTRO (Candidato vs Empresa) ---
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'registerUserType') {
        const lblRegNombre = document.getElementById('lblRegNombre');
        const regNombreInput = document.getElementById('regNombre');
        let formGroupApellido = document.getElementById('groupRegApellido');

        if (lblRegNombre && regNombreInput) {
            if (e.target.value === 'empresa') {
                lblRegNombre.innerHTML = 'Nombre de la Empresa <span style="color:#dc3545;">*</span>';
                regNombreInput.placeholder = "Ej. Grupo Pellas S.A.";
                
                // Ocultar campo de apellido si es empresa
                if (formGroupApellido) formGroupApellido.style.display = 'none';
            } else {
                lblRegNombre.innerHTML = 'Nombre <span style="color:#dc3545;">*</span>';
                regNombreInput.placeholder = "Ej. Juan";
                
                // Mostrar campo de apellido si es candidato
                if (formGroupApellido) {
                    formGroupApellido.style.display = 'block';
                } else {
                    // Crear el campo apellido dinámicamente si no existe en el HTML
                    formGroupApellido = document.createElement('div');
                    formGroupApellido.className = 'form-group-reg';
                    formGroupApellido.id = 'groupRegApellido';
                    formGroupApellido.innerHTML = `
                        <label for="regApellido" id="lblRegApellido">Apellido <span style="color:#dc3545;">*</span></label>
                        <input type="text" id="regApellido" class="input-reg" placeholder="Ej. Pérez" required>
                    `;
                    // Insertarlo justo después del campo de Nombre
                    regNombreInput.parentElement.insertAdjacentElement('afterend', formGroupApellido);
                }
            }
        }
    }
});

// Función auxiliar para pintar el error en el HTML
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

>>>>>>> DeveloperJuan
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
            if (e.target.closest('.close') && e.target.closest('#loginModal')) {
                modalLogin.style.display = 'none';
            }
            if (e.target === modalLogin) {
                modalLogin.style.display = 'none';
            }
        }

        // --- 2. ABRIR Y CERRAR MODAL DE REGISTRO ---
        if (e.target.closest('#btnOpenRegister')) {
            e.preventDefault();
            const regModal = document.getElementById('registerModal');
<<<<<<< HEAD
            if (regModal) regModal.style.display = 'flex';
=======
            if (regModal) {
                regModal.style.display = 'flex';
                // Forzar la creación/ajuste del campo Apellido al abrir por primera vez
                const selectTipo = document.getElementById('registerUserType');
                if (selectTipo) selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
            }
>>>>>>> DeveloperJuan
        }

        const regModal = document.getElementById('registerModal');
        if (regModal) {
            if (e.target.closest('.close') && e.target.closest('#registerModal')) {
                regModal.style.display = 'none';
            }
            if (e.target === regModal) {
                regModal.style.display = 'none';
            }
        }

        // --- 3. LÓGICA DE INICIO DE SESIÓN ---
        if (e.target.closest('#btnLogin')) {
            e.preventDefault();
            const btnLogin = e.target.closest('#btnLogin');
            
<<<<<<< HEAD
            const usuario = document.getElementById("correo").value;
            const clave = document.getElementById("password").value;
=======
            const usuario = document.getElementById("loginCorreo")?.value || document.getElementById("correo")?.value;
            const clave = document.getElementById("loginPassword")?.value || document.getElementById("password")?.value;
>>>>>>> DeveloperJuan

            if (!usuario || !clave) {
                alert("Por favor, ingresa tu correo y contraseña.");
                return;
            }

<<<<<<< HEAD
            btnLogin.innerText = "Iniciando...";
=======
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
>>>>>>> DeveloperJuan
            btnLogin.disabled = true;

            try {
                const response = await fetch(`${API_URL_AUTH}/token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usuario, password: clave })
                });

                const data = await response.json();

                if (response.ok) {
<<<<<<< HEAD
                    const rolDetectado = data.rol || "candidato"; 

                    localStorage.setItem('auth_token', data.access);
                    localStorage.setItem('user_type', rolDetectado);

                    alert("¡Inicio de sesión exitoso!");
                    if(modalLogin) modalLogin.style.display = "none";
                    actualizarMenuNavegacion();

                    if (rolDetectado === "candidato") window.location.href = "/html/PCandidato.html";
                    else if (rolDetectado === "empresa") window.location.href = "/html/PEmpresa.html";
                    else if (rolDetectado === "admin") window.location.href = "/html/admin.html";
=======
                    const rolBruto = data.rol || data.tipo || "candidato"; 
                    const rolDetectado = rolBruto.trim().toLowerCase();

                    localStorage.setItem('auth_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('user_type', rolDetectado);

                    if(modalLogin) modalLogin.style.display = "none";
                    actualizarMenuNavegacion();

                    // Redirecciones actualizadas
                    if (rolDetectado === "candidato") window.location.href = "/html/PCandidato.html";
                    else if (rolDetectado === "empresa") window.location.href = "/html/PEmpresa.html";
                    else if (rolDetectado === "admin") window.location.href = "/html/PAdministrador.html";
                    else window.location.reload();
>>>>>>> DeveloperJuan

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

        // --- 4. LÓGICA DE REGISTRO ---
        if (e.target.closest('#btnRegister')) {
            e.preventDefault();
            const btnRegister = e.target.closest('#btnRegister');
            
<<<<<<< HEAD
            // Buscamos los datos usando los IDs del registro.html
            const userType = document.getElementById("registerUserType")?.value;
            const correo = document.getElementById("regCorreo")?.value;
            const password = document.getElementById("regPassword")?.value;
            
            if (!correo || !password) {
                alert("Por favor completa tu correo y contraseña para registrarte.");
                return;
            }

            btnRegister.innerText = "Registrando...";
            btnRegister.disabled = true;
            
            try {
                const response = await fetch(`${API_URL_AUTH}/registro/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        tipo: userType,
                        email: correo,
                        password: password
                    })
=======
            // Recolectar datos
            const tipo = document.getElementById('registerUserType')?.value;
            const nombre = document.getElementById('regNombre')?.value.trim();
            const correo = document.getElementById('regCorreo')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
            
            // Obtener el apellido
            const apellidoInput = document.getElementById('regApellido');
            const apellido = apellidoInput && apellidoInput.closest('.form-group-reg').style.display !== 'none' 
                                ? apellidoInput.value.trim() 
                                : '';

            // Limpiar alerta previa
            const alertError = document.getElementById('regAlertError');
            if (alertError) alertError.style.display = 'none';

            if (!nombre || !correo || !password || !passwordConfirm || (tipo === 'candidato' && !apellido)) {
                return mostrarErrorRegistro("Por favor, completa todos los campos obligatorios.");
            }

            if (password !== passwordConfirm) {
                return mostrarErrorRegistro("Las contraseñas no coinciden. Verifícalas y vuelve a intentarlo.");
            }

            btnRegister.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
            btnRegister.disabled = true;
            
            try {
                const payload = { 
                    tipo: tipo, 
                    correo: correo, 
                    password: password, 
                    nombre: nombre,
                    apellido: apellido, 
                    email: correo 
                };

                const response = await fetch(`${API_URL_AUTH}/registro/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
>>>>>>> DeveloperJuan
                });

                const data = await response.json();

<<<<<<< HEAD
                if (response.ok) {
                    alert("¡Registro exitoso! Ya puedes iniciar sesión con tu nueva cuenta.");
                    if(regModal) regModal.style.display = "none";
                    
                    // Abrimos automáticamente la ventana de login para que entre
                    if (modalLogin) modalLogin.style.display = "flex";
                } else {
                    alert(`Error al registrar: ${data.error || 'Revisa los datos.'}`);
                }
            } catch (error) {
                console.error('Error de red:', error);
                alert("Error de conexión con el servidor.");
            } finally {
                btnRegister.innerText = "Registrarse";
=======
                if (!response.ok) {
                    const errorMsg = data.error ? data.error.toLowerCase() : '';
                    if (errorMsg.includes('unique') || errorMsg.includes('duplicate') || errorMsg.includes('violation')) {
                        throw new Error(`El correo "${correo}" ya se encuentra registrado. Por favor, intenta iniciar sesión.`);
                    }
                    throw new Error(data.error || "Ocurrió un error al registrar la cuenta.");
                }

                alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión en ImpulsoNica.");
                
                if(regModal) regModal.style.display = 'none';
                
                // Limpiar formulario
                document.getElementById('regNombre').value = '';
                if(apellidoInput) apellidoInput.value = '';
                document.getElementById('regCorreo').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regPasswordConfirm').value = '';

                if (modalLogin) modalLogin.style.display = "flex";

            } catch (error) {
                mostrarErrorRegistro(error.message);
            } finally {
                btnRegister.textContent = "Registrarse";
>>>>>>> DeveloperJuan
                btnRegister.disabled = false;
            }
        }
    });
}

<<<<<<< HEAD
async function actualizarMenuNavegacion() {
    const token = localStorage.getItem('auth_token');
    const rol = localStorage.getItem('user_type');
    
    // Buscar dónde inyectar el menú
=======
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
    
>>>>>>> DeveloperJuan
    const menuDestino = document.querySelector('.menu') || document.querySelector('.nav-links') || document.querySelector('.navbar');
    const linkLogin = document.getElementById('linkLogin');
    const btnOpenRegister = document.getElementById('btnOpenRegister');

    if (token && rol) {
<<<<<<< HEAD
        // Ocultar botones de login y registro si existen
        if (linkLogin) linkLogin.style.display = 'none';
        if (btnOpenRegister) btnOpenRegister.style.display = 'none';

        // Detectar si estamos en una página de perfil
        const isProfilePage = window.location.pathname.toLowerCase().includes('pcandidato.html') || 
                              window.location.pathname.toLowerCase().includes('pempresa.html') || 
                              window.location.pathname.toLowerCase().includes('admin.html');

        if (isProfilePage) {
            // ESTAMOS EN EL PERFIL: Vista 100% limpia sin menús (Estilo CV)
            return; 
        } else if (menuDestino) {
            // NO ESTAMOS EN EL PERFIL: Mostramos el menú desplegable con el avatar
            if (!document.getElementById('profileDropdownContainer')) {
                
                // Determinar rutas y etiquetas según el rol
                let profileLink = '/html/PCandidato.html';
                let roleName = 'Candidato';
                
                if (rol === 'admin') {
                    profileLink = '/html/admin.html';
                    roleName = 'Administrador';
=======
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
>>>>>>> DeveloperJuan
                } else if (rol === 'empresa') {
                    profileLink = '/html/PEmpresa.html';
                    roleName = 'Empresa';
                }
                
                const defaultAvatar = "/imgn/cv.png"; 

<<<<<<< HEAD
                // Crear el contenedor del menú desplegable (Avatar + Menú oculto)
=======
>>>>>>> DeveloperJuan
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
<<<<<<< HEAD
=======
                        <!-- Inyectamos el botón de Dashboard si existe -->
                        ${extraAdminLink}
>>>>>>> DeveloperJuan
                        <a href="${profileLink}"><i class="fas fa-user-circle"></i> Mi Perfil</a>
                        <a href="#" onclick="cerrarSesionApp(event)"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a>
                    </div>
                `;
                menuDestino.appendChild(profileDiv);

<<<<<<< HEAD
                // Hacer una petición rápida a tu BD para traer el nombre real y la foto de perfil
                try {
                    const response = await fetch(`${API_URL_AUTH}/mi-perfil/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.datos) {
                            // Actualizar Foto si existe
                            if (data.datos.foto_url) {
                                const fullUrl = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://127.0.0.1:8000${data.datos.foto_url}`;
                                document.getElementById('navAvatarBtn').src = fullUrl;
                                document.getElementById('dropAvatarImg').src = fullUrl;
                            }
                            // Actualizar Nombre
                            const fullName = data.datos.nombre ? `${data.datos.nombre} ${data.datos.apellido}` : (data.datos.nombreempresa || 'Usuario ImpulsoNica');
                            document.getElementById('dropUserName').textContent = fullName;
                        }
=======
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
                                const fullUrl = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://20.10.8.172:8000${data.datos.foto_url}`;
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
>>>>>>> DeveloperJuan
                    }
                } catch (error) {
                    console.error("Error obteniendo datos del perfil para el navbar:", error);
                }
            }
        }
    }
}

<<<<<<< HEAD
// --- FUNCIONES GLOBALES PARA EL MENÚ DESPLEGABLE ---

// 1. Abrir/cerrar el menú al dar clic en el Avatar
window.toggleProfileMenu = function(e) {
    e.preventDefault();
    const drop = document.getElementById('profileDropdown');
    if (drop) {
        drop.classList.toggle('active');
    }
}

// 2. Función para cerrar sesión y borrar caché
window.cerrarSesionApp = function(e) {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('access');
    localStorage.removeItem('user_type');
    
    // Redirigir siempre a la página principal de manera segura
    window.location.href = '/index.html'; 
}

// 3. Cerrar el menú automáticamente si se hace clic afuera de él
window.addEventListener('click', function(e) {
    const profileDiv = document.querySelector('.user-profile-container');
    const drop = document.getElementById('profileDropdown');
    
    // Si el menú existe y el clic NO fue dentro del contenedor del perfil, lo cerramos
    if (profileDiv && drop && !profileDiv.contains(e.target)) {
        drop.classList.remove('active');
=======
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
>>>>>>> DeveloperJuan
    }
});