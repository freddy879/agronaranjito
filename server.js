require('dotenv').config();

const express = require('express');
const Datastore = require('@seald-io/nedb');

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
app.use(express.static('public'));

// ================== BASE DE DATOS LOCAL (NeDB) ==================
// Se crean automáticamente archivos .db locales sin necesidad de servidores en la nube
const db = {};
db.productos = new Datastore({ filename: './datos_proyecto/productos.db', autoload: true });
db.ventas    = new Datastore({ filename: './datos_proyecto/ventas.db', autoload: true });
db.deudas    = new Datastore({ filename: './datos_proyecto/deudas.db', autoload: true });
db.clientes  = new Datastore({ filename: './datos_proyecto/clientes.db', autoload: true });
db.cajas     = new Datastore({ filename: './datos_proyecto/cajas.db', autoload: true });

console.log("✅ Base de datos local (NeDB) Inicializada en ./datos_proyecto/");

// ================== HEALTH ==================
app.get('/health', (req, res) => {
  res.json({ ok: true, message: "Servidor activo", time: new Date() });
});

// ================== PRODUCTOS ==================
app.get('/productos', (req, res) => {
  db.productos.find({}, (err, docs) => {
    if (err) { console.error(err); return res.json([]); }
    res.json(docs);
  });
});

app.post('/productos', (req, res) => {
  db.productos.insert(req.body, (err, newDoc) => {
    if (err) return res.status(500).json({ error: "Error al crear producto" });
    res.json({ ok: true });
  });
});

app.put('/productos/:id', (req, res) => {
  db.productos.update({ _id: req.params.id }, { $set: req.body }, {}, (err) => {
    if (err) return res.status(500).json({ error: "Error al editar producto" });
    res.json({ ok: true });
  });
});

app.put('/productos/agregar/:id', (req, res) => {
  db.productos.findOne({ _id: req.params.id }, (err, p) => {
    if (err || !p) return res.json({ error: "No existe" });
    const nuevoStock = (p.stock || 0) + Number(req.body.cantidad);
    db.productos.update({ _id: req.params.id }, { $set: { stock: nuevoStock } }, {}, (err2) => {
      if (err2) return res.status(500).json({ error: "Error al agregar stock" });
      res.json({ ok: true });
    });
  });
});

app.put('/productos/vender/:id', (req, res) => {
  db.productos.findOne({ _id: req.params.id }, (err, p) => {
    if (err || !p) return res.json({ error: "No existe" });
    let nuevoStock = (p.stock || 0) - Number(req.body.cantidad);
    if (nuevoStock < 0) nuevoStock = 0;
    db.productos.update({ _id: req.params.id }, { $set: { stock: nuevoStock } }, {}, (err2) => {
      if (err2) return res.status(500).json({ error: "Error al vender" });
      res.json({ ok: true });
    });
  });
});

app.delete('/productos/:id', (req, res) => {
  db.productos.remove({ _id: req.params.id }, {}, (err) => {
    if (err) return res.status(500).json({ error: "Error al eliminar" });
    res.json({ ok: true });
  });
});

// ================== CLIENTES ==================
app.post('/clientes', (req, res) => {
  const nuevoCliente = {
    nombre: req.body.nombre,
    cedula: req.body.cedula,
    direccion: req.body.direccion,
    telefono: req.body.telefono,
    correo: req.body.correo,
    deudaTotal: Number(req.body.deudaTotal || 0),
    deudaActual: Number(req.body.deudaActual || 0),
    estado: req.body.estado || "normal",
    fecha: req.body.fecha ? new Date(req.body.fecha) : new Date()
  };

  db.clientes.insert(nuevoCliente, (err, clienteGuardado) => {
    if (err) return res.status(500).json({ error: "Error al guardar cliente" });
    res.json({ ok: true, cliente: clienteGuardado });
  });
});

