// URL base de tu API en Django (Ajustado para incluir /api)
const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica del Menú Hamburguesa
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 2. Efecto Tilt y Animaciones de Scroll (Global)
    inicializarAnimaciones();

    // 3. Cargar Empleos Públicos al Iniciar (Específico de index.html)
    const contenedorOfertas = document.querySelector('.ofertasRecientes');
    if (contenedorOfertas) {
        cargarEmpleosRecientes();
    }

});

function toggleMenu() {
    const menu = document.querySelector('.menu');
    if(menu) menu.classList.toggle('show');
}

function inicializarAnimaciones() {
    const interactiveSections = document.querySelectorAll('.interactive-section');
    const cards = document.querySelectorAll('.interactive-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });

    const observerOptions = { threshold: 0.2 };
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    interactiveSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out, box-shadow 0.5s ease';
        scrollObserver.observe(section);
    });
}

// -------------------------------------------------------------
// CONEXIÓN CON LA API: CARGAR EMPLEOS RECIENTES (Inicio)
// -------------------------------------------------------------
async function cargarEmpleosRecientes() {
    const contenedorOfertas = document.querySelector('.ofertasRecientes');
    
    // 1. Mostrar estado de carga y ocultar los datos estáticos del HTML
    contenedorOfertas.innerHTML = `
        <div style="text-align: center; width: 100%; padding: 3rem;">
            <p style="color: #0066d5; font-weight: bold; font-size: 1.2rem;">Cargando vacantes recientes... ⏳</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/empleos/`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        contenedorOfertas.innerHTML = ''; // Limpiamos el mensaje de carga

        const empleosMostrar = data.slice(0, 3); // Solo 3 recientes

        if (empleosMostrar.length === 0) {
            contenedorOfertas.innerHTML = '<p>No hay vacantes disponibles en este momento.</p>';
            return;
        }

        empleosMostrar.forEach(empleo => {
            // 2. Solución al [object Object]: Extraemos el nombre correcto
            let nombreEmpresa = "Empresa Desconocida";
            if (typeof empleo.empresaid === 'object' && empleo.empresaid !== null) {
                // Si la API mandó el objeto completo (depth = 1)
                nombreEmpresa = empleo.empresaid.nombreempresa || empleo.empresaid.NombreEmpresa || `Empresa ID: ${empleo.empresaid.empresaid}`;
            } else {
                // Si la API manda solo el ID numérico
                nombreEmpresa = `Empresa ID: ${empleo.empresaid}`;
            }

            const tarjetaHTML = `
                <div class="card">
                    <div class="card-body">
                        <div class="card-header">
                            <h3 class="card-titles">${empleo.nombreempleo}</h3>
                            <a href="/html/DesEmpleo.html?id=${empleo.empleoid}" class="btn-action">Ver</a>
                        </div>
                        <div class="job-meta">
                            <span><img src="imgn/CompanyA.webp" class="imgs" alt="Empresa"> ${nombreEmpresa}</span>
                            <span><img src="imgn/LocationA.webp" class="imgs" alt="Salario"> Salario: C$ ${empleo.salario || 'A convenir'}</span>
                        </div>
                    </div>
                </div>
            `;
            contenedorOfertas.innerHTML += tarjetaHTML;
        });

    } catch (error) {
        console.error('Error al hacer fetch:', error);
        contenedorOfertas.innerHTML = `
            <div style="text-align: center; color: #0f2b5d; padding: 2rem; border: 1px dashed #0066d5; border-radius: 12px; margin-top: 1rem;">
                <h4 style="margin-bottom: 10px; color: #dc3545;">¡Sin conexión con el servidor! 🔌</h4>
                <p>Por favor, asegúrate de tener la API encendida ejecutando: <br><br><code style="background: #e7eefc; padding: 5px 10px; border-radius: 5px;">python manage.py runserver</code></p>
            </div>
        `;
    }
}

// -------------------------------------------------------------
// LÓGICA DE MODALES (Global para todas las páginas que lo incluyan)
// -------------------------------------------------------------
const modalLogin = document.getElementById("loginModal");
const linkLogin = document.getElementById("linkLogin");
const btnLogin = document.getElementById("btnLogin");
const spanClose = document.querySelector(".close");

if(linkLogin && modalLogin && spanClose) {
    linkLogin.onclick = (e) => { e.preventDefault(); modalLogin.style.display = "flex"; }
    spanClose.onclick = () => { modalLogin.style.display = "none"; }
    window.addEventListener('click', (e) => { if (e.target == modalLogin) modalLogin.style.display = "none"; });
}

if(btnLogin){
    btnLogin.addEventListener("click", async function () {
        const tipo = document.getElementById("userType").value;
        const usuario = document.getElementById("correo").value;
        const clave = document.getElementById("password").value;

        btnLogin.innerText = "Iniciando...";
        btnLogin.disabled = true;

        try {
            const response = await fetch(`${API_URL}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usuario, password: clave })
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Inicio de sesión exitoso!");
                localStorage.setItem('auth_token', data.access);
                localStorage.setItem('user_type', tipo);

                if (tipo === "candidato") window.location.href = "/html/PCandidato.html";
                else if (tipo === "empresa") window.location.href = "/html/PEmpresa.html";
                else if (tipo === "admin") window.location.href = "/html/admin.html";
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
    });
}

