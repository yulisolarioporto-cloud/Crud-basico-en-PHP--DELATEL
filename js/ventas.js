/* ═══════════════════════════════════════════
   ventas.js — Punto de Venta (ventas.html)
═══════════════════════════════════════════ */

let paginaActual      = 1;
let terminoBusqueda   = '';
let carritoDeCompras  = [];
let buscadorTimer     = null;

const PLACEHOLDER = 'https://placehold.co/160x130/1c1c2e/6c63ff?text=Sin+Imagen';

// ── Inicialización ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    solicitarProductos();

    // Atajos de teclado
    document.addEventListener('keydown', e => {
        // Ctrl/Cmd + Enter → registrar venta
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            enviarVentaAlServidor();
        }
        // Escape → limpiar búsqueda
        if (e.key === 'Escape' && document.activeElement.id === 'txt-buscador') {
            document.getElementById('txt-buscador').value = '';
            filtrarProductos();
        }
    });
});

// ── Escape HTML ──────────────────────────────
function escHTML(t) {
    return String(t)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}

// ── Cargar productos del servidor ────────────
function solicitarProductos() {
    const grid = document.getElementById('contenedor-grid');
    grid.innerHTML = `<div style="grid-column:1/-1">
        <div class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <p>Cargando productos...</p>
        </div>
    </div>`;

    const url = `./php/ventas_api.php?accion=listar_paginado&pagina=${paginaActual}&buscar=${encodeURIComponent(terminoBusqueda)}`;

    fetch(url, { credentials: 'same-origin' })
    .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    })
    .then(data => {
        if (data.error) {
            grid.innerHTML = `<div style="grid-column:1/-1">
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p style="color:var(--red)">${escHTML(data.mensaje)}</p>
                </div>
            </div>`;
            return;
        }
        renderProductos(data.productos || []);
        renderPaginacion(data.pagina_actual || 1, data.total_paginas || 1);
    })
    .catch(err => {
        console.error('Error al cargar productos:', err);
        grid.innerHTML = `<div style="grid-column:1/-1">
            <div class="empty-state">
                <div class="empty-state-icon">🔌</div>
                <p style="color:var(--red)">No se pudo conectar con el servidor</p>
                <button class="btn btn-ghost btn-sm" onclick="solicitarProductos()" style="margin-top:10px">
                    🔄 Reintentar
                </button>
            </div>
        </div>`;
    });
}

// ── Renderizar tarjetas de producto ──────────
function renderProductos(lista) {
    const grid = document.getElementById('contenedor-grid');

    if (!lista.length) {
        grid.innerHTML = `<div style="grid-column:1/-1">
            <div class="empty-state">
                <div class="empty-state-icon">🔎</div>
                <p>No se encontraron productos</p>
                ${terminoBusqueda ? `<button class="btn btn-ghost btn-sm" onclick="limpiarBusqueda()" style="margin-top:8px">Limpiar búsqueda</button>` : ''}
            </div>
        </div>`;
        return;
    }

    grid.innerHTML = lista.map(item => {
        const imgSrc = item.imagen ? `./${item.imagen}` : PLACEHOLDER;
        const enCarrito = carritoDeCompras.find(i => i.id === parseInt(item.id_producto));
        const cantEnCarrito = enCarrito ? enCarrito.cantidad : 0;
        const stockDisp = parseInt(item.stock) - cantEnCarrito;
        const agotado = stockDisp <= 0;
        const stockBajo = parseInt(item.stock) <= 5;

        return `
        <div class="prod-card ${agotado ? 'sin-stock' : ''}"
            onclick="agregarAlCarrito(${item.id_producto}, '${escHTML(item.modelo)}', ${item.precio}, ${item.stock}, '${imgSrc}')"
            title="${agotado ? 'Sin stock disponible' : 'Clic para agregar al carrito'}">
            <img class="prod-img" src="${imgSrc}" alt="${escHTML(item.modelo)}"
                onerror="this.src='${PLACEHOLDER}'">
            ${cantEnCarrito > 0 ? `<div style="position:absolute;top:8px;right:8px;background:var(--accent);color:#fff;border-radius:99px;padding:2px 8px;font-size:11px;font-weight:700;box-shadow:0 2px 8px var(--accent-glow)">${cantEnCarrito}</div>` : ''}
            <div class="prod-body">
                <div class="prod-name">${escHTML(item.modelo)}</div>
                <div class="prod-price">S/. ${parseFloat(item.precio).toFixed(2)}</div>
                <div class="prod-stock-badge ${stockBajo ? 'low' : ''}">
                    ${agotado ? '🚫 Agotado' : `Stock: ${item.stock}${cantEnCarrito > 0 ? ` (${stockDisp} disp.)` : ''}`}
                </div>
                <button class="prod-add-btn" ${agotado ? 'disabled' : ''}>
                    ${agotado ? 'Sin stock' : '+ Agregar'}
                </button>
            </div>
        </div>`;
    }).join('');
}

