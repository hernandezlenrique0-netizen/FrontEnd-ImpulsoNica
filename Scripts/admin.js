const API_URL_DASHBOARD = 'http://127.0.0.1:8000/api/dashboard';

document.addEventListener('DOMContentLoaded', () => {
    inicializarTabs();
    cargarDatosDashboard();
});

function inicializarTabs() {
    const botones = document.querySelectorAll('.tab-btn');
    const pestanas = document.querySelectorAll('.tab-pane');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            botones.forEach(b => b.classList.remove('active'));
            pestanas.forEach(p => p.classList.remove('active'));
            boton.classList.add('active');
            const idPanel = boton.getAttribute('data-tab');
            document.getElementById(idPanel).classList.add('active');
        });
    });
}

async function cargarDatosDashboard() {
    const token = localStorage.getItem('auth_token');
    if (!token) return window.location.replace('/index.html');

    try {
        const response = await fetch(`${API_URL_DASHBOARD}/metricas-ofertas/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.status === 401 || response.status === 403) {
            alert("No tienes permisos para ver el Data Warehouse.");
            return window.location.replace('/index.html');
        }

        if (!response.ok) throw new Error("Error al cargar los datos del DW");

        const data = await response.json();
        
        // Cargar KPIs
        actualizarKPIs(data.ofertas_por_sector);

        // Dibujar Básicos
        dibujarGraficaSectores(data.ofertas_por_sector);
        dibujarGraficaUbicaciones(data.ofertas_por_ubicacion);
        if (data.ofertas_por_mes) dibujarGraficaMeses(data.ofertas_por_mes);
        if (data.ofertas_por_modalidad) dibujarGraficaModalidad(data.ofertas_por_modalidad);

        // Dibujar Nuevos Avanzados
        if (data.top_empresas) dibujarTopEmpresas(data.top_empresas);
        if (data.tipos_empleo) dibujarTiposEmpleo(data.tipos_empleo);
        if (data.salarios_sector) dibujarSalariosSector(data.salarios_sector);
        if (data.dias_abierta) dibujarTiemposCierre(data.dias_abierta);
        if (data.requisitos_sector) dibujarRequisitos(data.requisitos_sector);

    } catch (error) {
        console.error("Error en el Dashboard:", error);
        document.getElementById('kpiVacantes').innerHTML = '<i class="fas fa-exclamation-triangle" style="color:red; font-size:2rem;"></i>';
    }
}

function actualizarKPIs(datosSector) {
    let totalVacantes = 0, totalPostulaciones = 0, sumaSalarios = 0, contSalarios = 0;
    datosSector.forEach(item => {
        totalVacantes += item.total_vacantes || 0;
        totalPostulaciones += item.total_postulaciones || 0;
        if (item.salario_promedio) { sumaSalarios += parseFloat(item.salario_promedio); contSalarios++; }
    });
    const salarioGlobal = contSalarios > 0 ? (sumaSalarios / contSalarios).toFixed(2) : 0;
    document.getElementById('kpiVacantes').textContent = totalVacantes;
    document.getElementById('kpiPostulaciones').textContent = totalPostulaciones;
    document.getElementById('kpiSalario').textContent = `C$ ${salarioGlobal}`;
}

// --- GRÁFICOS BÁSICOS ---
function dibujarGraficaSectores(datos) {
    const ctx = document.getElementById('graficaSectores').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(i => i.sectorkey__nombresector || 'Sin Sector'),
            datasets: [
                { label: 'Vacantes', data: datos.map(i => i.total_vacantes || 0), backgroundColor: 'rgba(0, 102, 213, 0.7)' },
                { label: 'Postulaciones', data: datos.map(i => i.total_postulaciones || 0), backgroundColor: 'rgba(40, 167, 69, 0.7)' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarGraficaUbicaciones(datos) {
    const ctx = document.getElementById('graficaUbicaciones').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.map(i => i.ubicacionkey__departamento || 'Sin Depto'),
            datasets: [{ data: datos.map(i => i.total_vacantes || 0), backgroundColor: ['#0f2b5d', '#0066d5', '#4ea8de', '#56cfe1', '#64dfdf', '#72efdd'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarGraficaMeses(datos) {
    const ctx = document.getElementById('graficaMeses').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.map(i => i.tiempopublicacionkey__nombremes || 'Mes'),
            datasets: [{ label: 'Vacantes por Mes', data: datos.map(i => i.total_vacantes || 0), borderColor: '#0066d5', backgroundColor: 'rgba(0,102,213,0.2)', fill: true, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarGraficaModalidad(datos) {
    const ctx = document.getElementById('graficaModalidad').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: datos.map(i => i.empleokey__modalidad || 'N/A'),
            datasets: [{ data: datos.map(i => i.total_vacantes || 0), backgroundColor: ['#28a745', '#ffc107', '#17a2b8', '#6c757d'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- NUEVOS GRÁFICOS AVANZADOS ---

function dibujarTopEmpresas(datos) {
    const ctx = document.getElementById('graficaEmpresas').getContext('2d');
    new Chart(ctx, {
        type: 'bar', // Gráfico de barras horizontales
        data: {
            labels: datos.map(i => i.empresakey__nombreempresa || 'Confidencial'),
            datasets: [{ label: 'Total Vacantes', data: datos.map(i => i.total_vacantes || 0), backgroundColor: '#0f2b5d' }]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' } // indexAxis 'y' las hace horizontales
    });
}

function dibujarTiposEmpleo(datos) {
    const ctx = document.getElementById('graficaTipos').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.map(i => i.empleokey__tipoempleo || 'No Especificado'),
            datasets: [{ data: datos.map(i => i.total_vacantes || 0), backgroundColor: ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarSalariosSector(datos) {
    const ctx = document.getElementById('graficaSalarios').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(i => i.sectorkey__nombresector || 'Sin Sector'),
            datasets: [{ label: 'Salario Promedio (C$)', data: datos.map(i => parseFloat(i.promedio_salario || 0).toFixed(2)), backgroundColor: '#2a9d8f' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarTiemposCierre(datos) {
    const ctx = document.getElementById('graficaTiempos').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.map(i => i.sectorkey__nombresector || 'Sin Sector'),
            datasets: [{ label: 'Días promedio para llenar vacante', data: datos.map(i => parseFloat(i.promedio_dias || 0).toFixed(1)), backgroundColor: '#e76f51' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dibujarRequisitos(datos) {
    const ctx = document.getElementById('graficaRequisitos').getContext('2d');
    new Chart(ctx, {
        type: 'polarArea', // Gráfico polar (muy elegante para medir niveles de algo)
        data: {
            labels: datos.map(i => i.sectorkey__nombresector || 'Sin Sector'),
            datasets: [{ label: 'Promedio de Requisitos', data: datos.map(i => parseFloat(i.promedio_requisitos || 0).toFixed(1)), backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}