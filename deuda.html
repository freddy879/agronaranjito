<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Deudas - Agro Naranjito</title>
   <style>
    body { margin: 0; font-family: 'Segoe UI'; display: flex; background: #f5f6fa; }
    .sidebar { width: 220px; background: #1e272e; color: white; height: 100vh; padding: 20px; }
    .sidebar a { display: block; padding: 10px; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px; }
    .sidebar a:hover { background: #485460; }
    .main { flex: 1; }
    .header { background: #ff3f34; color: white; padding: 15px; font-size: 20px; }
    .contenido { padding: 20px; }
    .card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0px 5px 15px rgba(0,0,0,0.1); }
    input, select { padding: 10px; margin: 5px; border-radius: 8px; border: 1px solid #ccc; }
    button { padding: 10px; border: none; background: #ff3f34; color: white; border-radius: 8px; cursor: pointer; }
    button:hover { background: #e84118; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: center; }
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; justify-content: center; align-items: center; }
    .modal-overlay.activo { display: flex; }
    .modal { background: white; border-radius: 16px; padding: 30px; width: 380px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .modal h3 { margin-top: 0; color: #1e272e; font-size: 18px; }
    .modal label { display: block; margin: 10px 0 4px; font-weight: 600; color: #444; font-size: 14px; }
    .modal input, .modal select { width: 100%; box-sizing: border-box; margin: 0 0 8px 0; padding: 10px 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 14px; }
    .tipo-pago { display: flex; gap: 10px; margin-bottom: 14px; }
    .tipo-btn { flex: 1; padding: 12px; border: 2px solid #ddd; background: #f5f6fa; color: #555; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; }
    .tipo-btn.activo { border-color: #ff3f34; background: #fff0ef; color: #ff3f34; }
    .banco-info { background: #f0f4ff; border-left: 4px solid #3c6fe4; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 10px; color: #333; }
    .modal-btns { display: flex; gap: 10px; margin-top: 16px; }
    .btn-cancelar { flex: 1; background: #ccc; color: #333; }
    .btn-cancelar:hover { background: #aaa; }
    .btn-confirmar { flex: 2; background: #ff3f34; }
    #seccion-transferencia { display: none; }
    .badge-acum { background: #fff3cd; color: #856404; border: 1px solid #ffc107; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>

<div class="sidebar">
  <h2>NEXUS</h2>
  <a href="index.html">💰 Venta</a>
  <a href="bodega.html">📦 Bodega</a>
  <a href="deuda.html">💸 Deudas</a>
  <a href="analisis.html">🔍 Historial</a>
  <a href="caja.html">💵 Caja</a>
  <a href="cliente.html">👤 Clientes</a>
</div>

<div class="main">
  <div class="header">💸 Deudas - Agro Naranjito</div>
  <div class="contenido">

    <div class="card">
      <input id="buscar" placeholder="Buscar por nombre o cédula" onkeyup="buscarCliente()">
      <button onclick="buscarCliente()">Buscar</button>
      <button onclick="cargar()">♻ Recargar</button>
    </div>

    <div class="card">
      <h3>➕ Nueva Deuda / Agregar Producto</h3>
      <small style="color:#666;">Si el cliente ya tiene deuda, te preguntaré si agregar a la deuda existente o crear una nueva.</small><br><br>
      <input id="nombre" placeholder="Nombre">
      <input id="apellido" placeholder="Apellido"><br>
      <input id="cedula" placeholder="Cédula">
      <input id="celular" placeholder="Celular">
      <input id="direccion" placeholder="Producto"><br>
      <input id="monto" placeholder="Monto">
      <input id="meses" placeholder="Meses"><br>
      <button onclick="agregar()">Guardar</button>
    </div>

    <div class="card">
      <h3>📋 Deudas</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Cédula</th>
            <th>Celular</th>
            <th>Total</th>
            <th>Pagado</th>
            <th>Restante</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody id="tabla"></tbody>
      </table>
    </div>

  </div>
</div>

<!-- MODAL ABONAR -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <h3>💰 Registrar Abono</h3>

    <label>Monto del abono</label>
    <input type="number" id="modal-monto" placeholder="Ej: 25.00">

    <label>Método de pago</label>
    <div class="tipo-pago">
      <button type="button" class="tipo-btn activo" id="btn-efectivo" onclick="seleccionarTipo('efectivo')">💵 Efectivo</button>
      <button type="button" class="tipo-btn" id="btn-transferencia" onclick="seleccionarTipo('transferencia')">🏦 Transferencia</button>
    </div>

    <div id="seccion-transferencia">
      <label>Banco</label>
      <select id="modal-banco" onchange="actualizarInfoBanco()">
        <option value="">- Selecciona banco -</option>
        <option value="Banco Guayaquil">Banco Guayaquil</option>
        <option value="Banco Pichincha">Banco Pichincha</option>
      </select>
      <div id="info-banco" class="banco-info" style="display:none;"></div>
      <label>Nombre del remitente</label>
      <input id="modal-remitente" placeholder="Nombre de quien transfiere">
      <label>Número de comprobante</label>
      <input id="modal-comprobante" placeholder="Número de comprobante">
    </div>

    <div class="modal-btns">
      <button class="btn-cancelar" onclick="cerrarModal('modalOverlay')">Cancelar</button>
      <button class="btn-confirmar" onclick="confirmarAbono()">✅ Confirmar</button>
    </div>
  </div>
</div>

<!-- MODAL EDITAR -->
<div class="modal-overlay" id="modalEditar">
  <div class="modal" style="width:400px;">
    <h3>✏️ Editar Deuda</h3>
    <input type="hidden" id="edit-id">
    <label>Nombre del cliente</label>
    <input type="text" id="edit-cliente" placeholder="Nombre completo">
    <label>Cédula</label>
    <input type="text" id="edit-cedula" placeholder="Cédula">
    <label>Celular</label>
    <input type="text" id="edit-celular" placeholder="Celular">
    <label>Monto total</label>
    <input type="number" id="edit-total" placeholder="0.00">
    <div class="modal-btns">
      <button class="btn-cancelar" onclick="cerrarModal('modalEditar')">Cancelar</button>
      <button class="btn-confirmar" onclick="confirmarEditar()">💾 Guardar</button>
    </div>
  </div>
</div>

<!-- MODAL ACUMULAR -->
<div class="modal-overlay" id="modalAcumular">
  <div class="modal" style="width:420px;">
    <h3>⚠️ Cliente con deuda pendiente</h3>
    <div id="acumular-info" style="background:#fff3cd; border-left:4px solid #ffc107; padding:12px 14px; border-radius:8px; font-size:14px; margin-bottom:14px; color:#333;"></div>
    <div class="modal-btns">
      <button class="btn-cancelar" onclick="responderAcumular(false)">➕ Crear deuda nueva</button>
      <button class="btn-confirmar" onclick="responderAcumular(true)">📦 Agregar a deuda existente</button>
    </div>
  </div>
</div>

<script>
const API = "https://agronaranjito-1.onrender.com";

let deudas = [];
let deudaIdActual = null;
let tipoPagoActual = "efectivo";

let _acumularResolve = null;

const BANCOS = {
  "Banco Guayaquil": { tipo: "Cuenta corriente", numero: "0046069900" },
  "Banco Pichincha": { tipo: "Cuenta de Ahorros", numero: "2202438965" }
};

// ================= CERRAR MODAL =================
function cerrarModal(id) {
  document.getElementById(id).classList.remove("activo");
}

// ================= CARGAR =================
async function cargar() {
  const res = await fetch(API + '/deudas');
  deudas = await res.json();
  mostrar(deudas);
}

// ================ BUSCAR ==================
function buscarCliente() {
  let texto = document.getElementById("buscar").value.toLowerCase().trim();
  if (!texto) { mostrar(deudas); return; }
  let filtradas = deudas.filter(d => {
    let nombre  = String(d.cliente || "").toLowerCase().trim();
    let cedula  = String(d.cedula  || "").toLowerCase().trim();
    let celular = String(d.celular || "").toLowerCase().trim();
    return nombre.includes(texto) || cedula.includes(texto) || celular.includes(texto);
  });
  mostrar(filtradas);
}

// ================= MODAL ACUMULAR =================
function mostrarModalAcumular(deudaExistente, nuevoProducto, totalV) {
  return new Promise(resolve => {
    _acumularResolve = resolve;
    let deudaPendiente = (deudaExistente.total - (deudaExistente.pagado || 0)).toFixed(2);
    let productosExistentes = (deudaExistente.productos || [])
      .map(p => `• ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}`)
      .join("<br>");
    document.getElementById("acumular-info").innerHTML = `
      <b>${deudaExistente.cliente}</b> ya tiene deuda pendiente de <b>$${deudaPendiente}</b><br><br>
      <b>Productos actuales:</b><br>${productosExistentes}<br><br>
      <b>Nuevo producto:</b> ${nuevoProducto.nombre} ($${totalV.toFixed(2)})
    `;
    document.getElementById("modalAcumular").classList.add("activo");
  });
}

function responderAcumular(valor) {
  cerrarModal("modalAcumular");
  if (_acumularResolve) {
    _acumularResolve(valor);
    _acumularResolve = null;
  }
}

// ================= AGREGAR =================
async function agregar() {
  let nombreV       = document.getElementById("nombre").value.trim();
  let apellidoV     = document.getElementById("apellido").value.trim();
  let cedulaV       = document.getElementById("cedula").value.trim();
  let celularV      = document.getElementById("celular").value.trim();
  let totalV        = parseFloat(document.getElementById("monto").value);
  let productosTexto = document.getElementById("direccion").value.trim();

  if (!totalV || isNaN(totalV)) return alert("Monto inválido");
  if (!productosTexto) return alert("Ingresa el nombre del producto");

  let clienteFinal  = (nombreV + " " + apellidoV).trim();
  let nuevoProducto = { nombre: productosTexto, cantidad: 1, precio: totalV };

  let deudaExistente = null;
  if (cedulaV && cedulaV !== "-") {
    deudaExistente = deudas.find(d =>
      d.cedula && d.cedula !== "-" &&
      d.cedula.trim() === cedulaV &&
      (d.total - (d.pagado || 0)) > 0
    );
  }
  if (!deudaExistente && clienteFinal) {
    deudaExistente = deudas.find(d =>
      d.cliente && d.cliente.trim().toLowerCase() === clienteFinal.toLowerCase() &&
      (d.total - (d.pagado || 0)) > 0
    );
  }

  if (deudaExistente) {
    const acumular = await mostrarModalAcumular(deudaExistente, nuevoProducto, totalV);

    if (acumular) {
      let productosActualizados = [...(deudaExistente.productos || []), nuevoProducto];
      let nuevoTotal = deudaExistente.total + totalV;
      const res = await fetch(API + '/deudas/' + deudaExistente._id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente:   deudaExistente.cliente,
          cedula:    deudaExistente.cedula,
          celular:   deudaExistente.celular,
          total:     nuevoTotal,
          productos: productosActualizados
        })
      });
      const texto = await res.text();
      let data;
      try { data = JSON.parse(texto); } catch { alert("Error del servidor al acumular deuda"); return; }
      if (!res.ok) { alert(data.error || "Error al actualizar deuda"); return; }
      alert(`✅ Producto agregado. Deuda actualizada: $${nuevoTotal.toFixed(2)}`);
    } else {
      await fetch(API + '/deudas', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente:   clienteFinal,
          cedula:    cedulaV || "-",
          celular:   celularV || "",
          direccion: "",
          total:     totalV,
          productos: [nuevoProducto],
          pagos:     [],
          pagado:    0
        })
      });
      alert(`✅ Deuda nueva creada para ${clienteFinal}`);
    }
  } else {
    await fetch(API + '/deudas', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente:   clienteFinal,
        cedula:    cedulaV || "-",
        celular:   celularV || "",
        direccion: "",
        total:     totalV,
        productos: [nuevoProducto],
        pagos:     [],
        pagado:    0
      })
    });
    alert(`✅ Deuda registrada para ${clienteFinal}`);
  }

  limpiar();
  cargar();
}

// ================= MODAL EDITAR =================
function editar(id) {
  let d = deudas.find(x => x._id === id);
  if (!d) return;
  document.getElementById("edit-id").value      = id;
  document.getElementById("edit-cliente").value = d.cliente || "";
  document.getElementById("edit-cedula").value  = d.cedula  || "";
  document.getElementById("edit-celular").value = d.celular || "";
  document.getElementById("edit-total").value   = d.total   || "";
  document.getElementById("modalEditar").classList.add("activo");
}

async function confirmarEditar() {
  const id      = document.getElementById("edit-id").value;
  const cliente = document.getElementById("edit-cliente").value.trim();
  const cedula  = document.getElementById("edit-cedula").value.trim();
  const celular = document.getElementById("edit-celular").value.trim();
  const total   = Number(document.getElementById("edit-total").value);
  if (!cliente) return alert("Ingresa el nombre del cliente");
  if (isNaN(total)) return alert("Monto inválido");
  try {
    const res = await fetch(API + '/deudas/' + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, cedula, celular, total })
    });
    const texto = await res.text();
    let data;
    try { data = JSON.parse(texto); } catch { alert("Error del servidor"); return; }
    if (!res.ok) { alert(data.error || "Error al editar"); return; }
    cerrarModal("modalEditar");
    cargar();
  } catch (err) { alert("Error: " + err.message); }
}

// ================= MOSTRAR =================
function mostrar(lista) {
  let tabla = document.getElementById("tabla");
  let html  = "";
  lista.forEach(d => {
    let pagado    = d.pagado || 0;
    let restante  = d.total - pagado;
    let estado    = restante <= 0 ? "Pagado ✅" : "Pendiente";
    let cantProds = (d.productos && d.productos.length) ? d.productos.length : 0;
    let productos = cantProds
      ? d.productos.map(p => `${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toFixed(2)}`).join("<br>")
      : "Sin productos";
    let pagos = (d.pagos && d.pagos.length)
      ? d.pagos.map(p => {
          let metodo = p.tipoPago === "transferencia"
            ? `🏦 ${p.banco || ""} | Comprobante: ${p.comprobante || "-"} | Remitente: ${p.remitente || "-"}`
            : "💵 Efectivo";
          return `$${p.monto} — ${new Date(p.fecha).toLocaleString()} — ${metodo}`;
        }).join("<br>")
      : "Sin pagos";
    let mensaje   = encodeURIComponent(`Hola ${d.cliente}, le saluda Agro Naranjito.\n\nLe recordamos que mantiene una deuda pendiente de $${restante.toFixed(2)}.\n\nGracias por su atención.`);
    let numero    = (d.celular || "").replace(/^0/, "593");
    let badgeProds = cantProds > 1 ? `<br><span class="badge-acum">📦 ${cantProds} productos</span>` : "";
    html += `
      <tr>
        <td>${d.cliente}${badgeProds}</td>
        <td>${d.cedula || "-"}</td>
        <td>
          ${d.celular || "-"}
          <a href="https://wa.me/${numero}?text=${mensaje}" target="_blank" style="text-decoration:none;">📱</a>
        </td>
        <td>$${d.total.toFixed(2)}</td>
        <td>$${pagado.toFixed(2)}</td>
        <td>$${restante.toFixed(2)}</td>
        <td>${estado}</td>
        <td>
          <button onclick="abrirModal('${d._id}')">💰 Abonar</button>
          <button onclick="editar('${d._id}')">✏️</button>
          <button onclick="toggleDetalle('${d._id}')">📄</button>
          <button onclick="eliminar('${d._id}')">🗑</button>
        </td>
      </tr>
      <tr id="detalle-${d._id}" style="display:none; background:#f9f9f9;">
        <td colspan="8" style="text-align:left;">
          <b>📦 Productos (${cantProds}):</b><br>${productos}<br><br>
          <b>💰 Pagos:</b><br>${pagos}
        </td>
      </tr>
    `;
  });
  tabla.innerHTML = html;
}

// ================ TOGGLE DETALLE ==================
function toggleDetalle(id) {
  let fila = document.getElementById("detalle-" + id);
  if (!fila) return;
  fila.style.display = fila.style.display === "none" ? "table-row" : "none";
}

// ================= MODAL ABONAR =================
function abrirModal(id) {
  deudaIdActual  = id;
  tipoPagoActual = "efectivo";
  document.getElementById("modal-monto").value      = "";
  document.getElementById("modal-banco").value      = "";
  document.getElementById("modal-comprobante").value = "";
  document.getElementById("modal-remitente").value  = "";
  document.getElementById("seccion-transferencia").style.display = "none";
  document.getElementById("info-banco").style.display            = "none";
  document.getElementById("btn-efectivo").classList.add("activo");
  document.getElementById("btn-transferencia").classList.remove("activo");

  const btnConfirmar = document.querySelector(".btn-confirmar");
  if (btnConfirmar) btnConfirmar.disabled = false;

  document.getElementById("modalOverlay").classList.add("activo");
}

function seleccionarTipo(tipo) {
  tipoPagoActual = tipo;
  document.getElementById("btn-efectivo").classList.toggle("activo", tipo === "efectivo");
  document.getElementById("btn-transferencia").classList.toggle("activo", tipo === "transferencia");
  document.getElementById("seccion-transferencia").style.display = tipo === "transferencia" ? "block" : "none";
  if (tipo === "efectivo") document.getElementById("info-banco").style.display = "none";
}

function actualizarInfoBanco() {
  let banco   = document.getElementById("modal-banco").value;
  let infoDiv = document.getElementById("info-banco");
  if (banco && BANCOS[banco]) {
    let b = BANCOS[banco];
    infoDiv.innerHTML    = `<b>${banco}</b><br>${b.tipo}<br><b>${b.numero}</b>`;
    infoDiv.style.display = "block";
  } else {
    infoDiv.style.display = "none";
  }
}

// ================= CONFIRMAR ABONO =================
// ✅ CORRECCIÓN: se eliminó la llamada a registrarTransferenciaEnCaja()
// El backend (/deudas/pagar) ya registra el movimiento en caja internamente,
// por lo que llamar también a /caja/transferencia generaba un duplicado.
async function confirmarAbono() {
  let monto = Number(document.getElementById("modal-monto").value);
  if (!monto || monto <= 0) return alert("Monto inválido");

  let banco       = "";
  let comprobante = "";
  let remitente   = "";

  if (tipoPagoActual === "transferencia") {
    banco       = document.getElementById("modal-banco").value;
    comprobante = document.getElementById("modal-comprobante").value.trim();
    remitente   = document.getElementById("modal-remitente").value.trim();
    if (!banco)       return alert("Selecciona un banco");
    if (!comprobante) return alert("Ingresa el número de comprobante");
  }

  const btnConfirmar = document.querySelector(".btn-confirmar");
  if (btnConfirmar) btnConfirmar.disabled = true;

  try {
    const res = await fetch(API + '/deudas/pagar', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:         deudaIdActual,
        monto,
        tipoPago:   tipoPagoActual,   // ✅ el backend ahora lee tipoPago correctamente
        banco,
        comprobante,
        remitente
      })
    });

    const data = await res.json();
    if (data.error) {
      if (btnConfirmar) btnConfirmar.disabled = false;
      return alert(data.error);
    }

    // ✅ NO se llama a /caja/transferencia aquí.
    // El endpoint /deudas/pagar en el backend ya lo hace internamente.

    cerrarModal("modalOverlay");
    abrirRecibo(data, monto, tipoPagoActual, banco, comprobante, remitente);
    cargar();

  } catch (err) {
    console.log(err);
    alert("Error al abonar la deuda");
  } finally {
    if (btnConfirmar) btnConfirmar.disabled = false;
  }
}