app.get('/clientes', (req, res) => {
  db.clientes.find({}).sort({ fecha: -1 }).exec((err, docs) => {
    if (err) return res.status(500).json([]);
    res.json(docs);
  });
});

app.post('/clientes/sumar-deuda', (req, res) => {
  const { cedula, total } = req.body;
  db.clientes.findOne({ cedula }, (err, cliente) => {
    if (err || !cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    
    const deudaTotal = (cliente.deudaTotal || 0) + Number(total);
    const deudaActual = (cliente.deudaActual || 0) + Number(total);
    
    db.clientes.update({ cedula }, { $set: { deudaTotal, deudaActual, estado: "deudor" } }, {}, (err2) => {
      if (err2) return res.status(500).json({ error: "Error al actualizar deuda" });
      cliente.deudaTotal = deudaTotal;
      cliente.deudaActual = deudaActual;
      cliente.estado = "deudor";
      res.json({ ok: true, cliente });
    });
  });
});

app.post('/clientes/abonar', (req, res) => {
  const { cedula, monto } = req.body;
  db.clientes.findOne({ cedula }, (err, cliente) => {
    if (err || !cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    
    let deudaActual = (cliente.deudaActual || 0) - Number(monto);
    let estado = cliente.estado;
    if (deudaActual <= 0) { deudaActual = 0; estado = "normal"; }
    
    db.clientes.update({ cedula }, { $set: { deudaActual, estado } }, {}, (err2) => {
      if (err2) return res.status(500).json({ error: "Error al abonar" });
      cliente.deudaActual = deudaActual;
      cliente.estado = estado;
      res.json({ ok: true, cliente });
    });
  });
});

app.put('/clientes/editar', (req, res) => {
  const { id, nombre, cedula, telefono, correo } = req.body;
  db.clientes.update({ _id: id }, { $set: { nombre, cedula, telefono, correo } }, {}, (err) => {
    if (err) return res.status(500).json({ error: "Error al editar cliente" });
    res.json({ ok: true });
  });
});

app.get('/clientes/:cedula', (req, res) => {
  db.clientes.findOne({ cedula: req.params.cedula }, (err, cliente) => {
    if (err) return res.status(500).json(null);
    res.json(cliente || null);
  });
});

app.delete('/clientes/:id', (req, res) => {
  db.clientes.remove({ _id: req.params.id }, {}, (err) => {
    if (err) return res.status(500).json({ error: "Error al eliminar cliente" });
    res.json({ ok: true });
  });
});

// ================== VENTAS ==================
app.post('/ventas', (req, res) => {
  const nuevaVenta = {
    ...req.body,
    fecha: req.body.fecha ? new Date(req.body.fecha) : new Date()
  };

  db.ventas.insert(nuevaVenta, async (err) => {
    if (err) return res.status(500).json({ error: "Error al guardar venta" });

    db.cajas.findOne({ activa: true }, (errCaja, caja) => {
      if (req.body.tipo === "efectivo" && caja) {
        caja.ingresos = (caja.ingresos || 0) + Number(req.body.total || 0);
        if(!caja.movimientos) caja.movimientos = [];
        caja.movimientos.push({
          tipo: "ingreso", monto: req.body.total, motivo: "Venta efectivo", fecha: new Date()
        });
        db.cajas.update({ _id: caja._id }, caja, {});
      }

      if (req.body.tipo === "transferencia" && caja) {
        caja.ingresos = (caja.ingresos || 0) + Number(req.body.total || 0);
        if(!caja.movimientos) caja.movimientos = [];
        caja.movimientos.push({
          tipo:        "transferencia",
          monto:       Number(req.body.total || 0),
          motivo:      `Transferencia venta — ${req.body.banco || ""}`,
          banco:       req.body.banco       || "",
          cuenta:      req.body.cuenta      || "",
          comprobante: req.body.comprobante || "",
          remitente:   req.body.cliente     || "",
          fecha: new Date()
        });
        db.cajas.update({ _id: caja._id }, caja, {});
      }
    });

    if (req.body.tipo === "credito") {
      db.deudas.insert({
        cliente:  req.body.cliente,
        cedula:   req.body.cedula   || "SIN CÉDULA",
        celular:  req.body.celular  || "",
        correo:   req.body.correo   || "",
        direccion:req.body.direccion|| "",
        total:    req.body.total,
        pagado:   0,
        productos:req.body.productos || [],
        pagos:    [],
        fecha:    new Date()
      });
    }

    res.json({ ok: true });
  });
});

// ================== BORRAR PRODUCTO DE VENTA ==================
app.delete('/ventas/producto/:ventaId/:indice', (req, res) => {
  db.ventas.findOne({ _id: req.params.ventaId }, (err, venta) => {
    if (err || !venta) return res.status(404).json({ error: "Venta no encontrada" });

    const indice = Number(req.params.indice);
    if (isNaN(indice) || indice < 0 || indice >= venta.productos.length) {
      return res.status(400).json({ error: "Índice inválido" });
    }

    venta.productos.splice(indice, 1);

    if (venta.productos.length === 0) {
      db.ventas.remove({ _id: req.params.ventaId }, {}, (errDel) => {
        if (errDel) return res.status(500).json({ error: "Error" });
        return res.json({ msg: "Venta eliminada (quedó sin productos)" });
      });
    } else {
      venta.total = venta.productos.reduce((sum, p) => {
        return sum + (Number(p.precio || 0) * Number(p.cantidad || 1));
      }, 0);

      db.ventas.update({ _id: req.params.ventaId }, { $set: { productos: venta.productos, total: venta.total } }, {}, (errUp) => {
        if (errUp) return res.status(500).json({ error: "Error al borrar el producto" });
        res.json({ msg: "Producto eliminado correctamente" });
      });
    }
  });
});

// ================== BORRAR DÍA ==================
app.delete('/ventas/dia', (req, res) => {
  const { fecha } = req.body;
  if (!fecha) return res.status(400).json({ error: "Falta fecha" });
  
  const inicio = new Date(fecha + "T00:00:00.000Z").getTime();
  const fin    = new Date(fecha + "T23:59:59.999Z").getTime();

  db.ventas.find({}, (err, todasLasVentas) => {
    if(err) return res.status(500).json({ error: "Error al filtrar" });
    
    // Filtrado por timestamp local dado que NeDB no hace consultas avanzadas con objetos Date complejos fácilmente
    const ventasAEliminar = todasLasVentas.filter(v => {
      const t = new Date(v.fecha).getTime();
      return t >= inicio && t <= fin;
    });

    const ids = ventasAEliminar.map(v => v._id);
    db.ventas.remove({ _id: { $in: ids } }, { multi: true }, (errDel, numRemoved) => {
      if (errDel) return res.status(500).json({ error: "Error al borrar día" });
      res.json({ ok: true, msg: `${numRemoved} venta(s) eliminadas`, deleted: numRemoved });
    });
  });
});

// ================== DEUDAS ==================
app.get('/deudas', (req, res) => {
  db.deudas.find({}).sort({ fecha: -1 }).exec((err, docs) => {
    res.json(docs || []);
  });
});

app.post('/deudas', (req, res) => {
  const nueva = {
    cliente:  req.body.cliente   || "",
    cedula:   req.body.cedula    || "-",
    celular:  req.body.celular   || "",
    direccion:req.body.direccion || "",
    correo:   req.body.correo    || "",
    total:    Number(req.body.total || 0),
    pagado:   0,
    productos:req.body.productos || [],
    pagos:    [],
    fecha:    new Date()
  };

  db.deudas.insert(nueva, (err, doc) => {
    if (err) return res.status(500).json({ error: "Error al crear deuda" });
    res.json(doc);
  });
});

app.post('/deudas/pagar', (req, res) => {
  db.deudas.findOne({ _id: req.body.id }, (err, deuda) => {
    if (err || !deuda) return res.json({ error: "Deuda no encontrada" });

    const monto = Number(req.body.monto);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    const restante = deuda.total - deuda.pagado;
    if (monto > restante) return res.json({ error: "No puedes pagar más de la deuda" });

    deuda.pagado += monto;
    if(!deuda.pagos) deuda.pagos = [];
    deuda.pagos.push({ monto, fecha: new Date() });

    db.deudas.update({ _id: req.body.id }, deuda, {}, (errUp) => {
      if (errUp) return res.status(500).json({ error: "Error al abonar" });

      db.cajas.findOne({ activa: true }, (errCaja, caja) => {
        if (caja) {
          const metodoPago  = req.body.metodoPago  || "efectivo";
          const banco       = req.body.banco       || "";
          const comprobante = req.body.comprobante || "";

          caja.ingresos = (caja.ingresos || 0) + monto;
          if(!caja.movimientos) caja.movimientos = [];

          if (metodoPago === "transferencia") {
            caja.movimientos.push({
              tipo:        "transferencia",
              monto,
              motivo:      `Abono deuda — ${deuda.cliente}`,
              banco,
              comprobante,
              remitente:   deuda.cliente || "",
              fecha: new Date()
            });
          } else {
            caja.movimientos.push({
              tipo:   "ingreso",
              monto,
              motivo: `Abono deuda efectivo — ${deuda.cliente}`,
              fecha: new Date()
            });
          }
          db.cajas.update({ _id: caja._id }, caja, {});
        }
      });

      res.json({
        cliente:  deuda.cliente,
        cedula:   deuda.cedula  || "-",
        celular:  deuda.celular || "",
        monto,
        total:    deuda.total,
        restante: deuda.total - deuda.pagado,
        pagado:   deuda.pagado,
        pagos:    deuda.pagos    || [],
        productos:deuda.productos || []
      });
    });
  });
});

app.put('/deudas/:id', (req, res) => {
  db.deudas.findOne({ _id: req.params.id }, (err, deuda) => {
    if (err || !deuda) return res.status(404).json({ error: "Deuda no encontrada" });

    if (req.body.cliente   !== undefined) deuda.cliente   = req.body.cliente;
    if (req.body.cedula    !== undefined) deuda.cedula    = req.body.cedula;
    if (req.body.celular   !== undefined) deuda.celular   = req.body.celular;
    if (req.body.direccion !== undefined) deuda.direccion = req.body.direccion;
    if (req.body.total     !== undefined) deuda.total     = Number(req.body.total);
    if (req.body.productos !== undefined) deuda.productos = req.body.productos;
    if (req.body.pagado    !== undefined) deuda.pagado    = Number(req.body.pagado);
    if (req.body.pagos     !== undefined) deuda.pagos     = req.body.pagos;

    db.deudas.update({ _id: req.params.id }, deuda, {}, (errUp) => {
      if (errUp) return res.status(500).json({ error: "Error al editar deuda" });
      res.json({ ok: true, deuda });
    });
  });
});

app.delete('/deudas/:id', (req, res) => {
  db.deudas.remove({ _id: req.params.id }, {}, (err) => {
    if (err) return res.status(500).json({ error: "Error al eliminar deuda" });
    res.json({ ok: true });
  });
});

// ================== CAJA ==================
app.post('/caja/abrir', (req, res) => {
  const monto = Number(req.body.monto);
  if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

  db.cajas.findOne({ activa: true }, (err, abierta) => {
    if (abierta) {
      db.cajas.update({ _id: abierta._id }, { $set: { activa: false, horaCierre: new Date() } }, {});
    }

    const nuevaCaja = {
      apertura:     monto,
      ingresos:     0,
      gastos:       0,
      activa:       true,
      horaApertura: new Date(),
      movimientos: [{ tipo: "inicio", monto, motivo: "Apertura de caja", fecha: new Date() }]
    };

    db.cajas.insert(nuevaCaja, (errIns) => {
      if (errIns) return res.status(500).json({ error: "Error al abrir caja" });
      res.json({ ok: true });
    });
  });
});

app.get('/caja', (req, res) => {
  db.cajas.findOne({ activa: true }, (err, caja) => {
    if (err || !caja) return res.json({ apertura: 0, ingresos: 0, gastos: 0, transferencias: 0, saldo: 0 });

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
      apertura:          caja.apertura,
      ingresos:          caja.ingresos,
      transferencias,
      gastos:            caja.gastos,
      saldo:             caja.apertura + caja.ingresos - caja.gastos,
      horaApertura:      caja.horaApertura,
      gastosLista,
      transferenciasList,
      movimientos:       caja.movimientos || []
    });
  });
});

