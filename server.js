require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// ================== FIREBASE ==================
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ ERROR CRÍTICO: La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada.");
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("✅ ¡Conectado exitosamente a Firebase Cloud Firestore!");
} catch (error) {
  console.error("❌ Error al procesar FIREBASE_SERVICE_ACCOUNT:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// ================== NODEMAILER ==================
// Variables necesarias en tu .env / Render:
//   EMAIL_USER    → tu dirección Gmail (ej: tienda@gmail.com)
//   EMAIL_PASS    → contraseña de aplicación Google (16 caracteres, sin espacios)
//   EMAIL_FROM    → nombre visible (ej: "Agro Naranjito #1") — opcional
//
// Para crear la contraseña de aplicación en Gmail:
//   Mi cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  if (err) {
    console.warn("⚠️  Nodemailer no pudo verificar la conexión SMTP:", err.message);
    console.warn("    Revisa EMAIL_USER y EMAIL_PASS en tus variables de entorno.");
  } else {
    console.log("📧 Nodemailer listo para enviar correos desde:", process.env.EMAIL_USER);
  }
});

// ── Helper: genera el HTML completo del correo ────────────────────────────
function generarHTMLCorreo(datos, carrito, tipoPago) {
  const {
    cliente, cedula, subtotal, pct, descuentoMonto, totalFinal,
    tasaPct, montoInteres, meses, pago, vuelto,
    bancoNombre, bancoCuenta, comprobante
  } = datos;

  const fecha = new Date().toLocaleString("es-EC", { dateStyle: "long", timeStyle: "short" });

  const filas = (carrito || []).map(p => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${p.nombre}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center">${p.cantidad}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:right">$${Number(p.precio).toFixed(2)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold">$${(Number(p.precio) * Number(p.cantidad)).toFixed(2)}</td>
    </tr>
  `).join("");

  let detallePago = "";
  if (tipoPago === "efectivo") {
    detallePago = `
      <tr><td style="padding:4px 0;color:#555">Pago recibido</td><td style="text-align:right">$${Number(pago).toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Vuelto</td><td style="text-align:right">$${Number(vuelto).toFixed(2)}</td></tr>
    `;
  } else if (tipoPago === "transferencia") {
    detallePago = `
      <tr><td style="padding:4px 0;color:#555">Banco</td><td style="text-align:right">${bancoNombre}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Cuenta</td><td style="text-align:right">${bancoCuenta}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Comprobante</td><td style="text-align:right">${comprobante}</td></tr>
    `;
  } else if (tipoPago === "credito") {
    detallePago = `
      <tr><td style="padding:4px 0;color:#555">Interés (${tasaPct}%)</td><td style="text-align:right">$${Number(montoInteres).toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Plazo</td><td style="text-align:right">${meses} meses</td></tr>
    `;
  }

  const descuentoRow = Number(pct) > 0 ? `
    <tr>
      <td style="padding:4px 0;color:#555">Subtotal</td>
      <td style="text-align:right">$${Number(subtotal).toFixed(2)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#e03329">Descuento (${pct}%)</td>
      <td style="text-align:right;color:#e03329">-$${Number(descuentoMonto).toFixed(2)}</td>
    </tr>
  ` : "";

  const tipoBadgeColor = tipoPago === "efectivo" ? "#27ae60" : tipoPago === "transferencia" ? "#2980b9" : "#e67e22";

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f5f6fa;font-family:'Segoe UI',Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:30px 0">
      <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

          <!-- Cabecera -->
          <tr>
            <td style="background:#ff3f34;padding:24px 28px;text-align:center">
              <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px">AGRO NARANJITO #1</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Factura de venta · ${fecha}</p>
            </td>
          </tr>

          <!-- Datos cliente -->
          <tr>
            <td style="padding:20px 28px 10px">
              <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px">Cliente</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#1e272e">${cliente || "-"}</p>
              ${cedula ? `<p style="margin:2px 0 0;font-size:13px;color:#555">Cédula: ${cedula}</p>` : ""}
              <span style="display:inline-block;margin-top:8px;padding:3px 12px;background:${tipoBadgeColor};color:#fff;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase">${tipoPago}</span>
            </td>
          </tr>

          <!-- Productos -->
          <tr>
            <td style="padding:0 28px">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px">
                <thead>
                  <tr style="background:#f8f9fa">
                    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase">Producto</th>
                    <th style="padding:8px 10px;text-align:center;font-size:12px;color:#888;font-weight:600;text-transform:uppercase">Cant.</th>
                    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase">P.Unit</th>
                    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>${filas}</tbody>
              </table>
            </td>
          </tr>

          <!-- Totales -->
          <tr>
            <td style="padding:16px 28px">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${descuentoRow}
                ${detallePago}
                <tr>
                  <td colspan="2"><hr style="border:none;border-top:2px solid #f0f0f0;margin:10px 0"></td>
                </tr>
                <tr>
                  <td style="font-size:18px;font-weight:700;color:#1e272e">TOTAL</td>
                  <td style="text-align:right;font-size:22px;font-weight:700;color:#ff3f34">$${Number(totalFinal).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#f8f9fa;padding:18px 28px;text-align:center;border-top:1px solid #f0f0f0">
              <p style="margin:0;font-size:14px;color:#555">¡Gracias por su compra! 😊</p>
              <p style="margin:4px 0 0;font-size:12px;color:#aaa">Agro Naranjito #1 · Este correo se generó automáticamente</p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

// ── Helper: mapa docs Firestore ───────────────────────────────────────────
const mapearDocs = (snapshot) => {
  const docs = [];
  snapshot.forEach(doc => docs.push({ _id: doc.id, ...doc.data() }));
  return docs;
};

// ================== HEALTH ==================
app.get('/health', (req, res) => {
  res.json({ ok: true, message: "Servidor activo", time: new Date() });
});

// ================== PRODUCTOS ==================
app.get('/productos', async (req, res) => {
  try {
    const snapshot = await db.collection('productos').get();
    res.json(mapearDocs(snapshot));
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

app.post('/productos', async (req, res) => {
  try {
    await db.collection('productos').add(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al crear producto" });
  }
});

app.put('/productos/:id', async (req, res) => {
  try {
    await db.collection('productos').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al editar producto" });
  }
});

app.put('/productos/agregar/:id', async (req, res) => {
  try {
    const docRef = db.collection('productos').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.json({ error: "No existe" });
    const p = doc.data();
    await docRef.update({ stock: (p.stock || 0) + Number(req.body.cantidad) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al agregar stock" });
  }
});

app.put('/productos/vender/:id', async (req, res) => {
  try {
    const docRef = db.collection('productos').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.json({ error: "No existe" });
    const p = doc.data();
    let nuevoStock = (p.stock || 0) - Number(req.body.cantidad);
    if (nuevoStock < 0) nuevoStock = 0;
    await docRef.update({ stock: nuevoStock });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al vender" });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    await db.collection('productos').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// ================== CLIENTES ==================
app.post('/clientes', async (req, res) => {
  try {
    console.log("➡️ POST /clientes:", req.body);
    const nuevoCliente = {
      nombre:     req.body.nombre    || "Sin Nombre",
      cedula:     req.body.cedula    || "Sin Cédula",
      direccion:  req.body.direccion || "",
      telefono:   req.body.telefono  || "",
      correo:     req.body.correo    || "",
      deudaTotal: Number(req.body.deudaTotal  || 0),
      deudaActual: Number(req.body.deudaActual || 0),
      estado: req.body.estado || "normal",
      fecha: req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };
    const resultado = await db.collection('clientes').add(nuevoCliente);
    res.json({ ok: true, cliente: { _id: resultado.id, ...nuevoCliente } });
  } catch (err) {
    console.error("❌ Error al guardar cliente:", err);
    res.status(500).json({ error: "Error al guardar cliente", detalle: err.message });
  }
});

app.get('/clientes', async (req, res) => {
  try {
    const snapshot = await db.collection('clientes').orderBy('fecha', 'desc').get();
    res.json(mapearDocs(snapshot));
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.post('/clientes/sumar-deuda', async (req, res) => {
  try {
    const { cedula, total } = req.body;
    const snapshot = await db.collection('clientes').where('cedula', '==', cedula).get();
    if (snapshot.empty) return res.status(404).json({ error: "Cliente no encontrado" });
    const docRef = snapshot.docs[0].ref;
    const cliente = snapshot.docs[0].data();
    const deudaTotal  = (cliente.deudaTotal  || 0) + Number(total);
    const deudaActual = (cliente.deudaActual || 0) + Number(total);
    await docRef.update({ deudaTotal, deudaActual, estado: "deudor" });
    res.json({ ok: true, cliente: { _id: docRef.id, ...cliente, deudaTotal, deudaActual, estado: "deudor" } });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar deuda" });
  }
});

app.post('/clientes/abonar', async (req, res) => {
  try {
    const { cedula, monto } = req.body;
    const snapshot = await db.collection('clientes').where('cedula', '==', cedula).get();
    if (snapshot.empty) return res.status(404).json({ error: "Cliente no encontrado" });
    const docRef = snapshot.docs[0].ref;
    const cliente = snapshot.docs[0].data();
    let deudaActual = (cliente.deudaActual || 0) - Number(monto);
    let estado = cliente.estado;
    if (deudaActual <= 0) { deudaActual = 0; estado = "normal"; }
    await docRef.update({ deudaActual, estado });
    res.json({ ok: true, cliente: { _id: docRef.id, ...cliente, deudaActual, estado } });
  } catch (err) {
    res.status(500).json({ error: "Error al abonar" });
  }
});

app.put('/clientes/editar', async (req, res) => {
  try {
    const { id, nombre, cedula, telefono, correo } = req.body;
    await db.collection('clientes').doc(id).update({ nombre, cedula, telefono, correo });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al editar cliente" });
  }
});

app.get('/clientes/:cedula', async (req, res) => {
  try {
    const snapshot = await db.collection('clientes').where('cedula', '==', req.params.cedula).get();
    if (snapshot.empty) return res.json(null);
    res.json({ _id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  } catch (err) {
    res.status(500).json(null);
  }
});

app.delete('/clientes/:id', async (req, res) => {
  try {
    await db.collection('clientes').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

// ================== VENTAS ==================

// ── ENVIAR FACTURA POR CORREO — va ANTES de POST /ventas para evitar conflicto de orden ──
app.post('/ventas/enviar-factura', async (req, res) => {
  console.log("📨 POST /ventas/enviar-factura recibido, correo:", req.body?.correo);
  const { correo, datos, carrito, tipoPago } = req.body;

  if (!correo) {
    return res.status(400).json({ error: "Correo requerido" });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  EMAIL_USER / EMAIL_PASS no configurados.");
    return res.status(503).json({ error: "Servicio de correo no configurado en el servidor." });
  }

  const htmlFactura = generarHTMLCorreo(datos, carrito, tipoPago);
  const fromName    = process.env.EMAIL_FROM || "Agro Naranjito #1";
  const subject     = `Factura de compra — ${datos?.cliente || "Cliente"} · $${Number(datos?.totalFinal || 0).toFixed(2)}`;

  try {
    await transporter.sendMail({
      from:    `"${fromName}" <${process.env.EMAIL_USER}>`,
      to:      correo,
      subject,
      html:    htmlFactura
    });
    console.log(`📧 Factura enviada a ${correo}`);
    res.json({ ok: true, mensaje: `Correo enviado a ${correo}` });
  } catch (err) {
    console.error("❌ Error al enviar correo:", err.message);
    res.status(500).json({ error: "No se pudo enviar el correo.", detalle: err.message });
  }
});

app.post('/ventas', async (req, res) => {
  try {
    const nuevaVenta = {
      ...req.body,
      fecha: req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };

    await db.collection('ventas').add(nuevaVenta);

    // Caja
    const cajasSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!cajasSnapshot.empty) {
      const cajaRef = cajasSnapshot.docs[0].ref;
      const caja    = cajasSnapshot.docs[0].data();

      if (req.body.tipo === "efectivo" || req.body.tipo === "transferencia") {
        caja.ingresos = (caja.ingresos || 0) + Number(req.body.total || 0);
        if (!caja.movimientos) caja.movimientos = [];

        if (req.body.tipo === "efectivo") {
          caja.movimientos.push({ tipo: "ingreso", monto: req.body.total, motivo: "Venta efectivo", fecha: new Date().toISOString() });
        } else {
          caja.movimientos.push({
            tipo: "transferencia",
            monto: Number(req.body.total || 0),
            motivo: `Transferencia venta — ${req.body.banco || ""}`,
            banco: req.body.banco || "",
            cuenta: req.body.cuenta || "",
            comprobante: req.body.comprobante || "",
            remitente: req.body.cliente || "",
            fecha: new Date().toISOString()
          });
        }
        await cajaRef.update(caja);
      }
    }

    if (req.body.tipo === "credito") {
      await db.collection('deudas').add({
        cliente:   req.body.cliente,
        cedula:    req.body.cedula    || "SIN CÉDULA",
        celular:   req.body.celular   || "",
        correo:    req.body.correo    || "",
        direccion: req.body.direccion || "",
        total:     req.body.total,
        pagado:    0,
        productos: req.body.productos || [],
        pagos:     [],
        fecha:     new Date().toISOString()
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar venta" });
  }
});

// ================== BORRAR PRODUCTO DE VENTA ==================
app.delete('/ventas/producto/:ventaId/:indice', async (req, res) => {
  try {
    const docRef = db.collection('ventas').doc(req.params.ventaId);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Venta no encontrada" });

    const venta  = doc.data();
    const indice = Number(req.params.indice);
    if (isNaN(indice) || indice < 0 || indice >= venta.productos.length) {
      return res.status(400).json({ error: "Índice inválido" });
    }

    venta.productos.splice(indice, 1);

    if (venta.productos.length === 0) {
      await docRef.delete();
      return res.json({ msg: "Venta eliminada (quedó sin productos)" });
    } else {
      venta.total = venta.productos.reduce((sum, p) => sum + (Number(p.precio || 0) * Number(p.cantidad || 1)), 0);
      await docRef.update({ productos: venta.productos, total: venta.total });
      res.json({ msg: "Producto eliminado correctamente" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al borrar el producto" });
  }
});

// ================== BORRAR DÍA ==================
app.delete('/ventas/dia', async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) return res.status(400).json({ error: "Falta fecha" });

    const inicio = new Date(fecha + "T00:00:00.000Z").toISOString();
    const fin    = new Date(fecha + "T23:59:59.999Z").toISOString();

    const snapshot = await db.collection('ventas')
      .where('fecha', '>=', inicio)
      .where('fecha', '<=', fin)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ ok: true, msg: `${snapshot.size} venta(s) eliminadas`, deleted: snapshot.size });
  } catch (err) {
    res.status(500).json({ error: "Error al borrar día" });
  }
});

// ================== DEUDAS ==================
app.get('/deudas', async (req, res) => {
  try {
    const snapshot = await db.collection('deudas').orderBy('fecha', 'desc').get();
    res.json(mapearDocs(snapshot));
  } catch (err) {
    res.json([]);
  }
});

app.post('/deudas', async (req, res) => {
  try {
    const nueva = {
      cliente:   req.body.cliente   || "",
      cedula:    req.body.cedula    || "-",
      celular:   req.body.celular   || "",
      direccion: req.body.direccion || "",
      correo:    req.body.correo    || "",
      total:     Number(req.body.total || 0),
      pagado:    0,
      productos: req.body.productos || [],
      pagos:     [],
      fecha:     req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };
    const resultado = await db.collection('deudas').add(nueva);
    res.json({ _id: resultado.id, ...nueva });
  } catch (err) {
    res.status(500).json({ error: "Error al crear deuda" });
  }
});

app.post('/deudas/pagar', async (req, res) => {
  try {
    const docRef = db.collection('deudas').doc(req.body.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.json({ error: "Deuda no encontrada" });

    const deuda   = doc.data();
    const monto   = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    const restante = deuda.total - deuda.pagado;
    if (monto > restante) return res.json({ error: "No puedes pagar más de la deuda" });

    deuda.pagado += monto;
    if (!deuda.pagos) deuda.pagos = [];
    deuda.pagos.push({ monto, fecha: new Date().toISOString() });
    await docRef.update(deuda);

    const cajasSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!cajasSnapshot.empty) {
      const cajaRef = cajasSnapshot.docs[0].ref;
      const caja    = cajasSnapshot.docs[0].data();
      const metodoPago  = req.body.metodoPago  || "efectivo";
      const banco       = req.body.banco       || "";
      const comprobante = req.body.comprobante || "";

      caja.ingresos = (caja.ingresos || 0) + monto;
      if (!caja.movimientos) caja.movimientos = [];

      if (metodoPago === "transferencia") {
        caja.movimientos.push({ tipo: "transferencia", monto, motivo: `Abono deuda — ${deuda.cliente}`, banco, comprobante, remitente: deuda.cliente || "", fecha: new Date().toISOString() });
      } else {
        caja.movimientos.push({ tipo: "ingreso", monto, motivo: `Abono deuda efectivo — ${deuda.cliente}`, fecha: new Date().toISOString() });
      }
      await cajaRef.update(caja);
    }

    res.json({
      cliente:  deuda.cliente,
      cedula:   deuda.cedula   || "-",
      celular:  deuda.celular  || "",
      monto,
      total:    deuda.total,
      restante: deuda.total - deuda.pagado,
      pagado:   deuda.pagado,
      pagos:    deuda.pagos    || [],
      productos: deuda.productos || []
    });
  } catch (err) {
    res.status(500).json({ error: "Error al abonar" });
  }
});

app.put('/deudas/:id', async (req, res) => {
  try {
    const docRef = db.collection('deudas').doc(req.params.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Deuda no encontrada" });

    const deuda = doc.data();
    if (req.body.cliente   !== undefined) deuda.cliente   = req.body.cliente;
    if (req.body.cedula    !== undefined) deuda.cedula    = req.body.cedula;
    if (req.body.celular   !== undefined) deuda.celular   = req.body.celular;
    if (req.body.direccion !== undefined) deuda.direccion = req.body.direccion;
    if (req.body.total     !== undefined) deuda.total     = Number(req.body.total);
    if (req.body.productos !== undefined) deuda.productos = req.body.productos;
    if (req.body.pagado    !== undefined) deuda.pagado    = Number(req.body.pagado);
    if (req.body.pagos     !== undefined) deuda.pagos     = req.body.pagos;

    await docRef.update(deuda);
    res.json({ ok: true, deuda: { _id: docRef.id, ...deuda } });
  } catch (err) {
    res.status(500).json({ error: "Error al editar deuda" });
  }
});

app.delete('/deudas/:id', async (req, res) => {
  try {
    await db.collection('deudas').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// ================== CAJA ==================
app.post('/caja/abrir', async (req, res) => {
  try {
    const monto = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    const abiertaSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!abiertaSnapshot.empty) {
      await abiertaSnapshot.docs[0].ref.update({ activa: false, horaCierre: new Date().toISOString() });
    }

    await db.collection('cajas').add({
      apertura: monto, ingresos: 0, gastos: 0, activa: true,
      horaApertura: new Date().toISOString(),
      movimientos: [{ tipo: "inicio", monto, motivo: "Apertura de caja", fecha: new Date().toISOString() }]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al abrir caja" });
  }
});

app.get('/caja', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ apertura: 0, ingresos: 0, gastos: 0, transferencias: 0, saldo: 0 });

    const caja = snapshot.docs[0].data();
    let transferencias = 0;
    const gastosLista = [], transferenciasList = [];

    (caja.movimientos || []).forEach(m => {
      if (m.tipo === "transferencia") { transferencias += m.monto; transferenciasList.push(m); }
      if (m.tipo === "gasto") gastosLista.push(m);
    });

    res.json({
      apertura: caja.apertura, ingresos: caja.ingresos, transferencias,
      gastos: caja.gastos, saldo: caja.apertura + caja.ingresos - caja.gastos,
      horaApertura: caja.horaApertura, gastosLista, transferenciasList,
      movimientos: caja.movimientos || []
    });
  } catch (err) {
    res.json({ apertura: 0, ingresos: 0, gastos: 0, transferencias: 0, saldo: 0 });
  }
});

app.post('/caja/gasto', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "Caja no abierta" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const monto  = Number(req.body.monto || 0);
    const motivo = req.body.motivo || "Sin motivo";
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    caja.gastos = (caja.gastos || 0) + monto;
    if (!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({ tipo: "gasto", monto, motivo, fecha: new Date().toISOString() });
    await docRef.update(caja);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar gasto" });
  }
});

app.post('/caja/transferencia', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "Caja no abierta" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const monto  = Number(req.body.monto || 0);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    caja.ingresos = (caja.ingresos || 0) + monto;
    if (!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({
      tipo: "transferencia", monto,
      motivo: `Transferencia ${req.body.banco || ""}`,
      banco: req.body.banco || "", cuenta: req.body.cuenta || "",
      comprobante: req.body.comprobante || "", remitente: req.body.remitente || "",
      fecha: new Date().toISOString()
    });
    await docRef.update(caja);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar transferencia" });
  }
});

app.post('/caja/cerrar', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "Caja no abierta" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const real   = Number(req.body.montoReal);
    const dejar  = Number(req.body.dejar || 0);
    const esperado  = caja.apertura + caja.ingresos - caja.gastos;
    const diferencia = real - esperado;

    let transferencias = 0;
    const gastosLista = [], transferenciasList = [];
    (caja.movimientos || []).forEach(m => {
      if (m.tipo === "gasto")         gastosLista.push(m);
      if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
    });

    caja.activa     = false;
    caja.cierre     = real;
    caja.horaCierre = new Date().toISOString();
    caja.dejado     = dejar;
    caja.movimientos.push({ tipo: "cierre", monto: real, motivo: `Cierre de caja | Dejado: $${dejar}`, fecha: new Date().toISOString() });
    await docRef.update(caja);

    if (dejar > 0) {
      await db.collection('cajas').add({
        apertura: dejar, ingresos: 0, gastos: 0, activa: true,
        horaApertura: new Date().toISOString(),
        movimientos: [{ tipo: "inicio", monto: dejar, motivo: "Apertura automática", fecha: new Date().toISOString() }]
      });
    }

    res.json({ apertura: caja.apertura, ingresos: caja.ingresos, transferencias, gastos: caja.gastos, esperado, real, diferencia, dejar, fechaApertura: caja.horaApertura, fechaCierre: caja.horaCierre, gastosLista, transferenciasList });
  } catch (err) {
    res.status(500).json({ error: "Error al cerrar caja" });
  }
});

app.get('/caja/historial', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas')
      .where('activa', '==', false)
      .orderBy('horaCierre', 'desc')
      .limit(50)
      .get();

    const historial = mapearDocs(snapshot).map(c => {
      let transferencias = 0;
      const gastosLista = [], transferenciasList = [];
      (c.movimientos || []).forEach(m => {
        if (m.tipo === "gasto")         gastosLista.push(m);
        if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
      });
      return {
        fechaApertura: c.horaApertura, fechaCierre: c.horaCierre,
        apertura: c.apertura, ingresos: c.ingresos, transferencias,
        gastos: c.gastos, real: c.cierre,
        diferencia: c.cierre - (c.apertura + c.ingresos - c.gastos),
        dejar: c.dejado || 0, gastosLista, transferenciasList
      };
    });

    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// ================== ANÁLISIS ==================
app.get('/analisis', async (req, res) => {
  try {
    const snapshot = await db.collection('ventas').get();
    const ventas   = mapearDocs(snapshot);

    let totalGeneral = 0, efectivo = 0, credito = 0, transferencia = 0;
    const productos = {}, porDia = {}, porMes = {};

    ventas.forEach(v => {
      const total = Number(v.total || 0);
      totalGeneral += total;
      if (v.tipo === "efectivo")      efectivo++;
      if (v.tipo === "credito")       credito++;
      if (v.tipo === "transferencia") transferencia++;

      let dia = "Desconocido", mes = "Desconocido";
      try { if (v.fecha) { dia = v.fecha.split("T")[0]; mes = v.fecha.slice(0, 7); } } catch (_) {}

      porDia[dia] = (porDia[dia] || 0) + total;
      porMes[mes] = (porMes[mes] || 0) + total;

      if (Array.isArray(v.productos)) {
        v.productos.forEach(p => {
          const nombre   = p.nombre   || "Sin nombre";
          const cantidad = Number(p.cantidad || 1);
          const precio   = Number(p.precio   || 0);
          const costo    = Number(p.costo    || 0);
          const ganancia = (precio - costo) * cantidad;
          if (!productos[nombre]) productos[nombre] = { nombre, vendidos: 0, ganancia: 0 };
          productos[nombre].vendidos += cantidad;
          productos[nombre].ganancia += ganancia;
        });
      }
    });

    const lista        = Object.values(productos);
    const masVendidos  = [...lista].sort((a, b) => b.vendidos  - a.vendidos ).slice(0, 5);
    const menosVendidos= [...lista].sort((a, b) => a.vendidos  - b.vendidos ).slice(0, 5);
    const masGanancia  = [...lista].sort((a, b) => b.ganancia  - a.ganancia ).slice(0, 5);
    const menosGanancia= [...lista].sort((a, b) => a.ganancia  - b.ganancia ).slice(0, 5);
    const clientesUnicos = new Set(ventas.map(v => v.cedula || v.cliente)).size;

    res.json({ ventas, totalGeneral, efectivo, credito, transferencia, clientes: clientesUnicos, porDia, porMes, masVendidos, menosVendidos, masGanancia, menosGanancia });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener análisis" });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en el puerto " + PORT);
});
