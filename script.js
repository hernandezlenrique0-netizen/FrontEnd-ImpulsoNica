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
    new Chart(document.getElementById('salariosSector'), {
        type: 'bar',
        data: {
            labels: ['Tecnología y Sistemas', 'Construcción', 'Call Center y BPO', 'Salud y Medicina', 'Banca y Finanzas', 'Comercio y Retail'],
            datasets: [{
                label: 'Salario Promedio ($)',
                data: [1501, 1025, 929, 871, 863, 590],
                backgroundColor: '#007bff'
            }]
        },
        options: {
            indexAxis: 'y'
        }
    });

    // 2. Eficiencia: Días para cerrar vacantes
    new Chart(document.getElementById('eficienciaVacantes'), {
        type: 'bar',
        data: {
            labels: ['Managua', 'Masaya', 'León', 'Estelí', 'Granada', 'Matagalpa'],
            datasets: [{
                label: 'Días promedio',
                data: [25, 26, 27, 29, 30, 34],
                backgroundColor: '#28a745'
            }]
        }
    });

    // 3. Distribución de Vacantes por Modalidad
    new Chart(document.getElementById('vacantesModalidad'), {
        type: 'pie',
        data: {
            labels: ['Remoto', 'Híbrido', 'Presencial'],
            datasets: [{
                data: [30.8, 35.6, 33.6],
                backgroundColor: ['#17a2b8', '#ffc107', '#6f42c1']
            }]
        }
    });

    // 4. Tendencia de Publicación por Mes
    new Chart(document.getElementById('tendenciaMeses'), {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Noviembre', 'Diciembre'],
            datasets: [{
                label: 'Cantidad de Vacantes',
                data: [40, 55, 70, 65, 80, 95],
                borderColor: '#dc3545',
                fill: false,
                tension: 0.3
            }]
        }
    });


});
