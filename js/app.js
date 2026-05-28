/* ═══════════════════════════════════════════
   app.js — Gestión de Productos (index.html)
═══════════════════════════════════════════ */

let editando  = false;
let idEditar  = null;
let tabActual = 'activos';

// ── Inicialización ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setTab('activos');

    // Enter en campos → guardar
    ['modelo','precio','stock'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') guardar();
        });
    });
});

// ── Tabs ────────────────────────────────────
function setTab(tab) {
    tabActual = tab;

    // Mostrar / ocultar paneles
    document.getElementById('panel-productos').style.display = tab !== 'kardex' ? 'block' : 'none';
    document.getElementById('panel-kardex').style.display    = tab === 'kardex'  ? 'block' : 'none';
    document.getElementById('kardex-actions').style.display  = tab === 'kardex'  ? 'flex'  : 'none';

    // Actualizar clases de los botones de tab
    ['activos','papelera','kardex'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (!btn) return;
        btn.classList.toggle('active', t === tab);
    });

    // Cargar datos del tab
    if (tab === 'activos')  listar();
    if (tab === 'papelera') listarBajas();
    if (tab === 'kardex')   mostrarHistorialKardex();
}

// ── Utilidades ──────────────────────────────
function escaparHTML(t) {
    return String(t)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}

function showError(msg) {
    Swal.fire({ icon:'error',   title:'Error',    text:msg, background:'#1c1c2e', color:'#eaeaf4' });
}
function showWarn(msg) {
    Swal.fire({ icon:'warning', title:'Atención', text:msg, background:'#1c1c2e', color:'#eaeaf4' });
}
function showOk(msg) {
    Swal.fire({ icon:'success', title:'✓ Listo',  text:msg, timer:1600, showConfirmButton:false, background:'#1c1c2e', color:'#eaeaf4' });
}

function setLoading(tbodyId, cols) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${cols}">
        <div class="empty-state"><div class="empty-state-icon">⏳</div><p>Cargando...</p></div>
    </td></tr>`;
}

// ── Listar productos activos ─────────────────
function listar() {
    setLoading('tabla', 5);

    fetch('./php/producto.php?accion=listar', { credentials:'same-origin' })
    .then(r => r.json())
    .then(data => {
        const tbody = document.getElementById('tabla');
        if (data.error) { showError(data.mensaje); return; }

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5">
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <p>No hay productos activos</p>
                </div>
            </td></tr>`;
            return;
        }

        // Alertar si hay productos con stock bajo (solo una vez al cargar)
        const bajos = data.filter(p => Number(p.stock) <= 5);
        if (bajos.length) {
            Swal.fire({
                icon:'warning',
                title:'⚠ Stock bajo',
                html: bajos.map(p => `<b>${escaparHTML(p.modelo)}</b>: ${p.stock} ud.`).join('<br>'),
                background:'#1c1c2e',
                color:'#eaeaf4',
                confirmButtonColor:'#6c63ff'
            });
        }

        tbody.innerHTML = data.map(p => {
            const m = escaparHTML(p.modelo);
            const precio = Number(p.precio_actual).toFixed(2);
            const stock  = Number(p.stock);
            const stockBadge = stock <= 5
                ? `<span class="badge badge-red">${stock}</span>`
                : `<span class="badge badge-green">${stock}</span>`;

            return `<tr>
                <td style="color:var(--text3);font-size:12px">${p.id_producto}</td>
                <td style="font-weight:600">${m}</td>
                <td style="font-family:'Syne',sans-serif;font-weight:700;color:var(--accent2)">S/. ${precio}</td>
                <td>${stockBadge}</td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-warning btn-sm"
                            onclick="editar(${p.id_producto}, '${m}', ${p.precio_actual}, ${p.stock})">
                            ✏ Editar
                        </button>
                        <button class="btn btn-danger btn-sm"
                            onclick="eliminar(${p.id_producto}, '${m}')">
                            🗑 Eliminar
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    })
    .catch(() => showError('No se pudo conectar con el servidor'));
}

// ── Listar papelera ──────────────────────────
function listarBajas() {
    setLoading('tabla', 5);

    fetch('./php/producto.php?accion=listar&bajas=true', { credentials:'same-origin' })
    .then(r => r.json())
    .then(data => {
        const tbody = document.getElementById('tabla');
        if (data.error) { showError(data.mensaje); return; }

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5">
                <div class="empty-state">
                    <div class="empty-state-icon">🗑</div>
                    <p>La papelera está vacía</p>
                </div>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(p => `<tr>
            <td style="color:var(--text3);font-size:12px">${p.id_producto}</td>
            <td style="font-weight:600;color:var(--red)">
                <span style="text-decoration:line-through;opacity:0.7">${escaparHTML(p.modelo)}</span>
            </td>
            <td>S/. ${Number(p.precio_actual).toFixed(2)}</td>
            <td><span class="badge badge-amber">${p.stock}</span></td>
            <td>
                <button class="btn btn-success btn-sm" onclick="reactivar(${p.id_producto})">
                    ↩ Reactivar
                </button>
            </td>
        </tr>`).join('');
    })
    .catch(() => showError('No se pudo cargar la papelera'));
}

// ── Kardex ───────────────────────────────────
function mostrarHistorialKardex() {
    const buscar = encodeURIComponent((document.getElementById('buscar-kardex')?.value || '').trim());

    fetch(`./php/kardex_api.php?buscar=${buscar}`, { credentials:'same-origin' })
    .then(r => r.json())
    .then(data => {
        const tbody = document.getElementById('historial-kardex-container');
        if (data.error) { showError(data.mensaje); return; }

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="8">
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>Sin movimientos registrados</p>
                </div>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const tipoCls = item.tipo_movimiento === 'ENTRADA' ? 'badge-green'
                          : item.tipo_movimiento === 'SALIDA'  ? 'badge-red'
                          : 'badge-amber';
            return `<tr>
                <td style="color:var(--text3);font-size:12px">${item.id_kardex}</td>
                <td style="font-weight:600">${escaparHTML(item.modelo)}</td>
                <td><span class="badge badge-blue">${escaparHTML(item.accion)}</span></td>
                <td><span class="badge ${tipoCls}">${escaparHTML(item.tipo_movimiento)}</span></td>
                <td style="font-weight:700">${item.cantidad}</td>
                <td>${item.saldo_total}</td>
                <td style="font-family:'Syne',sans-serif;color:var(--accent2)">
                    S/. ${parseFloat(item.valor_unico_historico).toFixed(2)}
                </td>
                <td style="color:var(--text3);font-size:12px">${escaparHTML(item.fecha)}</td>
            </tr>`;
        }).join('');
    })
    .catch(() => showError('No se pudo cargar el kardex'));
}

// ── Guardar (insertar / actualizar) ──────────
function guardar() {
    const modelo = document.getElementById('modelo').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const stock  = parseInt(document.getElementById('stock').value);

    if (!modelo)               { showWarn('El campo Modelo es obligatorio');  return; }
    if (isNaN(precio) || precio <= 0) { showWarn('Ingresa un precio válido mayor a 0'); return; }
    if (isNaN(stock)  || stock  < 0) { showWarn('El stock no puede ser negativo');  return; }

    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ Guardando...';

    const accion = editando ? 'actualizar' : 'insertar';
    const datos  = { modelo, precio, stock };
    if (editando) datos.id = idEditar;

    fetch(`./php/producto.php?accion=${accion}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) { showError(res.mensaje); return; }
        showOk(res.mensaje);
        limpiar();
        listar();
    })
    .catch(() => showError('No se pudo guardar el producto'))
    .finally(() => {
        btnGuardar.disabled = false;
        btnGuardar.textContent = editando ? '💾 Actualizar' : '💾 Guardar';
    });
}