app.post('/caja/gasto', (req, res) => {
  db.cajas.findOne({ activa: true }, (err, caja) => {
    if (err || !caja) return res.json({ error: "Caja no abierta" });

    const monto  = Number(req.body.monto  || 0);
    const motivo = req.body.motivo || "Sin motivo";
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    caja.gastos = (caja.gastos || 0) + monto;
    if(!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({ tipo: "gasto", monto, motivo, fecha: new Date() });

    db.cajas.update({ _id: caja._id }, caja, {}, (errUp) => {
      if (errUp) return res.status(500).json({ error: "Error al registrar gasto" });
      res.json({ ok: true });
    });
  });
});

app.post('/caja/transferencia', (req, res) => {
  db.cajas.findOne({ activa: true }, (err, caja) => {
    if (err || !caja) return res.json({ error: "Caja no abierta" });

    const monto = Number(req.body.monto || 0);
    if (!monto || monto <= 0) return res.json({ error: "Monto inválido" });

    caja.ingresos = (caja.ingresos || 0) + monto;
    if(!caja.movimientos) caja.movimientos = [];
    caja.movimientos.push({
      tipo:        "transferencia",
      monto,
      motivo:      `Transferencia ${req.body.banco || ""}`,
      banco:       req.body.banco       || "",
      cuenta:      req.body.cuenta      || "",
      comprobante: req.body.comprobante || "",
      remitente:   req.body.remitente   || "",
      fecha: new Date()
    });

    db.cajas.update({ _id: caja._id }, caja, {}, (errUp) => {
      if (errUp) return res.status(500).json({ error: "Error al registrar transferencia" });
      res.json({ ok: true });
    });
  });
});

// ================== CIERRE CAJA ==================
app.post('/caja/cerrar', (req, res) => {
  db.cajas.findOne({ activa: true }, (err, caja) => {
    if (err || !caja) return res.json({ error: "Caja no abierta" });

    const real  = Number(req.body.montoReal);
    const dejar = Number(req.body.dejar || 0);

    const esperado   = caja.apertura + caja.ingresos - caja.gastos;
    const diferencia = real - esperado;

    let transferencias = 0;
    const gastosLista        = [];
    const transferenciasList = [];

    (caja.movimientos || []).forEach(m => {
      if (m.tipo === "gasto")         gastosLista.push(m);
      if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
    });

    caja.activa     = false;
    caja.cierre     = real;
    caja.horaCierre = new Date();
    caja.dejado     = dejar;
    caja.movimientos.push({
      tipo: "cierre", monto: real,
      motivo: `Cierre de caja | Dejado: $${dejar}`,
      fecha: new Date()
    });

    db.cajas.update({ _id: caja._id }, caja, {}, (errUp) => {
      if (dejar > 0) {
        db.cajas.insert({
          apertura:     dejar,
          ingresos:     0,
          gastos:       0,
          activa:       true,
          horaApertura: new Date(),
          movimientos: [{ tipo: "inicio", monto: dejar, motivo: "Apertura automática", fecha: new Date() }]
        });
      }

      res.json({
        apertura:         caja.apertura,
        ingresos:         caja.ingresos,
        transferencias,
        gastos:           caja.gastos,
        esperado,
        real,
        diferencia,
        dejar,
        fechaApertura:    caja.horaApertura,
        fechaCierre:      caja.horaCierre,
        gastosLista,
        transferenciasList
      });
    });
  });
});

app.get('/caja/historial', (req, res) => {
  db.cajas.find({ activa: false }).sort({ horaCierre: -1 }).limit(50).exec((err, cajas) => {
    if (err) return res.status(500).json({ error: "Error al obtener historial" });

    const historial = cajas.map(c => {
      let transferencias = 0;
      const gastosLista        = [];
      const transferenciasList = [];

      (c.movimientos || []).forEach(m => {
        if (m.tipo === "gasto")         gastosLista.push(m);
        if (m.tipo === "transferencia") { transferenciasList.push(m); transferencias += m.monto; }
      });

      return {
        fechaApertura:    c.horaApertura,
        fechaCierre:      c.horaCierre,
        apertura:         c.apertura,
        ingresos:         c.ingresos,
        transferencias,
        gastos:           c.gastos,
        real:             c.cierre,
        diferencia:       c.cierre - (c.apertura + c.ingresos - c.gastos),
        dejar:            c.dejado || 0,
        gastosLista,
        transferenciasList
      };
    });

    res.json(historial);
  });
});

// ================== ANÁLISIS / DASHBOARD ==================
app.get('/analisis', (req, res) => {
  db.ventas.find({}, (err, ventas) => {
    if (err) return res.status(500).json({ error: "Error al obtener análisis" });

    let totalGeneral  = 0;
    let efectivo      = 0;
    let credito       = 0;
    let transferencia = 0;

    const productos = {};
    const porDia    = {};
    const porMes    = {};

    ventas.forEach(v => {
      const total = Number(v.total || 0);
      totalGeneral += total;

      if (v.tipo === "efectivo")      efectivo++;
      if (v.tipo === "credito")       credito++;
      if (v.tipo === "transferencia") transferencia++;

      const fecha = new Date(v.fecha);
      let dia = "Desconocido";
      let mes = "Desconocido";
      try {
        dia = fecha.toISOString().split("T")[0];
        mes = fecha.toISOString().slice(0, 7);
      } catch(e){}

      porDia[dia] = (porDia[dia] || 0) + total;
      porMes[mes] = (porMes[mes] || 0) + total;

      if (Array.isArray(v.productos)) {
        v.productos.forEach(p => {
          const nombre   = p.nombre  || "Sin nombre";
          const cantidad = Number(p.cantidad || 1);
          const precio   = Number(p.precio   || 0);
          const costo    = Number(p.costo    || 0);
          const ganancia = (precio - costo) * cantidad;

          if (!productos[nombre]) {
            productos[nombre] = { nombre, vendidos: 0, ganancia: 0 };
          }
          productos[nombre].vendidos  += cantidad;
          productos[nombre].ganancia  += ganancia;
        });
      }
    });

    const lista = Object.values(productos);

    const masVendidos   = [...lista].sort((a,b) => b.vendidos  - a.vendidos ).slice(0, 5);
    const menosVendidos = [...lista].sort((a,b) => a.vendidos  - b.vendidos ).slice(0, 5);
    const masGanancia   = [...lista].sort((a,b) => b.ganancia  - a.ganancia ).slice(0, 5);
    const menosGanancia = [...lista].sort((a,b) => a.ganancia  - b.ganancia ).slice(0, 5);

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
  });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor local corriendo en: http://localhost:" + PORT);
});  res.status(500).json({ error: "Error al obtener análisis" });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 http://localhost:" + PORT);
});