// ── Paginación ───────────────────────────────
function renderPaginacion(actual, total) {
    const wrap = document.getElementById('contenedor-paginas');
    if (total <= 1) { wrap.innerHTML = ''; return; }

    let html = `<button class="page-btn" onclick="irAPagina(${actual-1})" ${actual<=1?'disabled':''}>‹</button>`;

    // Mostrar máx 7 páginas
    const rango = 3;
    let ini = Math.max(1, actual - rango);
    let fin = Math.min(total, actual + rango);
    if (ini > 1) html += `<button class="page-btn" onclick="irAPagina(1)">1</button><span style="padding:0 4px;color:var(--text3)">…</span>`;
    for (let i = ini; i <= fin; i++) {
        html += `<button class="page-btn ${i===actual?'active':''}" onclick="irAPagina(${i})">${i}</button>`;
    }
    if (fin < total) html += `<span style="padding:0 4px;color:var(--text3)">…</span><button class="page-btn" onclick="irAPagina(${total})">${total}</button>`;
    html += `<button class="page-btn" onclick="irAPagina(${actual+1})" ${actual>=total?'disabled':''}>›</button>`;

    wrap.innerHTML = html;
}

function irAPagina(n) {
    paginaActual = n;
    solicitarProductos();
    document.querySelector('.pos-grid-wrap').scrollTop = 0;
}

// ── Búsqueda con debounce ────────────────────
function filtrarProductos() {
    clearTimeout(buscadorTimer);
    buscadorTimer = setTimeout(() => {
        terminoBusqueda = document.getElementById('txt-buscador').value.trim();
        paginaActual = 1;
        solicitarProductos();
    }, 300);
}

function limpiarBusqueda() {
    document.getElementById('txt-buscador').value = '';
    terminoBusqueda = '';
    paginaActual = 1;
    solicitarProductos();
}

// ── Carrito ───────────────────────────────────
function agregarAlCarrito(id, modelo, precio, stock, imagen) {
    const idNum = parseInt(id);
    const existente = carritoDeCompras.find(i => i.id === idNum);

    if (existente) {
        if (existente.cantidad < parseInt(stock)) {
            existente.cantidad++;
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Stock máximo',
                text: `Solo hay ${stock} unidades disponibles de este producto`,
                background: '#1c1c2e',
                color: '#eaeaf4',
                confirmButtonColor: '#6c63ff'
            });
            return;
        }
    } else {
        carritoDeCompras.push({
            id: idNum,
            modelo,
            precio: parseFloat(precio),
            stock: parseInt(stock),
            cantidad: 1,
            imagen
        });
    }

    renderCarrito();
    // Actualizar tarjeta del producto para mostrar contador
    renderProductos(obtenerProductosActuales());
}