// ================= RECIBO =================
// ================= RECIBO NEGRO ALTA CALIDAD =================
function abrirRecibo(d, monto, tipoPago, banco, comprobante, remitente) {
  let win = window.open("", "", "width=380,height=700");

  let productos = (d.productos && d.productos.length)
    ? d.productos.map(p => `
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:14px;">
          <span>${p.nombre} x${p.cantidad}</span>
          <b>$${(p.precio * p.cantidad).toFixed(2)}</b>
        </div>`).join("")
    : `<div style="font-size:13px;color:#555;">Sin productos</div>`;

  let filasHistorial = "";
  let totalAcumulado = 0;
  if (d.pagos && d.pagos.length) {
    d.pagos.forEach((p, i) => {
      totalAcumulado += p.monto;
      const esUltimo = i === d.pagos.length - 1;
      const fecha = new Date(p.fecha).toLocaleDateString("es-EC");
      const metodo = p.tipoPago === "transferencia" ? "Transf." : "Efectivo";
      filasHistorial += `
        <div style="display:grid;grid-template-columns:1fr 65px 65px;font-size:13px;padding:5px 0;border-bottom:1px dashed #ccc;${esUltimo ? 'font-weight:700;' : ''}">
          <span>${fecha}</span>
          <span style="text-align:right;">$${p.monto.toFixed(2)}</span>
          <span style="text-align:right;">${metodo}</span>
        </div>`;
    });
  } else {
    filasHistorial = `<div style="font-size:13px;color:#555;padding:5px 0;">Sin pagos</div>`;
  }

  let infoPago = tipoPago === "transferencia" ? `
    <div style="font-size:13px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #aaa;">
      <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:4px;">Método de pago</div>
      <b>Transferencia</b><br>
      Banco: ${banco}<br>
      Remitente: ${remitente || "-"}<br>
      Comprobante: ${comprobante}
    </div>` : `
    <div style="font-size:13px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #aaa;">
      <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:4px;">Método de pago</div>
      <b>Efectivo</b>
    </div>`;

  const pagado   = d.pagado  || 0;
  const total    = d.total   || 0;
  const restante = d.restante ?? (total - pagado);
  const fecha    = new Date().toLocaleString("es-EC");

  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Recibo</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', Courier, monospace; background:#fff; display:flex; justify-content:center; padding:12px; color:#000; }
  .recibo { width:300px; }
  @media print { body { padding:0; } .recibo { width:100%; } }
</style>
</head>
<body onload="window.print()">
<div class="recibo">

  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px;">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Comprobante de Abono</div>
    <div style="font-size:20px;font-weight:700;letter-spacing:1px;">AGRO NARANJITO</div>
    <div style="font-size:11px;color:#555;margin-top:4px;">${fecha}</div>
  </div>

  <div style="margin-bottom:10px;border-bottom:1px dashed #aaa;padding-bottom:10px;">
    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:4px;">Cliente</div>
    <div style="font-size:16px;font-weight:700;">${d.cliente || "-"}</div>
    <div style="font-size:13px;margin-top:3px;">CI: ${d.cedula || "-"}</div>
    <div style="font-size:13px;">Tel: ${d.celular || "-"}</div>
  </div>

  <div style="margin-bottom:10px;border-bottom:1px dashed #aaa;padding-bottom:10px;">
    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:6px;">Productos</div>
    ${productos}
  </div>

  <div style="margin-bottom:10px;border-bottom:1px dashed #aaa;padding-bottom:10px;">
    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:6px;">Historial de pagos</div>
    <div style="display:grid;grid-template-columns:1fr 65px 65px;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;padding:4px 0;border-bottom:1px solid #000;">
      <span>Fecha</span><span style="text-align:right;">Monto</span><span style="text-align:right;">Método</span>
    </div>
    ${filasHistorial}
    <div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-top:1px solid #000;margin-top:2px;">
      <span style="color:#555;">Total abonado</span><b>$${totalAcumulado.toFixed(2)}</b>
    </div>
  </div>

  ${infoPago}

  <div style="margin-bottom:10px;border-bottom:1px dashed #aaa;padding-bottom:10px;font-size:14px;">
    <div style="display:flex;justify-content:space-between;padding:3px 0;">
      <span>Total deuda</span><span>$${total.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:3px 0;">
      <span>Total pagado</span><span>$${pagado.toFixed(2)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:3px 0;">
      <span>Restante</span><b>$${restante.toFixed(2)}</b>
    </div>
  </div>

  <div style="border:2px solid #000;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <span style="font-size:15px;font-weight:700;">ESTE ABONO</span>
    <span style="font-size:24px;font-weight:700;">$${monto.toFixed(2)}</span>
  </div>

  <div style="text-align:center;font-size:12px;color:#555;">
    Gracias por su pago<br>Agro Naranjito
  </div>

</div>
</body></html>`);
  win.document.close();
}
// ================= LIMPIAR =================
function limpiar() {
  document.getElementById("nombre").value    = "";
  document.getElementById("apellido").value  = "";
  document.getElementById("cedula").value    = "";
  document.getElementById("celular").value   = "";
  document.getElementById("direccion").value = "";
  document.getElementById("monto").value     = "";
  if (document.getElementById("meses")) document.getElementById("meses").value = "";
}

// ================= ELIMINAR =================
async function eliminar(id) {
  if (!confirm("¿Seguro que quieres eliminar esta deuda?")) return;
  try {
    await fetch(API + '/deudas/' + id, { method: "DELETE" });
    cargar();
  } catch (err) { console.log(err); alert("Error al eliminar deuda"); }
}

window.onload = cargar;
</script>
</body>
</html>
