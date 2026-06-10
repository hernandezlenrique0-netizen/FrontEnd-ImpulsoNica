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

// --- FUNCIÓN 4: Cambiar barra de navegación si hay sesión ---
function actualizarMenuNavegacion() {
    const token = localStorage.getItem('auth_token');
    const rol = localStorage.getItem('user_type');
    
    const menuDestino = document.querySelector('.menu') || document.querySelector('.nav-links');
    const linkLogin = document.getElementById('linkLogin');
    const btnOpenRegister = document.getElementById('btnOpenRegister');

    if (token && rol && menuDestino) {
        if (linkLogin) linkLogin.style.display = 'none';
        if (btnOpenRegister) btnOpenRegister.style.display = 'none';

        if (!document.getElementById('linkMiPerfil')) {
            const linkPerfil = document.createElement('a');
            linkPerfil.id = 'linkMiPerfil';
            linkPerfil.className = 'btn-primary'; 
            
            if (rol === 'admin') {
                linkPerfil.href = '/html/admin.html';
                linkPerfil.innerText = 'Panel Admin';
            } else if (rol === 'candidato') {
                linkPerfil.href = '/html/PCandidato.html';
                linkPerfil.innerText = 'Mi Perfil';
            } else if (rol === 'empresa') {
                linkPerfil.href = '/html/PEmpresa.html';
                linkPerfil.innerText = 'Mi Empresa';
            }
            menuDestino.appendChild(linkPerfil);

            const linkLogout = document.createElement('a');
            linkLogout.id = 'linkLogout';
            linkLogout.href = '#';
            linkLogout.innerText = 'Cerrar sesión';
            linkLogout.style.color = '#dc3545';
            linkLogout.style.fontWeight = 'bold';
            linkLogout.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_type');
                window.location.href = '/index.html';
            };
            menuDestino.appendChild(linkLogout);
        }
    }
}