// Guarda referencia a los productos actuales del grid para re-renderizar
let _productosActuales = [];
function obtenerProductosActuales() { return _productosActuales; }

// Patch: guardar lista al renderizar
const _renderProductosOriginal = renderProductos;
// eslint-disable-next-line no-global-assign
// (Usamos una técnica distinta — guardamos la lista después de fetch)

function cambiarCantidad(id, delta) {
    const item = carritoDeCompras.find(i => i.id === id);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
        quitarDelCarrito(id);
        return;
    }
    if (nueva > item.stock) {
        Swal.fire({ icon:'warning', title:'Stock máximo', text:`Solo hay ${item.stock} unidades disponibles`, background:'#1c1c2e', color:'#eaeaf4', confirmButtonColor:'#6c63ff' });
        return;
    }
    item.cantidad = nueva;
    renderCarrito();
}

function quitarDelCarrito(id) {
    carritoDeCompras = carritoDeCompras.filter(i => i.id !== id);
    renderCarrito();
}

// ── Calcular vuelto ───────────────────────────
function calcularVuelto() {
    const total   = parseFloat(document.getElementById('monto-total-carrito').innerText) || 0;
    const pagaCon = parseFloat(document.getElementById('txt-paga-con').value)            || 0;
    const vuelto  = (pagaCon >= total && pagaCon > 0) ? (pagaCon - total) : 0;
    document.getElementById('monto-vuelto').innerText = vuelto.toFixed(2);

    // Colorear vuelto según si alcanza
    const vueltoEl = document.getElementById('monto-vuelto').parentElement;
    if (pagaCon > 0 && pagaCon < total) {
        if (vueltoEl) vueltoEl.style.borderColor = 'rgba(244,63,94,0.3)';
    } else {
        if (vueltoEl) vueltoEl.style.borderColor = '';
    }
}

// ── Renderizar carrito ────────────────────────
function renderCarrito() {
    const panel   = document.getElementById('lista-carrito-items');
    const totalEl = document.getElementById('monto-total-carrito');
    const count   = document.getElementById('cart-count');
    const btn     = document.getElementById('btn-vender');

    if (!carritoDeCompras.length) {
        panel.innerHTML = `
        <div class="cart-empty">
            <div class="cart-empty-icon">🛒</div>
            <span>El carrito está vacío</span>
            <span style="font-size:12px;opacity:0.6">Haz clic en un producto para agregar</span>
        </div>`;
        totalEl.innerText = '0.00';
        count.textContent = '0';
        document.getElementById('txt-paga-con').value = '';
        document.getElementById('monto-vuelto').innerText = '0.00';
        btn.disabled = true;
        return;
    }

    let total = 0;
    const totalItems = carritoDeCompras.reduce((s,i) => s + i.cantidad, 0);

    panel.innerHTML = carritoDeCompras.map(item => {
        const subtotalItem = item.precio * item.cantidad;
        total += subtotalItem;
        return `
        <div class="cart-item">
            <img class="cart-thumb" src="${item.imagen}" alt="${escHTML(item.modelo)}"
                onerror="this.src='${PLACEHOLDER}'">
            <div class="cart-info">
                <div class="cart-info-name" title="${escHTML(item.modelo)}">${escHTML(item.modelo)}</div>
                <div class="cart-info-price">S/. ${subtotalItem.toFixed(2)}</div>
            </div>
            <div class="cart-qty-wrap">
                <button class="cart-qty-btn" onclick="cambiarCantidad(${item.id},-1)">−</button>
                <span class="cart-qty">${item.cantidad}</span>
                <button class="cart-qty-btn" onclick="cambiarCantidad(${item.id},1)">+</button>
            </div>
            <button class="cart-remove" onclick="quitarDelCarrito(${item.id})" title="Quitar">×</button>
        </div>`;
    }).join('');

    totalEl.innerText     = total.toFixed(2);
    count.textContent     = totalItems;
    btn.disabled          = false;
    calcularVuelto();
}

