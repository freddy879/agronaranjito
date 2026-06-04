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

// =========================================================================
// 1. CONFIGURACIÓN DE FIREBASE ADMIN SDK
// =========================================================================
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ ERROR CRÍTICO: La variable de entorno FIREBASE_SERVICE_ACCOUNT no está configurada.");
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log("✅ ¡Conectado exitosamente a Firebase Cloud Firestore!");
} catch (error) {
  console.error("❌ Error crítico al procesar FIREBASE_SERVICE_ACCOUNT:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// =========================================================================
// 2. CONFIGURACIÓN DE NODEMAILER CON BREVO SMTP (DATOS REALES)
// =========================================================================
transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true, // true para usar SSL directo en el puerto 465
    auth: {
      user: 'ad85ef001@smtp-brevo.com',
      pass: process.env.BREVO_SMTP_KEY
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  transporter.verify((err) => {
    if (err) {
      console.warn("⚠️ Brevo SMTP error de verificación:", err.message);
    } else {
      console.log("📧 Relay Brevo SMTP listo para despachar facturas a clientes.");
    }
  });
} else {
  console.warn("⚠️ BREVO_SMTP_KEY no configurado en Render. Envío de correos inhabilitado.");
}

// ── Helper: Generación dinámica del cuerpo HTML del comprobante ───────────
function generarHTMLCorreo(datos, carrito, tipoPago) {
  const {
    cliente, cedula, subtotal, pct, descuentoMonto, totalFinal,
    tasaPct, montoInteres, meses, pago, vuelto,
    bancoNombre, bancoCuenta, comprobante
  } = datos;

  const fecha = new Date().toLocaleString("es-EC", { dateStyle: "long", timeStyle: "short" });

  const filas = (carrito || []).map(p => `
    <tr>
      <td style="padding:8px 10px; border-bottom:1px solid #f0f0f0; text-align:left;">${p.nombre}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #f0f0f0; text-align:center;">${p.amount || p.cantidad}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #f0f0f0; text-align:right;">$${Number(p.precio).toFixed(2)}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #f0f0f0; text-align:right; font-weight:bold;">$${(Number(p.precio) * Number(p.amount || p.cantidad)).toFixed(2)}</td>
    </tr>
  `).join("");

  let detallePago = "";
  if (tipoPago === "efectivo") {
    detallePago = `
      <tr><td style="padding:4px 0; color:#555;">Monto Recibido</td><td style="text-align:right; font-weight:500;">$${Number(pago).toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Vuelto Entregado</td><td style="text-align:right; font-weight:500;">$${Number(vuelto).toFixed(2)}</td></tr>
    `;
  } else if (tipoPago === "transferencia") {
    detallePago = `
      <tr><td style="padding:4px 0; color:#555;">Entidad Bancaria</td><td style="text-align:right; font-weight:500;">${bancoNombre}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Nº de Cuenta</td><td style="text-align:right; font-family:monospace;">${bancoCuenta}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Nº Referencia / Código</td><td style="text-align:right; font-weight:bold; color:#1e272e;">${comprobante}</td></tr>
    `;
  } else if (tipoPago === "credito") {
    detallePago = `
      <tr><td style="padding:4px 0; color:#555;">Tasa Diferido (${tasaPct}%)</td><td style="text-align:right; color:#e67e22;">+$${Number(montoInteres).toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0; color:#555;">Plazo Acordado</td><td style="text-align:right; font-weight:500;">${meses} meses</td></tr>
    `;
  }

  const descuentoRow = Number(pct) > 0 ? `
    <tr>
      <td style="padding:4px 0; color:#555;">Subtotal Bruto</td>
      <td style="text-align:right;">$${Number(subtotal).toFixed(2)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0; color:#e03329;">Descuento Aplicado (${pct}%)</td>
      <td style="text-align:right; color:#e03329; font-weight:500;">-$${Number(descuentoMonto).toFixed(2)}</td>
    </tr>
  ` : "";

  const tipoBadgeColor = tipoPago === "efectivo" ? "#27ae60" : tipoPago === "transferencia" ? "#2980b9" : "#e67e22";

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0; padding:0; background-color:#f5f6fa; font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6fa; padding:30px 0;">
      <tr><td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#ff3f34; padding:26px 30px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:1px; font-weight:700;">AGRO NARANJITO #1</h1>
              <p style="margin:4px 0 0; color:rgba(255,255,255,0.85); font-size:13px;">Comprobante Digital de Venta · ${fecha}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 30px 10px;">
              <p style="margin:0 0 4px; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.5px;">Titular del Documento</p>
              <p style="margin:0; font-size:17px; font-weight:600; color:#1e272e;">${cliente || "Consumidor Final"}</p>
              ${cedula ? `<p style="margin:4px 0 0; font-size:13px; color:#555;"><b>RUC / Cédula:</b> ${cedula}</p>` : ""}
              <span style="display:inline-block; margin-top:10px; padding:4px 14px; background-color:${tipoBadgeColor}; color:#ffffff; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.3px;">${tipoPago}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:15px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:5px;">
                <thead>
                  <tr style="background-color:#f8f9fa;">
                    <th style="padding:10px; text-align:left; font-size:12px; color:#777; font-weight:600; text-transform:uppercase; border-bottom:1px solid #ddd;">Detalle</th>
                    <th style="padding:10px; text-align:center; font-size:12px; color:#777; font-weight:600; text-transform:uppercase; border-bottom:1px solid #ddd; width:50px;">Cant.</th>
                    <th style="padding:10px; text-align:right; font-size:12px; color:#777; font-weight:600; text-transform:uppercase; border-bottom:1px solid #ddd; width:80px;">P. Unit</th>
                    <th style="padding:10px; text-align:right; font-size:12px; color:#777; font-weight:600; text-transform:uppercase; border-bottom:1px solid #ddd; width:90px;">Total</th>
                  </tr>
                </thead>
                <tbody>${filas}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 30px 25px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${descuentoRow}
                ${detallePago}
                <tr>
                  <td colspan="2"><hr style="border:none; border-top:2px dashed #f0f0f0; margin:12px 0;"></td>
                </tr>
                <tr>
                  <td style="font-size:16px; font-weight:700; color:#1e272e;">IMPORTE NETO RECAUDADO</td>
                  <td style="text-align:right; font-size:22px; font-weight:700; color:#ff3f34;">$${Number(totalFinal).toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa; padding:20px 30px; text-align:center; border-top:1px solid #f0f0f0;">
              <p style="margin:0; font-size:14px; color:#2c3e50; font-weight:500;">¡Gracias por depositar su confianza en nosotros! 😊</p>
              <p style="margin:4px 0 0; font-size:11px; color:#7f8c8d;">Agro Naranjito #1 · Nota: Este documento digital es un comprobante automático de caja.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

const mapearDocs = (snapshot) => {
  const docs = [];
  snapshot.forEach(doc => docs.push({ _id: doc.id, ...doc.data() }));
  return docs;
};

// =========================================================================
// 3. ENDPOINTS API REST
// =========================================================================

app.get('/health', (req, res) => {
  res.json({ ok: true, message: "NEXUS Core Engine activo", time: new Date() });
});

app.get('/productos', async (req, res) => {
  try {
    const snapshot = await db.collection('productos').get();
    res.json(mapearDocs(snapshot));
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.json([]);
  }
});

app.post('/productos', async (req, res) => {
  try {
    await db.collection('productos').add(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno al crear producto" });
  }
});

app.put('/productos/:id', async (req, res) => {
  try {
    await db.collection('productos').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno al editar propiedades del producto" });
  }
});

app.put('/productos/agregar/:id', async (req, res) => {
  try {
    const docRef = db.collection('productos').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Documento objetivo inexistente" });
    const p = doc.data();
    await docRef.update({ stock: (p.stock || 0) + Number(req.body.cantidad) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno al reaprovisionar stock" });
  }
});

app.put('/productos/vender/:id', async (req, res) => {
  try {
    const docRef = db.collection('productos').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "El producto no existe en el catálogo" });
    const p = doc.data();
    let nuevoStock = (p.stock || 0) - Number(req.body.cantidad);
    if (nuevoStock < 0) nuevoStock = 0;
    await docRef.update({ stock: nuevoStock });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error de inventario al procesar el descuento posventa" });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    await db.collection('productos').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno al purgar producto" });
  }
});

app.post('/clientes', async (req, res) => {
  try {
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
    console.error("❌ Error registrando cliente:", err);
    res.status(500).json({ error: "Error de persistencia", detalle: err.message });
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
    if (snapshot.empty) return res.status(404).json({ error: "Cliente no registrado en la base de datos" });
    const docRef = snapshot.docs[0].ref;
    const cliente = snapshot.docs[0].data();
    const deudaTotal  = (cliente.deudaTotal  || 0) + Number(total);
    const deudaActual = (cliente.deudaActual || 0) + Number(total);
    await docRef.update({ deudaTotal, deudaActual, estado: "deudor" });
    res.json({ ok: true, cliente: { _id: docRef.id, ...cliente, deudaTotal, deudaActual, estado: "deudor" } });
  } catch (err) {
    res.status(500).json({ error: "Error crítico al cargar línea de crédito" });
  }
});

app.post('/clientes/abonar', async (req, res) => {
  try {
    const { cedula, monto } = req.body;
    const snapshot = await db.collection('clientes').where('cedula', '==', cedula).get();
    if (snapshot.empty) return res.status(404).json({ error: "Titular no encontrado" });
    const docRef = snapshot.docs[0].ref;
    const cliente = snapshot.docs[0].data();
    let deudaActual = (cliente.deudaActual || 0) - Number(monto);
    let estado = cliente.estado;
    if (deudaActual <= 0) { deudaActual = 0; estado = "normal"; }
    await docRef.update({ deudaActual, estado });
    res.json({ ok: true, cliente: { _id: docRef.id, ...cliente, deudaActual, estado } });
  } catch (err) {
    res.status(500).json({ error: "Error de red al aplicar abono parcial" });
  }
});

app.put('/clientes/editar', async (req, res) => {
  try {
    const { id, nombre, cedula, telefono, correo } = req.body;
    await db.collection('clientes').doc(id).update({ nombre, cedula, telefono, correo });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al refrescar ficha de cliente" });
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
    res.status(500).json({ error: "No se pudo eliminar el cliente seleccionado" });
  }
});

// --- CORREO ---
app.post('/correo/factura', async (req, res) => {
  console.log("📨 Petición entrante POST /correo/factura para:", req.body?.correo);
  const { correo, datos, carrito, tipoPago } = req.body;

  if (!correo) {
    return res.status(400).json({ error: "La dirección de correo destinataria es obligatoria." });
  }
  if (!transporter) {
    return res.status(503).json({ error: "El servicio SMTP de Brevo no está configurado o inicializado." });
  }

  try {
    const htmlFactura = generarHTMLCorreo(datos, carrito, tipoPago);
    const subject     = `🧾 Comprobante Digital — ${datos?.cliente || "Cliente"} · Total: $${Number(datos?.totalFinal || 0).toFixed(2)}`;

    await transporter.sendMail({
      from: '"Agro Naranjito #1" <ad85ef001@smtp-brevo.com>',
      to:      correo,
      subject,
      html:    htmlFactura
    });

    console.log(`📧 Factura despachada con éxito a: ${correo}`);
    res.json({ ok: true, mensaje: `Correo enviado satisfactoriamente a ${correo}` });
  } catch (err) {
    console.error("❌ Error crítico en Brevo SMTP:", err.message);
    res.status(500).json({ error: "Fallo crítico al despachar correo electrónico.", detalle: err.message });
  }
});

app.post('/ventas', async (req, res) => {
  try {
    const nuevaVenta = {
      ...req.body,
      fecha: req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };

    await db.collection('ventas').add(nuevaVenta);

    const cajasSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!cajasSnapshot.empty) {
      const cajaRef = cajasSnapshot.docs[0].ref;
      const caja    = cajasSnapshot.docs[0].data();

      if (req.body.tipo === "efectivo" || req.body.tipo === "transferencia") {
        caja.ingresos = (caja.ingresos || 0) + Number(req.body.total || 0);
        if (!caja.movimientos) caja.movimientos = [];

        if (req.body.tipo === "efectivo") {
          caja.movimientos.push({ tipo: "ingreso", monto: req.body.total, motivo: `Venta directa efectivo - Cliente: ${req.body.cliente}`, fecha: new Date().toISOString() });
        } else {
          caja.movimientos.push({
            tipo: "transferencia",
            monto: Number(req.body.total || 0),
            motivo: `Liquidación por Transferencia — ${req.body.banco || ""}`,
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
    res.status(500).json({ error: "Fallo del sistema al asentar venta" });
  }
});

app.delete('/ventas/producto/:ventaId/:indice', async (req, res) => {
  try {
    const docRef = db.collection('ventas').doc(req.params.ventaId);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Registro de transacción no localizado" });

    const venta  = doc.data();
    const indice = Number(req.params.indice);
    if (isNaN(indice) || indice < 0 || indice >= venta.productos.length) {
      return res.status(400).json({ error: "Direccionamiento indexado incorrecto" });
    }

    venta.productos.splice(indice, 1);

    if (venta.productos.length === 0) {
      await docRef.delete();
      return res.json({ msg: "Transacción purgada en su totalidad" });
    } else {
      venta.total = venta.productos.reduce((sum, p) => sum + (Number(p.precio || 0) * Number(p.amount || p.cantidad || 1)), 0);
      await docRef.update({ productos: venta.productos, total: venta.total });
      res.json({ msg: "Item removido e importes recalculados." });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al modificar la venta consolidada" });
  }
});

app.delete('/ventas/dia', async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) return res.status(400).json({ error: "Parámetro fecha ausente" });

    const inicio = new Date(fecha + "T00:00:00.000Z").toISOString();
    const fin    = new Date(fecha + "T23:59:59.999Z").toISOString();

    const snapshot = await db.collection('ventas')
      .where('fecha', '>=', inicio)
      .where('fecha', '<=', fin)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    res.json({ ok: true, msg: `Cierre forzado: ${snapshot.size} venta(s) eliminada(s)`, deleted: snapshot.size });
  } catch (err) {
    res.status(500).json({ error: "Fallo al purgar registros diarios" });
  }
});

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
    res.status(500).json({ error: "No se pudo aperturar la cuenta por cobrar" });
  }
});

app.post('/deudas/pagar', async (req, res) => {
  try {
    const docRef = db.collection('deudas').doc(req.body.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.json({ error: "Cuenta de deuda no localizada" });

    const deuda   = doc.data();
    const monto   = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Importe introducido inválido" });

    const restante = deuda.total - deuda.pagado;
    if (monto > restante) return res.json({ error: "Sobrepago no permitido para el saldo restante" });

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
        caja.movimientos.push({ tipo: "transferencia", monto, motivo: `Abono a Cuenta Diferida — ${deuda.cliente}`, banco, comprobante, remitente: deuda.cliente || "", fecha: new Date().toISOString() });
      } else {
        caja.movimientos.push({ tipo: "ingreso", monto, motivo: `Abono Efectivo Deuda — ${deuda.cliente}`, fecha: new Date().toISOString() });
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
    res.status(500).json({ error: "Fallo crítico al asentar amortización" });
  }
});

app.put('/deudas/:id', async (req, res) => {
  try {
    const docRef = db.collection('deudas').doc(req.params.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Cuenta no encontrada" });

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
    res.status(500).json({ error: "Fallo técnico al editar balance de deuda" });
  }
});

app.delete('/deudas/:id', async (req, res) => {
  try {
    await db.collection('deudas').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error de borrado" });
  }
});

app.post('/caja/abrir', async (req, res) => {
  try {
    const monto = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Capital inicial de apertura no válido" });

    const abiertaSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!abiertaSnapshot.empty) {
      await abiertaSnapshot.docs[0].ref.update({ activa: false, horaCierre: new Date().toISOString() });
    }

    await db.collection('cajas').add({
      apertura: monto, ingresos: 0, gastos: 0, activa: true,
      horaApertura: new Date().toISOString(),
      movimientos: [{ tipo: "inicio", monto, motivo: "Apertura operativa de caja", fecha: new Date().toISOString() }]
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error crítico al perturbar estado de caja" });
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
    if (snapshot.empty) return res.json({ error: "Ninguna terminal de caja se encuentra activa" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const monto  = Number(req.body.monto || 0);
    const motivo = req.body.motivo || "Gasto misceláneo de caja";
    if (!monto || monto <= 0) return res.json({ error: "Importe inválido" });

    caja.gastos = (caja.gastos || 0) + monto;
    if (!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({ tipo: "gasto", monto, motivo, fecha: new Date().toISOString() });
    await docRef.update(caja);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error de red al consolidar débito" });
  }
});

app.post('/caja/transferencia', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "La caja se encuentra cerrada" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const monto  = Number(req.body.monto || 0);
    if (!monto || monto <= 0) return res.json({ error: "Importe bancario fuera de rango" });

    caja.ingresos = (caja.ingresos || 0) + monto;
    if (!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({
      tipo: "transferencia", monto,
      motivo: `Ingreso directo por transferencia - ${req.body.banco || ""}`,
      banco: req.body.banco || "", cuenta: req.body.cuenta || "",
      comprobante: req.body.comprobante || "", remitente: req.body.remitente || "",
      fecha: new Date().toISOString()
    });
    await docRef.update(caja);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Fallo de comunicación en asiento bancario" });
  }
});

app.post('/caja/cerrar', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "No hay actividades vigentes en caja" });

    const docRef = snapshot.docs[0].ref;
    const caja   = snapshot.docs[0].data();
    const real   = Number(req.body.montoReal);
    const dejar  = Number(req.body.dejar || 0);
    const esperado   = caja.apertura + caja.ingresos - caja.gastos;
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
    caja.movimientos.push({ tipo: "cierre", monto: real, motivo: `Cierre contable de jornada | Fondo retenido: $${dejar}`, fecha: new Date().toISOString() });
    await docRef.update(caja);

    if (dejar > 0) {
      await db.collection('cajas').add({
        apertura: dejar, ingresos: 0, gastos: 0, activa: true,
        horaApertura: new Date().toISOString(),
        movimientos: [{ tipo: "inicio", monto: dejar, motivo: "Fondo de apertura automático poscierre", fecha: new Date().toISOString() }]
      });
    }

    res.json({ apertura: caja.apertura, ingresos: caja.ingresos, transferencias, gastos: caja.gastos, esperado, real, diferencia, dejar, fechaApertura: caja.horaApertura, fechaCierre: caja.horaCierre, gastosLista, transferenciasList });
  } catch (err) {
    res.status(500).json({ error: "Fallo general en protocolo de arqueo" });
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
    res.status(500).json({ error: "Fallo de lectura en base histórica" });
  }
});

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
          const cantidad = Number(p.amount || p.cantidad || 1);
          const precio   = Number(p.precio   || 0);
          const costo    = Number(p.precioCosto || p.costo || 0);
          const ganancia = (precio - costo) * cantidad;

          if (!productos[nombre]) productos[nombre] = { nombre, vendidos: 0, ganancia: 0 };
          productos[nombre].vendidos += cantidad;
          productos[nombre].ganancia += ganancia;
        });
      }
    });

    const lista         = Object.values(productos);
    const masVendidos   = [...lista].sort((a, b) => b.vendidos  - a.vendidos ).slice(0, 5);
    const menosVendidos = [...lista].sort((a, b) => a.vendidos  - b.vendidos ).slice(0, 5);
    const masGanancia   = [...lista].sort((a, b) => b.ganancia  - a.ganancia ).slice(0, 5);
    const menosGanancia = [...lista].sort((a, b) => a.ganancia  - b.ganancia ).slice(0, 5);
    const clientesUnicos = new Set(ventas.map(v => v.cedula || v.cliente)).size;

    res.json({ ventas, totalGeneral, efectivo, credito, transferencia, clientes: clientesUnicos, porDia, porMes, masVendidos, menosVendidos, masGanancia, menosGanancia });
  } catch (err) {
    res.status(500).json({ error: "Fallo al procesar métricas gerenciales de auditoría" });
  }
});

// =========================================================================
// 4. INICIALIZACIÓN
// =========================================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Motor NEXUS encendido en el puerto base asignado: ${PORT}`);
});
