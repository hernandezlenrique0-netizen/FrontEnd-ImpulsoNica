document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica del Menú Hamburguesa
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Seleccionamos las secciones que queremos animar
    const interactiveSections = document.querySelectorAll('.interactive-section');
    const cards = document.querySelectorAll('.interactive-card');

    // 2. Efecto Tilt (Inclinación 3D) en tarjetas de números
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

        // Restaurar cuando el ratón sale
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        // Quitar la transición durante el movimiento
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });

    // 3. Animación de "Fade-in Up" al hacer scroll
    const observerOptions = {
        threshold: 0.2 // Se activa cuando el 20% es visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Preparar las secciones
    interactiveSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out, box-shadow 0.5s ease';
        scrollObserver.observe(section);
    });
});
function toggleMenu() {
    document.querySelector('.menu').classList.toggle('show');
}

//funcion para el modal de login
const modal = document.getElementById("loginModal");
const link = document.getElementById("linkLogin");
const span = document.querySelector(".close");

link.onclick = function (event) {
    event.preventDefault(); // evita que el ancla recargue la página
    modal.style.display = "flex"; //flex para centrar
}

span.onclick = function () {
    modal.style.display = "none"; // cierra el modal
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none"; // cierra si clic fuera
    }
}
document.getElementById("btnLogin").addEventListener("click", function () {
    const tipo = document.getElementById("userType").value;
    const usuario = document.getElementById("correo").value;
    const clave = document.getElementById("password").value;

    //tipo de usuario
    if (tipo === "candidato") {
        alert("Bienvenido candidato: " + usuario);
        //candidatos
        window.location.href = "/html/PCandidato.html";
    } else if (tipo === "empresa") {
        alert("Bienvenida empresa: " + usuario);
        //empresas
        window.location.href = "/html/PEmpresa.html";
    } else if (tipo === "admin") {
        alert("Bienvenido administrador: " + usuario);
        //administrador
        window.location.href = "/html/admin.html";
    }
});

//modal de registro empresa y candidato
// Referencias al modal y elementos
const registerModal = document.getElementById("registerModal");
const btnOpenRegister = document.getElementById("btnOpenRegister"); // enlace "Regístrate"
const closeRegister = registerModal.querySelector(".close");
const btnRegister = document.getElementById("btnRegister");

// Mostrar fecha actual en ambos formularios
const hoy = new Date().toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});
document.getElementById("fechaCandidato").textContent = hoy;
document.getElementById("fechaEmpresa").textContent = hoy;

// Abrir modal al tocar el enlace
btnOpenRegister.onclick = function (event) {
    event.preventDefault();
    registerModal.style.display = "flex";
};

// Cerrar modal con la X
closeRegister.onclick = function () {
    registerModal.style.display = "none";
};

// Cerrar modal si se hace clic fuera
window.onclick = function (event) {
    if (event.target === registerModal) {
        registerModal.style.display = "none";
    }
};

// Alternar campos según tipo de usuario
const userTypeSelect = document.getElementById("registerUserType");
const candidatoFields = document.getElementById("candidatoFields");
const empresaFields = document.getElementById("empresaFields");

userTypeSelect.onchange = function () {
    if (userTypeSelect.value === "empresa") {
        candidatoFields.style.display = "none";
        empresaFields.style.display = "block";
    } else {
        candidatoFields.style.display = "block";
        empresaFields.style.display = "none";
    }
};

// Capturar datos al presionar "Registrarse"
btnRegister.onclick = function () {
    const userType = userTypeSelect.value;

    if (userType === "candidato") {
        // Datos de candidato
        const nombre = document.getElementById("nombre").value;
        const apellido = document.getElementById("apellido").value;
        const email = document.getElementById("Email").value;
        const telefono = document.getElementById("telefono").value;
        const direccion = document.getElementById("direccion").value;
        const genero = document.getElementById("genero").value;
        const fechaNacimiento = document.getElementById("fechaNacimiento").value;
        const nacionalidad = document.getElementById("nacionalidad").value;
        const municipio = document.getElementById("municipio").value;
        const contraseña = document.getElementById("contraseña").value;
        const curriculum = document.getElementById("curriculum").files[0];

        console.log({
            tipo: "candidato",
            nombre,
            apellido,
            email,
            telefono,
            direccion,
            genero,
            fechaNacimiento,
            nacionalidad,
            municipio,
            contraseña,
            curriculum
        });

        alert("Registro de candidato: " + nombre + " " + apellido);
    } else {
        // Datos de empresa
        const empresaNombre = document.getElementById("empresaNombre").value;
        const tipoempresa = document.getElementById("tipoempresa").value;
        const empresaSector = document.getElementById("empresaSector").value;
        const empresaEmail = document.getElementById("empresaEmail").value;
        const empresaTelefono = document.getElementById("empresaTelefono").value;
        const empresaDireccion = document.getElementById("empresaDireccion").value;
        const empresaMunicipio = document.getElementById("empresaMunicipio").value;
        const empresaContraseña = document.getElementById("empresaContraseña").value;

        console.log({
            tipo: "empresa",
            empresaNombre,
            tipoempresa,
            empresaSector,
            empresaEmail,
            empresaTelefono,
            empresaDireccion,
            empresaMunicipio,
            empresaContraseña
        });

        alert("Registro de empresa: " + empresaNombre + " (" + empresaEmail + ")");
    }
};