// ── Enviar venta al servidor ──────────────────
async function enviarVentaAlServidor() {
    if (!carritoDeCompras.length) return;

    const total   = parseFloat(document.getElementById('monto-total-carrito').innerText) || 0;
    const pagaCon = parseFloat(document.getElementById('txt-paga-con').value) || 0;

    // Validar efectivo si se ingresó algo
    if (pagaCon > 0 && pagaCon < total) {
        Swal.fire({
            icon: 'error',
            title: 'Monto insuficiente',
            html: `El efectivo <b>S/. ${pagaCon.toFixed(2)}</b> es menor al total <b>S/. ${total.toFixed(2)}</b>`,
            background: '#1c1c2e',
            color: '#eaeaf4',
            confirmButtonColor: '#6c63ff'
        });
        return;
    }

    // Confirmar la venta
    const confirmar = await Swal.fire({
        title: 'Confirmar venta',
        html: `
            <div style="text-align:left;margin-top:8px">
                <div style="margin-bottom:8px">
                    <b>${carritoDeCompras.reduce((s,i)=>s+i.cantidad,0)}</b> ítem(s) — 
                    Total: <b style="color:#10b981">S/. ${total.toFixed(2)}</b>
                </div>
                ${pagaCon > 0 ? `<div>Efectivo: <b>S/. ${pagaCon.toFixed(2)}</b> | Vuelto: <b style="color:#10b981">S/. ${Math.max(0,pagaCon-total).toFixed(2)}</b></div>` : ''}
            </div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '✓ Confirmar',
        cancelButtonText:  'Cancelar',
        background: '#1c1c2e',
        color: '#eaeaf4',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#3a3a5a'
    });

    if (!confirmar.isConfirmed) return;

    const btn = document.getElementById('btn-vender');
    btn.disabled    = true;
    btn.textContent = '⏳ Procesando...';

    try {
        const payload = carritoDeCompras.map(i => ({
            id_producto: i.id,
            cantidad: i.cantidad,
            precio: i.precio
        }));

        const res = await fetch('./php/ventas_api.php?accion=procesar_venta', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrito: payload })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error en la venta',
                text: data.mensaje,
                background: '#1c1c2e',
                color: '#eaeaf4',
                confirmButtonColor: '#6c63ff'
            });
        } else {
            await Swal.fire({
                icon: 'success',
                title: '✓ Venta registrada',
                html: `
                    <div style="font-size:28px;font-weight:800;color:#10b981;margin:10px 0;font-family:'Syne',sans-serif">
                        S/. ${(data.total || total).toFixed(2)}
                    </div>
                    <div style="color:#8e8eb0;font-size:13px">Venta #${data.id_venta || ''} procesada correctamente</div>
                    ${pagaCon > 0 ? `<div style="margin-top:8px;font-size:14px">Vuelto entregado: <b style="color:#10b981">S/. ${Math.max(0,pagaCon-total).toFixed(2)}</b></div>` : ''}`,
                timer: 3000,
                showConfirmButton: false,
                background: '#1c1c2e',
                color: '#eaeaf4'
            });

            // Resetear carrito y recargar productos
            carritoDeCompras = [];
            renderCarrito();
            solicitarProductos();
        }
    } catch(err) {
        console.error('Error al enviar venta:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Intenta nuevamente.',
            background: '#1c1c2e',
            color: '#eaeaf4',
            confirmButtonColor: '#6c63ff'
        });
    } finally {
        btn.disabled    = false;
        btn.textContent = '✓ Registrar Venta';
        if (!carritoDeCompras.length) btn.disabled = true;
    }
}

// ── Parche: guardar lista de productos al renderizar ──
// Sobreescribimos la función original para guardar el estado
(function() {
    const original = renderProductos;
    window.renderProductos = function(lista) {
        _productosActuales = lista;
        original(lista);
    };
})();
