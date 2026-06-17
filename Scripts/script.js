const API_URL = 'http://20.10.8.172:8000/api';

document.addEventListener('DOMContentLoaded', async () => {

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

    // 4. Ajustar la vista dependiendo de si es Empresa o Candidato
    ajustarVistaPorRol();
});

// --- FUNCIÓN PARA OCULTAR ELEMENTOS SEGÚN EL ROL ---
function ajustarVistaPorRol() {
    // Usamos un intervalo para dar tiempo a que auth.js termine de reconstruir el menú
    const comprobacion = setInterval(() => {
        // Leemos las variables de sesión (cubrimos varios nombres por seguridad)
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access');
        const userType = localStorage.getItem('user_type') || localStorage.getItem('tipo_usuario') || localStorage.getItem('rol') || localStorage.getItem('tipo');
        
        // Extraemos todos los enlaces del menú
        const menuLinks = Array.from(document.querySelectorAll('.menu a'));
        
        // Sabemos que está logueado si hay token o si auth.js dibujó el botón "Cerrar sesión"
        const estaLogueado = token || menuLinks.some(a => a.textContent.toLowerCase().includes('cerrar sesi'));

        // Buscamos directamente por la clase CSS original, es infalible
        const seccionCuentas = document.querySelector('.crearcuentas');

        // Identificar los enlaces de Buscar y Publicar (por ID o por texto)
        let linkBuscar = document.getElementById('navBuscarEmpleo') || menuLinks.find(a => a.textContent.toLowerCase().includes('buscar empleo'));
        let linkPublicar = document.getElementById('navPublicarVacante') || menuLinks.find(a => a.textContent.toLowerCase().includes('publicar vacante'));

        if (estaLogueado) {
            // 1. Ocultar las tarjetas gigantes si YA inició sesión
            if (seccionCuentas) {
                seccionCuentas.style.display = 'none';
                
                // Subimos la cuadrícula para que no quede un hueco en blanco
                const gridRecientes = document.querySelector('.section-grid');
                if (gridRecientes) {
                    gridRecientes.style.marginTop = '2rem';
                }
            }

            // 2. Ocultar opciones según el rol (estando logueado)
            if (userType === 'candidato') {
                if (linkPublicar) linkPublicar.style.display = 'none';
            } else if (userType === 'empresa') {
                if (linkBuscar) linkBuscar.style.display = 'none';
            }
        } else {
            // 3. SI NO ESTÁ LOGUEADO: Ocultar ambas opciones
            if (linkBuscar) linkBuscar.style.display = 'none';
            if (linkPublicar) linkPublicar.style.display = 'none';
        }

    }, 100); // Se ejecuta rapidísimo cada 100ms

    // Detenemos la búsqueda después de 2 segundos para liberar memoria
    setTimeout(() => clearInterval(comprobacion), 2000);
}
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