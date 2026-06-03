require('dotenv').config();

const express = require('express');
const admin = require('firebase-admin'); // 1. Cambiamos NeDB por Firebase

const app = express();

// Configuración CORS — acepta cualquier origen, incluyendo file:// (origin: null)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.static('.'));

// ================== CONEXIÓN A FIREBASE CLOUD FIRESTORE ==================
// Cargamos tu archivo JSON con la clave privada de Google
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
console.log("✅ ¡Conectado exitosamente a Firebase Cloud Firestore en la nube!");

// Helper para mapear los documentos de Firebase trayendo su ID único de Google (_id)
const mapearDocs = (snapshot) => {
  const docs = [];
  snapshot.forEach(doc => {
    docs.push({ _id: doc.id, ...doc.data() });
  });
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
    const nuevoStock = (p.stock || 0) + Number(req.body.cantidad);

    await docRef.update({ stock: nuevoStock });
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
    const nuevoCliente = {
      nombre: req.body.nombre,
      cedula: req.body.cedula,
      direccion: req.body.direccion,
      telefono: req.body.telefono,
      correo: req.body.correo,
      deudaTotal: Number(req.body.deudaTotal || 0),
      deudaActual: Number(req.body.deudaActual || 0),
      estado: req.body.estado || "normal",
      fecha: req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };

    const resultado = await db.collection('clientes').add(nuevoCliente);
    res.json({ ok: true, cliente: { _id: resultado.id, ...nuevoCliente } });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar cliente" });
  }
});

