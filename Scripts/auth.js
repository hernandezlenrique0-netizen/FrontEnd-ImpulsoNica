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
            if (regModal) regModal.style.display = 'flex';
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
            
            const usuario = document.getElementById("correo").value;
            const clave = document.getElementById("password").value;

            if (!usuario || !clave) {
                alert("Por favor, ingresa tu correo y contraseña.");
                return;
            }

            btnLogin.innerText = "Iniciando...";
            btnLogin.disabled = true;

            try {
                const response = await fetch(`${API_URL_AUTH}/token/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usuario, password: clave })
                });

                const data = await response.json();

                if (response.ok) {
                    const rolDetectado = data.rol || "candidato"; 

                    localStorage.setItem('auth_token', data.access);
                    localStorage.setItem('user_type', rolDetectado);

                    alert("¡Inicio de sesión exitoso!");
                    if(modalLogin) modalLogin.style.display = "none";
                    actualizarMenuNavegacion();

                    if (rolDetectado === "candidato") window.location.href = "/html/PCandidato.html";
                    else if (rolDetectado === "empresa") window.location.href = "/html/PEmpresa.html";
                    else if (rolDetectado === "admin") window.location.href = "/html/admin.html";

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
                });

                const data = await response.json();

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
                btnRegister.disabled = false;
            }
        }
    });
}

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
                } else if (rol === 'empresa') {
                    profileLink = '/html/PEmpresa.html';
                    roleName = 'Empresa';
                }
                
                const defaultAvatar = "/imgn/cv.png"; 

                // Crear el contenedor del menú desplegable (Avatar + Menú oculto)
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
                    }
                } catch (error) {
                    console.error("Error obteniendo datos del perfil para el navbar:", error);
                }
            }
        }
    }
}

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
    }
});