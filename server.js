const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let solicitudesPendientes = {};

app.post('/enviar-solicitud', (req, res) => {
  const datos = req.body;
  const id = Date.now().toString();
  
  solicitudesPendientes[id] = {
    ...datos,
    estado: 'pendiente',
    fecha: new Date().toLocaleString('es-EC')
  };

  const mensaje = `*📋 SOLICITUD DE SALIDA - DRIVE*%0A
📅 Fecha: ${solicitudesPendientes[id].fecha}%0A
👤 Conductor: ${datos.conductor}%0A
🚗 Placa: ${datos.placa} | Tipo: ${datos.tipoVeh}%0A
📍 Ruta: ${datos.inicio} ➜ ${datos.destino}%0A
%0A🔍 REVISIÓN%0A
✅ Vehículo: ${datos.revVeh}%0A
✅ Equipo: ${datos.revEquipo}%0A
✅ Descanso: ${datos.revDescanso}%0A
✅ Documentos: ${datos.revDoc}%0A
%0A📝 Observaciones: ${datos.observaciones || 'Sin observaciones'}%0A
%0A---%0A
*PARA RESPONDER:*%0A
✅ LUZVERDE ${id} → Autorizar%0A
❌ LUZROJA ${id} → Rechazar`;

  res.json({
    exito: true,
    idSolicitud: id,
    enlaceWhatsApp: `https://wa.me/593980530610?text=${mensaje}`
  });
});

app.get('/estado-solicitud/:id', (req, res) => {
  const id = req.params.id;
  if (solicitudesPendientes[id]) {
    res.json({ estado: solicitudesPendientes[id].estado });
  } else {
    res.json({ estado: 'no_encontrado' });
  }
});

app.post('/respuesta-autorizacion', (req, res) => {
  const { id, decision } = req.body;
  if (solicitudesPendientes[id]) {
    solicitudesPendientes[id].estado = decision === 'verde' ? 'aprobado' : 'rechazado';
    res.json({ exito: true });
  } else {
    res.json({ exito: false });
  }
});

app.listen(PUERTO, () => console.log('✅ SERVIDOR CORRIENDO CORRECTAMENTE'));
