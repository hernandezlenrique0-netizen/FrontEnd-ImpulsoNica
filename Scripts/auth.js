// =====================================================================
// GUARDIÁN DE RUTAS (Bloqueo instantáneo de vistas no autorizadas)
// =====================================================================
(function() {
    const ruta = window.location.pathname.toLowerCase();
    const rol = localStorage.getItem('user_type'); // 'candidato', 'empresa' o 'admin'

    // 1. Proteger perfil de Candidato
    if ((ruta.includes('pcandidato.html') || ruta.includes('vercandidato.html')) && rol !== 'candidato' && rol !== 'empresa') {
        window.location.replace('/index.html');
    }
    
    // 2. Proteger perfil de Empresa
    if (ruta.includes('pempresa.html') && rol !== 'empresa') {
        window.location.replace(rol === 'candidato' ? '/html/PCandidato.html' : '/index.html');
    }

    // 3. Proteger Panel de Administrador (Dashboard DW)
    if (ruta.includes('admin.html') && rol !== 'admin') {
        if (rol === 'candidato') window.location.replace('/html/PCandidato.html');
        else if (rol === 'empresa') window.location.replace('/html/PEmpresa.html');
        else window.location.replace('/index.html');
    }
})();

// URL base de tu API
const API_URL_AUTH = 'http://127.0.0.1:8000/api';

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
        alert(mensaje); // Respaldo si no encuentran el div
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
            if (regModal) {
                regModal.style.display = 'flex';
                // Forzar la creación/ajuste del campo Apellido al abrir por primera vez
                const selectTipo = document.getElementById('registerUserType');
                if (selectTipo) selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
            }
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
            
            const usuario = document.getElementById("loginCorreo")?.value || document.getElementById("correo")?.value;
            const clave = document.getElementById("loginPassword")?.value || document.getElementById("password")?.value;

            if (!usuario || !clave) {
                alert("Por favor, ingresa tu correo y contraseña.");
                return;
            }

            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            btnLogin.disabled = true;

            try {
                // Usamos la ruta original /token/ que devuelve el access, refresh y tipo
                const response = await fetch(`${API_URL_AUTH}/token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usuario, password: clave })
                });

                const data = await response.json();

                if (response.ok) {
                    const rolDetectado = data.rol || data.tipo || "candidato"; 

                    localStorage.setItem('auth_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('user_type', rolDetectado);

                    if(modalLogin) modalLogin.style.display = "none";
                    actualizarMenuNavegacion();

                    // Redirecciones
                    if (rolDetectado === "candidato") window.location.href = "/html/PCandidato.html";
                    else if (rolDetectado === "empresa") window.location.href = "/html/PEmpresa.html";
                    else if (rolDetectado === "admin") window.location.href = "/html/admin.html";
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

        // --- 4. LÓGICA DE REGISTRO CON NUEVAS VALIDACIONES ---
        if (e.target.closest('#btnRegister')) {
            e.preventDefault();
            const btnRegister = e.target.closest('#btnRegister');
            
            // Recolectar datos
            const tipo = document.getElementById('registerUserType')?.value;
            const nombre = document.getElementById('regNombre')?.value.trim();
            const correo = document.getElementById('regCorreo')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
            
            // Obtener el apellido (si es candidato, lo leemos; si es empresa, lo ignoramos)
            const apellidoInput = document.getElementById('regApellido');
            const apellido = apellidoInput && apellidoInput.closest('.form-group-reg').style.display !== 'none' 
                                ? apellidoInput.value.trim() 
                                : '';

            // Limpiar alerta previa
            const alertError = document.getElementById('regAlertError');
            if (alertError) alertError.style.display = 'none';

            // VALIDACIÓN 1: Campos vacíos (Exigimos el apellido si es candidato)
            if (!nombre || !correo || !password || !passwordConfirm || (tipo === 'candidato' && !apellido)) {
                return mostrarErrorRegistro("Por favor, completa todos los campos obligatorios.");
            }

            // VALIDACIÓN 2: Contraseñas no coinciden
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
                    apellido: apellido, // SE ENVÍA EL APELLIDO AL BACKEND
                    email: correo 
                };

                const response = await fetch(`${API_URL_AUTH}/registro/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    // TRADUCTOR DE ERRORES: Capturar el error crudo de SQL y suavizarlo
                    const errorMsg = data.error ? data.error.toLowerCase() : '';
                    if (errorMsg.includes('unique') || errorMsg.includes('duplicate') || errorMsg.includes('violation')) {
                        throw new Error(`El correo "${correo}" ya se encuentra registrado. Por favor, intenta iniciar sesión.`);
                    }
                    throw new Error(data.error || "Ocurrió un error al registrar la cuenta.");
                }

                // Registro Exitoso
                alert("¡Cuenta creada exitosamente! Ya puedes iniciar sesión en ImpulsoNica.");
                
                if(regModal) regModal.style.display = 'none';
                
                // Limpiar formulario para el próximo uso
                document.getElementById('regNombre').value = '';
                if(apellidoInput) apellidoInput.value = '';
                document.getElementById('regCorreo').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regPasswordConfirm').value = '';

                // Abrimos automáticamente la ventana de login
                if (modalLogin) modalLogin.style.display = "flex";

            } catch (error) {
                mostrarErrorRegistro(error.message);
            } finally {
                btnRegister.textContent = "Registrarse";
                btnRegister.disabled = false;
            }
        }
    });
}

// =================================================================
// 4. BARRA DE NAVEGACIÓN Y PERFIL
// =================================================================
async function actualizarMenuNavegacion() {
    const token = localStorage.getItem('auth_token');
    const rol = localStorage.getItem('user_type');
    
    // Buscar dónde inyectar el menú
    const menuDestino = document.querySelector('.menu') || document.querySelector('.nav-links') || document.querySelector('.navbar');
    const linkLogin = document.getElementById('linkLogin');
    const btnOpenRegister = document.getElementById('btnOpenRegister');

    if (token && rol) {
        // Ocultar botones de login y registro si existen
        if (linkLogin) linkLogin.style.display = 'none';
        if (btnOpenRegister) btnOpenRegister.style.display = 'none';

        // Detectar si estamos en una página de perfil
        const isProfilePage = window.location.pathname.toLowerCase().includes('pcandidato.html') || 
                              window.location.pathname.toLowerCase().includes('pempresa.html') || 
                              window.location.pathname.toLowerCase().includes('admin.html');

        if (isProfilePage) {
            return; 
        } else if (menuDestino) {
            if (!document.getElementById('profileDropdownContainer')) {
                
                // Determinar rutas y etiquetas según el rol
                let profileLink = '/html/PCandidato.html';
                let roleName = 'Candidato';
                
                if (rol === 'admin') {
                    profileLink = '/html/admin.html';
                    roleName = 'Administrador';
                } else if (rol === 'empresa') {
                    profileLink = '/html/PEmpresa.html';
                    roleName = 'Empresa';
                }
                
                const defaultAvatar = "/imgn/cv.png"; 

                // Crear el contenedor del menú desplegable
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
                        <a href="${profileLink}"><i class="fas fa-user-circle"></i> Mi Perfil</a>
                        <a href="#" onclick="cerrarSesionApp(event)"><i class="fas fa-sign-out-alt"></i> Cerrar sesión</a>
                    </div>
                `;
                menuDestino.appendChild(profileDiv);

                try {
                    const response = await fetch(`${API_URL_AUTH}/mi-perfil/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

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
                    } else if (response.status === 404 || response.status === 401) {
                        // Limpiar sesión fantasma si la BD fue borrada
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