const API_URL = 'http://20.10.8.172:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    inicializarSubidaImagen();
});

const setTexto = (id, texto) => { 
    const el = document.getElementById(id); 
    if (el) el.textContent = texto; 
};

async function cargarDatosPerfil() {
    let token = localStorage.getItem('auth_token');
    if (!token) return window.location.href = "/index.html";

    try {
        const response = await fetch(`${API_URL}/mi-perfil/`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) throw new Error("No se pudo cargar el perfil.");
        
        const data = await response.json();
        
        if (data.tipo === 'admin' && data.datos) {
            setTexto('lblNombreAdmin', `${data.datos.nombre || ''} ${data.datos.apellido || ''}`.trim() || 'Super Administrador');
            setTexto('lblCorreo', data.datos.correo || '...');
            setTexto('lblTelefono', data.datos.telefono || 'No especificado');

            if (data.datos.foto_url) {
                document.getElementById('fotoPerfil').src = data.datos.foto_url.startsWith('http') ? data.datos.foto_url : `http://20.10.8.172:8000${data.datos.foto_url}`;
            }
        } else {
            // Si el usuario no es un administrador, lo sacamos de aquí por seguridad
            window.location.href = "/index.html";
        }
    } catch (error) { 
        console.error('Error:', error); 
    }
}

function inicializarSubidaImagen() {
    document.getElementById('btnCambiarFoto')?.addEventListener('click', () => document.getElementById('inputFoto').click());
    document.getElementById('inputFoto')?.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (ev) => { document.getElementById('fotoPerfil').src = ev.target.result; };
        reader.readAsDataURL(archivo);

        const formData = new FormData();
        formData.append('imagen', archivo); 
        try {
            // 👇 CORRECCIÓN AQUÍ: Barra estricta al final 👇
            const res = await fetch(`${API_URL}/upload-imagen/`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }, 
                body: formData 
            });
            if (!res.ok) throw new Error();
            alert("¡Foto de perfil actualizada!");
            cargarDatosPerfil(); 
        } catch (error) { alert("No se pudo subir la foto."); }
    });
}