app.get('/clientes', async (req, res) => {
  try {
    // Firebase ordena con .orderBy
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

    const deudaTotal = (cliente.deudaTotal || 0) + Number(total);
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
app.post('/ventas', async (req, res) => {
  try {
    const nuevaVenta = {
      ...req.body,
      fecha: req.body.fecha ? new Date(req.body.fecha).toISOString() : new Date().toISOString()
    };

    await db.collection('ventas').add(nuevaVenta);

    // Manejo de Cajas
    const cajasSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!cajasSnapshot.empty) {
      const cajaRef = cajasSnapshot.docs[0].ref;
      const caja = cajasSnapshot.docs[0].data();

      if (req.body.tipo === "efectivo" || req.body.tipo === "transferencia") {
        caja.ingresos = (caja.ingresos || 0) + Number(req.body.total || 0);
        if (!caja.movimientos) caja.movimientos = [];

        if (req.body.tipo === "efectivo") {
          caja.movimientos.push({
            tipo: "ingreso", monto: req.body.total, motivo: "Venta efectivo", fecha: new Date().toISOString()
          });
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
        cliente: req.body.cliente,
        cedula: req.body.cedula || "SIN CÉDULA",
        celular: req.body.celular || "",
        correo: req.body.correo || "",
        direccion: req.body.direccion || "",
        total: req.body.total,
        pagado: 0,
        productos: req.body.productos || [],
        pagos: [],
        fecha: new Date().toISOString()
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
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Venta no encontrada" });

    const venta = doc.data();
    const indice = Number(req.params.indice);
    if (isNaN(indice) || indice < 0 || indice >= venta.productos.length) {
      return res.status(400).json({ error: "Índice inválido" });
    }

    venta.productos.splice(indice, 1);

    if (venta.productos.length === 0) {
      await docRef.delete();
      return res.json({ msg: "Venta eliminada (quedó sin productos)" });
    } else {
      venta.total = venta.productos.reduce((sum, p) => {
        return sum + (Number(p.precio || 0) * Number(p.cantidad || 1));
      }, 0);

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
    const fin = new Date(fecha + "T23:59:59.999Z").toISOString();

    // Firebase permite filtrar rangos de strings con ISOString directamente
    const snapshot = await db.collection('ventas')
      .where('fecha', '>=', inicio)
      .where('fecha', '<=', fin)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
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
      cliente: req.body.cliente || "",
      cedula: req.body.cedula || "-",
      celular: req.body.celular || "",
      direccion: req.body.direccion || "",
      correo: req.body.correo || "",
      total: Number(req.body.total || 0),
      pagado: 0,
      productos: req.body.productos || [],
      pagos: [],
      fecha: new Date().toISOString()
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
    const doc = await docRef.get();
    if (!doc.exists) return res.json({ error: "Deuda no encontrada" });

    const deuda = doc.data();
    const monto = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    const restante = deuda.total - deuda.pagado;
    if (monto > restante) return res.json({ error: "No puedes pagar más de la deuda" });

    deuda.pagado += monto;
    if (!deuda.pagos) deuda.pagos = [];
    deuda.pagos.push({ monto, fecha: new Date().toISOString() });

    await docRef.update(deuda);

    // Registrar abono en la caja activa si existe
    const cajasSnapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (!cajasSnapshot.empty) {
      const cajaRef = cajasSnapshot.docs[0].ref;
      const caja = cajasSnapshot.docs[0].data();

      const metodoPago = req.body.metodoPago || "efectivo";
      const banco = req.body.banco || "";
      const comprobante = req.body.comprobante || "";

      caja.ingresos = (caja.ingresos || 0) + monto;
      if (!caja.movimientos) caja.movimientos = [];

      if (metodoPago === "transferencia") {
        caja.movimientos.push({
          tipo: "transferencia",
          monto,
          motivo: `Abono deuda — ${deuda.cliente}`,
          banco,
          comprobante,
          remitente: deuda.cliente || "",
          fecha: new Date().toISOString()
        });
      } else {
        caja.movimientos.push({
          tipo: "ingreso",
          monto,
          motivo: `Abono deuda efectivo — ${deuda.cliente}`,
          fecha: new Date().toISOString()
        });
      }
      await cajaRef.update(caja);
    }

    res.json({
      cliente: deuda.cliente,
      cedula: deuda.cedula || "-",
      celular: deuda.celular || "",
      monto,
      total: deuda.total,
      restante: deuda.total - deuda.pagado,
      pagado: deuda.pagado,
      pagos: deuda.pagos || [],
      productos: deuda.productos || []
    });
  } catch (err) {
    res.status(500).json({ error: "Error al abonar" });
  }
});

app.put('/deudas/:id', async (req, res) => {
  try {
    const docRef = db.collection('deudas').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Deuda no encontrada" });

    const deuda = doc.data();
    if (req.body.cliente !== undefined) deuda.cliente = req.body.cliente;
    if (req.body.cedula !== undefined) deuda.cedula = req.body.cedula;
    if (req.body.celular !== undefined) deuda.celular = req.body.celular;
    if (req.body.direccion !== undefined) deuda.direccion = req.body.direccion;
    if (req.body.total !== undefined) deuda.total = Number(req.body.total);
    if (req.body.productos !== undefined) deuda.productos = req.body.productos;
    if (req.body.pagado !== undefined) deuda.pagado = Number(req.body.pagado);
    if (req.body.pagos !== undefined) deuda.pagos = req.body.pagos;

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
    res.status(500).json({ error: "Error al eliminar deuda" });
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

    const nuevaCaja = {
      apertura: monto,
      ingresos: 0,
      gastos: 0,
      activa: true,
      horaApertura: new Date().toISOString(),
      movimientos: [{ tipo: "inicio", monto, motivo: "Apertura de caja", fecha: new Date().toISOString() }]
    };

    await db.collection('cajas').add(nuevaCaja);
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
    let gastosLista = [];
    let transferenciasList = [];

    (caja.movimientos || []).forEach(m => {
      if (m.tipo === "transferencia") {
        transferencias += m.monto;
        transferenciasList.push(m);
      }
      if (m.tipo === "gasto") {
        gastosLista.push(m);
      }
    });

    res.json({
      apertura: caja.apertura,
      ingresos: caja.ingresos,
      transferencias,
      gastos: caja.gastos,
      saldo: caja.apertura + caja.ingresos - caja.gastos,
      horaApertura: caja.horaApertura,
      gastosLista,
      transferenciasList,
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
    const caja = snapshot.docs[0].data();

    const monto = Number(req.body.monto || 0);
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
    const caja = snapshot.docs[0].data();

    const monto = Number(req.body.monto || 0);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    caja.ingresos = (caja.ingresos || 0) + monto;
    if (!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({
      tipo: "transferencia",
      monto,
      motivo: `Transferencia ${req.body.banco || ""}`,
      banco: req.body.banco || "",
      cuenta: req.body.cuenta || "",
      comprobante: req.body.comprobante || "",
      remitente: req.body.remitente || "",
      fecha: new Date().toISOString()
    });

    await docRef.update(caja);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar transferencia" });
  }
});

// ================== CIERRE CAJA ==================
app.post('/caja/cerrar', async (req, res) => {
  try {
    const snapshot = await db.collection('cajas').where('activa', '==', true).get();
    if (snapshot.empty) return res.json({ error: "Caja no abierta" });

    const docRef = snapshot.docs[0].ref;
    const caja = snapshot.docs[0].data();

    const real = Number(req.body.montoReal);
    const dejar = Number(req.body.dejar || 0);

    const esperado = caja.apertura + caja.ingresos - caja.gastos;
    const diferencia = real - esperado;

    let transferencias = 0;
    const gastosLista = [];
    const transferenciasList = [];

    (caja.movimientos || []).forEach(m => {
      if (m.tipo === "gasto") gastosLista.push(m);
      if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
    });

    caja.activa = false;
    caja.cierre = real;
    caja.horaCierre = new Date().toISOString();
    caja.dejado = dejar;
    caja.movimientos.push({
      tipo: "cierre", monto: real,
      motivo: `Cierre de caja | Dejado: $${dejar}`,
      fecha: new Date().toISOString()
    });

    await docRef.update(caja);

    if (dejar > 0) {
      await db.collection('cajas').add({
        apertura: dejar,
        ingresos: 0,
        gastos: 0,
        activa: true,
        horaApertura: new Date().toISOString(),
        movimientos: [{ tipo: "inicio", monto: dejar, motivo: "Apertura automática", fecha: new Date().toISOString() }]
      });
    }

    res.json({
      apertura: caja.apertura,
      ingresos: caja.ingresos,
      transferencias,
      gastos: caja.gastos,
      esperado,
      real,
      diferencia,
      dejar,
      fechaApertura: caja.horaApertura,
      fechaCierre: caja.horaCierre,
      gastosLista,
      transferenciasList
    });
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
      const gastosLista = [];
      const transferenciasList = [];

      (c.movimientos || []).forEach(m => {
        if (m.tipo === "gasto") gastosLista.push(m);
        if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
      });

      return {
        fechaApertura: c.horaApertura,
        fechaCierre: c.horaCierre,
        apertura: c.apertura,
        ingresos: c.ingresos,
        transferencias,
        gastos: c.gastos,
        real: c.cierre,
        diferencia: c.cierre - (c.apertura + c.ingresos - c.gastos),
        dejar: c.dejado || 0,
        gastosLista,
        transferenciasList
      };
    });

    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// ================== ANÁLISIS / DASHBOARD ==================
app.get('/analisis', async (req, res) => {
  try {
    const snapshot = await db.collection('ventas').get();
    const ventas = mapearDocs(snapshot);

    let totalGeneral = 0;
    let efectivo = 0;
    let credito = 0;
    let transferencia = 0;

    const productos = {};
    const porDia = {};
    const porMes = {};

    ventas.forEach(v => {
      const total = Number(v.total || 0);
      totalGeneral += total;

      if (v.tipo === "efectivo") efectivo++;
      if (v.tipo === "credito") credito++;
      if (v.tipo === "transferencia") transferencia++;

      let dia = "Desconocido";
      let mes = "Desconocido";
      try {
        if (v.fecha) {
          dia = v.fecha.split("T")[0];
          mes = v.fecha.slice(0, 7);
        }
      } catch (e) {}

      porDia[dia] = (porDia[dia] || 0) + total;
      porMes[mes] = (porMes[mes] || 0) + total;

      if (Array.isArray(v.productos)) {
        v.productos.forEach(p => {
          const nombre = p.nombre || "Sin nombre";
          const cantidad = Number(p.cantidad || 1);
          const precio = Number(p.precio || 0);
          const costo = Number(p.costo || 0);
          const ganancia = (precio - costo) * cantidad;

          if (!productos[nombre]) {
            productos[nombre] = { nombre, vendidos: 0, ganancia: 0 };
          }
          productos[nombre].vendidos += cantidad;
          productos[nombre].ganancia += ganancia;
        });
      }
    });

    const lista = Object.values(productos);

    const masVendidos = [...lista].sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
    const menosVendidos = [...lista].sort((a, b) => a.vendidos - b.vendidos).slice(0, 5);
    const masGanancia = [...lista].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
    const menosGanancia = [...lista].sort((a, b) => a.ganancia - b.ganancia).slice(0, 5);

    const clientesUnicos = new Set(ventas.map(v => v.cedula || v.cliente)).size;

    res.json({
      ventas,
      totalGeneral,
      efectivo,
      credito,
      transferencia,
      clientes: clientesUnicos,
      porDia,
      porMes,
      masVendidos,
      menosVendidos,
      masGanancia,
      menosGanancia
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener análisis" });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en el puerto " + PORT);
});
