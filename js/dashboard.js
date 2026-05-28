/* ═══════════════════════════════════════════
   dashboard.js — Dashboard (dashboard.html)
═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
});

async function cargarDashboard() {
    try {
        const res  = await fetch('./dashboard_api.php', { credentials: 'same-origin' });
        const data = await res.json();

        if (data.error) {
            console.error('Dashboard error:', data.mensaje);
            mostrarErrorDashboard(data.mensaje);
            return;
        }

        // ── Stats ──────────────────────────────────
        animarNumero('total-productos', data.total_productos || 0);
        document.getElementById('total-ventas').textContent =
            'S/ ' + Number(data.total_ventas || 0).toLocaleString('es-PE', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        animarNumero('stock-bajo',  data.stock_bajo  || 0);
        animarNumero('ventas-hoy',  data.ventas_hoy  || 0);
        document.getElementById('count-stock-bajo').textContent = data.stock_bajo || 0;

        // ── Lista de stock bajo ────────────────────
        const lista = document.getElementById('lista-stock-bajo');
        if (!data.productos_bajos || !data.productos_bajos.length) {
            lista.innerHTML = `
            <div style="color:var(--green);text-align:center;padding:20px 0;font-size:13px">
                ✓ Sin productos en riesgo
            </div>`;
        } else {
            lista.innerHTML = data.productos_bajos.map(p => {
                const pct   = Math.min(100, (parseInt(p.stock) / 5) * 100);
                const color = p.stock == 0 ? 'var(--red)' : p.stock <= 2 ? 'var(--red)' : 'var(--amber)';
                return `
                <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <span style="font-size:13px;font-weight:600;color:var(--text)">${escHTML(p.modelo)}</span>
                        <span style="font-size:12px;font-weight:700;color:${color}">${p.stock} ud.</span>
                    </div>
                    <div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden">
                        <div style="height:4px;border-radius:99px;background:${color};width:0%;transition:width 0.8s ease;animation:barFill 0.8s ease forwards"
                             data-pct="${pct}"></div>
                    </div>
                </div>`;
            }).join('');

            // Animar barras
            setTimeout(() => {
                document.querySelectorAll('[data-pct]').forEach(bar => {
                    bar.style.width = bar.dataset.pct + '%';
                });
            }, 100);
        }

        // ── Gráfico de ventas ──────────────────────
        const grafico = data.grafico || [];

        if (!grafico.length) {
            const canvas  = document.getElementById('graficoVentas');
            const emptyEl = document.getElementById('chart-empty');
            if (canvas)  canvas.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'flex';
            return;
        }

        const labels  = grafico.map(g => {
            const d = new Date(g.fecha + 'T00:00:00');
            return d.toLocaleDateString('es-PE', { day:'2-digit', month:'short' });
        });
        const valores = grafico.map(g => parseFloat(g.total || 0));

        const ctx = document.getElementById('graficoVentas').getContext('2d');

        // Gradiente de fondo
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0,   'rgba(108,99,255,0.25)');
        gradient.addColorStop(1,   'rgba(108,99,255,0.01)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Ventas S/.',
                    data: valores,
                    borderColor: '#6c63ff',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.45,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6c63ff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#6c63ff',
                    borderWidth: 2.5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeInOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c1c2e',
                        borderColor: 'rgba(108,99,255,0.3)',
                        borderWidth: 1,
                        titleColor: '#eaeaf4',
                        bodyColor: '#10b981',
                        callbacks: {
                            label: ctx => ' S/. ' + ctx.parsed.y.toFixed(2)
                        }
                    }
                },
                scales: {
                    x: {
                        grid:  { color: 'rgba(255,255,255,0.04)' },
                        ticks: { color: '#56567a', font: { size: 11 } },
                        border: { color: 'rgba(255,255,255,0.06)' }
                    },
                    y: {
                        grid:  { color: 'rgba(255,255,255,0.04)' },
                        ticks: {
                            color: '#56567a',
                            font: { size: 11 },
                            callback: v => 'S/.' + v.toLocaleString()
                        },
                        border: { color: 'rgba(255,255,255,0.06)' },
                        beginAtZero: true
                    }
                }
            }
        });

    } catch(e) {
        console.error('Dashboard fetch error:', e);
        mostrarErrorDashboard('No se pudo conectar con el servidor');
    }
}

// ── Helpers ──────────────────────────────────
function escHTML(t) {
    return String(t)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
}

function animarNumero(id, hasta) {
    const el = document.getElementById(id);
    if (!el) return;
    const inicio = 0;
    const duracion = 700;
    const paso = (duracion / 60);
    let actual = inicio;
    const incremento = hasta / (duracion / paso);

    const timer = setInterval(() => {
        actual = Math.min(actual + incremento, hasta);
        el.textContent = Math.round(actual);
        if (actual >= hasta) clearInterval(timer);
    }, paso);
}

function mostrarErrorDashboard(msg) {
    ['total-productos','total-ventas','stock-bajo','ventas-hoy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    const lista = document.getElementById('lista-stock-bajo');
    if (lista) lista.innerHTML = `<div style="color:var(--red);text-align:center;padding:16px;font-size:13px">⚠ ${escHTML(msg)}</div>`;
}