// ── Editar ────────────────────────────────────
function editar(id, modelo, precio, stock) {
    editando = true;
    idEditar = id;

    document.getElementById('modelo').value = modelo;
    document.getElementById('precio').value = precio;
    document.getElementById('stock').value  = stock;
    document.getElementById('form-title').textContent      = '✏ Editar Producto';
    document.getElementById('btn-guardar').textContent     = '💾 Actualizar';
    document.getElementById('btn-cancelar').style.display  = '';
    document.getElementById('modelo').focus();

    // Scroll al formulario
    document.querySelector('.card').scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── Limpiar formulario ────────────────────────
function limpiar() {
    editando = false;
    idEditar = null;
    ['modelo','precio','stock'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('form-title').textContent     = '➕ Nuevo Producto';
    document.getElementById('btn-guardar').textContent    = '💾 Guardar';
    document.getElementById('btn-cancelar').style.display = 'none';
    document.getElementById('btn-guardar').disabled = false;
}

// ── Eliminar (baja lógica) ────────────────────
function eliminar(id, nombre) {
    Swal.fire({
        title: '¿Eliminar producto?',
        html: `<b>${nombre}</b> se moverá a la papelera`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1c1c2e',
        color: '#eaeaf4',
        confirmButtonColor: '#f43f5e',
        cancelButtonColor: '#3a3a5a'
    })
    .then(r => {
        if (!r.isConfirmed) return;
        fetch('./php/producto.php?accion=eliminar', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        })
        .then(r => r.json())
        .then(res => {
            if (res.error) { showError(res.mensaje); return; }
            showOk('Producto eliminado');
            listar();
        })
        .catch(() => showError('No se pudo eliminar'));
    });
}

// ── Reactivar desde papelera ──────────────────
function reactivar(id) {
    fetch('./php/producto.php?accion=reactivar', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) { showError(res.mensaje); return; }
        showOk('Producto reactivado');
        listarBajas();
    })
    .catch(() => showError('No se pudo reactivar'));
}
